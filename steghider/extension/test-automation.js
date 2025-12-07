// StegHider Extension Automated Test
// Run this in browser console on the test.html page

async function runAutomatedTests() {
    console.log('🧪 Starting StegHider Extension Tests...');

    const results = {
        passed: 0,
        failed: 0,
        tests: []
    };

    function test(name, condition, details = '') {
        if (condition) {
            console.log(`✅ ${name}`);
            results.passed++;
        } else {
            console.log(`❌ ${name}${details ? ': ' + details : ''}`);
            results.failed++;
        }
        results.tests.push({ name, passed: condition, details });
    }

    // Test 1: StegHider class exists
    test('StegHider class loaded', typeof StegHider !== 'undefined');

    // Test 2: Can create instance
    let steg;
    try {
        steg = new StegHider();
        test('StegHider instance created', true);
    } catch (error) {
        test('StegHider instance created', false, error.message);
        return results; // Can't continue without instance
    }

    // Test 3: Basic string conversion
    try {
        const binary = steg.stringToBinary('Hi');
        const back = steg.binaryToString(binary);
        test('String conversion works', back === 'Hi');
    } catch (error) {
        test('String conversion works', false, error.message);
    }

    // Test 4: Image loading (using test image)
    try {
        const img = document.getElementById('testImage');
        const imageData = await steg.getImageData(img);
        test('Image data extraction works', imageData && imageData.data);
    } catch (error) {
        test('Image data extraction works', false, error.message);
    }

    // Test 5: Hide and extract (basic)
    try {
        const testMessage = 'Test123';
        const img = document.getElementById('testImage');

        // Hide
        const hideResult = await steg.hideMessage(img.src, testMessage);
        test('Hide operation succeeds', hideResult.success);

        if (hideResult.success) {
            // Extract
            const extractResult = await steg.extractMessage(hideResult.dataUrl);
            test('Extract operation succeeds', extractResult.success);

            if (extractResult.success) {
                test('Message integrity preserved', extractResult.message === testMessage);
            }
        }
    } catch (error) {
        test('Hide/Extract roundtrip works', false, error.message);
    }

    // Test 6: Password encryption
    try {
        const testMessage = 'Secret message';
        const password = 'testpass123';

        // Encrypt
        const encrypted = await steg.encryptString(testMessage, password);
        test('Encryption works', encrypted && encrypted.length > 0);

        // Decrypt
        const decrypted = await steg.decryptString(encrypted, password);
        test('Decryption works', decrypted === testMessage);
    } catch (error) {
        test('Password encryption/decryption works', false, error.message);
    }

    // Test 7: MetaWipe
    try {
        const img = document.getElementById('testImage');
        const metawipeResult = await steg.metawipeImage(img.src);
        test('MetaWipe works', metawipeResult.success);
    } catch (error) {
        test('MetaWipe works', false, error.message);
    }

    // Test 8: Capacity calculation
    try {
        const img = document.getElementById('testImage');
        const imageData = await steg.getImageData(img);
        const capacity = (imageData.width * imageData.height * 3) / 8;
        test('Capacity calculation reasonable', capacity > 0 && capacity < 1000000);
    } catch (error) {
        test('Capacity calculation works', false, error.message);
    }

    // Summary
    console.log(`\n📊 Test Results: ${results.passed} passed, ${results.failed} failed`);

    if (results.failed === 0) {
        console.log('🎉 All tests passed! Extension is working correctly.');
    } else {
        console.log('⚠️ Some tests failed. Check the details above.');
        console.log('Failed tests:', results.tests.filter(t => !t.passed));
    }

    return results;
}

// Auto-run if this script is loaded
if (typeof window !== 'undefined' && window.location) {
    console.log('💡 Run: runAutomatedTests() to start testing');
    window.runAutomatedTests = runAutomatedTests;
}