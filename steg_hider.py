from PIL import Image
import sys
import os
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.fernet import Fernet
import base64
import json
import zlib
import zipfile
import io

DELIMITER = "###END###"


def metawipe_image(image_path, output_path=None, keep_basic=True):
    """Removes metadata from an image for privacy, keeping basic info if specified."""
    img = Image.open(image_path)
    # Create a new image without metadata
    new_img = Image.new(img.mode, img.size)
    new_img.putdata(list(img.getdata()))
    
    if keep_basic:
        # Keep basic format info
        new_img.format = img.format
        new_img.info = {}  # Clear all metadata
    
    if output_path is None:
        output_path = image_path.replace('.png', '_clean.png').replace('.jpg', '_clean.jpg').replace('.jpeg', '_clean.jpeg')
    
    new_img.save(output_path)
    return output_path


def derive_key(password, salt):
    """Derives a Fernet-compatible key from a password."""
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    return base64.urlsafe_b64encode(kdf.derive(password.encode()))


def encrypt_message_password(data, password):
    """Encrypts data using a password (PBKDF2 + Fernet)."""
    salt = os.urandom(16)
    key = derive_key(password, salt)
    f = Fernet(key)
    if isinstance(data, str):
        data = data.encode()
    token = f.encrypt(data)
    # Return salt + token so we can derive the same key later
    return salt + token


def decrypt_message_password(encrypted_data, password):
    """Decrypts a message using a password. Returns bytes."""
    # Extract salt (first 16 bytes)
    salt = encrypted_data[:16]
    token = encrypted_data[16:]

    key = derive_key(password, salt)
    f = Fernet(key)
    return f.decrypt(token)


def generate_keys(private_path="private_key.pem", public_path="public_key.pem"):
    """Generates a public/private key pair."""
    print("[*] Generating RSA key pair...")
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )
    public_key = private_key.public_key()

    # Save private key
    with open(private_path, "wb") as f:
        f.write(
            private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption(),
            )
        )

    # Save public key
    with open(public_path, "wb") as f:
        f.write(
            public_key.public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo,
            )
        )

    print(f"[+] Keys generated: {private_path}, {public_path}")


def encrypt_message(data, public_key_path):
    """Encrypts data using a hybrid approach (Fernet + RSA)."""
    # 1. Generate a symmetric key (Fernet)
    fernet_key = Fernet.generate_key()
    cipher_suite = Fernet(fernet_key)

    # 2. Encrypt the actual data with Fernet
    if isinstance(data, str):
        data = data.encode()
    encrypted_message = cipher_suite.encrypt(data)

    # 3. Encrypt the Fernet key with RSA Public Key
    with open(public_key_path, "rb") as f:
        public_key = serialization.load_pem_public_key(f.read())

    encrypted_key = public_key.encrypt(
        fernet_key,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None,
        ),
    )

    # Return combined data: Encrypted Key (256 bytes) + Encrypted Message
    return encrypted_key + encrypted_message


def decrypt_message(encrypted_data, private_key_path):
    """Decrypts a message using the hybrid approach. Returns bytes."""
    # 1. Split the data
    # RSA 2048 key size -> 256 bytes encrypted output
    encrypted_key = encrypted_data[:256]
    encrypted_message = encrypted_data[256:]

    # 2. Decrypt the Fernet key with RSA Private Key
    with open(private_key_path, "rb") as f:
        private_key = serialization.load_pem_private_key(f.read(), password=None)

    fernet_key = private_key.decrypt(
        encrypted_key,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None,
        ),
    )

    # 3. Decrypt the message with Fernet
    cipher_suite = Fernet(fernet_key)
    decrypted_message = cipher_suite.decrypt(encrypted_message)

    return decrypted_message


def data_to_bin(data):
    """Convert string or bytes to a binary string."""
    if isinstance(data, str):
        return "".join(format(ord(char), "08b") for char in data)
    elif isinstance(data, bytes):
        return "".join(format(byte, "08b") for byte in data)
    else:
        raise ValueError("Unsupported data type")


def bin_to_bytes(binary_data):
    """Convert binary string to bytes."""
    all_bytes = [binary_data[i : i + 8] for i in range(0, len(binary_data), 8)]
    byte_array = bytearray()
    for byte in all_bytes:
        byte_array.append(int(byte, 2))
    return bytes(byte_array)


