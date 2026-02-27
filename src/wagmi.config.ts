import { createConfig, http } from "wagmi";
import { polygonAmoy, polygon } from "wagmi/chains";
import { injected, walletConnect, coinbaseWallet } from "wagmi/connectors";
import { createPublicClient } from "viem";

// ── Replace this after running: npx hardhat run scripts/deploy.js --network amoy
export const TYPTO_CONTRACT_ADDRESS =
  "0x2e49C4995edCE22dD483e00B0D674553468AF258"; // ← paste deployed address here

// ── Your WalletConnect Project ID (free at cloud.walletconnect.com)
const WALLETCONNECT_PROJECT_ID = "YOUR_WALLETCONNECT_PROJECT_ID";

// ── Wagmi config ──────────────────────────────────────────────────────────────
export const wagmiConfig = createConfig({
  chains: [polygonAmoy, polygon],
  connectors: [
    injected(),                                          // MetaMask, Rabby, etc.
    walletConnect({ projectId: WALLETCONNECT_PROJECT_ID }), // mobile wallets
    coinbaseWallet({ appName: "TYPTO AR" }),
  ],
  transports: {
    [polygonAmoy.id]: http("https://rpc-amoy.polygon.technology"),
    [polygon.id]:     http("https://polygon-rpc.com"),
  },
});

// ── TYPTO Token ABI (only the functions we use in the app) ────────────────────
export const TYPTO_ABI = [
  // Read
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "isOrderPaid",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "orderId", type: "string" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "lastFaucetClaim",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  // Write
  {
    name: "payBar",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "barAddress", type: "address" },
      { name: "amount",     type: "uint256" },
      { name: "orderId",    type: "string"  },
    ],
    outputs: [],
  },
  {
    name: "faucet",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount",  type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  // Events
  {
    name: "BarPayment",
    type: "event",
    inputs: [
      { name: "customer", type: "address", indexed: true },
      { name: "bar",      type: "address", indexed: true },
      { name: "amount",   type: "uint256", indexed: false },
      { name: "orderId",  type: "string",  indexed: false },
    ],
  },
] as const;

// ── Your bar's wallet address (receives payments) ─────────────────────────────
// Set this to the wallet address where your bar collects TYPTO
export const BAR_WALLET_ADDRESS =
  "0x1E49838114A1dE1C040f78f65BEEcF635a8C954C"; // ← your bar wallet here

// ── Public client (for reading chain data without wallet) ─────────────────────
export const publicClient = createPublicClient({
  chain: polygonAmoy,
  transport: http("https://rpc-amoy.polygon.technology"),
});
