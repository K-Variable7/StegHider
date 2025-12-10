// StegHider - Client-side LSB Steganography
// JavaScript implementation for browser extension

class StegHider {
    constructor() {
        this.DELIMITER = "###END###";
    }

    // Convert string to binary string
    stringToBinary(str) {
        return str.split('').map(char => {
            return char.charCodeAt(0).toString(2).padStart(8, '0');
        }).join('');
    }

    // Convert binary string to string
    binaryToString(binary) {
        const bytes = [];
        for (let i = 0; i < binary.length; i += 8) {
            const byte = binary.substr(i, 8);
            bytes.push(parseInt(byte, 2));
        }
        let str = '';
        for (const byte of bytes) {
            str += String.fromCharCode(byte);
        }
        return str;
    }

    // Convert bytes to binary string
    bytesToBinary(bytes) {
        return Array.from(bytes).map(byte => {
            return byte.toString(2).padStart(8, '0');
        }).join('');
    }

    // Convert binary string to Uint8Array
    binaryToBytes(binary) {
        const bytes = new Uint8Array(binary.length / 8);
        for (let i = 0; i < binary.length; i += 8) {
            bytes[i / 8] = parseInt(binary.substr(i, 8), 2);
        }
        return bytes;
    }

    // Load image from URL or data URL
    async loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    // Get image data from canvas
    getImageData(img, canvas = null) {
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
        }

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        return ctx.getImageData(0, 0, canvas.width, canvas.height);
    }

    // Put image data back to canvas
    putImageData(canvas, imageData) {
        const ctx = canvas.getContext('2d');
        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }

    // Hide message in image
    async hideMessage(imageSrc, message, options = {}) {
        try {
            const {
                password = '',
                enableRS = false,
                nsym = 10,
                expiration = 0
            } = options;

            // Load and process image
            const img = await this.loadImage(imageSrc);
            const imageData = this.getImageData(img);
            const { data, width, height } = imageData;

            // Prepare message
            let payload = message;

            // Add expiration if set
            if (expiration > 0) {
                const expireTime = Date.now() + (expiration * 60 * 60 * 1000);
                payload = `EXPIRE:${expireTime}:${payload}`;
            }

            // Add basic compression (simple RLE for demo)
            payload = this.compressString(payload);

            // Add encryption if password provided
            if (password) {
                payload = await this.encryptString(payload, password);
            }

            // Add delimiter
            payload += this.DELIMITER;

            // Convert to binary
            const binaryMessage = this.stringToBinary(payload);
            const messageBits = binaryMessage.length;

            // Check capacity
            const maxBits = (width * height * 4) / 8 * 8; // 1 bit per color channel
            if (messageBits > maxBits) {
                throw new Error(`Message too large. Max capacity: ${maxBits} bits, needed: ${messageBits} bits`);
            }

            // Hide in LSBs
            let bitIndex = 0;
            for (let i = 0; i < data.length && bitIndex < messageBits; i += 4) {
                // Skip alpha channel for now
                for (let channel = 0; channel < 3 && bitIndex < messageBits; channel++) {
                    const bit = parseInt(binaryMessage[bitIndex]);
                    data[i + channel] = (data[i + channel] & ~1) | bit;
                    bitIndex++;
                }
            }

            // Create canvas with hidden data
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            this.putImageData(canvas, imageData);

            return {
                success: true,
                canvas: canvas,
                dataUrl: canvas.toDataURL('image/png'),
                bitsHidden: messageBits,
                maxBits: maxBits
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Extract message from image
    async extractMessage(imageSrc, options = {}) {
        try {
            const { password = '' } = options;

            // Load image
            const img = await this.loadImage(imageSrc);
            const imageData = this.getImageData(img);
            const { data } = imageData;

            // Extract LSBs
            let binaryData = '';
            const delimiterBinary = this.stringToBinary(this.DELIMITER);

            for (let i = 0; i < data.length; i += 4) {
                for (let channel = 0; channel < 3; channel++) {
                    const bit = data[i + channel] & 1;
                    binaryData += bit;

                    // Check for delimiter
                    if (binaryData.length >= delimiterBinary.length) {
                        const tail = binaryData.slice(-delimiterBinary.length);
                        if (tail === delimiterBinary) {
                            // Found delimiter, extract message
                            const messageBinary = binaryData.slice(0, -delimiterBinary.length);
                            let message = this.binaryToString(messageBinary);

                            // Decrypt if password provided
                            if (password) {
                                message = await this.decryptString(message, password);
                            }

                            // Check for expiration
                            if (message.startsWith('EXPIRE:')) {
                                const parts = message.split(':');
                                const expireTime = parseInt(parts[1]);
                                if (Date.now() > expireTime) {
                                    return {
                                        success: false,
                                        error: 'Message has expired'
                                    };
                                }
                                message = parts.slice(2).join(':');
                            }

                            // Decompress
                            message = this.decompressString(message);

                            return {
                                success: true,
                                message: message
                            };
                        }
                    }
                }
            }

            return {
                success: false,
                error: 'No hidden message found'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Simple compression (RLE for repeated characters)
    compressString(str) {
        let compressed = '';
        let count = 1;

        for (let i = 1; i <= str.length; i++) {
            if (str[i] === str[i - 1] && count < 255) {
                count++;
            } else {
                compressed += String.fromCharCode(count) + str[i - 1];
                count = 1;
            }
        }

        return compressed;
    }

    // Simple decompression
    decompressString(str) {
        let decompressed = '';

        for (let i = 0; i < str.length; i += 2) {
            const count = str.charCodeAt(i);
            const char = str[i + 1];
            decompressed += char.repeat(count);
        }

        return decompressed;
    }

    // Encrypt string using Web Crypto API
    async encryptString(text, password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);

        // Derive key from password
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );

        const salt = crypto.getRandomValues(new Uint8Array(16));
        const key = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt']
        );

        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            data
        );

        // Combine salt + iv + encrypted data
        const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
        result.set(salt, 0);
        result.set(iv, salt.length);
        result.set(new Uint8Array(encrypted), salt.length + iv.length);

        return btoa(String.fromCharCode(...result));
    }

    // Decrypt string using Web Crypto API
    async decryptString(encryptedB64, password) {
        try {
            const encrypted = Uint8Array.from(atob(encryptedB64), c => c.charCodeAt(0));

            const salt = encrypted.slice(0, 16);
            const iv = encrypted.slice(16, 28);
            const data = encrypted.slice(28);

            const encoder = new TextEncoder();
            const keyMaterial = await crypto.subtle.importKey(
                'raw',
                encoder.encode(password),
                'PBKDF2',
                false,
                ['deriveBits', 'deriveKey']
            );

            const key = await crypto.subtle.deriveKey(
                {
                    name: 'PBKDF2',
                    salt: salt,
                    iterations: 100000,
                    hash: 'SHA-256'
                },
                keyMaterial,
                { name: 'AES-GCM', length: 256 },
                false,
                ['decrypt']
            );

            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                data
            );

            const decoder = new TextDecoder();
            return decoder.decode(decrypted);

        } catch (error) {
            throw new Error('Decryption failed - wrong password?');
        }
    }

    // MetaWipe - remove EXIF data by redrawing
    async metawipeImage(imageSrc) {
        try {
            const img = await this.loadImage(imageSrc);
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            return {
                success: true,
                dataUrl: canvas.toDataURL('image/png'),
                canvas: canvas
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Export for use in extension
window.StegHider = StegHider;