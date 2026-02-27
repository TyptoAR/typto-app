import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId, useSwitchChain } from "wagmi";
import { parseEther, formatEther } from "viem";
import { polygonAmoy } from "wagmi/chains";
import { TYPTO_ABI, TYPTO_CONTRACT_ADDRESS, BAR_WALLET_ADDRESS } from "./wagmi.config";

// ── Read TYPTO balance ─────────────────────────────────────────────────────────
export function useTYPTOBalance() {
  const { address } = useAccount();

  const { data, isLoading, refetch } = useReadContract({
    address: TYPTO_CONTRACT_ADDRESS,
    abi: TYPTO_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  return {
    balance: data ? formatEther(data) : "0",
    balanceRaw: data ?? 0n,
    isLoading,
    refetch,
  };
}

// ── Check if order has been paid on-chain ─────────────────────────────────────
export function useOrderPaid(orderId: string) {
  const { data } = useReadContract({
    address: TYPTO_CONTRACT_ADDRESS,
    abi: TYPTO_ABI,
    functionName: "isOrderPaid",
    args: [orderId],
    query: { enabled: !!orderId },
  });
  return data ?? false;
}

// ── Pay bar with TYPTO ────────────────────────────────────────────────────────
export function usePayBar() {
  const { writeContractAsync, isPending, data: txHash, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const payBar = async (amountTYPTO: number, orderId: string) => {
    const amountWei = parseEther(amountTYPTO.toFixed(18));
    const hash = await writeContractAsync({
      address: TYPTO_CONTRACT_ADDRESS,
      abi: TYPTO_ABI,
      functionName: "payBar",
      args: [BAR_WALLET_ADDRESS as `0x${string}`, amountWei, orderId],
    });
    return hash;
  };

  return {
    payBar,
    isPending,         // waiting for user to sign in MetaMask
    isConfirming,      // tx submitted, waiting for block confirmation
    isSuccess,         // tx confirmed on-chain ✅
    txHash,
    error,
  };
}

// ── Claim free TYPTO from faucet (testnet) ────────────────────────────────────
export function useFaucet() {
  const { writeContractAsync, isPending, data: txHash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const { address } = useAccount();
  const { data: lastClaim } = useReadContract({
    address: TYPTO_CONTRACT_ADDRESS,
    abi: TYPTO_ABI,
    functionName: "lastFaucetClaim",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const nextClaim = lastClaim
    ? new Date((Number(lastClaim) + 86400) * 1000)
    : new Date(0);
  const canClaim = new Date() > nextClaim;

  const claimFaucet = async () => {
    return writeContractAsync({
      address: TYPTO_CONTRACT_ADDRESS,
      abi: TYPTO_ABI,
      functionName: "faucet",
      args: [],
    });
  };

  return { claimFaucet, isPending, isConfirming, isSuccess, canClaim, nextClaim, txHash };
}

// ── Ensure user is on Polygon Amoy ────────────────────────────────────────────
export function useCorrectNetwork() {
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const isCorrectNetwork = chainId === polygonAmoy.id;

  const switchToAmoy = () => switchChain({ chainId: polygonAmoy.id });

  return { isCorrectNetwork, switchToAmoy, chainId };
}
