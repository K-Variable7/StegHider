from PIL import Image
import sys
import os
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives.asymmetric.rsa import RSAPublicKey, RSAPrivateKey
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.fernet import Fernet
import base64
import json
import zlib
import hashlib
import math
from reedsolo import RSCodec, ReedSolomonError
import argparse
import logging
import shutil
import time
 
DELIMITER = "###END###"
DEFAULT_RS_PERCENT = 0.125  # default parity fraction (12.5%) of combined header+chunk


def estimate_nsym_for_expected_corruption(combined_len, expected_corrupt_fraction=0.02, safety_factor=1.5, max_nsym=256):
    """Estimate required RS nsym (parity bytes) given an expected fraction of corrupted bytes.

    - combined_len: length in bytes of header+chunk
    - expected_corrupt_fraction: fraction (0-1) of bytes expected to be corrupted
    - safety_factor: multiply estimated corrupt bytes by this factor
    - returns (nsym, percent) where percent is suggested RS percent of combined length
    """
    if combined_len <= 0:
        return (16, DEFAULT_RS_PERCENT)
    # estimated corrupted bytes
    est_corrupt_bytes = combined_len * float(expected_corrupt_fraction)
    # Reed-Solomon corrects up to nsym/2 random byte errors; for erasures it can correct nsym
    # To be conservative assume random errors: nsym_needed ~= 2 * est_corrupt_bytes
    nsym = int(math.ceil(2.0 * est_corrupt_bytes * float(safety_factor)))
    nsym = max(8, min(int(max_nsym), nsym))
    percent = nsym / float(combined_len) if combined_len > 0 else DEFAULT_RS_PERCENT
    # clamp percent to reasonable bounds
    percent = max(0.01, min(0.5, percent))
    return (nsym, percent)
def _safe_get_rgb(pixels, x, y):
    """Return a (r,g,b) tuple of ints from a PIL PixelAccess, defensively."""
    val = pixels[x, y]
    if val is None:
        return (0, 0, 0)
    # If PixelAccess returns a single int (grayscale) or floats, coerce
    if isinstance(val, (int, float)):
        v = int(val) & 0xFF
        return (v, v, v)
    # If it's a tuple/list-like, ensure ints
    try:
        r, g, b = val[:3]
        return (int(r) & 0xFF, int(g) & 0xFF, int(b) & 0xFF)
    except Exception:
        return (0, 0, 0)
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

    # Ensure we have an RSA public key (helps static analyzers and provides clearer error messages)
    if not isinstance(public_key, RSAPublicKey):
        raise TypeError("Provided public key is not an RSA public key")

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

    if not isinstance(private_key, RSAPrivateKey):
        raise TypeError("Provided private key is not an RSA private key")

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
    image_path, secret_message, output_path, public_key_path=None, password=None
):
    """Embeds a secret message into an image using LSB steganography."""
    try:
        img = Image.open(image_path)
        img = img.convert("RGB")
        pixels = img.load()

        # Prepare the payload
        if isinstance(secret_message, dict):
            # It's already a structured payload (e.g. file)
            payload_str = json.dumps(secret_message)
        else:
            # It's just text
            payload = {"type": "text", "data": secret_message}
            payload_str = json.dumps(payload)

        # Compress the payload
        print("[*] Compressing data...")
        payload_bytes = payload_str.encode("utf-8")
        compressed_data = zlib.compress(payload_bytes)

        if password:
            print("[*] Encrypting message with password...")
            secret_data = encrypt_message_password(compressed_data, password)
            full_data = secret_data + DELIMITER.encode()
        elif public_key_path:
            print(f"[*] Encrypting message with {public_key_path}...")
            # Encrypt the message -> returns bytes
            secret_data = encrypt_message(compressed_data, public_key_path)
            # We need to append a delimiter. Since we are working with bytes now,
            # and Fernet output is base64 (safe chars), we can use the string delimiter.
            # But we need to be careful. Let's just append the delimiter as bytes.
            full_data = secret_data + DELIMITER.encode()
        else:
            # Plain text mode (compressed)
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
                r, g, b = _safe_get_rgb(pixels, x, y)

                if data_index < message_len:
                    r = (r & ~1) | int(binary_message[data_index])
                    data_index += 1
                if data_index < message_len:
                    g = (g & ~1) | int(binary_message[data_index])
                    data_index += 1
                if data_index < message_len:
                    b = (b & ~1) | int(binary_message[data_index])
                    data_index += 1

                img.putpixel((x, y), (r, g, b))
                if data_index >= message_len:
                    break
            if data_index >= message_len:
                break

        img.save(output_path)
        print(f"[+] Data hidden successfully! Saved to {output_path}")

    except Exception as e:
        print(f"[-] Error: {e}")


