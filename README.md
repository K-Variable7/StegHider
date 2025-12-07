# StegHider Monorepo

This monorepo contains two main projects:

## 🛡️ StegHider - Secure Image Steganography

A powerful, privacy-focused web application and browser extension for hiding secret messages in images using LSB steganography, encryption, and robustness features.

### Structure
```
steghider/
├── core/          # Core Python library (steg_hider.py)
├── web/           # Flask web app (deployed on Vercel)
└── extension/     # Browser extension for metadata wiping and stego operations
```

### Features
*   **📸 Image Steganography**: LSB technique for hiding data in pixels
*   **🔐 Military-Grade Encryption**: AES-GCM + RSA support
*   **📂 File Embedding**: Hide any file type in images
*   **🛡️ Robustness**: Reed-Solomon error correction
*   **🕵️ Privacy Tools**: EXIF metadata removal
*   **📱 PWA**: Installable on mobile devices

## 🎮 VaultWars - Blockchain Scavenger Hunt Game

A competitive NFT-based scavenger hunt where players discover hidden clues in steganographic images, competing in factions for rewards.

### Structure
```
vaultwars/
├── contracts/     # Solidity smart contracts (ERC-721 NFTs, reward pots)
├── frontend/      # Next.js game dashboard with faction chat
├── scripts/       # Automation for clue generation and IPFS uploads
├── oracle-keeper/ # Chainlink oracle service
└── extension-bridge/ # Overlay for StegHider extension integration
```

### Features
*   **🏆 NFT Rewards**: Clue images minted as NFTs
*   **🎯 Faction Competition**: Team-based gameplay with multipliers
*   **🔗 Chainlink Integration**: Randomness and automation
*   **💬 Social Features**: Nostr/XMTP faction communication
*   **🌐 Decentralized**: IPFS storage for images

## 🚀 Getting Started

### StegHider Web App
```bash
cd steghider/web
pip install -r requirements.txt
python app.py
```

### StegHider Core Library
```bash
cd steghider/core
pip install -e .
```

### VaultWars Contracts
```bash
cd vaultwars/contracts
npm install
npx hardhat compile
```

## 📦 Shared Resources

The `shared/` folder contains common types, constants, and utilities used across both projects.

## 🤝 Contributing

- **StegHider**: Focus on privacy and steganography improvements
- **VaultWars**: Game mechanics, blockchain integration, UI/UX

Keep the projects separate to maintain StegHider's privacy focus while allowing VaultWars to evolve rapidly.

## 🚀 Features

*   **📸 Image Steganography**: Hides data within the pixels of an image without noticeably altering its appearance using Least Significant Bit (LSB) technique
*   **🔐 Military-Grade Encryption**:
    *   **Password Protection**: Encrypts data using AES-GCM (256-bit) with key derived from password using PBKDF2-HMAC-SHA256 (100,000 iterations)
    *   **RSA Key Support**: Use Public/Private key pairs (2048-bit RSA) for asymmetric encryption. Share your Public Key so others can send you secrets only YOU can read
*   **📂 File Embedding**: Hide not just text, but **any file type** (PDFs, Docs, Images, etc.) inside a cover image
*   **📦 Smart Compression**: Automatically compresses data using `zlib` (level 9, maximum compression) and zips files to maximize storage capacity within the image.
*   **🛡️ Robustness Features**:
    *   **Reed-Solomon Error Correction**: Recover hidden data even if the image is corrupted (JPEG compression, resizing, etc.) using configurable parity symbols
    *   **Auto-Tuning**: Automatically calculates optimal parity symbols based on expected corruption levels
    *   **Corruption Simulations**: Test your steganographic images against LSB flips, zero regions, JPEG recompression, and resize operations
*   **🕵️ Privacy Tools**: MetaWipe feature removes EXIF metadata from images for enhanced privacy
*   **🎮 Gamification**: Earn points for different security levels and features used
*   **📱 Mobile Ready (PWA)**: Installable as a native app on iOS and Android devices
*   **🌑 Modern UI**: Sleek Dark Mode interface with Drag & Drop support

## 🛠️ Installation & Local Run

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/steg-image-hider.git
    cd steg-image-hider
    ```

2.  **Install Dependencies**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Run the Application**
    ```bash
    python app.py
    ```

4.  **Access**
    Open your browser and navigate to `http://localhost:5000`.

## 📖 How to Use

### Hiding Data (Embed)
1.  **Upload Cover Image**: Select a PNG or JPG image.
2.  **Enter Secret**: Type a text message OR upload a file to hide.
3.  **Secure It**:
    *   **Option A (Password)**: Enter a password.
    *   **Option B (RSA)**: Upload a recipient's `public_key.pem`.
