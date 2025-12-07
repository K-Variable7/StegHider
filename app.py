from flask import Flask, render_template, request, send_file, redirect, url_for
import os
import uuid
import zipfile
import base64
import io
from steg_hider import hide_message, extract_message, generate_keys

app = Flask(__name__)
# Use /tmp for Vercel compatibility (read-only file system elsewhere)
UPLOAD_FOLDER = "/tmp"
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# Ensure upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/embed", methods=["POST"])
def embed():
    if "image" not in request.files:
        return "No image uploaded", 400

    image = request.files["image"]

    # Check for secret file or text
    secret_file = request.files.get("secret_file")
    message = request.form.get("message")

    use_encryption = "use_encryption" in request.form
    password = request.form.get("password", "").strip()
    level = request.form.get("level", "basic")  # basic, advanced, premium

    if image.filename == "":
        return "No selected file", 400

    # Prepare payload
    payload = {}
    has_content = False

    # Handle File
    if secret_file and secret_file.filename != "":
        file_data = secret_file.read()
        b64_data = base64.b64encode(file_data).decode("utf-8")
        payload["type"] = "file"
        payload["name"] = secret_file.filename
        payload["data"] = b64_data
        has_content = True

    # Handle Message
    if message:
        if has_content:
            # If we already have a file, add the message as a secondary field
            payload["text_content"] = message
        else:
            # If no file, it's a pure text payload
            payload["type"] = "text"
            payload["data"] = message
            has_content = True

    if not has_content:
        return "No message or file to hide", 400

    # Save input image
    ext = os.path.splitext(image.filename)[1]
    unique_id = str(uuid.uuid4())
    input_path = os.path.join(app.config["UPLOAD_FOLDER"], f"{unique_id}_input{ext}")
    image.save(input_path)

    output_filename = f"secret_{unique_id}.png"
    output_path = os.path.join(app.config["UPLOAD_FOLDER"], output_filename)

    pub_key_path = None

    # Logic: If password is provided, use it. Else if encryption checked and key provided, use key.

    if use_encryption and not password:
        if "public_key" in request.files and request.files["public_key"].filename != "":
            pub_key = request.files["public_key"]
            pub_key_path = os.path.join(
                app.config["UPLOAD_FOLDER"], f"{unique_id}_pub.pem"
            )
            pub_key.save(pub_key_path)
        else:
            return "Encryption selected but no password or public key provided", 400

    # Call the logic
    try:
        result = hide_message(input_path, payload, output_path, pub_key_path, password, level)
        score = result.get("score", 0)
    except Exception as e:
        return f"Error embedding message: {str(e)}", 500

    # Cleanup input files
    try:
        os.remove(input_path)
        if pub_key_path:
            os.remove(pub_key_path)
    except:
        pass

    if os.path.exists(output_path):
        return send_file(
            output_path, as_attachment=True, download_name="secret_image.png"
        )
    else:
        return (
            "Failed to create output image. Message might be too long or an error occurred.",
            500,
        )