def extract_message(image_path, private_key_path=None, password=None):
    """Extracts a hidden message from an image."""
    try:
        img = Image.open(image_path)
        img = img.convert("RGB")
        pixels = img.load()

        width, height = img.size

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
                r, g, b = _safe_get_rgb(pixels, x, y)

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
                print("[*] Decrypting message with password...")
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
                except Exception:
                    return {
                        "error": "Decompression failed and could not decode as text."
                    }
            except Exception as e:
                return {"error": f"Decompression error: {e}"}

            # Parse JSON
            try:
                payload = json.loads(decrypted_json_str)
                return payload
            except json.JSONDecodeError:
                # Backward compatibility: It might be a plain string from previous version
                return {"type": "text", "data": decrypted_json_str}

        else:
            return {"error": "No hidden message found or delimiter missing."}

    except Exception as e:
        return {"error": f"Error: {e}"}


def calculate_capacity(image_path):
    """Calculates the maximum message size for a given image."""
    try:
        img = Image.open(image_path)
        width, height = img.size
        total_pixels = width * height
        max_bits = total_pixels * 3
        max_bytes = max_bits // 8

        print(f"[*] Image Dimensions: {width}x{height}")
        print(f"[*] Total Pixels: {total_pixels}")
        print(f"[*] Max Capacity: {max_bits} bits")
        print(f"[*] Max Message Size: approx {max_bytes} characters (bytes)")
        print(
            f"[*] (Note: Encryption adds overhead, and the delimiter takes {len(DELIMITER)} bytes)"
        )
        return max_bytes
    except Exception as e:
        print(f"[-] Error: {e}")
        return 0


def embed_bytes_to_image(image_path, data_bytes, output_path):
    """Embed raw bytes (already encrypted/compressed) into an image LSB and save to output_path."""
    try:
        img = Image.open(image_path)
        img = img.convert("RGB")
        pixels = img.load()

        full_data = data_bytes + DELIMITER.encode()
        binary_message = data_to_bin(full_data)
        message_len = len(binary_message)

        width, height = img.size
        total_pixels = width * height * 3

        if message_len > total_pixels:
            raise ValueError(
                f"Chunk too large for this image. Need {message_len} bits, but image only has {total_pixels} bits available."
            )

        data_index = 0
        print(f"[*] Embedding {len(data_bytes)} bytes into {image_path}...")

        for y in range(height):
            for x in range(width):
                r, g, b = _safe_get_rgb(pixels, x, y)

                if data_index < message_len:
                    r = (r & ~1) | int(binary_message[data_index])
                    data_index += 1
                if data_index < message_len:
                    g = (g & ~1) | int(binary_message[data_index])
                    data_index += 1
                if data_index < message_len:
                    b = (b & ~1) | int(binary_message[data_index])
                    data_index += 1

                img.putpixel((x, y), (r, g, b))
                if data_index >= message_len:
                    break
            if data_index >= message_len:
                break

        img.save(output_path)
        print(f"[+] Chunk embedded successfully to {output_path}")
        return True

    except Exception as e:
        print(f"[-] Error embedding bytes: {e}")
        return False


def extract_raw_bytes_from_image(image_path):
    """Extract raw bytes (header+payload) from image LSB without attempting decryption/decompression."""
    try:
        img = Image.open(image_path)
        img = img.convert("RGB")
        pixels = img.load()

        width, height = img.size
        delimiter_bin = data_to_bin(DELIMITER.encode())
        delimiter_len = len(delimiter_bin)

        collected_bits = []

        for y in range(height):
            for x in range(width):
                r, g, b = _safe_get_rgb(pixels, x, y)

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
            content_binary = full_binary[:-delimiter_len]
            content_bytes = bin_to_bytes(content_binary)
            return content_bytes
        else:
            return None

    except Exception as e:
        print(f"[-] Error extracting raw bytes: {e}")
        return None


