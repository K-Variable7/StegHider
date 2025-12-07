// StegHider Extension Content Script

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'hideData') {
        hideDataInPage(request.data).then(sendResponse);
        return true;
    } else if (request.action === 'extractData') {
        extractDataFromPage(request.data).then(sendResponse);
        return true;
    }
});

async function hideDataInPage({ message, password, enableRS, isFile, expiration }) {
    try {
        console.log('hideDataInPage called with message:', message);
        // Find the largest image on the page
        const images = Array.from(document.querySelectorAll('img'))
            .filter(img => img.offsetWidth > 100 && img.offsetHeight > 100)
            .sort((a, b) => (b.offsetWidth * b.offsetHeight) - (a.offsetWidth * a.offsetHeight));

        console.log('Found images:', images.length);
        if (images.length === 0) {
            return { success: false, error: 'No suitable images found on page' };
        }

        const targetImage = images[0];
        console.log('Target image src:', targetImage.src);
        const steg = new StegHider();

        // For now, use basic features (RS and advanced encryption require server)
        const result = await steg.hideMessage(targetImage.src, message, {
            password: password,
            enableRS: false, // Client-side RS not implemented yet
            expiration: expiration
        });

        console.log('hideMessage result:', result);
        if (result.success) {
            // Replace the image with the steganographic version
            targetImage.src = result.dataUrl;
            targetImage.dataset.stegProcessed = 'true';

            return {
                success: true,
                message: `Data hidden in image! (${result.bitsHidden} bits)`,
                imageUrl: result.dataUrl
            };
        } else {
            return result;
        }

    } catch (error) {
        console.error('hideDataInPage error:', error);
        return { success: false, error: error.message };
    }
}

async function extractDataFromPage({ password, enableRS }) {
    try {
        // Find images on the page
        const images = Array.from(document.querySelectorAll('img'))
            .filter(img => img.offsetWidth > 100 && img.offsetHeight > 100);

        if (images.length === 0) {
            return { success: false, error: 'No suitable images found on page' };
        }

        const steg = new StegHider();

        // Try to extract from each image
        for (const img of images) {
            try {
                const result = await steg.extractMessage(img.src, {
                    password: password,
                    enableRS: false // Client-side RS not implemented yet
                });

                if (result.success) {
                    return {
                        success: true,
                        data: result.message,
                        sourceImage: img.src
                    };
                }
            } catch (error) {
                // Continue to next image
                console.log('Failed to extract from image:', error.message);
            }
        }

        return {
            success: false,
            error: 'No hidden messages found in page images'
        };

    } catch (error) {
        return { success: false, error: error.message };
    }
}

// Add visual indicators for images that can be processed
function addImageOverlays() {
    const images = document.querySelectorAll('img');

    images.forEach(img => {
        if (img.offsetWidth > 50 && img.offsetHeight > 50) {
            const overlay = document.createElement('div');
            overlay.className = 'steg-overlay';
            overlay.style.cssText = `
                position: absolute;
                top: 5px;
                right: 5px;
                background: rgba(0, 212, 255, 0.8);
                color: black;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 10px;
                font-weight: bold;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.3s;
                z-index: 10000;
            `;
            overlay.textContent = 'STEG';

            // Position relative to image
            const rect = img.getBoundingClientRect();
            overlay.style.position = 'fixed';
            overlay.style.top = (rect.top + 5) + 'px';
            overlay.style.left = (rect.right - 40) + 'px';

            img.parentElement.style.position = img.parentElement.style.position || 'relative';
            img.parentElement.appendChild(overlay);

            // Show on hover
            img.addEventListener('mouseenter', () => {
                overlay.style.opacity = '1';
            });
            img.addEventListener('mouseleave', () => {
                overlay.style.opacity = '0';
            });
        }
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addImageOverlays);
} else {
    addImageOverlays();
}