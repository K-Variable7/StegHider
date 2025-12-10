'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
// import { Client } from '@xmtp/xmtp-js';
import { ethers } from 'ethers';

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
}

interface FactionChatProps {
  factionId: number;
}

export default function FactionChat({ factionId }: FactionChatProps) {
  const { address } = useAccount();
  // const [client, setClient] = useState<Client | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(true); // Mock as always connected
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (address && !isConnected) {
      connectToChat();
    }
  }, [address, isConnected]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectToChat = async () => {
    if (!address) return;

    try {
      // Mock connection - in real implementation, connect to XMTP or other chat service
      setIsConnected(true);

      // Add some mock messages for demonstration
      const mockMessages: Message[] = [
        {
          id: '1',
          sender: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
          content: `Welcome to faction ${factionId} chat!`,
          timestamp: new Date(Date.now() - 300000)
        },
        {
          id: '2',
          sender: '0x742d35Cc6634C0532925a3b844Bc454e4438f44f',
          content: 'Let\'s coordinate our steganography strategy!',
          timestamp: new Date(Date.now() - 240000)
        }
      ];
      setMessages(mockMessages);
    } catch (error) {
      console.error('Failed to connect to faction chat:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      // Mock sending message - in real implementation, send via XMTP or other service
      const newMsg: Message = {
        id: Date.now().toString(),
        sender: address || 'unknown',
        content: newMessage,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 h-96 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">Faction Chat</h2>
        {!isConnected ? (
          <button
            onClick={connectToChat}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Connect
          </button>
        ) : (
          <span className="text-green-400 text-sm">Connected</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto mb-4 space-y-2">
        {messages.map((message) => (
          <div key={message.id} className="bg-white/5 rounded p-3">
            <div className="flex justify-between items-start">
              <span className="text-blue-400 font-medium text-sm">
                {message.sender.slice(0, 6)}...{message.sender.slice(-4)}
              </span>
              <span className="text-gray-400 text-xs">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
            <p className="text-white mt-1">{message.content}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {isConnected && (
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 bg-white/10 text-white rounded border border-white/20 focus:outline-none focus:border-blue-400"
          />
          <button
            onClick={sendMessage}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
}