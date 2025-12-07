import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import FactionDashboard from '../components/FactionDashboard';

export default function Home() {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <header className="p-6">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-white">VaultWars</h1>
          <ConnectButton />
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {!isConnected ? (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Welcome to VaultWars</h2>
            <p className="text-xl text-gray-300 mb-8">
              Connect your wallet to join the scavenger hunt and compete with factions for NFT rewards!
            </p>
            <ConnectButton />
          </div>
        ) : (
          <FactionDashboard />
        )}
      </main>
    </div>
  );
}