def hide_message(
    image_path, secret_message, output_path, public_key_path=None, password=None, level="basic", max_file_size=10*1024*1024
):
    """Embeds a secret message into an image using LSB steganography.
    
    Levels:
    - basic: No encryption, just compression
    - advanced: Password encryption
    - premium: RSA encryption (requires public_key_path)
    
    max_file_size: Maximum file size in bytes (default 10MB)
    """
    if level not in ["basic", "advanced", "premium"]:
        raise ValueError("Level must be 'basic', 'advanced', or 'premium'")
    
    if level == "advanced" and not password:
        raise ValueError("Password required for advanced level")
    if level == "premium" and not public_key_path:
        raise ValueError("Public key required for premium level")
    
    # Check file size if it's a file
    if isinstance(secret_message, dict) and secret_message.get("type") == "file":
        file_data = base64.b64decode(secret_message["data"])
        if len(file_data) > max_file_size:
            raise ValueError(f"File too large. Max size: {max_file_size} bytes")
    
    try:
        img = Image.open(image_path)
        img = img.convert("RGB")
        pixels = img.load()

        # Prepare the payload
        if isinstance(secret_message, dict):
            # It's already a structured payload (e.g. file)
            if secret_message.get("type") == "file":
                # Auto-zip the file data
                file_data = base64.b64decode(secret_message["data"])
                zip_buffer = io.BytesIO()
                with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                    zip_file.writestr(secret_message["name"], file_data)
                secret_message["data"] = base64.b64encode(zip_buffer.getvalue()).decode()
                secret_message["zipped"] = True
            payload_str = json.dumps(secret_message)
        else:
            # It's just text
            payload = {"type": "text", "data": secret_message}
            payload_str = json.dumps(payload)

        # Compress the payload
        print("[*] Compressing data...")
        payload_bytes = payload_str.encode("utf-8")
        compressed_data = zlib.compress(payload_bytes)

        if level == "advanced":
            print(f"[*] Encrypting message with password (advanced)...")
            secret_data = encrypt_message_password(compressed_data, password)
            full_data = secret_data + DELIMITER.encode()
        elif level == "premium":
            print(f"[*] Encrypting message with {public_key_path} (premium)...")
            # Encrypt the message -> returns bytes
            secret_data = encrypt_message(compressed_data, public_key_path)
            # We need to append a delimiter. Since we are working with bytes now,
            # and Fernet output is base64 (safe chars), we can use the string delimiter.
            # But we need to be careful. Let's just append the delimiter as bytes.
            full_data = secret_data + DELIMITER.encode()
        else:
            # Basic: Plain text mode (compressed)
            print("[*] Using basic level (no encryption)...")
            full_data = compressed_data + DELIMITER.encode()

        binary_message = data_to_bin(full_data)
        message_len = len(binary_message)

        width, height = img.size
        total_pixels = width * height * 3

        if message_len > total_pixels:
            raise ValueError(
                f"Message is too large for this image. Need {message_len} bits, but image only has {total_pixels} bits available. Try a larger image or smaller file."
            )

        data_index = 0
        print("[*] Embedding data...")

        for y in range(height):
            for x in range(width):
                r, g, b = pixels[x, y]

                if data_index < message_len:
                    r = (r & ~1) | int(binary_message[data_index])
                    data_index += 1
                if data_index < message_len:
                    g = (g & ~1) | int(binary_message[data_index])
                    data_index += 1
                if data_index < message_len:
                    b = (b & ~1) | int(binary_message[data_index])
                    data_index += 1

                pixels[x, y] = (r, g, b)
                if data_index >= message_len:
                    break
            if data_index >= message_len:
                break

        img.save(output_path)
        print(f"[+] Data hidden successfully! Saved to {output_path}")
        
        # Gamification score
        score = 10 if level == "basic" else 20 if level == "advanced" else 30
        print(f"[+] Gamification Score: {score} points (Level: {level})")
        return {"success": True, "output": output_path, "score": score}

    except Exception as e:
        print(f"[-] Error: {e}")


def extract_message(image_path, private_key_path=None, password=None):
    """Extracts a hidden message from an image."""
    try:
        img = Image.open(image_path)
        img = img.convert("RGB")
        pixels = img.load()

        width, height = img.size
        binary_data = ""

        print("[*] Extracting data...")

        # We need to read enough bits to find the delimiter.
        # Since we don't know the length, we have to scan.
        # Optimization: Check for delimiter every N bytes.

        delimiter_bin = data_to_bin(DELIMITER.encode())
        delimiter_len = len(delimiter_bin)

        # We will collect bits and check the tail
        collected_bits = []

        for y in range(height):
            for x in range(width):
                r, g, b = pixels[x, y]

                collected_bits.append(str(r & 1))
                if (
                    len(collected_bits) >= delimiter_len
                    and "".join(collected_bits[-delimiter_len:]) == delimiter_bin
                ):
                    break

                collected_bits.append(str(g & 1))
                if (
                    len(collected_bits) >= delimiter_len
                    and "".join(collected_bits[-delimiter_len:]) == delimiter_bin
                ):
                    break

                collected_bits.append(str(b & 1))
                if (
                    len(collected_bits) >= delimiter_len
                    and "".join(collected_bits[-delimiter_len:]) == delimiter_bin
                ):
                    break
            else:
                continue
            break

        full_binary = "".join(collected_bits)

        if full_binary.endswith(delimiter_bin):
            # Remove delimiter
            content_binary = full_binary[:-delimiter_len]
            content_bytes = bin_to_bytes(content_binary)

            decrypted_data = None

            if password:
                print(f"[*] Decrypting message with password...")
                try:
                    decrypted_data = decrypt_message_password(content_bytes, password)
                except Exception as e:
                    return {"error": f"Decryption failed: {e}"}
            elif private_key_path:
                print(f"[*] Decrypting message with {private_key_path}...")
                try:
                    decrypted_data = decrypt_message(content_bytes, private_key_path)
                except Exception as e:
                    return {"error": f"Decryption failed: {e}"}
            else:
                # Assume plain text (compressed)
                decrypted_data = content_bytes

            # Decompress
            try:
                print("[*] Decompressing data...")
                decompressed_bytes = zlib.decompress(decrypted_data)
                decrypted_json_str = decompressed_bytes.decode("utf-8")
            except zlib.error:
                # Fallback for backward compatibility (uncompressed data)
                # If decompression fails, maybe it wasn't compressed (old images)
                try:
                    decrypted_json_str = decrypted_data.decode("utf-8")
                except:
                    return {
                        "error": "Decompression failed and could not decode as text."
                    }
            except Exception as e:
                return {"error": f"Decompression error: {e}"}

            # Parse JSON
            try:
                payload = json.loads(decrypted_json_str)
                # Auto-unzip if zipped
                if payload.get("type") == "file" and payload.get("zipped"):
                    zip_data = base64.b64decode(payload["data"])
                    zip_buffer = io.BytesIO(zip_data)
                    with zipfile.ZipFile(zip_buffer, 'r') as zip_file:
                        file_name = zip_file.namelist()[0]
                        payload["data"] = base64.b64encode(zip_file.read(file_name)).decode()
                    payload["zipped"] = False
                return payload
            except json.JSONDecodeError:
                # Backward compatibility: It might be a plain string from previous version
                return {"type": "text", "data": decrypted_json_str}

        else:
            return {"error": "No hidden message found or delimiter missing."}

    except Exception as e:
        return {"error": f"Error: {e}"}


