'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { Client } from '@xmtp/xmtp-js';
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
  const [client, setClient] = useState<Client | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectToChat = async () => {
    if (!address) return;

    try {
      // Create XMTP client
      const wallet = new ethers.Wallet(process.env.NEXT_PUBLIC_PRIVATE_KEY || ''); // In production, use user's wallet
      const xmtp = await Client.create(wallet);
      setClient(xmtp);
      setIsConnected(true);

      // Listen for messages
      const conversation = await xmtp.conversations.newConversation(
        `vaultwars-faction-${factionId}@example.com`, // Placeholder - in real app, use faction coordinator
        {
          conversationId: `vaultwars-faction-${factionId}`,
          metadata: { faction: factionId.toString() }
        }
      );

      // Load existing messages
      const existingMessages = await conversation.messages();
      const formattedMessages = existingMessages.map((msg: any) => ({
        id: msg.id,
        sender: msg.senderAddress,
        content: msg.content,
        timestamp: new Date(msg.sent)
      }));
      setMessages(formattedMessages);

      // Listen for new messages
      const stream = await conversation.streamMessages();
      for await (const message of stream) {
        const newMsg: Message = {
          id: message.id,
          sender: message.senderAddress,
          content: message.content,
          timestamp: new Date(message.sent)
        };
        setMessages(prev => [...prev, newMsg]);
      }
    } catch (error) {
      console.error('Failed to connect to faction chat:', error);
    }
  };

  const sendMessage = async () => {
    if (!client || !newMessage.trim()) return;

    try {
      const conversation = await client.conversations.newConversation(
        `vaultwars-faction-${factionId}@example.com`,
        {
          conversationId: `vaultwars-faction-${factionId}`,
          metadata: { faction: factionId.toString() }
        }
      );

      await conversation.send(newMessage);
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