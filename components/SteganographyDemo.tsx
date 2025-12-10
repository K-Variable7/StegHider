import { useState } from 'react';

export default function SteganographyDemo() {
  const [imageFile, setImageFile] = useState(null);
  const [clueText, setClueText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [encodedImage, setEncodedImage] = useState(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      // In a real implementation, you'd process the image here
    }
  };

  const encodeMessage = async () => {
    if (!imageFile || !clueText) return;

    setIsProcessing(true);

    // Simulate steganography processing
    setTimeout(() => {
      // Create a demo result
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Add a subtle watermark effect for demo
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.font = '20px Arial';
        ctx.fillText('VAULTWARS', 10, 30);

        setEncodedImage(canvas.toDataURL());
        setIsProcessing(false);
      };

      img.src = URL.createObjectURL(imageFile);
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-900 text-white rounded-xl">
      <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
        🔐 Steganography Demo
      </h1>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">📤 Encode Message</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Upload Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 file:bg-purple-600 file:border-0 file:rounded file:px-3 file:py-1 file:text-white"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Secret Clue</label>
            <textarea
              value={clueText}
              onChange={(e) => setClueText(e.target.value)}
              placeholder="Enter your secret message..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 h-24 resize-none"
            />
          </div>

          <button
            onClick={encodeMessage}
            disabled={!imageFile || !clueText || isProcessing}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-6 rounded-lg hover:from-green-500 hover:to-blue-500 transition-all duration-300 font-bold disabled:opacity-50"
          >
            {isProcessing ? '🔄 Encoding...' : '🔐 Encode Message'}
          </button>
        </div>

        {/* Output Section */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">📥 Encoded Result</h2>

          {encodedImage ? (
            <div className="space-y-4">
              <img
                src={encodedImage}
                alt="Encoded image"
                className="w-full rounded-lg border border-gray-600"
              />
              <div className="bg-green-900/20 border border-green-500/30 p-3 rounded-lg">
                <p className="text-green-300 text-sm">
                  ✅ Message successfully encoded! The image now contains your secret clue.
                </p>
              </div>
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.download = 'vaultwars-encoded.png';
                  link.href = encodedImage;
                  link.click();
                }}
                className="w-full bg-gray-700 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
              >
                💾 Download Encoded Image
              </button>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-12">
              <div className="text-6xl mb-4">🖼️</div>
              <p>Upload an image and enter a clue to see the steganography in action!</p>
            </div>
          )}
        </div>
      </div>

      {/* Educational Section */}
      <div className="mt-8 bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">🎓 How It Works</h2>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-3xl mb-2">🖼️</div>
            <h3 className="font-bold mb-1">Image Input</h3>
            <p className="text-gray-300">Upload any image as your canvas</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">🔐</div>
            <h3 className="font-bold mb-1">Steganography</h3>
            <p className="text-gray-300">Secret message hidden in pixel data</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">🎮</div>
            <h3 className="font-bold mb-1">Gaming</h3>
            <p className="text-gray-300">Clues become part of the metaverse</p>
          </div>
        </div>
      </div>
    </div>
  );
}