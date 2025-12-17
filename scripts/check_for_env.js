#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function getStagedFiles() {
  const out = execSync('git diff --cached --name-only', { encoding: 'utf8' });
  return out.split('\n').map(s => s.trim()).filter(Boolean);
}

const envPathPattern = /(^|\/)\.env($|\.|\/)/i;
const suspiciousKeyRegex = /(PRIVATE_KEY|BOT_PRIVATE_KEY|ETHERSCAN_API_KEY|SEPOLIA_RPC_URL|BASE_TESTNET_RPC_URL|NOSTR_SECRET|AWS_SECRET|SECRET_KEY|API_KEY|PASSWORD)/i;
const privateKeyHex = /0x[a-fA-F0-9]{64}/;
const pemPrivateKey = /-----BEGIN [A-Z ]*PRIVATE KEY-----/;

function checkFile(file) {
  if (!fs.existsSync(file)) return null;
  try {
    const content = fs.readFileSync(file, 'utf8');
    if (envPathPattern.test(file)) return { file, reason: 'Attempt to add .env file' };
    if (suspiciousKeyRegex.test(content)) return { file, reason: 'Likely secret environment variable present' };
    if (privateKeyHex.test(content)) return { file, reason: 'Looks like a private key hex (0x...)' };
    if (pemPrivateKey.test(content)) return { file, reason: 'PEM formatted private key found' };
    return null;
  } catch (err) {
    return null; // binary files etc
  }
}

const staged = getStagedFiles();
const warnings = [];
const SELF = 'scripts/check_for_env.js';
for (const f of staged) {
  // skip node_modules, virtualenvs, husky and the check itself and common binary media
  if (f === SELF) continue;
  if (f.startsWith('.husky/') || f.startsWith('node_modules/') || f.includes('.venv/') || f.startsWith('venv/') || f.includes('/dist/') || f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg')) continue;
  const res = checkFile(f);
  if (res) warnings.push(res);
}

if (warnings.length) {
  console.error('\n\u26A0\uFE0F  Committing potential secrets blocked by pre-commit check:');
  for (const w of warnings) {
    console.error(` - ${w.file}: ${w.reason}`);
  }
  console.error('\nPlease remove secrets from the commit. Use environment variables or a secrets manager, and add local .env to your .gitignore.');
  console.error('If this is a false positive, review the files and stage only the intended changes.');
  process.exit(1);
}

process.exit(0);