def generate_nft_metadata(owner_wallet, faction, superpower, keys_clue, level):
    """Generates encrypted metadata for NFT, owner-only access."""
    metadata = {
        "faction": faction,
        "superpower": superpower,
        "keys_clue": keys_clue,  # Encrypted clue
        "level": level,
        "owner": owner_wallet
    }
    # Encrypt with owner's wallet as password (or derive key)
    encrypted = encrypt_message_password(json.dumps(metadata).encode(), owner_wallet)
    return base64.b64encode(encrypted).decode()


def embed_nft_secret(image_path, owner_wallet, faction, superpower, keys_clue, level, output_path):
    """Embeds owner-specific NFT data into image."""
    secret_data = generate_nft_metadata(owner_wallet, faction, superpower, keys_clue, level)
    payload = {"type": "nft_secret", "data": secret_data}
    return hide_message(image_path, payload, output_path, level="premium", password=owner_wallet)


def extract_nft_secret(image_path, owner_wallet):
    """Extracts NFT secret for owner."""
    result = extract_message(image_path, password=owner_wallet)
    if result.get("type") == "nft_secret":
        encrypted = base64.b64decode(result["data"])
        decrypted = decrypt_message_password(encrypted, owner_wallet)
        return json.loads(decrypted.decode())
    return None
        print(
            f"[*] (Note: Encryption adds overhead, and the delimiter takes {len(DELIMITER)} bytes)"
        )
        return max_bytes
    except Exception as e:
        print(f"[-] Error: {e}")
        return 0


if __name__ == "__main__":
    print("--- Steganography Image Hider (Secure) ---")
    print("1. Generate Keys")
    print("2. Embed Message")
    print("3. Extract Message")
    print("4. Check Image Capacity")

    choice = input("Select an option (1-4): ").strip()

    if choice == "1":
        generate_keys()

    elif choice == "2":
        img_path = input("Enter path to input image: ").strip()
        if not os.path.exists(img_path):
            print("[-] Image not found.")
            sys.exit()

        msg = input("Enter secret message: ")
        out_path = input("Enter path for output image (e.g., secret.png): ").strip()

        use_enc = input("Use encryption? (y/n): ").lower().strip()
        pub_key = None
        if use_enc == "y":
            pub_key = (
                input("Enter path to public key (default: public_key.pem): ").strip()
                or "public_key.pem"
            )
            if not os.path.exists(pub_key):
                print("[-] Public key not found. Generate keys first.")
                sys.exit()

        hide_message(img_path, msg, out_path, pub_key)

    elif choice == "3":
        img_path = input("Enter path to image with hidden message: ").strip()
        if not os.path.exists(img_path):
            print("[-] Image not found.")
            sys.exit()

        use_enc = input("Is the message encrypted? (y/n): ").lower().strip()
        priv_key = None
        if use_enc == "y":
            priv_key = (
                input("Enter path to private key (default: private_key.pem): ").strip()
                or "private_key.pem"
            )
            if not os.path.exists(priv_key):
                print("[-] Private key not found.")
                sys.exit()

        hidden_msg = extract_message(img_path, priv_key)
        print(f"[+] Hidden Message: {hidden_msg}")

    elif choice == "4":
        img_path = input("Enter path to image: ").strip()
        if not os.path.exists(img_path):
            print("[-] Image not found.")
            sys.exit()
        calculate_capacity(img_path)

    else:
        print("[-] Invalid choice.")