4.  **Enable Robustness** (Premium Feature):
    *   Check "Enable Reed-Solomon Error Correction"
    *   Set parity symbols (nsym) or enable auto-tuning
    *   Specify expected corruption percentage
5.  **Download**: Click "Hide & Download" to get your new image containing the secret.

### Revealing Data (Extract)
1.  **Upload Image**: Select the image containing the secret.
2.  **Unlock It**:
    *   **Option A**: Enter the password used to encrypt it.
    *   **Option B**: Upload your `private_key.pem` if it was encrypted for you.
3.  **Robustness Settings**: If RS was used during hiding, check the box and enter the nsym value.
4.  **View**: The hidden text will appear, and hidden files will be available for download.

### Generating Keys
*   Click the "Need RSA Keys?" link in the footer to generate a secure Public/Private key pair `.zip` file.

## 💰 Paid Tiers

### Free Tier
- Basic security level (compression only)
- MetaWipe privacy features
- Limited to 10MB files
- Community support

### Advanced Tier ($5/month)
- Password encryption
- File compression and auto-zipping
- Unlimited file sizes
- Priority email support
- Gamification features

### Premium Tier ($10/month)
- RSA key encryption
- Reed-Solomon error correction
- Auto-tuning and corruption simulations
- NFT metadata embedding
- Commercial usage rights
- Phone support

## 🌐 Browser Extension (Coming Soon)

Transform StegHider into a browser extension for seamless privacy protection:

### Features
- **Right-click Context Menu**: Hide/extract data from any image on web pages
- **Quick MetaWipe**: Remove metadata from downloaded images instantly
- **Popup Interface**: Easy access to all steganography tools
- **Web Page Integration**: Detect and process images directly from websites
- **Paid Feature Unlocks**: In-app purchases for premium robustness features

### Technical Structure
- **Manifest V3**: Modern Chrome/Firefox extension format
- **Background Script**: Handle encryption/decryption operations
- **Content Script**: Interact with web page images
- **Popup UI**: Clean interface matching the web app design
- **Storage API**: Secure local storage for keys and settings

This project is configured for easy deployment on **Vercel**.

1.  Install Vercel CLI: `npm i -g vercel`
2.  Run deploy: `vercel --prod`

*Note: The Vercel free tier has a request body limit (approx 4.5MB). For larger file embedding, consider hosting on a platform with higher limits or a VPS.*

## 🛡️ Technologies

*   **Python 3.12**
*   **Flask**: Web Framework
*   **Pillow (PIL)**: Image Processing
*   **Cryptography**: AES-GCM & RSA Encryption
*   **reedsolo**: Reed-Solomon Error Correction
*   **HTML5/CSS3/JS**: Frontend

## 🔬 Technical Details

### Steganography Method
- **LSB (Least Significant Bit)**: Modifies the least significant bits of pixel values
- **Capacity**: Approximately 1MB of data per 4K image (depends on image size and color depth)
- **Visual Impact**: Virtually undetectable to the human eye

### Encryption Details
- **Symmetric**: AES-GCM with 256-bit keys, 96-bit IV, 128-bit authentication tag
- **Key Derivation**: PBKDF2 with HMAC-SHA256, 100,000 iterations, 256-bit output
- **Asymmetric**: RSA-OAEP with 2048-bit keys for key exchange
- **Hybrid Approach**: AES for bulk encryption, RSA for key wrapping

### Error Correction
- **Reed-Solomon**: Configurable parity symbols (default: 10)
- **Recovery**: Can recover from up to 50% data loss depending on configuration
- **Auto-tuning**: Calculates optimal parity based on expected corruption percentage

### Compression
- **Algorithm**: zlib with maximum compression (level 9)
- **File Handling**: Automatic ZIP compression for uploaded files
- **Efficiency**: Up to 90% size reduction for text, varies for binary files

### Privacy & Security
- **Zero Server Storage**: All processing happens client-side
- **Metadata Removal**: EXIF stripping prevents accidental data leaks
- **No Tracking**: No analytics or user data collection (optional email for profiles)
- **Open Source Core**: Steganography and crypto algorithms available for audit

## ⚠️ Disclaimer

This tool is for educational and privacy purposes. Please use responsibly.

---
Made with &hearts; for Privacy.
Donations (BTC): `bc1qf2j96j70j9I3cs3gh8048mgxpg3su5ydse6z9m`
