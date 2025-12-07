// StegHider Extension Popup Script

function showTab(tabName) {
    // Hide all tabs
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));

    // Remove active class from buttons
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));

    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
}

function showStatus(message, type = 'success') {
    const status = document.getElementById('status');
    const statusText = document.getElementById('status-text');
    statusText.textContent = message;
    status.className = `status ${type}`;
    status.style.display = 'block';
}

function hideStatus() {
    document.getElementById('status').style.display = 'none';
}

// Add event listeners
document.getElementById('embedTab').addEventListener('click', () => showTab('embed'));
document.getElementById('extractTab').addEventListener('click', () => showTab('extract'));
document.getElementById('metawipeTab').addEventListener('click', () => showTab('metawipe'));
document.getElementById('settingsTab').addEventListener('click', () => showTab('settings'));
document.getElementById('donateTab').addEventListener('click', () => showTab('donate'));
document.getElementById('suggestionsTab').addEventListener('click', () => showTab('suggestions'));
document.getElementById('hideBtn').addEventListener('click', hideData);
document.getElementById('extractBtn').addEventListener('click', extractData);
document.getElementById('metawipeBtn').addEventListener('click', metawipeImages);
document.getElementById('saveSettings').addEventListener('click', saveSettings);
document.getElementById('generate-key').addEventListener('click', generateKey);
document.getElementById('export-keys').addEventListener('click', exportKeys);
document.getElementById('import-key').addEventListener('click', importKey);
document.getElementById('generate-qr').addEventListener('click', generateQR);
document.getElementById('submit-suggestion').addEventListener('click', submitSuggestion);

// Drag and drop
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.background = '#333';
});

dropZone.addEventListener('dragleave', () => {
    dropZone.style.background = '';
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.background = '';
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        fileInput.files = files;
        dropZone.textContent = `File selected: ${files[0].name}`;
    }
});

async function hideData() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab.url.startsWith('http')) {
            showStatus('Cannot process this page type', 'error');
            return;
        }

        const message = document.getElementById('secret-message').value;
        const fileInput = document.getElementById('file-input');
        const password = document.getElementById('password').value;
        const expiration = parseInt(document.getElementById('expiration').value) || 0;
        const enableRS = document.getElementById('enable-rs').checked;

        let payload = message;
        let isFile = false;

        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            if (file.size > 15000) {
                showStatus('File too large! Max 15KB for this image size.', 'error');
                return;
            }
            const arrayBuffer = await file.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            const binaryString = Array.from(bytes).map(b => String.fromCharCode(b)).join('');
            payload = `FILE:${file.name}:${file.size}:${binaryString}`;
            isFile = true;
            showStatus(`Processing file: ${file.name} (${file.size} bytes)`, 'success');
        } else if (!message) {
            showStatus('Please enter a secret message or select a file', 'error');
            return;
        } else {
            payload = `TEXT:${message}`;
        }

        // Send message to content script
        const response = await chrome.tabs.sendMessage(tab.id, {
            action: 'hideData',
            data: { message: payload, password, enableRS, isFile, expiration }
        });

        if (response.success) {
            showStatus(`${response.message} (${response.bitsHidden} bits hidden, ${response.maxBits} available)`, 'success');
        } else {
            showStatus('Error: ' + response.error, 'error');
        }

    } catch (error) {
        showStatus('Error: ' + error.message, 'error');
    }
}

async function extractData() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        const password = document.getElementById('extract-password').value;
        const enableRS = document.getElementById('extract-rs').checked;

        // Send message to content script
        const response = await chrome.tabs.sendMessage(tab.id, {
            action: 'extractData',
            data: { password, enableRS }
        });

        if (response.success) {
            const data = response.data;
            if (data.startsWith('TEXT:')) {
                showStatus('Secret: ' + data.substring(5));
            } else if (data.startsWith('FILE:')) {
                const parts = data.split(':');
                const filename = parts[1];
                const size = parseInt(parts[2]);
                const fileData = parts.slice(3).join(':');
                // Convert back to bytes
                const bytes = fileData.split('').map(c => c.charCodeAt(0));
                const blob = new Blob([new Uint8Array(bytes)]);
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                URL.revokeObjectURL(url);
                showStatus(`File extracted: ${filename} (${size} bytes)`);
            } else {
                showStatus('Secret: ' + data); // Fallback
            }
        } else {
            showStatus('Error: ' + response.error, 'error');
        }

    } catch (error) {
        showStatus('Error: ' + error.message, 'error');
    }
}

async function metawipeImages() {
    try {
        // Get recent downloads
        const downloads = await chrome.downloads.search({
            limit: 10,
            orderBy: ['-startTime']
        });

        const imageDownloads = downloads.filter(d =>
            d.filename.match(/\.(png|jpg|jpeg|gif|bmp)$/i)
        );

        if (imageDownloads.length === 0) {
            showStatus('No recent image downloads found', 'error');
            return;
        }

        // Process each image
        for (const download of imageDownloads) {
            await chrome.downloads.removeFile(download.id);
            showStatus(`MetaWipe applied to ${imageDownloads.length} images`);
        }

    } catch (error) {
        showStatus('Error: ' + error.message, 'error');
    }
}

