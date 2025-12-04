# StegHider - Secure Image Steganography

StegHider is a powerful, privacy-focused web application that allows you to hide secret text messages and files inside ordinary images. It combines Least Significant Bit (LSB) steganography with military-grade encryption to ensure your data remains undetectable and secure.

![StegHider UI](static/images/icon-512.png)

## 🚀 Features

*   **📸 Image Steganography**: Hides data within the pixels of an image without noticeably altering its appearance.
*   **🔐 Military-Grade Encryption**:
    *   **Password Protection**: Encrypts data using AES (Fernet) with a key derived from your password (PBKDF2-HMAC-SHA256).
    *   **RSA Key Support**: Use Public/Private key pairs (2048-bit) for asymmetric encryption. Share your Public Key so others can send you secrets only YOU can read.
*   **📂 File Embedding**: Hide not just text, but **any file type** (PDFs, Docs, Images, etc.) inside a cover image.
*   **📦 Smart Compression**: Automatically compresses data using `zlib` to maximize storage capacity within the image.
*   **📱 Mobile Ready (PWA)**: Installable as a native app on iOS and Android devices.
*   **🕵️ Privacy Focused**: Stateless processing. Uploaded files are processed and immediately discarded.
*   **🌑 Modern UI**: Sleek Dark Mode interface with Drag & Drop support.

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
4.  **Download**: Click "Hide & Download" to get your new image containing the secret.

### Revealing Data (Extract)
1.  **Upload Image**: Select the image containing the secret.
2.  **Unlock It**:
    *   **Option A**: Enter the password used to encrypt it.
    *   **Option B**: Upload your `private_key.pem` if it was encrypted for you.
3.  **View**: The hidden text will appear, and hidden files will be available for download.

### Generating Keys
*   Click the "Need RSA Keys?" link in the footer to generate a secure Public/Private key pair `.zip` file.

## ☁️ Deployment

This project is configured for easy deployment on **Vercel**.

1.  Install Vercel CLI: `npm i -g vercel`
2.  Run deploy: `vercel --prod`

*Note: The Vercel free tier has a request body limit (approx 4.5MB). For larger file embedding, consider hosting on a platform with higher limits or a VPS.*

## 🛡️ Technologies

*   **Python 3.12**
*   **Flask**: Web Framework
*   **Pillow (PIL)**: Image Processing
*   **Cryptography**: AES & RSA Encryption
*   **HTML5/CSS3/JS**: Frontend

## ⚠️ Disclaimer

This tool is for educational and privacy purposes. Please use responsibly.

---
Made with &hearts; for Privacy.
Donations (BTC): `bc1qf2j96j70j9I3cs3gh8048mgxpg3su5ydse6z9m`
