// Quick verification script - paste this in browser console (F12) after loading extension

console.log('🔍 Verifying StegHider Extension...');

// Check if extension is loaded
if (typeof chrome !== 'undefined' && chrome.runtime) {
    console.log('✅ Chrome extension API available');
    
    // Check if our extension is loaded
    chrome.runtime.sendMessage({ action: 'ping' }, (response) => {
        if (chrome.runtime.lastError) {
            console.log('⚠️ Extension not responding (this is normal for background scripts)');
        } else {
            console.log('✅ Extension responding:', response);
        }
    });
} else {
    console.log('❌ Chrome extension API not available');
}

// Check if StegHider class is available (from content script)
if (typeof StegHider !== 'undefined') {
    console.log('✅ StegHider class loaded');
    const steg = new StegHider();
    console.log('✅ StegHider instance created');
} else {
    console.log('❌ StegHider class not loaded');
}

console.log('🎯 If you see mostly green checkmarks, the extension is working!');