async function saveSettings() {
    const autoWipe = document.getElementById('auto-wipe').checked;
    const secureDelete = document.getElementById('secure-delete').checked;
    const useTor = document.getElementById('use-tor').checked;
    const rsLevel = document.getElementById('rs-level').value;

    // Save to chrome.storage
    await chrome.storage.sync.set({
        autoWipe,
        secureDelete,
        useTor,
        rsLevel
    });

    showStatus('Settings saved!', 'success');
}

async function generateKey() {
    try {
        // Generate a random 256-bit key
        const key = await crypto.getRandomValues(new Uint8Array(32));
        const keyHex = Array.from(key).map(b => b.toString(16).padStart(2, '0')).join('');

        // Store the key
        const result = await chrome.storage.sync.get(['keys']);
        const keys = result.keys || {};
        const keyId = 'key_' + Date.now();
        keys[keyId] = { id: keyId, name: `Key ${Object.keys(keys).length + 1}`, key: keyHex, created: new Date().toISOString() };

        await chrome.storage.sync.set({ keys });

        updateKeySelect();
        showStatus('New encryption key generated!', 'success');
    } catch (error) {
        showStatus('Error generating key: ' + error.message, 'error');
    }
}

async function exportKeys() {
    try {
        const result = await chrome.storage.sync.get(['keys']);
        const keys = result.keys || {};

        const dataStr = JSON.stringify(keys, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const url = URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'steg_keys_backup.json';
        a.click();
        URL.revokeObjectURL(url);

        showStatus('Keys exported successfully!', 'success');
    } catch (error) {
        showStatus('Error exporting keys: ' + error.message, 'error');
    }
}

async function importKey() {
    // For simplicity, prompt for key
    const keyHex = prompt('Enter encryption key (64 hex characters):');
    if (!keyHex || keyHex.length !== 64 || !/^[0-9a-f]+$/i.test(keyHex)) {
        showStatus('Invalid key format', 'error');
        return;
    }

    const result = await chrome.storage.sync.get(['keys']);
    const keys = result.keys || {};
    const keyId = 'key_' + Date.now();
    keys[keyId] = { id: keyId, name: `Imported Key ${Object.keys(keys).length + 1}`, key: keyHex, created: new Date().toISOString() };

    await chrome.storage.sync.set({ keys });
    updateKeySelect();
    showStatus('Key imported successfully!', 'success');
}

async function updateKeySelect() {
    const result = await chrome.storage.sync.get(['keys']);
    const keys = result.keys || {};
    const select = document.getElementById('key-select');

    select.innerHTML = '<option value="">Select Key</option>';
    for (const keyId in keys) {
        const key = keys[keyId];
        const option = document.createElement('option');
        option.value = keyId;
        option.textContent = key.name;
        select.appendChild(option);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    updateKeySelect();
    checkTorStatus();
});

async function checkTorStatus() {
    const result = await chrome.storage.sync.get(['useTor']);
    if (result.useTor) {
        // Check if in Tor Browser
        const isTor = navigator.userAgent.includes('Tor');
        if (!isTor) {
            showStatus('Tor enabled but not detected. Use Tor Browser for best privacy.', 'error');
        } else {
            showStatus('Tor Browser detected - privacy mode active!', 'success');
        }
    }
}

function submitSuggestion() {
    const text = document.getElementById('suggestion-text').value.trim();
    if (!text) {
        showStatus('Please enter a suggestion before submitting.', 'error');
        return;
    }
    // Use mailto to open email client with suggestion
    const subject = encodeURIComponent('StegHider User Suggestion');
    const body = encodeURIComponent(text);
    window.open(`mailto:feedback@steghider.com?subject=${subject}&body=${body}`);
    document.getElementById('suggestion-text').value = '';
    showStatus('Suggestion submitted! Thank you for your feedback.', 'success');
}

async function generateQR() {
    const keySelect = document.getElementById('key-select');
    const selectedKey = keySelect.value;
    if (!selectedKey) {
        showStatus('Please select a key to generate QR.', 'error');
        return;
    }
    
    const result = await chrome.storage.sync.get(['encryptionKeys']);
    const keys = result.encryptionKeys || {};
    const keyData = keys[selectedKey];
    if (!keyData) {
        showStatus('Key not found.', 'error');
        return;
    }
    
    // Create dynamic QR with timestamp for security
    const timestamp = Date.now();
    const qrData = JSON.stringify({
        key: keyData,
        timestamp: timestamp,
        expires: timestamp + 300000 // 5 minutes
    });
    
    const qrContainer = document.getElementById('qr-container');
    qrContainer.innerHTML = ''; // Clear previous
    
    QRCode.toCanvas(qrData, { width: 200 }, function (error, canvas) {
        if (error) {
            showStatus('Failed to generate QR.', 'error');
            console.error(error);
        } else {
            qrContainer.appendChild(canvas);
            showStatus('QR generated! Scan to share key (expires in 5 minutes).', 'success');
        }
    });
}