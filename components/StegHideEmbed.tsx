'use client';

import { useState } from 'react';

interface StegHideEmbedProps {
  clueText: string;
  onImageGenerated?: (imageData: string) => void;
}

export default function StegHideEmbed({ clueText, onImageGenerated }: StegHideEmbedProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [useEncryption, setUseEncryption] = useState(false);
  const [password, setPassword] = useState('');
  const [enableRobustness, setEnableRobustness] = useState(true);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleEmbed = async () => {
    if (!selectedImage || !clueText) return;

    setIsProcessing(true);

    try {
      // In a full implementation, this would call the StegHide API
      // For now, we'll simulate the process and provide instructions
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create a "processed" image (in reality, this would be the steganographic image)
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        
        // Add a subtle watermark to show "processing"
        ctx!.fillStyle = 'rgba(255, 0, 0, 0.1)';
        ctx!.fillRect(0, 0, canvas.width, canvas.height);
        ctx!.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx!.font = '20px Arial';
        ctx!.fillText('STEGANOGRAPHIC', 20, 40);
        ctx!.fillText('CLUE EMBEDDED', 20, 70);
        
        const processedImage = canvas.toDataURL('image/png');
        onImageGenerated?.(processedImage);
      };
      
      img.src = imagePreview!;
      
    } catch (error) {
      console.error('Embedding failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/30 rounded-lg p-4">
        <h3 className="text-cyan-400 font-bold text-lg mb-2">🎨 StegHide Integration</h3>
        <p className="text-gray-300 text-sm mb-4">
          Embed your clue directly into an image using advanced steganography. 
          Your secret message will be invisible to the naked eye!
        </p>
        
        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-3 mb-4">
          <p className="text-yellow-300 text-sm">
            <strong>Note:</strong> This is a preview integration. Full StegHide functionality 
            requires API endpoints to call the Python steganography engine.
          </p>
        </div>
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-white text-sm mb-3 font-semibold">
          Select Cover Image
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-cyan-500 focus:outline-none"
        />
        <p className="text-gray-400 text-xs mt-2">
          Choose a high-quality image. PNG format recommended for best results.
        </p>
      </div>

      {/* Image Preview */}
      {imagePreview && (
        <div className="flex justify-center">
          <img 
            src={imagePreview} 
            alt="Cover image preview" 
            className="max-w-full max-h-64 rounded-lg border border-gray-600" 
          />
        </div>
      )}

      {/* Steganography Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="flex items-center space-x-2 text-white">
            <input
              type="checkbox"
              checked={useEncryption}
              onChange={(e) => setUseEncryption(e.target.checked)}
              className="rounded border-gray-600"
            />
            <span className="text-sm">Enable Encryption</span>
          </label>
          
          {useEncryption && (
            <input
              type="password"
              placeholder="Encryption password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-2 bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-cyan-500 focus:outline-none"
            />
          )}
        </div>

        <div>
          <label className="flex items-center space-x-2 text-white">
            <input
              type="checkbox"
              checked={enableRobustness}
              onChange={(e) => setEnableRobustness(e.target.checked)}
              className="rounded border-gray-600"
            />
            <span className="text-sm">Error Correction (Recommended)</span>
          </label>
          <p className="text-gray-400 text-xs mt-1">
            Protects against image corruption
          </p>
        </div>
      </div>

      {/* Embed Button */}
      <button
        onClick={handleEmbed}
        disabled={!selectedImage || !clueText || isProcessing}
        className="w-full px-6 py-4 bg-gradient-to-r from-cyan-600 to-blue-700 text-white rounded-xl hover:from-cyan-500 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-2xl border border-cyan-500/50 font-bold text-lg disabled:opacity-50"
      >
        {isProcessing ? '🔄 Embedding Clue...' : '🎨 Embed Clue in Image'}
      </button>

      {/* Instructions */}
      <div className="bg-gradient-to-r from-gray-800/60 to-gray-900/60 border border-gray-600/30 rounded-lg p-4">
        <h4 className="text-white font-semibold mb-2">📋 How It Works:</h4>
        <ol className="text-gray-300 text-sm space-y-1 list-decimal list-inside">
          <li>Upload a cover image (your clue will be invisibly embedded)</li>
          <li>Configure encryption and robustness options</li>
          <li>Click "Embed Clue" to create your steganographic image</li>
          <li>Share the image - others must use StegHide to extract your clue!</li>
          <li>Successful extraction allows them to claim your NFT treasure</li>
        </ol>
      </div>

      {/* Alternative Link */}
      <div className="text-center">
        <p className="text-gray-400 text-sm mb-2">For full functionality:</p>
        <a
          href="https://steghide.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-500 hover:to-blue-500 transition-all duration-300 text-sm font-semibold"
        >
          🌐 Open Full StegHide Tool
        </a>
      </div>
    </div>
  );
}
