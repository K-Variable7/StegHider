import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWatchContractEvent } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { DYNAMIC_CLUE_NFT_ABI } from '../utils/dynamicClueNftAbi';

const CONTRACT_ADDRESS = "0x7fE9313c7e65A0c8Db47F9Fbb825Bab10bbbd1f4";

export default function Marketplace() {
  const { address } = useAccount();
  const [selectedTokenId, setSelectedTokenId] = useState('');
  const [listingPrice, setListingPrice] = useState('');
  const [userNFTs, setUserNFTs] = useState([]);

  // Read marketplace data
  const { data: activeListings, refetch: refetchListings } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DYNAMIC_CLUE_NFT_ABI,
    functionName: 'getActiveListings'
  });

  const { data: userClues } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DYNAMIC_CLUE_NFT_ABI,
    functionName: 'getPlayerClues',
    args: [address]
  });

  // Get listing details for each active listing
  const listingDetails = (activeListings as any)?.map((tokenId: any) => {
    const { data: listing } = useReadContract({
      address: CONTRACT_ADDRESS,
      abi: DYNAMIC_CLUE_NFT_ABI,
      functionName: 'listings',
      args: [tokenId]
    });
    return { tokenId, listing };
  });

  // Write functions
  const { writeContract: listNFT } = useWriteContract();
  const { writeContract: buyNFT } = useWriteContract();
  const { writeContract: cancelListing } = useWriteContract();

  // Watch for marketplace events
  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: DYNAMIC_CLUE_NFT_ABI,
    eventName: 'NFTListed',
    onLogs: () => refetchListings()
  });

  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: DYNAMIC_CLUE_NFT_ABI,
    eventName: 'NFTSold',
    onLogs: () => refetchListings()
  });

  const handleListNFT = () => {
    if (!selectedTokenId || !listingPrice) return;

    listNFT({
      address: CONTRACT_ADDRESS,
      abi: DYNAMIC_CLUE_NFT_ABI,
      functionName: 'listNFT',
      args: [selectedTokenId, listingPrice],
      chain: baseSepolia,
      account: address
    });
  };

  const handleBuyNFT = (tokenId, price) => {
    buyNFT({
      address: CONTRACT_ADDRESS,
      abi: DYNAMIC_CLUE_NFT_ABI,
      functionName: 'buyNFT',
      args: [tokenId],
      value: price,
      chain: baseSepolia,
      account: address
    });
  };

  const handleCancelListing = (tokenId) => {
    cancelListing({
      address: CONTRACT_ADDRESS,
      abi: DYNAMIC_CLUE_NFT_ABI,
      functionName: 'cancelListing',
      args: [tokenId],
      chain: baseSepolia,
      account: address
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-900 text-white rounded-xl">
      <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">
        🏪 NFT Marketplace
      </h1>

      {/* List NFT Section */}
      <div className="bg-gray-800 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-bold mb-4">📦 List Your NFT</h2>
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <select
            value={selectedTokenId}
            onChange={(e) => setSelectedTokenId(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
          >
            <option value="">Select NFT</option>
            {(userClues as any)?.map((tokenId: any) => (
              <option key={tokenId} value={tokenId}>
                Clue NFT #{tokenId}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Price (ETH)"
            value={listingPrice}
            onChange={(e) => setListingPrice(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
            step="0.001"
          />
          <button
            onClick={handleListNFT}
            disabled={!selectedTokenId || !listingPrice}
            className="bg-gradient-to-r from-green-600 to-teal-600 text-white py-2 px-4 rounded-lg hover:from-green-500 hover:to-teal-500 transition-all duration-300 font-bold disabled:opacity-50"
          >
            List NFT
          </button>
        </div>
      </div>

      {/* Active Listings */}
      <div className="bg-gray-800 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-bold mb-4">🛍️ Active Listings</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(activeListings as any) && (activeListings as any).length > 0 ? (
            (activeListings as any).slice(0, 9).map((tokenId: any) => {
              const listing = listingDetails?.find(l => l.tokenId === tokenId)?.listing;
              if (!listing) return null;

              return (
                <div key={tokenId} className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">🎴</div>
                    <h3 className="font-bold">Clue NFT #{tokenId}</h3>
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-gray-300">
                      Seller: {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
                    </p>
                    <p className="text-lg font-bold text-yellow-400">
                      {listing.price} ETH
                    </p>
                  </div>

                  <div className="space-y-2">
                    {listing.seller === address ? (
                      <button
                        onClick={() => handleCancelListing(tokenId)}
                        className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-500 transition-colors"
                      >
                        Cancel Listing
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBuyNFT(tokenId, listing.price)}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded hover:from-blue-500 hover:to-purple-500 transition-all duration-300 font-bold"
                      >
                        Buy NFT
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center text-gray-400 py-12">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-lg">No active listings</p>
              <p className="text-sm mt-2">Be the first to list an NFT!</p>
            </div>
          )}
        </div>
      </div>

      {/* Marketplace Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg text-center">
          <div className="text-4xl mb-2">📊</div>
          <h3 className="text-lg font-bold mb-1">Active Listings</h3>
          <p className="text-2xl text-blue-400">{(activeListings as any)?.length || 0}</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg text-center">
          <div className="text-4xl mb-2">💎</div>
          <h3 className="text-lg font-bold mb-1">Your NFTs</h3>
          <p className="text-2xl text-purple-400">{(userClues as any)?.length || 0}</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg text-center">
          <div className="text-4xl mb-2">💰</div>
          <h3 className="text-lg font-bold mb-1">Total Volume</h3>
          <p className="text-2xl text-green-400">Coming Soon</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg text-center">
          <div className="text-4xl mb-2">🏷️</div>
          <h3 className="text-lg font-bold mb-1">Floor Price</h3>
          <p className="text-2xl text-yellow-400">Coming Soon</p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-gray-800 p-6 rounded-lg mt-8">
        <h2 className="text-xl font-bold mb-4">📈 Recent Transactions</h2>
        <div className="space-y-3">
          {/* This would be populated with actual transaction data */}
          <div className="flex justify-between items-center bg-gray-700 p-3 rounded-lg">
            <div>
              <span className="font-bold">Clue NFT #1</span>
              <span className="ml-2 text-xs bg-green-600 px-2 py-1 rounded">Sold</span>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-300">0.05 ETH</p>
              <p className="text-xs text-gray-400">2 hours ago</p>
            </div>
          </div>

          <div className="flex justify-between items-center bg-gray-700 p-3 rounded-lg">
            <div>
              <span className="font-bold">Clue NFT #3</span>
              <span className="ml-2 text-xs bg-blue-600 px-2 py-1 rounded">Listed</span>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-300">0.08 ETH</p>
              <p className="text-xs text-gray-400">4 hours ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}