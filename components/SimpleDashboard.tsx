'use client';

import { useState } from 'react';
import NFTGallery from './NFTGallery';

export default function SimpleDashboard() {
  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          VaultWars NFT Gallery
        </h1>
        <NFTGallery />
      </div>
    </div>
  );
}
