// utils/nostrIdentity.ts
import { useAccount, useSignMessage } from 'wagmi';
import { getPublicKey } from 'nostr-tools';
import { bytesToHex } from '@noble/hashes/utils.js';
import { HDKey } from '@scure/bip32';
import { hmac } from '@noble/hashes/hmac.js';
import { sha256 } from '@noble/hashes/sha2.js';

export function useNostrIdentity() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const deriveNostrKeyFromWallet = async () => {
    if (!address) return null;

    // Method used by Amethyst, Coracle, primal, etc. in 2025
    const message = 'Sign this message to generate your Nostr key. This does NOT spend funds.';
    const signature = await signMessageAsync({ account: address, message });

    // Derive seed from signature
    const seed = hmac(sha256, new TextEncoder().encode('Nostr'), new TextEncoder().encode(signature));
    const master = HDKey.fromMasterSeed(seed);
    const nostrKey = master.derive("m/44'/1237'/0'/0/0"); // BIP-44 path for Nostr

    const privateKeyBytes = nostrKey.privateKey!;
    const privateKey = bytesToHex(privateKeyBytes);
    const publicKey = getPublicKey(privateKeyBytes);

    return { privateKey, publicKey };
  };

  return { deriveNostrKeyFromWallet };
}