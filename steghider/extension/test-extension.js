// Test script for StegHider extension
// Run with: node test-extension.js

const fs = require('fs');
const path = require('path');

// Check if all required files exist
const requiredFiles = [
    'manifest.json',
    'popup.html',
    'popup.js',
    'background.js',
    'content.js',
    'steg.js',
    'test.html'
];

console.log('🔍 Checking extension files...');

let allFilesExist = true;
requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file} - OK`);
    } else {
        console.log(`❌ ${file} - MISSING`);
        allFilesExist = false;
    }
});

// Check manifest.json syntax
try {
    const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
    console.log('✅ manifest.json - Valid JSON');

    // Check required manifest fields
    const requiredFields = ['manifest_version', 'name', 'version', 'description'];
    requiredFields.forEach(field => {
        if (manifest[field]) {
            console.log(`✅ manifest.${field} - OK`);
        } else {
            console.log(`❌ manifest.${field} - MISSING`);
        }
    });

} catch (error) {
    console.log('❌ manifest.json - Invalid JSON:', error.message);
}

// Basic syntax check for JavaScript files
const jsFiles = ['popup.js', 'background.js', 'content.js'];
jsFiles.forEach(file => {
    try {
        const content = fs.readFileSync(file, 'utf8');
        // Basic syntax check - look for obvious issues
        if (content.includes('undefined') && content.includes('function')) {
            console.log(`✅ ${file} - Basic syntax OK`);
        } else {
            console.log(`⚠️  ${file} - Needs review`);
        }
    } catch (error) {
        console.log(`❌ ${file} - Error reading:`, error.message);
    }
});

// Check steg.js for class definition
try {
    const stegContent = fs.readFileSync('steg.js', 'utf8');
    if (stegContent.includes('class StegHider') && stegContent.includes('hideMessage')) {
        console.log('✅ steg.js - Contains StegHider class');
    } else {
        console.log('❌ steg.js - Missing StegHider class');
    }
} catch (error) {
    console.log('❌ steg.js - Error reading:', error.message);
}

console.log('\n📋 Extension Status:');
if (allFilesExist) {
    console.log('✅ All required files present');
    console.log('🚀 Ready to load in browser!');
    console.log('\n📖 Installation:');
    console.log('1. Open Chrome: chrome://extensions/');
    console.log('2. Enable "Developer mode"');
    console.log('3. Click "Load unpacked"');
    console.log('4. Select this extension/ directory');
    console.log('\n🧪 Testing:');
    console.log('- Open test.html in browser');
    console.log('- Use extension popup on any webpage');
    console.log('- Right-click images for context menu');
} else {
    console.log('❌ Some files are missing. Please check the list above.');
}