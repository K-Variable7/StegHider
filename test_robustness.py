#!/usr/bin/env python3

import steg_hider
import os


# Test Reed-Solomon encoding/decoding
def test_rs():
    data = b"Hello World"
    nsym = 10
    encoded = steg_hider.rs_encode(data, nsym)
    print(f"Original: {data}")
    print(f"Encoded length: {len(encoded)}")

    # Simulate corruption
    corrupted = bytearray(encoded)
    corrupted[5] ^= 1  # Flip a bit
    corrupted = bytes(corrupted)

    decoded = steg_hider.rs_decode(corrupted, nsym)
    print(f"Decoded: {decoded}")
    assert decoded == data, "RS failed"
    print("RS test passed")


# Test hide/extract with RS
def test_hide_extract_rs():
    image_path = "test_image.png"  # Assume exists
    if not os.path.exists(image_path):
        print("No test image, skipping")
        return

    output_path = "output.png"
    message = "Test message"

    # Hide with RS
    result = steg_hider.hide_message(
        image_path, message, output_path, enable_rs=True, nsym=10
    )
    print(f"Hide result: {result}")

    # Extract with RS
    extracted = steg_hider.extract_message(output_path, enable_rs=True, nsym=10)
    print(f"Extracted: {extracted}")

    assert extracted["data"] == message, "Extract failed"
    print("Hide/Extract with RS passed")


if __name__ == "__main__":
    test_rs()
    # test_hide_extract_rs()  # Uncomment if test image exists
