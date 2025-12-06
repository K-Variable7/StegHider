import os
import io
import shutil
import hashlib
from PIL import Image
import pytest

from steg_hider import (
    generate_keys,
    chunk_and_embed_file,
    reassemble_from_images,
    calculate_capacity,
)


def make_cover(path, size=(100, 100), color=(255, 255, 255)):
    img = Image.new('RGB', size, color)
    img.save(path, format='PNG')


def test_chunk_embed_reassemble_rsa(tmp_path):
    # Prepare temp workspace
    tmp = tmp_path
    cover = tmp / 'cover.png'
    make_cover(str(cover), size=(120, 120))

    infile = tmp / 'payload.bin'
    payload = b"Hello StegHider!" * 40  # ~640 bytes
    with open(infile, 'wb') as f:
        f.write(payload)

    # generate keys into tmp
    priv = tmp / 'private_test.pem'
    pub = tmp / 'public_test.pem'
    generate_keys(private_path=str(priv), public_path=str(pub))
    assert priv.exists() and pub.exists()

    out_dir = tmp / 'stego_out'
    os.makedirs(out_dir, exist_ok=True)

    # Run chunk & embed
    ok = chunk_and_embed_file(str(infile), [str(cover)], str(out_dir), public_key_path=str(pub))
    assert ok, "chunk_and_embed_file failed"

    # find generated stego images
    stego_images = [str(p) for p in out_dir.iterdir() if p.suffix.lower() == '.png']
    assert len(stego_images) >= 1

    out_reassembled = tmp / 'reassembled.bin'
    ok2 = reassemble_from_images(stego_images, str(out_reassembled), private_key_path=str(priv))
    assert ok2, "reassemble failed"

    with open(out_reassembled, 'rb') as f:
        got = f.read()

    assert got == payload


def corrupt_image_flip_lsb(src_path, dst_path, flips=100):
    img = Image.open(src_path).convert('RGB')
    pixels = img.load()
    width, height = img.size
    import random
    for i in range(flips):
        x = random.randrange(width)
        y = random.randrange(height)
        r, g, b = pixels[x, y]
        # flip LSB of r
        r = (r & ~1) | (1 - (r & 1))
        pixels[x, y] = (r, g, b)
    img.save(dst_path)


def corrupt_image_zero_region(src_path, dst_path, region_fraction=0.2):
    """Zero out a rectangular region of the image to simulate cropping/erase."""
    img = Image.open(src_path).convert('RGB')
    pixels = img.load()
    width, height = img.size
    rw = int(width * region_fraction)
    rh = int(height * region_fraction)
    import random
    x0 = random.randint(0, max(0, width - rw))
    y0 = random.randint(0, max(0, height - rh))
    for y in range(y0, y0 + rh):
        for x in range(x0, x0 + rw):
            pixels[x, y] = (0, 0, 0)
    img.save(dst_path)


def test_auto_tune_nsym_for_corruption(tmp_path):
    """Attempt embedding with increasing RS percent until corrupted image recovers."""
    tmp = tmp_path
    cover = tmp / 'cover3.png'
    make_cover(str(cover), size=(180, 180))

    infile = tmp / 'payload3.bin'
    payload = os.urandom(2048)  # 2KB random data
    with open(infile, 'wb') as f:
        f.write(payload)

    priv = tmp / 'private_test3.pem'
    pub = tmp / 'public_test3.pem'
    generate_keys(private_path=str(priv), public_path=str(pub))

    # Try a sequence of increasing parity percentages until recovery succeeds
    tried = []
    success = False
    for pct in [5, 10, 15, 20, 30]:
        out_dir = tmp / f'stego_out_pct_{pct}'
        os.makedirs(out_dir, exist_ok=True)
        ok = chunk_and_embed_file(str(infile), [str(cover)], str(out_dir), public_key_path=str(pub), rs_percent_override=pct)
        assert ok
        stego_images = [str(p) for p in out_dir.iterdir() if p.suffix.lower() == '.png']
        assert stego_images
        corrupted = tmp / f'corrupted_pct_{pct}.png'
        # use LSB flips and a zero region to stress
        corrupt_image_flip_lsb(stego_images[0], str(corrupted), flips=300)
        zeroed = tmp / f'zeroed_pct_{pct}.png'
        corrupt_image_zero_region(str(corrupted), str(zeroed), region_fraction=0.15)

        out_reassembled = tmp / f'reassembled_pct_{pct}.bin'
        ok2 = reassemble_from_images([str(zeroed)], str(out_reassembled), private_key_path=str(priv))
        tried.append((pct, ok2))
        if ok2:
            with open(out_reassembled, 'rb') as f:
                got = f.read()
            if got == payload:
                success = True
                break

    assert success, f"Auto-tune failed, attempts: {tried}"


def test_recovery_with_corruption(tmp_path):
    tmp = tmp_path
    cover = tmp / 'cover2.png'
    make_cover(str(cover), size=(160, 160))

    infile = tmp / 'payload2.bin'
    payload = os.urandom(1500)  # 1.5KB random data
    with open(infile, 'wb') as f:
        f.write(payload)

    # generate keys
    priv = tmp / 'private_test2.pem'
    pub = tmp / 'public_test2.pem'
    generate_keys(private_path=str(priv), public_path=str(pub))

    out_dir = tmp / 'stego_out2'
    os.makedirs(out_dir, exist_ok=True)

    ok = chunk_and_embed_file(str(infile), [str(cover)], str(out_dir), public_key_path=str(pub))
    assert ok

    stego_images = [str(p) for p in out_dir.iterdir() if p.suffix.lower() == '.png']
    assert len(stego_images) >= 1

    # corrupt the first stego image's LSBs
    corrupted = tmp / 'corrupted.png'
    corrupt_image_flip_lsb(stego_images[0], str(corrupted), flips=200)

    out_reassembled = tmp / 'reassembled2.bin'
    # try reassemble from corrupted image (should succeed if RS parity was sufficient)
    ok2 = reassemble_from_images([str(corrupted)], str(out_reassembled), private_key_path=str(priv))

    # If Reed-Solomon parity was insufficient, reassembly may fail - assert and surface result
    assert ok2, "Reassembly failed on corrupted image - consider increasing RS parity"

    with open(out_reassembled, 'rb') as f:
        got = f.read()
    assert got == payload