@app.route("/extract", methods=["POST"])
def extract():
    if "image" not in request.files:
        return "No image uploaded", 400

    image = request.files["image"]
    is_encrypted = "is_encrypted" in request.form
    password = request.form.get("password", "").strip()

    if image.filename == "":
        return "No selected file", 400

    # Save input image
    ext = os.path.splitext(image.filename)[1]
    unique_id = str(uuid.uuid4())
    input_path = os.path.join(app.config["UPLOAD_FOLDER"], f"{unique_id}_extract{ext}")
    image.save(input_path)

    priv_key_path = None
    if is_encrypted and not password:
        if (
            "private_key" in request.files
            and request.files["private_key"].filename != ""
        ):
            priv_key = request.files["private_key"]
            priv_key_path = os.path.join(
                app.config["UPLOAD_FOLDER"], f"{unique_id}_priv.pem"
            )
            priv_key.save(priv_key_path)
        else:
            return "Encryption selected but no password or private key provided", 400

    # Call the logic
    extracted_data = extract_message(input_path, priv_key_path, password)

    # Cleanup
    try:
        os.remove(input_path)
        if priv_key_path:
            os.remove(priv_key_path)
    except:
        pass

    extracted_text = None
    download_link = None
    error_msg = None

    if isinstance(extracted_data, dict):
        if extracted_data.get("error"):
            error_msg = extracted_data["error"]
        else:
            # Handle new format (text and/or file)
            if "text" in extracted_data:
                extracted_text = extracted_data["text"]

            if "file" in extracted_data:
                file_info = extracted_data["file"]
                file_name = file_info.get("name", "secret_file")
                b64_data = file_info.get("data")
                try:
                    file_bytes = base64.b64decode(b64_data)
                    # Save to disk for download
                    download_filename = f"extracted_{uuid.uuid4().hex[:8]}_{file_name}"
                    download_path = os.path.join(
                        app.config["UPLOAD_FOLDER"], download_filename
                    )
                    with open(download_path, "wb") as f:
                        f.write(file_bytes)
                    download_link = url_for("download_file", filename=download_filename)
                except Exception as e:
                    error_msg = f"Error decoding file: {e}"

            # Handle legacy format (type="text" or type="file")
            if "type" in extracted_data:
                if extracted_data["type"] == "text":
                    extracted_text = extracted_data["data"]
                elif extracted_data["type"] == "file":
                    file_name = extracted_data.get("name", "secret_file")
                    b64_data = extracted_data.get("data")
                    # Check for accompanying text (new feature)
                    if "text_content" in extracted_data:
                        extracted_text = extracted_data["text_content"]

                    try:
                        file_bytes = base64.b64decode(b64_data)
                        download_filename = (
                            f"extracted_{uuid.uuid4().hex[:8]}_{file_name}"
                        )
                        download_path = os.path.join(
                            app.config["UPLOAD_FOLDER"], download_filename
                        )
                        with open(download_path, "wb") as f:
                            f.write(file_bytes)
                        download_link = url_for(
                            "download_file", filename=download_filename
                        )
                    except Exception as e:
                        error_msg = f"Error decoding file: {e}"
    else:
        # It's a string (error or old format)
        if str(extracted_data).startswith("[-]"):
            error_msg = extracted_data
        else:
            extracted_text = extracted_data

    return render_template(
        "index.html",
        extracted_text=extracted_text,
        download_link=download_link,
        error=error_msg,
    )


@app.route("/download/<filename>")
def download_file(filename):
    return send_file(
        os.path.join(app.config["UPLOAD_FOLDER"], filename), as_attachment=True
    )


@app.route("/generate_keys", methods=["POST"])
def generate_keys_route():
    unique_id = str(uuid.uuid4())
    priv_path = os.path.join(app.config["UPLOAD_FOLDER"], f"{unique_id}_private.pem")
    pub_path = os.path.join(app.config["UPLOAD_FOLDER"], f"{unique_id}_public.pem")
    zip_path = os.path.join(app.config["UPLOAD_FOLDER"], f"{unique_id}_keys.zip")

    generate_keys(priv_path, pub_path)

    with zipfile.ZipFile(zip_path, "w") as zipf:
        zipf.write(priv_path, arcname="private_key.pem")
        zipf.write(pub_path, arcname="public_key.pem")

    # Cleanup raw keys
    os.remove(priv_path)
    os.remove(pub_path)

    return send_file(zip_path, as_attachment=True, download_name="steg_keys.zip")


@app.route("/metawipe", methods=["POST"])
def metawipe():
    if "image" not in request.files:
        return "No image uploaded", 400

    image = request.files["image"]
    if image.filename == "":
        return "No selected file", 400

    # Save input image
    ext = os.path.splitext(image.filename)[1]
    unique_id = str(uuid.uuid4())
    input_path = os.path.join(app.config["UPLOAD_FOLDER"], f"{unique_id}_input{ext}")
    image.save(input_path)

    output_filename = f"clean_{unique_id}{ext}"
    output_path = os.path.join(app.config["UPLOAD_FOLDER"], output_filename)

    try:
        from steg_hider import metawipe_image
        clean_path = metawipe_image(input_path, output_path)
        return send_file(clean_path, as_attachment=True, download_name=output_filename)
    except Exception as e:
        return f"Error cleaning metadata: {str(e)}", 500
    finally:
        if os.path.exists(input_path):
            os.remove(input_path)


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
