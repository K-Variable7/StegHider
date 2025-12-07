# StegHider Browser Extension

This directory contains the browser extension version of StegHider, bringing secure steganography directly to your browser.

## Features

- **Context Menu Integration**: Right-click any image to hide/extract data or apply MetaWipe
- **Popup Interface**: Quick access to all steganography tools
- **Web Page Processing**: Process images directly from websites
- **Privacy Focused**: Client-side processing where possible
- **Paid Feature Integration**: Unlock premium robustness features

## File Structure

```
extension/
├── manifest.json          # Extension manifest (Chrome/Firefox)
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── background.js         # Background service worker
├── content.js            # Content script for web pages
├── injected.js           # Injected script (if needed)
├── icons/                # Extension icons (16x16, 32x32, 48x48, 128x128)
└── README.md             # This file
```

## Installation

### Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select this `extension/` directory
4. The extension should now be installed

### Firefox
1. Open Firefox and go to `about:debugging`
2. Click "This Firefox" in the sidebar
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` file in this directory

## Usage

### Context Menu
- Right-click any image on a web page
- Choose "Hide Secret in Image", "Extract Secret from Image", or "MetaWipe Image"

### Popup Interface
- Click the StegHider icon in your browser toolbar
- Use the tabs to hide data, extract data, or MetaWipe images

### Web Page Integration
- Images on web pages show a "STEG" indicator when you hover over them
- Click the popup to process the current page's images

## Technical Implementation

### Client-Side Processing
For basic operations, the extension processes images client-side using:
- Canvas API for image manipulation
- Web Crypto API for encryption
- JavaScript implementation of LSB steganography

### Server Integration
Premium features and complex operations call back to the main StegHider web service:
- Reed-Solomon error correction
- Advanced encryption modes
- Large file processing

### Security Considerations
- No sensitive data is stored locally
- All processing is done in memory
- HTTPS-only communication with the server
- User consent required for all operations

## Development

### Testing
- Use the browser's developer tools to debug
- Test on various websites with different image types
- Verify functionality with different security levels

### Building for Production
1. Update version numbers in `manifest.json`
2. Compress the extension directory
3. Submit to Chrome Web Store / Firefox Add-ons

### Future Enhancements
- Offline processing for premium users
- Integration with browser downloads
- Batch processing of multiple images
- Custom keyboard shortcuts

## Monetization

The extension supports the same paid tier structure as the web app:
- Free: Basic features
- Advanced ($5/month): Password encryption
- Premium ($10/month): Full robustness features

Purchases are handled through the main web app and synced via user accounts.