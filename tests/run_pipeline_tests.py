import os
import sys
from PIL import Image
import shutil

from steg_hider import (
    generate_keys,
    chunk_and_embed_file,
    reassemble_from_images,
    auto_tune_and_embed,
)


def make_cover(path, size=(100, 100), color=(255, 255, 255)):
    img = Image.new("RGB", size, color)
    img.save(path, format="PNG")


def corrupt_image_flip_lsb(src_path, dst_path, flips=100):
    img = Image.open(src_path).convert("RGB")
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


def run_e2e(tmp_dir):
    print("Running E2E RSA flow...")
    os.makedirs(tmp_dir, exist_ok=True)
    cover = os.path.join(tmp_dir, "cover.png")
    make_cover(cover, size=(120, 120))

    infile = os.path.join(tmp_dir, "payload.bin")
    payload = b"Hello StegHider!" * 40
    with open(infile, "wb") as f:
        f.write(payload)

    priv = os.path.join(tmp_dir, "private_test.pem")
    pub = os.path.join(tmp_dir, "public_test.pem")
    generate_keys(private_path=priv, public_path=pub)

    out_dir = os.path.join(tmp_dir, "stego_out")
    os.makedirs(out_dir, exist_ok=True)

    # Use simple chunk embed for E2E smoke test (no corruption simulation here)
    ok = chunk_and_embed_file(infile, [cover], out_dir, public_key_path=pub)
    if not ok:
        print("chunk_and_embed_file failed")
        return False

    # auto_tune_and_embed writes final outputs into out_dir/final on success
    # Find any stego images anywhere under out_dir (handles auto-tune final dir or direct outdir)
    stego_images = []
    for root, dirs, files in os.walk(out_dir):
        for p in files:
            if p.lower().endswith(".png"):
                stego_images.append(os.path.join(root, p))
    if not stego_images:
        print("No stego images found")
        return False

    out_reassembled = os.path.join(tmp_dir, "reassembled.bin")
    ok2 = reassemble_from_images(stego_images, out_reassembled, private_key_path=priv)
    if not ok2:
        print("reassemble failed")
        return False

    with open(out_reassembled, "rb") as f:
        got = f.read()
    print("Comparing payloads...")
    return got == payload


def run_corruption_test(tmp_dir):
    print("Running corruption recovery test...")
    os.makedirs(tmp_dir, exist_ok=True)
    cover = os.path.join(tmp_dir, "cover2.png")
    make_cover(cover, size=(160, 160))

    infile = os.path.join(tmp_dir, "payload2.bin")
    payload = os.urandom(1500)
    with open(infile, "wb") as f:
        f.write(payload)

    priv = os.path.join(tmp_dir, "private_test2.pem")
    pub = os.path.join(tmp_dir, "public_test2.pem")
    generate_keys(private_path=priv, public_path=pub)

    out_dir = os.path.join(tmp_dir, "stego_out2")
    os.makedirs(out_dir, exist_ok=True)

    # Use auto-tune to pick RS parity robust to simulated corruption
    ok = auto_tune_and_embed(
        infile,
        [cover],
        out_dir,
        public_key_path=pub,
        verify_private_key=priv,
        start_percent=10.0,
        step_percent=5.0,
        max_percent=40.0,
        max_iterations=8,
        jpeg_qualities=[85, 75],
    )
    if not ok:
        print("auto_tune_and_embed failed")
        return False

    stego_images = [
        os.path.join(out_dir, p)
        for p in os.listdir(out_dir)
        if p.lower().endswith(".png")
    ]
    if not stego_images:
        print("No stego images found")
        return False

    # If auto-tune produced a sidecar manifest, prefer the variant it used
    final_dir = os.path.join(out_dir, "final")
    sidecar = os.path.join(final_dir, "manifest.auto_tune.json")
    test_variant = None
    if os.path.exists(sidecar):
        try:
            import json

            with open(sidecar, "r") as sf:
                info = json.load(sf)
            varname = info.get("variant")
            if varname:
                # search for that filename under out_dir
                for root, dirs, files in os.walk(out_dir):
                    if varname in files:
                        test_variant = os.path.join(root, varname)
                        break
        except Exception:
            test_variant = None

    if not test_variant:
        # Prefer an auto-tune produced variant (zeroed/recompress/resized) if present
        variant_candidates = [
            p
            for p in stego_images
            if any(
                k in os.path.basename(p).lower()
                for k in ("zeroed", "recompress", "resized")
            )
        ]
        if variant_candidates:
            test_variant = variant_candidates[0]
        else:
            # Fallback: flip LSBs on first stego image
            corrupted = os.path.join(tmp_dir, "corrupted.png")
            corrupt_image_flip_lsb(stego_images[0], corrupted, flips=200)
            test_variant = corrupted

    out_reassembled = os.path.join(tmp_dir, "reassembled2.bin")
    ok2 = reassemble_from_images([test_variant], out_reassembled, private_key_path=priv)
    if not ok2:
        print("Reassembly failed on corrupted image")
        return False

    with open(out_reassembled, "rb") as f:
        got = f.read()
    return got == payload


if __name__ == "__main__":
    work = os.path.abspath("tests/_tmp_run")
    shutil.rmtree(work, ignore_errors=True)
    os.makedirs(work, exist_ok=True)

    e2e_ok = run_e2e(os.path.join(work, "e2e"))
    print("E2E result:", e2e_ok)

    corr_ok = run_corruption_test(os.path.join(work, "corr"))
    print("Corruption recovery result:", corr_ok)

    if e2e_ok and corr_ok:
        print("ALL TESTS PASSED")
        sys.exit(0)
    else:
        print("SOME TESTS FAILED")
        sys.exit(2)
