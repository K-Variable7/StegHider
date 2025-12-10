'use client';

import { useState } from 'react';

type TabType = 'embed' | 'extract' | 'clean' | 'batch';

export default function StegHideTool() {
  const [activeTab, setActiveTab] = useState<TabType>('embed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🎨 StegHide Tool
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Advanced steganography tool for hiding and extracting secret messages in images.
            Perfect for creating hidden clues in your VaultWars adventures!
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-1 border border-gray-700 flex flex-wrap">
            <button
              onClick={() => setActiveTab('embed')}
              className={`px-3 py-2 rounded-lg font-semibold transition-all duration-300 text-sm ${
                activeTab === 'embed'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              🔒 Hide
            </button>
            <button
              onClick={() => setActiveTab('extract')}
              className={`px-3 py-2 rounded-lg font-semibold transition-all duration-300 text-sm ${
                activeTab === 'extract'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              🔓 Extract
            </button>
            <button
              onClick={() => setActiveTab('clean')}
              className={`px-3 py-2 rounded-lg font-semibold transition-all duration-300 text-sm ${
                activeTab === 'clean'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              🧹 Clean
            </button>
            <button
              onClick={() => setActiveTab('batch')}
              className={`px-3 py-2 rounded-lg font-semibold transition-all duration-300 text-sm ${
                activeTab === 'batch'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              📦 Batch
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-4xl mx-auto">
          {activeTab === 'embed' ? <EmbedTab /> : activeTab === 'extract' ? <ExtractTab /> : activeTab === 'clean' ? <CleanTab /> : <BatchTab />}
        </div>
      </div>
    </div>
  );
}

function EmbedTab() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [useEncryption, setUseEncryption] = useState(false);
  const [password, setPassword] = useState('');
  const [enableRobustness, setEnableRobustness] = useState(true);
  const [nsym, setNsym] = useState(10);
  const [result, setResult] = useState<string | null>(null);

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
    if (!selectedImage || !message) return;

    setIsProcessing(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('message', message);

      if (useEncryption && password) {
        formData.append('use_encryption', 'true');
        formData.append('password', password);
      }

      if (enableRobustness) {
        formData.append('enable_rs', 'true');
        formData.append('nsym', nsym.toString());
      }

      const response = await fetch('/api/embed', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setResult(url);
      } else {
        const errorText = await response.text();
        alert(`Embedding failed: ${errorText}`);
      }
    } catch (error) {
      console.error('Embedding failed:', error);
      alert('Embedding failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/30 rounded-lg p-6">
        <h3 className="text-cyan-400 font-bold text-xl mb-4">🔒 Hide Your Secret Message</h3>
        <p className="text-gray-300">
          Embed your message invisibly into an image. The hidden data will be undetectable to the naked eye!
        </p>
      </div>

      {/* Image Upload */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
        <label className="block text-white text-lg mb-3 font-semibold">
          📸 Select Cover Image
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-cyan-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-700"
        />
        <p className="text-gray-400 text-sm mt-2">
          Choose a high-quality image. PNG format recommended for best results.
        </p>
      </div>

      {/* Image Preview */}
      {imagePreview && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
          <h4 className="text-white font-semibold mb-4">🖼️ Image Preview</h4>
          <div className="flex justify-center">
            <img
              src={imagePreview}
              alt="Cover image preview"
              className="max-w-full max-h-64 rounded-lg border border-gray-600"
            />
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
        <label className="block text-white text-lg mb-3 font-semibold">
          💬 Secret Message
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter your secret message here..."
          className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-cyan-500 focus:outline-none resize-none"
          rows={4}
        />
        <p className="text-gray-400 text-sm mt-2">
          This message will be hidden invisibly in your image.
        </p>
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Encryption */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
          <h4 className="text-white font-semibold mb-4">🔐 Encryption</h4>
          <label className="flex items-center space-x-3 mb-4">
            <input
              type="checkbox"
              checked={useEncryption}
              onChange={(e) => setUseEncryption(e.target.checked)}
              className="w-5 h-5 rounded border-gray-600 bg-gray-700"
            />
            <span className="text-white">Enable Encryption</span>
          </label>

          {useEncryption && (
            <input
              type="password"
              placeholder="Enter encryption password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-cyan-500 focus:outline-none"
            />
          )}
        </div>

        {/* Robustness */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
          <h4 className="text-white font-semibold mb-4">🛡️ Error Correction</h4>
          <label className="flex items-center space-x-3 mb-4">
            <input
              type="checkbox"
              checked={enableRobustness}
              onChange={(e) => setEnableRobustness(e.target.checked)}
              className="w-5 h-5 rounded border-gray-600 bg-gray-700"
            />
            <span className="text-white">Enable Error Correction</span>
          </label>

          {enableRobustness && (
            <div>
              <label className="block text-gray-300 text-sm mb-2">
                Parity Symbols: {nsym}
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={nsym}
                onChange={(e) => setNsym(parseInt(e.target.value))}
                className="w-full"
              />
              <p className="text-gray-400 text-xs mt-1">
                Higher values provide better error correction but reduce capacity.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Embed Button */}
      <div className="text-center">
        <button
          onClick={handleEmbed}
          disabled={!selectedImage || !message || isProcessing}
          className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-700 text-white rounded-xl hover:from-cyan-500 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-2xl border border-cyan-500/50 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? '🔄 Embedding Message...' : '🎨 Hide Message in Image'}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700 text-center">
          <h4 className="text-green-400 font-bold text-xl mb-4">✅ Success!</h4>
          <p className="text-gray-300 mb-4">
            Your message has been successfully hidden in the image.
          </p>
          <a
            href={result}
            download="secret_image.png"
            className="inline-block px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-500 hover:to-emerald-500 transition-all duration-300 font-semibold"
          >
            💾 Download Steganographic Image
          </a>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gradient-to-r from-gray-800/60 to-gray-900/60 border border-gray-600/30 rounded-lg p-6">
        <h4 className="text-white font-semibold mb-4">📋 How It Works:</h4>
        <ol className="text-gray-300 text-sm space-y-2 list-decimal list-inside">
          <li>Upload a cover image (your message will be invisibly embedded)</li>
          <li>Enter your secret message in the text area</li>
          <li>Configure encryption and error correction options as needed</li>
          <li>Click "Hide Message" to create your steganographic image</li>
          <li>Download and share the image - others must use this tool to extract your message!</li>
        </ol>
      </div>
    </div>
  );
}

function ExtractTab() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [password, setPassword] = useState('');
  const [enableRobustness, setEnableRobustness] = useState(true);
  const [nsym, setNsym] = useState(10);
  const [extractedMessage, setExtractedMessage] = useState<string | null>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleExtract = async () => {
    if (!selectedImage) return;

    setIsProcessing(true);
    setExtractedMessage(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);

      if (isEncrypted && password) {
        formData.append('is_encrypted', 'true');
        formData.append('password', password);
      }

      if (enableRobustness) {
        formData.append('enable_rs', 'true');
        formData.append('nsym', nsym.toString());
      }

      const response = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const text = await response.text();
        setExtractedMessage(text);
      } else {
        const errorText = await response.text();
        alert(`Extraction failed: ${errorText}`);
      }
    } catch (error) {
      console.error('Extraction failed:', error);
      alert('Extraction failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/30 rounded-lg p-6">
        <h3 className="text-cyan-400 font-bold text-xl mb-4">🔓 Extract Hidden Message</h3>
        <p className="text-gray-300">
          Extract secret messages that have been hidden in images using steganography.
        </p>
      </div>

      {/* Image Upload */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
        <label className="block text-white text-lg mb-3 font-semibold">
          🖼️ Select Image with Hidden Message
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-cyan-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-700"
        />
        <p className="text-gray-400 text-sm mt-2">
          Select an image that contains a hidden message.
        </p>
      </div>

      {/* Image Preview */}
      {imagePreview && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
          <h4 className="text-white font-semibold mb-4">🖼️ Image Preview</h4>
          <div className="flex justify-center">
            <img
              src={imagePreview}
              alt="Image with hidden message"
              className="max-w-full max-h-64 rounded-lg border border-gray-600"
            />
          </div>
        </div>
      )}

      {/* Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Decryption */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
          <h4 className="text-white font-semibold mb-4">🔐 Decryption</h4>
          <label className="flex items-center space-x-3 mb-4">
            <input
              type="checkbox"
              checked={isEncrypted}
              onChange={(e) => setIsEncrypted(e.target.checked)}
              className="w-5 h-5 rounded border-gray-600 bg-gray-700"
            />
            <span className="text-white">Message is Encrypted</span>
          </label>

          {isEncrypted && (
            <input
              type="password"
              placeholder="Enter decryption password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-cyan-500 focus:outline-none"
            />
          )}
        </div>

        {/* Robustness */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
          <h4 className="text-white font-semibold mb-4">🛡️ Error Correction</h4>
          <label className="flex items-center space-x-3 mb-4">
            <input
              type="checkbox"
              checked={enableRobustness}
              onChange={(e) => setEnableRobustness(e.target.checked)}
              className="w-5 h-5 rounded border-gray-600 bg-gray-700"
            />
            <span className="text-white">Enable Error Correction</span>
          </label>

          {enableRobustness && (
            <div>
              <label className="block text-gray-300 text-sm mb-2">
                Parity Symbols: {nsym}
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={nsym}
                onChange={(e) => setNsym(parseInt(e.target.value))}
                className="w-full"
              />
              <p className="text-gray-400 text-xs mt-1">
                Must match the settings used when hiding the message.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Extract Button */}
      <div className="text-center">
        <button
          onClick={handleExtract}
          disabled={!selectedImage || isProcessing}
          className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-700 text-white rounded-xl hover:from-cyan-500 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-2xl border border-cyan-500/50 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? '🔄 Extracting Message...' : '🔓 Extract Hidden Message'}
        </button>
      </div>

      {/* Result */}
      {extractedMessage && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
          <h4 className="text-green-400 font-bold text-xl mb-4">✅ Message Extracted!</h4>
          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-600">
            <p className="text-white font-mono text-sm whitespace-pre-wrap">
              {extractedMessage}
            </p>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gradient-to-r from-gray-800/60 to-gray-900/60 border border-gray-600/30 rounded-lg p-6">
        <h4 className="text-white font-semibold mb-4">📋 How to Extract:</h4>
        <ol className="text-gray-300 text-sm space-y-2 list-decimal list-inside">
          <li>Upload an image that contains a hidden message</li>
          <li>If the message was encrypted, check the encryption box and enter the password</li>
          <li>Ensure error correction settings match those used when hiding the message</li>
          <li>Click "Extract Hidden Message" to reveal the secret</li>
          <li>The extracted message will appear below</li>
        </ol>
      </div>
    </div>
  );
}

function CleanTab() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [cleanedImageUrl, setCleanedImageUrl] = useState<string | null>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
      setCleanedImageUrl(null); // Reset when new image is selected
    }
  };

  const handleCleanMetadata = async () => {
    if (!selectedImage) return;

    setIsProcessing(true);
    setCleanedImageUrl(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);

      const response = await fetch('/api/clean', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setCleanedImageUrl(url);
      } else {
        const errorText = await response.text();
        alert(`Metadata cleaning failed: ${errorText}`);
      }
    } catch (error) {
      console.error('Metadata cleaning failed:', error);
      alert('Metadata cleaning failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/30 rounded-lg p-6">
        <h3 className="text-cyan-400 font-bold text-xl mb-4">🧹 Clean Image Metadata</h3>
        <p className="text-gray-300">
          Remove EXIF data and other metadata from images to protect privacy before hiding messages.
          This prevents accidental leakage of location, timestamps, and camera information.
        </p>
      </div>

      {/* Image Upload */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
        <label className="block text-white text-lg mb-3 font-semibold">
          📸 Select Image to Clean
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-cyan-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-700"
        />
        <p className="text-gray-400 text-sm mt-2">
          Upload any image to remove its metadata. PNG, JPG, and other formats supported.
        </p>
      </div>

      {/* Image Preview */}
      {imagePreview && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
          <h4 className="text-white font-semibold mb-4">🖼️ Original Image</h4>
          <div className="flex justify-center">
            <img
              src={imagePreview}
              alt="Original image"
              className="max-w-full max-h-64 rounded-lg border border-gray-600"
            />
          </div>
          <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-300 text-sm">
              <strong>⚠️ Warning:</strong> This image may contain EXIF metadata including GPS coordinates,
              timestamps, camera information, and other sensitive data that could compromise privacy.
            </p>
          </div>
        </div>
      )}

      {/* Clean Button */}
      <div className="text-center">
        <button
          onClick={handleCleanMetadata}
          disabled={!selectedImage || isProcessing}
          className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl hover:from-green-500 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 shadow-2xl border border-green-500/50 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? '🧹 Cleaning Metadata...' : '🧹 Clean Metadata'}
        </button>
      </div>

      {/* Result */}
      {cleanedImageUrl && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700 text-center">
          <h4 className="text-green-400 font-bold text-xl mb-4">✅ Metadata Cleaned!</h4>
          <p className="text-gray-300 mb-4">
            All EXIF data and metadata have been removed from your image. It's now safe for steganography!
          </p>
          <div className="flex justify-center mb-4">
            <img
              src={cleanedImageUrl}
              alt="Cleaned image"
              className="max-w-full max-h-64 rounded-lg border border-green-500/50"
            />
          </div>
          <a
            href={cleanedImageUrl}
            download="clean_image.png"
            className="inline-block px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-500 hover:to-emerald-500 transition-all duration-300 font-semibold"
          >
            💾 Download Clean Image
          </a>
        </div>
      )}

      {/* Information */}
      <div className="bg-gradient-to-r from-gray-800/60 to-gray-900/60 border border-gray-600/30 rounded-lg p-6">
        <h4 className="text-white font-semibold mb-4">🔒 Why Clean Metadata?</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300 text-sm">
          <div>
            <h5 className="text-cyan-400 font-semibold mb-2">📍 Location Data</h5>
            <p>GPS coordinates can reveal where a photo was taken, compromising operational security.</p>
          </div>
          <div>
            <h5 className="text-cyan-400 font-semibold mb-2">⏰ Timestamps</h5>
            <p>Creation and modification dates can provide timing information for investigations.</p>
          </div>
          <div>
            <h5 className="text-cyan-400 font-semibold mb-2">📷 Device Info</h5>
            <p>Camera model, software version, and settings can identify equipment and techniques.</p>
          </div>
          <div>
            <h5 className="text-cyan-400 font-semibold mb-2">🔐 Privacy Protection</h5>
            <p>Clean images ensure no accidental information leakage when sharing steganographic content.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BatchTab() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [batchOperation, setBatchOperation] = useState<'embed' | 'extract' | 'clean'>('embed');
  const [batchMessage, setBatchMessage] = useState('');
  const [useEncryption, setUseEncryption] = useState(false);
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{file: string, status: 'success' | 'error', url?: string}[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
    setResults([]);
  };

  const handleBatchProcess = async () => {
    if (selectedFiles.length === 0) return;
    if (batchOperation === 'embed' && !batchMessage) return;

    setIsProcessing(true);
    setProgress(0);
    setResults([]);

    const newResults: {file: string, status: 'success' | 'error', url?: string}[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      try {
        let response: Response;
        let resultUrl: string;

        if (batchOperation === 'embed') {
          const formData = new FormData();
          formData.append('image', file);
          formData.append('message', batchMessage);
          if (useEncryption && password) {
            formData.append('use_encryption', 'true');
            formData.append('password', password);
          }

          response = await fetch('/api/embed', { method: 'POST', body: formData });
        } else if (batchOperation === 'extract') {
          const formData = new FormData();
          formData.append('image', file);
          if (useEncryption && password) {
            formData.append('is_encrypted', 'true');
            formData.append('password', password);
          }

          response = await fetch('/api/extract', { method: 'POST', body: formData });
        } else { // clean
          const formData = new FormData();
          formData.append('image', file);

          response = await fetch('/api/clean', { method: 'POST', body: formData });
        }

        if (response.ok) {
          if (batchOperation === 'extract') {
            const text = await response.text();
            resultUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`;
          } else {
            const blob = await response.blob();
            resultUrl = URL.createObjectURL(blob);
          }
          newResults.push({ file: file.name, status: 'success', url: resultUrl });
        } else {
          newResults.push({ file: file.name, status: 'error' });
        }
      } catch (error) {
        newResults.push({ file: file.name, status: 'error' });
      }

      setProgress(((i + 1) / selectedFiles.length) * 100);
      setResults([...newResults]);
    }

    setIsProcessing(false);
  };

  const downloadAll = () => {
    // Create a ZIP-like download (simplified - would need proper ZIP generation)
    const successfulResults = results.filter(r => r.status === 'success' && r.url);
    if (successfulResults.length === 0) return;

    // For now, download the first successful result as an example
    const firstSuccess = successfulResults[0];
    if (firstSuccess.url) {
      const link = document.createElement('a');
      link.href = firstSuccess.url;
      link.download = `batch_${batchOperation}_${firstSuccess.file}`;
      link.click();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/30 rounded-lg p-6">
        <h3 className="text-cyan-400 font-bold text-xl mb-4">📦 Batch Processing</h3>
        <p className="text-gray-300">
          Process multiple images at once! Perfect for creating treasure collections or bulk operations.
        </p>
      </div>

      {/* Operation Selection */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
        <label className="block text-white text-lg mb-3 font-semibold">
          ⚙️ Select Operation
        </label>
        <select
          value={batchOperation}
          onChange={(e) => setBatchOperation(e.target.value as 'embed' | 'extract' | 'clean')}
          className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-cyan-500 focus:outline-none"
        >
          <option value="embed">🔒 Hide Message (Embed in images)</option>
          <option value="extract">🔓 Extract Messages (From images)</option>
          <option value="clean">🧹 Clean Metadata (Remove EXIF)</option>
        </select>
      </div>

      {/* Message Input (for embed only) */}
      {batchOperation === 'embed' && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
          <label className="block text-white text-lg mb-3 font-semibold">
            💬 Message to Hide
          </label>
          <textarea
            value={batchMessage}
            onChange={(e) => setBatchMessage(e.target.value)}
            placeholder="Enter the message to hide in ALL selected images..."
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-cyan-500 focus:outline-none resize-none"
            rows={3}
          />
        </div>
      )}

      {/* Encryption Options */}
      {(batchOperation === 'embed' || batchOperation === 'extract') && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
          <h4 className="text-white font-semibold mb-4">🔐 Encryption Settings</h4>
          <label className="flex items-center space-x-3 mb-4">
            <input
              type="checkbox"
              checked={useEncryption}
              onChange={(e) => setUseEncryption(e.target.checked)}
              className="w-5 h-5 rounded border-gray-600 bg-gray-700"
            />
            <span className="text-white">Use Encryption</span>
          </label>

          {useEncryption && (
            <input
              type="password"
              placeholder="Enter password for all files"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-cyan-500 focus:outline-none"
            />
          )}
        </div>
      )}

      {/* File Selection */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
        <label className="block text-white text-lg mb-3 font-semibold">
          📸 Select Images ({selectedFiles.length} selected)
        </label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 border border-gray-600 focus:border-cyan-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-700"
        />
        <p className="text-gray-400 text-sm mt-2">
          Select multiple images to process all at once. Maximum 10 files recommended.
        </p>
      </div>

      {/* Progress Bar */}
      {isProcessing && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
          <div className="flex justify-between text-white mb-2">
            <span>Processing...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Process Button */}
      <div className="text-center">
        <button
          onClick={handleBatchProcess}
          disabled={selectedFiles.length === 0 || isProcessing || (batchOperation === 'embed' && !batchMessage)}
          className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-700 text-white rounded-xl hover:from-purple-500 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-2xl border border-purple-500/50 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? '🔄 Processing Batch...' : `📦 Process ${selectedFiles.length} Images`}
        </button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-green-400 font-bold text-xl">📊 Results</h4>
            {results.some(r => r.status === 'success') && (
              <button
                onClick={downloadAll}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-500 hover:to-emerald-500 transition-all duration-300 font-semibold"
              >
                💾 Download All
              </button>
            )}
          </div>

          <div className="space-y-2">
            {results.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                <span className="text-white text-sm">{result.file}</span>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm ${result.status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                    {result.status === 'success' ? '✅ Success' : '❌ Failed'}
                  </span>
                  {result.status === 'success' && result.url && (
                    <a
                      href={result.url}
                      download={`processed_${result.file}`}
                      className="text-cyan-400 hover:text-cyan-300 text-sm underline"
                    >
                      Download
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Use Cases */}
      <div className="bg-gradient-to-r from-gray-800/60 to-gray-900/60 border border-gray-600/30 rounded-lg p-6">
        <h4 className="text-white font-semibold mb-4">🎯 Perfect For:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300 text-sm">
          <div>
            <h5 className="text-cyan-400 font-semibold mb-2">🏴‍☠️ Treasure Hunts</h5>
            <p>Create multiple clues with the same message hidden in different images</p>
          </div>
          <div>
            <h5 className="text-cyan-400 font-semibold mb-2">📸 Photo Collections</h5>
            <p>Bulk clean metadata from entire photo albums before sharing</p>
          </div>
          <div>
            <h5 className="text-cyan-400 font-semibold mb-2">🔍 Investigation</h5>
            <p>Extract hidden messages from multiple suspicious images at once</p>
          </div>
          <div>
            <h5 className="text-cyan-400 font-semibold mb-2">⚡ Efficiency</h5>
            <p>Process dozens of images in a single batch operation</p>
          </div>
        </div>
      </div>
    </div>
  );
}