def chunk_and_embed_file(input_file_path, cover_images, out_dir, public_key_path=None, password=None, rs_nsym_override=None, rs_percent_override=None):
    """Encrypt input file (hybrid or password), chunk the encrypted payload and embed across provided cover images.

    cover_images: list of image paths (order matters). One chunk per image.
    """
    try:
        if not os.path.exists(input_file_path):
            print("[-] Input file not found.")
            return False

        with open(input_file_path, "rb") as f:
            file_bytes = f.read()

        print(f"[*] Read {len(file_bytes)} bytes from {input_file_path}")

        # Encrypt the whole payload
        if password:
            print("[*] Encrypting payload with password...")
            encrypted_payload = encrypt_message_password(file_bytes, password)
        elif public_key_path:
            print("[*] Encrypting payload with RSA public key...")
            encrypted_payload = encrypt_message(file_bytes, public_key_path)
        else:
            print("[*] No encryption selected: using plaintext payload (not recommended)")
            encrypted_payload = file_bytes

        total_size = len(encrypted_payload)
        print(f"[*] Encrypted payload size: {total_size} bytes")

        # Prepare manifest
        manifest = {
            "version": 1,
            "original_filename": os.path.basename(input_file_path),
            "total_size": total_size,
            "chunks": [],
        }

        # Determine chunk sizes based on cover images capacities
        chunks = []
        offset = 0
        for idx, cover in enumerate(cover_images):
            cap = calculate_capacity(cover)
            # conservative margin for header + delimiter + compression/encryption overhead
            cap_bytes = max(64, math.floor(cap * 0.85))

            if offset >= total_size:
                break

            take = min(cap_bytes, total_size - offset)
            chunk_bytes = encrypted_payload[offset : offset + take]

            # simple header for the chunk
            header = json.dumps({
                "index": idx,
                "payload_len": total_size,
                "chunk_len": len(chunk_bytes),
                "orig_name": os.path.basename(input_file_path),
            }).encode("utf-8")

            combined = header + b"\n\n" + chunk_bytes

            # Determine Reed-Solomon parity length (nsym).
            # Priority: explicit override (absolute nsym), percent override (e.g. 0.15 for 15%),
            # otherwise use heuristic based on combined chunk length (~12.5%).
            if rs_nsym_override is not None:
                try:
                    nsym = int(rs_nsym_override)
                except Exception:
                    nsym = None
            elif rs_percent_override is not None:
                try:
                    percent = float(rs_percent_override)
                    if percent > 1.0:
                        # if user passed percent like 15, convert to fraction
                        percent = percent / 100.0
                    combined_len = len(combined)
                    nsym = int(max(8, min(256, math.ceil(combined_len * percent))))
                except Exception:
                    nsym = None
            else:
                combined_len = len(combined)
                suggested_nsym = int(max(12, min(192, math.ceil(combined_len * 0.125))))
                nsym = suggested_nsym

            # Try encoding with RS, reduce nsym until it fits
            encoded_blob = None
            while nsym >= 0:
                try:
                    if nsym > 0:
                        rs = RSCodec(nsym)
                        encoded = rs.encode(combined)
                    else:
                        encoded = combined

                    # prefix nsym (2 bytes) so we can know parity length on decode
                    final_blob = nsym.to_bytes(2, "big") + encoded

                    if len(final_blob) <= cap_bytes:
                        encoded_blob = final_blob
                        break
                    else:
                        # reduce parity and retry
                        if nsym == 0:
                            break
                        nsym = max(0, nsym // 2)
                except Exception:
                    nsym = max(0, nsym // 2)

            if encoded_blob is None:
                print(f"[-] Could not fit chunk into cover image {cover} (insufficient capacity)")
                return False

            sha = hashlib.sha256(encoded_blob).hexdigest()
            chunks.append({"cover": cover, "data": encoded_blob, "sha256": sha, "nsym": nsym})
            manifest["chunks"].append({"index": idx, "cover": os.path.basename(cover), "sha256": sha, "chunk_len": len(chunk_bytes), "nsym": nsym})

            offset += take

        total_chunks = len(chunks)
        manifest["total_chunks"] = total_chunks

        if offset < total_size:
            print("[-] Not enough cover images to fit the payload. Provide more or larger images.")
            return False

        # Ensure output directory
        os.makedirs(out_dir, exist_ok=True)

        # Embed each chunk into corresponding cover image
        out_images = []
        for i, c in enumerate(chunks):
            out_name = os.path.join(out_dir, f"stego_chunk_{i}_{os.path.basename(c['cover'])}")
            # keep extension .png
            if not out_name.lower().endswith('.png'):
                out_name = out_name + '.png'

            ok = embed_bytes_to_image(c["cover"], c["data"], out_name)
            if not ok:
                print(f"[-] Failed to embed chunk {i}")
                return False
            out_images.append(out_name)

        # Save manifest (plaintext) into out_dir as manifest.json (will encrypt below if requested)
        manifest_path = os.path.join(out_dir, "manifest.json")
        with open(manifest_path, "w") as mf:
            json.dump(manifest, mf, indent=2)

        # Encrypt manifest if encryption was used for payload
        manifest_bytes = json.dumps(manifest).encode("utf-8")
        enc_manifest = None
        if password:
            enc_manifest = encrypt_message_password(manifest_bytes, password)
        elif public_key_path:
            enc_manifest = encrypt_message(manifest_bytes, public_key_path)

        if enc_manifest:
            manifest_enc_path = os.path.join(out_dir, "manifest.json.enc")
            with open(manifest_enc_path, "wb") as mfe:
                mfe.write(enc_manifest)
            # remove plaintext manifest
            try:
                os.remove(manifest_path)
            except Exception:
                pass
            print(f"[+] Finished embedding {total_chunks} chunks. Encrypted manifest saved to {manifest_enc_path}")
        else:
            print(f"[+] Finished embedding {total_chunks} chunks. Manifest saved to {manifest_path}")
        return True

    except Exception as e:
        print(f"[-] Error in chunk_and_embed_file: {e}")
        return False


def reassemble_from_images(image_paths, output_file_path, private_key_path=None, password=None):
    """Extract chunks from images (given in order or unsorted), reassemble, and decrypt to produce original file."""
    try:
        extracted_chunks = []
        for p in image_paths:
            data = extract_raw_bytes_from_image(p)
            if data is None:
                print(f"[-] No chunk found in {p}")
                return False

            # read nsym prefix (first 2 bytes)
            if len(data) < 2:
                print(f"[-] Chunk too small in {p}")
                return False
            nsym = int.from_bytes(data[:2], "big")
            encoded = data[2:]

            # Attempt RS decode if nsym > 0
            try:
                if nsym > 0:
                    rs = RSCodec(nsym)
                    decoded = rs.decode(encoded)
                    # some reedsolo versions return (decoded, ecc); handle that
                    if isinstance(decoded, tuple) and len(decoded) > 0:
                        decoded = decoded[0]
                else:
                    decoded = encoded
            except ReedSolomonError as e:
                print(f"[-] Reed-Solomon decode failed for {p}: {e}")
                return False
            except Exception as e:
                print(f"[-] Unexpected decode error for {p}: {e}")
                return False

            # normalize decoded value to raw bytes (handle tuple return types, arrays, memoryviews)
            try:
                if isinstance(decoded, tuple) and len(decoded) > 0:
                    decoded = decoded[0]

                decoded_bytes = bytes(decoded)
            except Exception as e:
                print(f"[-] Could not convert decoded data to bytes for {p}: {e}")
                return False

            # split header and chunk
            try:
                header_raw, chunk = decoded_bytes.split(b"\n\n", 1)
            except ValueError:
                print(f"[-] Invalid chunk format after decode in {p}")
                return False

            header = json.loads(header_raw.decode("utf-8"))
            extracted_chunks.append((header.get("index", 0), chunk))

        # sort by index
        extracted_chunks.sort(key=lambda x: x[0])
        payload_bytes = b"".join([c[1] for c in extracted_chunks])

        # Now payload_bytes is the encrypted payload (possibly wrapped with RSA or password salt)
        # Decrypt according to provided keys
        decrypted = None
        if password:
            print("[*] Decrypting with password...")
            decrypted = decrypt_message_password(payload_bytes, password)
        elif private_key_path:
            print("[*] Decrypting with RSA private key...")
            decrypted = decrypt_message(payload_bytes, private_key_path)
        else:
            decrypted = payload_bytes

        # Write to output file
        with open(output_file_path, "wb") as out:
            out.write(decrypted)

        print(f"[+] Reassembled and wrote to {output_file_path}")
        return True

    except Exception as e:
        print(f"[-] Error in reassemble_from_images: {e}")
        return False


def _run_args_and_exit():
    """Parse CLI args for non-interactive usage and execute commands if provided.
    Returns True if args were handled (and process should exit), False otherwise.
    """
    parser = argparse.ArgumentParser(description="StegHider CLI (non-interactive)")
    sub = parser.add_subparsers(dest="cmd")

    # genkeys
    p_gen = sub.add_parser("genkeys")
    p_gen.add_argument("--private", default="private_key.pem")
    p_gen.add_argument("--public", default="public_key.pem")

    # chunk & embed
    p_chunk = sub.add_parser("chunk")
    p_chunk.add_argument("--infile", required=True)
    p_chunk.add_argument("--covers", required=True, help="Comma-separated cover image paths")
    p_chunk.add_argument("--outdir", required=True)
    p_chunk.add_argument("--public-key", dest="public_key")
    p_chunk.add_argument("--password")
    p_chunk.add_argument("--rs-nsym", type=int)
    p_chunk.add_argument("--rs-percent", type=float)
    p_chunk.add_argument("--dry-run-estimate", action="store_true", help="Estimate nsym/percent for expected corruption and exit")
    p_chunk.add_argument("--expected-corruption", type=float, default=0.02, help="Expected fraction of byte corruption (e.g., 0.02 for 2%) used by estimator")
    p_chunk.add_argument("--safety-factor", type=float, default=1.5, help="Safety multiplier used by estimator")
    p_chunk.add_argument("--auto-tune", action="store_true", help="Automatically increase RS parity until simulated corruption recovery succeeds")
    p_chunk.add_argument("--rs-start", type=float, default=5.0, help="Starting RS percent for auto-tune (percent)")
    p_chunk.add_argument("--rs-step", type=float, default=5.0, help="RS percent increment step for auto-tune (percent)")
    p_chunk.add_argument("--rs-max", type=float, default=35.0, help="Maximum RS percent for auto-tune (percent)")
    p_chunk.add_argument("--verify-private-key", dest="verify_private_key", help="Path to private key used to verify recovery during auto-tune")
    p_chunk.add_argument("--verify-password", dest="verify_password", help="Password used to verify recovery during auto-tune")
    p_chunk.add_argument("--jpeg-qualities", dest="jpeg_qualities", help="Comma-separated JPEG qualities to try during auto-tune (e.g. 85,75,65)", default="85,75,65")

    # reassemble
    p_reas = sub.add_parser("reassemble")
    p_reas.add_argument("--images", required=True, help="Comma-separated stego image paths")
    p_reas.add_argument("--outfile", required=True)
    p_reas.add_argument("--private-key", dest="private_key")
    p_reas.add_argument("--password")

    args = parser.parse_args()
    if not args.cmd:
        return False

    if args.cmd == "genkeys":
        generate_keys(private_path=args.private, public_path=args.public)
        sys.exit(0)

    if args.cmd == "chunk":
        covers = [c.strip() for c in args.covers.split(",") if c.strip()]
        rs_n = getattr(args, "rs_nsym", None)
        rs_p = getattr(args, "rs_percent", None)
        if getattr(args, "dry_run_estimate", False):
            # Do a dry-run estimate and exit -- need combined length estimate.
            # Read input file and estimate per-chunk combined length as file size (single chunk)
            with open(args.infile, 'rb') as rf:
                payload = rf.read()
            combined_len = len(payload)  # header overhead unknown here; use payload as proxy
            nsym_suggest, pct_suggest = estimate_nsym_for_expected_corruption(combined_len, expected_corrupt_fraction=args.expected_corruption, safety_factor=args.safety_factor)
            print(f"Estimated nsym: {nsym_suggest}, suggested RS percent: {pct_suggest*100:.2f}% for combined_len={combined_len}")
            sys.exit(0)

        if getattr(args, "auto_tune", False):
            # parse jpeg qualities
            try:
                jpeg_quals = [int(q) for q in args.jpeg_qualities.split(',') if q.strip()]
            except Exception:
                jpeg_quals = [85, 75, 65]

            ok = auto_tune_and_embed(args.infile, covers, args.outdir, public_key_path=args.public_key, password=args.password,
                                     start_percent=args.rs_start, step_percent=args.rs_step, max_percent=args.rs_max,
                                     verify_private_key=args.verify_private_key, verify_password=args.verify_password,
                                     expected_corrupt_fraction=args.expected_corruption, safety_factor=args.safety_factor,
                                     jpeg_qualities=jpeg_quals)
        else:
            ok = chunk_and_embed_file(args.infile, covers, args.outdir, public_key_path=args.public_key, password=args.password, rs_nsym_override=rs_n, rs_percent_override=rs_p)
        sys.exit(0 if ok else 2)

    if args.cmd == "reassemble":
        images = [c.strip() for c in args.images.split(",") if c.strip()]
        ok = reassemble_from_images(images, args.outfile, private_key_path=args.private_key, password=args.password)
        sys.exit(0 if ok else 2)

    return True


def _corrupt_lsb_image(src_path, dst_path, flips=200):
    """Flip random LSBs in the red channel of the image to simulate mild corruption."""
    try:
        img = Image.open(src_path).convert('RGB')
        pixels = img.load()
        width, height = img.size
        import random
        for i in range(flips):
            x = random.randrange(width)
            y = random.randrange(height)
            r, g, b = _safe_get_rgb(pixels, x, y)
            r = (r & ~1) | (1 - (r & 1))
            img.putpixel((x, y), (r, g, b))
        img.save(dst_path)
        return True
    except Exception as e:
        print(f"[-] Corruption (LSB) failed: {e}")
        return False


def _zero_region_image(src_path, dst_path, region_fraction=0.15):
    """Zero out a random rectangular region to simulate cropping or erasure."""
    try:
        img = Image.open(src_path).convert('RGB')
        pixels = img.load()
        width, height = img.size
        rw = max(1, int(width * region_fraction))
        rh = max(1, int(height * region_fraction))
        import random
        x0 = random.randint(0, max(0, width - rw))
        y0 = random.randint(0, max(0, height - rh))
        for y in range(y0, min(height, y0 + rh)):
            for x in range(x0, min(width, x0 + rw)):
                img.putpixel((x, y), (0, 0, 0))
        img.save(dst_path)
        return True
    except Exception as e:
        print(f"[-] Corruption (zero region) failed: {e}")
        return False


def _simulate_jpeg_recompress(src_path, dst_path, quality=80):
    """Recompress the image as JPEG at `quality` to simulate platform recompression.

    Saves output to `dst_path` (can be .jpg or .png). Returns True on success.
    """
    try:
        img = Image.open(src_path).convert('RGB')
        # Write to a temporary JPEG then reopen and save to dst_path if requested
        tmp_jpeg = dst_path
        # If dst_path endswith .png, we still create a jpeg and then save png
        if dst_path.lower().endswith('.png'):
            tmp_jpeg = dst_path[:-4] + '.jpg'

        img.save(tmp_jpeg, format='JPEG', quality=int(quality))

        if dst_path.lower().endswith('.png'):
            # reopen jpeg and save as png to preserve extension
            img2 = Image.open(tmp_jpeg).convert('RGB')
            img2.save(dst_path, format='PNG')
            try:
                os.remove(tmp_jpeg)
            except Exception:
                pass
        return True
    except Exception as e:
        print(f"[-] JPEG recompress failed: {e}")
        return False


def _simulate_resize_roundtrip(src_path, dst_path, scale_down=0.9):
    """Resize down by `scale_down` then resize back to original size to simulate scaling artifacts."""
    try:
        img = Image.open(src_path).convert('RGB')
        width, height = img.size
        new_w = max(1, int(width * float(scale_down)))
        new_h = max(1, int(height * float(scale_down)))
        img_small = img.resize((new_w, new_h), resample=Image.LANCZOS)
        img_round = img_small.resize((width, height), resample=Image.BILINEAR)
        img_round.save(dst_path)
        return True
    except Exception as e:
        print(f"[-] Resize roundtrip failed: {e}")
        return False


def auto_tune_and_embed(input_file_path, cover_images, out_dir, public_key_path=None, password=None,
                        start_percent=5.0, step_percent=5.0, max_percent=35.0,
                        verify_private_key=None, verify_password=None, max_iterations=None,
                        expected_corrupt_fraction=0.02, safety_factor=1.5, jpeg_qualities=None):
    """Auto-tune RS parity by embedding with increasing parity percent and verifying recovery under simulated corruption.

    Requires either `verify_private_key` (for RSA) or `verify_password` (for password mode) to validate reassembly.
    """
    try:
        if not os.path.exists(input_file_path):
            print("[-] Input file not found for auto-tune.")
            return False

        with open(input_file_path, 'rb') as f:
            original_bytes = f.read()

        orig_sha = hashlib.sha256(original_bytes).hexdigest()

        # Use estimator to seed starting percent based on approximate per-chunk size.
        try:
            total_size = len(original_bytes)
            num_covers = max(1, len(cover_images))
            # rough per-chunk payload (we'll add a small header estimate)
            per_chunk_payload = math.ceil(total_size / num_covers)
            header_estimate = 128
            combined_len = per_chunk_payload + header_estimate
            nsym_est, pct_frac = estimate_nsym_for_expected_corruption(combined_len, expected_corrupt_fraction=expected_corrupt_fraction, safety_factor=safety_factor)
            pct_est = pct_frac * 100.0
            # ensure starting percent is at least estimator suggestion
            if start_percent is None:
                start_percent = pct_est
            else:
                start_percent = max(float(start_percent), pct_est)
            print(f"[*] Auto-tune seeded by estimator: per_chunk_len={combined_len}, suggested nsym={nsym_est}, pct={pct_est:.2f}%; start_percent set to {start_percent}%")
        except Exception:
            pass

        os.makedirs(out_dir, exist_ok=True)

        # Setup logger for auto-tune attempts
        log_path = os.path.join(out_dir, 'auto_tune.log')
        logger = logging.getLogger(f'auto_tune_{id(out_dir)}')
        logger.setLevel(logging.INFO)
        # Ensure no duplicate handlers
        if not any(isinstance(h, logging.FileHandler) and h.baseFilename == os.path.abspath(log_path) for h in logger.handlers):
            fh = logging.FileHandler(log_path)
            fh.setFormatter(logging.Formatter('%(asctime)s %(levelname)s %(message)s'))
            logger.addHandler(fh)
        logger.info(f"Starting auto-tune for {input_file_path} covers={len(cover_images)}")

        tried = []
        iter_count = 0
        pct = float(start_percent)
        while pct <= float(max_percent):
            iter_count += 1
            if max_iterations and iter_count > max_iterations:
                break
            attempt_start = math.floor(time.time())
            logger.info(f"Attempt {iter_count}: trying RS percent {pct}%")
            print(f"[*] Auto-tune attempt: trying RS percent {pct}%")
            attempt_dir = os.path.join(out_dir, f"attempt_pct_{int(pct)}")
            try:
                shutil.rmtree(attempt_dir, ignore_errors=True)
                os.makedirs(attempt_dir, exist_ok=True)
            except Exception:
                pass

            ok = chunk_and_embed_file(input_file_path, cover_images, attempt_dir, public_key_path=public_key_path, password=password, rs_percent_override=pct)
            if not ok:
                logger.info(f"Attempt {iter_count} embed failed at pct={pct}%")
                tried.append((pct, False, 'embed_failed'))
                pct += float(step_percent)
                continue

            # find stego images
            stego_images = [os.path.join(attempt_dir, p) for p in os.listdir(attempt_dir) if p.lower().endswith('.png')]
            if not stego_images:
                tried.append((pct, False, 'no_stego_images'))
                pct += float(step_percent)
                continue

            # simulate corruption variations on first stego image and attempt recovery
            test_img = stego_images[0]
            corrupted = os.path.join(attempt_dir, 'corrupted.png')
            _corrupt_lsb_image(test_img, corrupted, flips=300)
            zeroed = os.path.join(attempt_dir, 'zeroed.png')
            _zero_region_image(corrupted, zeroed, region_fraction=0.15)

            # JPEG recompression variants (try multiple qualities)
            jpeg_paths = []
            quals = jpeg_qualities or [85, 75, 65]
            for q in quals:
                qp = os.path.join(attempt_dir, f'recompress_q{q}.jpg')
                okj = _simulate_jpeg_recompress(test_img, qp, quality=q)
                if okj:
                    jpeg_paths.append(qp)

            # Resize roundtrip variant
            resized = os.path.join(attempt_dir, 'resized.png')
            _simulate_resize_roundtrip(test_img, resized, scale_down=0.9)

            # include the raw LSB-flipped corrupted image first, then zeroed region, JPEGs and resized
            variants = [corrupted, zeroed] + jpeg_paths + [resized]
            verified_any = False
            for variant in variants:
                tmp_reassembled = os.path.join(attempt_dir, f'reassembled_check_{os.path.basename(variant)}.bin')
                verify_ok = False
                if verify_password:
                    verify_ok = reassemble_from_images([variant], tmp_reassembled, password=verify_password)
                elif verify_private_key:
                    verify_ok = reassemble_from_images([variant], tmp_reassembled, private_key_path=verify_private_key)
                else:
                    print("[-] No verification credential provided (private key or password). Auto-tune requires verification credentials.")
                    return False

                if not verify_ok:
                    logger.info(f"Attempt {iter_count} pct={pct}% variant={os.path.basename(variant)} verify_failed")
                    tried.append((pct, False, f'verify_failed:{os.path.basename(variant)}'))
                    continue

                # check SHA
                try:
                    with open(tmp_reassembled, 'rb') as rf:
                        got = rf.read()
                    got_sha = hashlib.sha256(got).hexdigest()
                except Exception:
                    got_sha = None

                if got_sha == orig_sha:
                    logger.info(f"Attempt {iter_count} pct={pct}% variant={os.path.basename(variant)} success (sha match)")
                    print(f"[+] Auto-tune succeeded with RS percent {pct}% on variant {os.path.basename(variant)}")
                    # Move final attempt_dir contents into out_dir/final
                    final_dir = os.path.join(out_dir, 'final')
                    shutil.rmtree(final_dir, ignore_errors=True)
                    shutil.copytree(attempt_dir, final_dir)

                    # For compatibility with older tools/tests, also copy any stego PNGs into out_dir root
                    try:
                        for fname in os.listdir(final_dir):
                            if fname.lower().endswith('.png'):
                                srcf = os.path.join(final_dir, fname)
                                dstf = os.path.join(out_dir, fname)
                                try:
                                    shutil.copy(srcf, dstf)
                                except Exception:
                                    pass
                    except Exception:
                        pass

                    # copy auto_tune log into final_dir for debugging/record
                    try:
                        src_log = log_path
                        if os.path.exists(src_log):
                            shutil.copy(src_log, os.path.join(final_dir, 'auto_tune.log'))
                            log_ref = 'auto_tune.log'
                        else:
                            log_ref = None
                    except Exception:
                        log_ref = None

                    # annotate manifest if present (or write a sidecar if manifest is encrypted)
                    manifest_path = os.path.join(final_dir, 'manifest.json')
                    if not os.path.exists(manifest_path):
                        manifest_path = os.path.join(final_dir, 'manifest.json.enc') or manifest_path
                    try:
                        if os.path.exists(manifest_path) and manifest_path.endswith('.json'):
                            with open(manifest_path, 'r') as mf:
                                mfj = json.load(mf)
                            mfj.setdefault('auto_tune', {})
                            mfj['auto_tune']['rs_percent'] = pct
                            mfj['auto_tune']['iterations'] = iter_count
                            mfj['auto_tune']['variant'] = os.path.basename(variant)
                            if log_ref:
                                mfj['auto_tune']['log'] = log_ref
                            with open(manifest_path, 'w') as mfw:
                                json.dump(mfj, mfw, indent=2)
                        else:
                            # can't modify encrypted manifest; write a sidecar
                            sidecar = os.path.join(final_dir, 'manifest.auto_tune.json')
                            sidecar_obj = {'rs_percent': pct, 'iterations': iter_count, 'variant': os.path.basename(variant)}
                            if log_ref:
                                sidecar_obj['auto_tune_log'] = log_ref
                            with open(sidecar, 'w') as sf:
                                json.dump(sidecar_obj, sf, indent=2)
                    except Exception:
                        pass

                    tried.append((pct, True, f'success:{os.path.basename(variant)}'))
                    logger.info(f"Auto-tune completed: pct={pct}% variant={os.path.basename(variant)} iterations={iter_count}")
                    return True
                else:
                    logger.info(f"Attempt {iter_count} pct={pct}% variant={os.path.basename(variant)} sha_mismatch")
                    tried.append((pct, False, f'sha_mismatch:{os.path.basename(variant)}'))

            attempt_end = math.floor(time.time())
            duration = attempt_end - attempt_start
            logger.info(f"Attempt {iter_count} finished pct={pct}% duration_sec={duration} tried_variants={[os.path.basename(v) for v in variants]}")
            pct += float(step_percent)

        print(f"[-] Auto-tune failed after trying: {tried}")
        return False
    except Exception as e:
        print(f"[-] Error in auto_tune_and_embed: {e}")
        return False


if __name__ == "__main__":
    print("--- Steganography Image Hider (Secure) ---")
    print("1. Generate Keys")
    print("2. Embed Message")
    print("3. Extract Message")
    print("4. Check Image Capacity")
    print("5. Chunk & Embed File across multiple cover images")
    print("6. Reassemble & Extract file from stego images")

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

    elif choice == "5":
        infile = input("Path to input file to embed: ").strip()
        covers_raw = input("Comma-separated list of cover image paths: ").strip()
        covers = [c.strip() for c in covers_raw.split(',') if c.strip()]
        out_dir = input("Output directory for stego images: ").strip() or "stego_out"
        use_enc = input("Encrypt with RSA public key? (y/n): ").lower().strip()
        pub_key = None
        pwd = None
        if use_enc == 'y':
            pub_key = input("Path to public key (public_key.pem): ").strip() or "public_key.pem"
        else:
            use_pwd = input("Encrypt with password instead? (y/n): ").lower().strip()
            if use_pwd == 'y':
                pwd = input("Enter password: ").strip()

        # RS parity override: either absolute nsym or percent (e.g. '15%')
        rs_input = input("RS parity (absolute nsym or percent like '15%') or leave empty for heuristic: ").strip()
        rs_override = None
        rs_percent = None
        if rs_input:
            if rs_input.endswith('%'):
                try:
                    rs_percent = float(rs_input[:-1])
                except Exception:
                    rs_percent = None
            else:
                try:
                    rs_override = int(rs_input)
                except Exception:
                    rs_override = None

        ok = chunk_and_embed_file(infile, covers, out_dir, public_key_path=pub_key, password=pwd, rs_nsym_override=rs_override, rs_percent_override=rs_percent)
        if ok:
            print("[+] Chunk & embed completed.")
        else:
            print("[-] Chunk & embed failed.")

    elif choice == "6":
        images_raw = input("Comma-separated list of stego image paths (in order if possible): ").strip()
        images = [c.strip() for c in images_raw.split(',') if c.strip()]
        out_file = input("Path for output file (reassembled): ").strip() or "reassembled.bin"
        use_enc = input("Was payload encrypted? (y/n): ").lower().strip()
        priv_key = None
        pwd = None
        if use_enc == 'y':
            which = input("Decrypt with RSA private key or password? (rsa/pwd): ").lower().strip()
            if which == 'rsa':
                priv_key = input("Path to private key (private_key.pem): ").strip() or "private_key.pem"
            else:
                pwd = input("Enter password: ").strip()

        ok = reassemble_from_images(images, out_file, private_key_path=priv_key, password=pwd)
        if ok:
            print("[+] Reassembly successful.")
        else:
            print("[-] Reassembly failed.")

    else:
        print("[-] Invalid choice.")
