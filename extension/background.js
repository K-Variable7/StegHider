// StegHider Extension Background Script

// Context menu for images
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'steg_hide',
        title: 'Hide Secret in Image',
        contexts: ['image']
    });

    chrome.contextMenus.create({
        id: 'steg_extract',
        title: 'Extract Secret from Image',
        contexts: ['image']
    });

    chrome.contextMenus.create({
        id: 'steg_metawipe',
        title: 'MetaWipe Image',
        contexts: ['image']
    });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'steg_hide') {
        // Open popup or prompt for data
        chrome.action.openPopup();
    } else if (info.menuItemId === 'steg_extract') {
        extractFromContextMenu(info.srcUrl, tab);
    } else if (info.menuItemId === 'steg_metawipe') {
        metawipeFromContextMenu(info.srcUrl);
    }
});

async function extractFromContextMenu(imageUrl, tab) {
    try {
        // Execute extraction in the context of the current tab
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: async (url) => {
                const steg = new StegHider();
                const result = await steg.extractMessage(url);

                if (result.success) {
                    // Show alert with extracted message
                    alert('Extracted message: ' + result.message);
                    return { success: true, message: result.message };
                } else {
                    alert('Extraction failed: ' + result.error);
                    throw new Error(result.error);
                }
            },
            args: [imageUrl]
        });

        if (results[0].result.success) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon-128.png',
                title: 'StegHider',
                message: 'Secret extracted successfully!'
            });
        }

    } catch (error) {
        console.error('Extraction error:', error);
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon-128.png',
            title: 'StegHider',
            message: 'Extraction failed: ' + error.message
        });
    }
}

async function metawipeFromContextMenu(imageUrl) {
    try {
        // Execute MetaWipe in the context of the current tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: async (url) => {
                const steg = new StegHider();
                const result = await steg.metawipeImage(url);

                if (result.success) {
                    return { success: true, dataUrl: result.dataUrl };
                } else {
                    throw new Error(result.error);
                }
            },
            args: [imageUrl]
        });

        if (results[0].result.success) {
            // Download using chrome.downloads API
            await chrome.downloads.download({
                url: results[0].result.dataUrl,
                filename: 'metawiped_image.png',
                saveAs: false
            });

            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon-128.png',
                title: 'StegHider',
                message: 'Image MetaWiped and downloaded successfully!'
            });
        }

    } catch (error) {
        console.error('MetaWipe error:', error);
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon-128.png',
            title: 'StegHider',
            message: 'MetaWipe failed: ' + error.message
        });
    }
}

// Handle commands
chrome.commands.onCommand.addListener((command) => {
    if (command === 'hide-data' || command === 'extract-data') {
        chrome.action.openPopup();
    }
});