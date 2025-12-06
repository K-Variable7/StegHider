# 🚀 Recursive Stego Vaults: Roadmap

## Stage 1: File Embedding with Hybrid Encryption & Error Correction
- Encrypt file payloads using AES (symmetric) and wrap the AES key with RSA (asymmetric).
- Chunk encrypted payload to fit image LSB capacity.
- Apply Reed-Solomon error correction to each chunk.
- Embed each chunk in one or more PNG images.

## Stage 2: Recursive Stego Embedding
- Take the output image(s) from Stage 1 and embed them as payloads in new cover images (thumbnails or compressed versions).
- Each layer uses a new encryption key derived from a master passphrase + unique nonce.
- Repeat for N layers (e.g., 3-5 deep).

## Stage 3: Recursive Extraction & Integrity Verification
- On extraction, peel back each layer, decrypting and verifying integrity (hash/signature) at every step.
- Use Reed-Solomon to recover from noisy/corrupted images.
- Reassemble and decrypt the original file.

## Stage 4: QR-Recursive Extraction
- Extend QR scanner to recursively decode QR-embedded images, extracting stego payloads layer by layer.

## Stage 5: AI Cover Generation (Optional)
- Integrate generative AI (e.g., Stable Diffusion API) to create plausible cover images for each layer.

---

# Stage 1: Implementation Plan

1. Add AES encryption for file payloads.
2. Wrap AES key with RSA public key.
3. Chunk encrypted payload to fit image LSB capacity.
4. Apply Reed-Solomon error correction to each chunk.
5. Embed each chunk in PNG images.
6. Document chunk metadata (order, hashes, keys).

---

# Next: Begin coding Stage 1 in `steg_hider.py`.
