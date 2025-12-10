import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWatchContractEvent } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { DYNAMIC_CLUE_NFT_ABI } from '../utils/dynamicClueNftAbi';

const CONTRACT_ADDRESS = "0x7fE9313c7e65A0c8Db47F9Fbb825Bab10bbbd1f4";

export default function TournamentDashboard() {
  const { address } = useAccount();
  const [activeTournament, setActiveTournament] = useState(null);
  const [tournamentName, setTournamentName] = useState('');
  const [entryFee, setEntryFee] = useState('');
  const [durationHours, setDurationHours] = useState('');

  // Read tournament data
  const { data: tournamentData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DYNAMIC_CLUE_NFT_ABI,
    functionName: 'tournaments',
    args: [activeTournament]
  });

  const { data: userTournaments } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DYNAMIC_CLUE_NFT_ABI,
    functionName: 'getUserTournaments',
    args: [address]
  });

  const { data: participants } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: DYNAMIC_CLUE_NFT_ABI,
    functionName: 'getTournamentParticipants',
    args: [activeTournament]
  });

  // Write functions
  const { writeContract: createTournament } = useWriteContract();
  const { writeContract: joinTournament } = useWriteContract();
  const { writeContract: endTournament } = useWriteContract();

  // Watch for tournament events
  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: DYNAMIC_CLUE_NFT_ABI,
    eventName: 'TournamentCreated',
    onLogs: (logs) => {
      console.log('Tournament created:', logs);
    }
  });

  const handleCreateTournament = () => {
    if (!tournamentName || !entryFee || !durationHours) return;

    createTournament({
      address: CONTRACT_ADDRESS,
      abi: DYNAMIC_CLUE_NFT_ABI,
      functionName: 'createTournament',
      args: [tournamentName, entryFee, durationHours],
      chain: baseSepolia,
      account: address
    });
  };

  const handleJoinTournament = () => {
    if (!activeTournament) return;

    joinTournament({
      address: CONTRACT_ADDRESS,
      abi: DYNAMIC_CLUE_NFT_ABI,
      functionName: 'joinTournament',
      args: [activeTournament],
      value: entryFee,
      chain: baseSepolia,
      account: address
    });
  };

  const handleEndTournament = () => {
    if (!activeTournament) return;

    endTournament({
      address: CONTRACT_ADDRESS,
      abi: DYNAMIC_CLUE_NFT_ABI,
      functionName: 'endTournament',
      args: [activeTournament],
      chain: baseSepolia,
      account: address
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-900 text-white rounded-xl">
      <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
        🏆 Tournament Arena
      </h1>

      {/* Create Tournament Section */}
      <div className="bg-gray-800 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-bold mb-4">⚔️ Create Tournament</h2>
        <div className="grid md:grid-cols-4 gap-4 mb-4">
          <input
            type="text"
            placeholder="Tournament Name"
            value={tournamentName}
            onChange={(e) => setTournamentName(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
          />
          <input
            type="number"
            placeholder="Entry Fee (ETH)"
            value={entryFee}
            onChange={(e) => setEntryFee(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
          />
          <input
            type="number"
            placeholder="Duration (hours)"
            value={durationHours}
            onChange={(e) => setDurationHours(e.target.value)}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2"
          />
          <button
            onClick={handleCreateTournament}
            className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white py-2 px-4 rounded-lg hover:from-yellow-500 hover:to-orange-500 transition-all duration-300 font-bold"
          >
            Create Tournament
          </button>
        </div>
      </div>

      {/* Active Tournament Display */}
      {tournamentData && (
        <div className="bg-gray-800 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-bold mb-4">🎯 Active Tournament</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-bold mb-2">{(tournamentData as any).name}</h3>
              <p className="text-gray-300 mb-2">Entry Fee: {entryFee} ETH</p>
              <p className="text-gray-300 mb-2">Prize Pool: {(tournamentData as any).prizePool} ETH</p>
              <p className="text-gray-300 mb-4">Participants: {(participants as any)?.length || 0}</p>

              <div className="space-x-2">
                <button
                  onClick={handleJoinTournament}
                  className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-2 px-4 rounded-lg hover:from-green-500 hover:to-blue-500 transition-all duration-300 font-bold"
                >
                  Join Tournament
                </button>
                <button
                  onClick={handleEndTournament}
                  className="bg-gradient-to-r from-red-600 to-pink-600 text-white py-2 px-4 rounded-lg hover:from-red-500 hover:to-pink-500 transition-all duration-300 font-bold"
                >
                  End Tournament
                </button>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-2">Participants</h4>
              <div className="bg-gray-700 p-3 rounded-lg max-h-40 overflow-y-auto">
                {(participants as any) && (participants as any).length > 0 ? (
                  (participants as any).map((participant, index) => (
                    <div key={index} className="text-sm text-gray-300 mb-1">
                      {participant.slice(0, 6)}...{participant.slice(-4)}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400">No participants yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tournament Selector */}
      <div className="bg-gray-800 p-6 rounded-lg mb-8">
        <h2 className="text-xl font-bold mb-4">📋 Select Tournament</h2>
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4, 5].map((id) => (
            <button
              key={id}
              onClick={() => setActiveTournament(id)}
              className={`p-3 rounded-lg border-2 transition-all duration-300 ${
                activeTournament === id
                  ? 'border-yellow-400 bg-yellow-400/20'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              Tournament {id}
            </button>
          ))}
        </div>
      </div>

      {/* User Tournaments */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">🏅 Your Tournaments</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {(userTournaments as any) && (userTournaments as any).length > 0 ? (
            (userTournaments as any).map((tournamentId, index) => (
              <div key={index} className="bg-gray-700 p-4 rounded-lg">
                <h3 className="font-bold mb-2">Tournament #{tournamentId}</h3>
                <p className="text-sm text-gray-300">Status: Active</p>
                <button
                  onClick={() => setActiveTournament(Number(tournamentId))}
                  className="mt-2 bg-gray-600 text-white py-1 px-3 rounded hover:bg-gray-500 transition-colors text-sm"
                >
                  View Details
                </button>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center text-gray-400 py-8">
              <p>You haven't joined any tournaments yet.</p>
              <p className="text-sm mt-2">Join a tournament to start competing!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}