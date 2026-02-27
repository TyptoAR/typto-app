import { useState, useEffect } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { wagmiConfig } from "./wagmi.config";
import {
  useTYPTOBalance,
  usePayBar,
  useFaucet,
  useCorrectNetwork,
  useOrderPaid,
} from "./hooks";

const queryClient = new QueryClient();

// ─── Menu & Mock Data ─────────────────────────────────────────────────────────
const MENU = [
  { id: 1, name: "Neon Margarita",        price: 12, typto: 4.2, emoji: "🍹", complexity: "medium", time: 3 },
  { id: 2, name: "Cyber Whiskey Sour",    price: 14, typto: 4.9, emoji: "🥃", complexity: "easy",   time: 2 },
  { id: 3, name: "Block Chain Mojito",    price: 13, typto: 4.5, emoji: "🌿", complexity: "hard",   time: 5 },
  { id: 4, name: "Hash Rate IPA",         price: 9,  typto: 3.1, emoji: "🍺", complexity: "easy",   time: 1 },
  { id: 5, name: "Proof of Stake Spritz", price: 11, typto: 3.8, emoji: "🥂", complexity: "easy",   time: 2 },
  { id: 6, name: "Wallet Connect Colada", price: 15, typto: 5.2, emoji: "🥥", complexity: "hard",   time: 6 },
];

const MOCK_ORDERS = [
  { id: "typto-order-001", customer: "0xAlice", avatar: "👩‍🦰", items: ["Neon Margarita", "Hash Rate IPA"], total: 7.3, status: "pending", table: 4, vip: true, time: 0 },
  { id: "typto-order-002", customer: "0xBob",   avatar: "👨‍🦱", items: ["Block Chain Mojito"], total: 4.5, status: "making", table: 2, vip: false, time: 2 },
  { id: "typto-order-003", customer: "0xDave",  avatar: "🧔",   items: ["Wallet Connect Colada"], total: 5.2, status: "pending", table: 1, vip: false, time: 1 },
];

const statusColors = {
  pending:  { bg: "rgba(255,180,0,0.12)",   border: "#ffb400", text: "#ffcc44", label: "⏳ PENDING"  },
  making:   { bg: "rgba(0,210,255,0.10)",   border: "#00d2ff", text: "#00d2ff", label: "🔧 MAKING"   },
  paid:     { bg: "rgba(0,255,120,0.10)",   border: "#00ff78", text: "#00ff78", label: "✅ PAID"     },
  ready:    { bg: "rgba(160,0,255,0.12)",   border: "#a000ff", text: "#cc44ff", label: "🚀 READY"    },
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Inter:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .typto-app {
    min-height: 100vh;
    background: #030712;
    color: #e2f4ff;
    font-family: 'Inter', sans-serif;
    position: relative;
  }
  .typto-app::before {
    content: '';
    position: fixed;
    inset: 0;
    background:
      radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0,180,255,0.12) 0%, transparent 70%),
      radial-gradient(ellipse 40% 30% at 90% 80%, rgba(0,80,200,0.08) 0%, transparent 60%);
    pointer-events: none; z-index: 0;
  }
  .grid-bg {
    position: fixed; inset: 0;
    background-image:
      linear-gradient(rgba(0,180,255,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,180,255,0.04) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none; z-index: 0;
  }
  .content { position: relative; z-index: 1; }
  .nav {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 32px;
    border-bottom: 1px solid rgba(0,180,255,0.15);
    background: rgba(3,7,18,0.85);
    backdrop-filter: blur(20px);
    position: sticky; top: 0; z-index: 100;
  }
  .nav-logo {
    font-family: 'Orbitron', monospace; font-weight: 900; font-size: 22px;
    background: linear-gradient(135deg, #00d2ff, #0066ff);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    letter-spacing: 2px;
  }
  .nav-logo span { color: rgba(0,180,255,0.5); font-weight: 400; font-size: 13px; margin-left: 8px; -webkit-text-fill-color: rgba(0,180,255,0.5); }
  .wallet-badge {
    display: flex; align-items: center; gap: 10px;
    background: rgba(0,180,255,0.08); border: 1px solid rgba(0,180,255,0.25);
    border-radius: 100px; padding: 8px 16px; font-size: 13px;
    cursor: pointer; transition: all 0.2s;
  }
  .wallet-badge:hover { background: rgba(0,180,255,0.15); border-color: rgba(0,180,255,0.5); }
  .wallet-dot { width: 8px; height: 8px; border-radius: 50%; }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(1.3)} }
  .pulse-anim { animation: pulse 2s infinite; }
  .role-tabs {
    display: flex; gap: 6px; padding: 0 32px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    background: rgba(3,7,18,0.5);
  }
  .role-tab {
    padding: 14px 22px; font-family: 'Orbitron', monospace;
    font-size: 11px; font-weight: 600; letter-spacing: 1.5px;
    color: rgba(255,255,255,0.35); cursor: pointer;
    border: none; background: none; border-bottom: 2px solid transparent;
    transition: all 0.2s; text-transform: uppercase;
  }
  .role-tab:hover { color: rgba(0,210,255,0.7); }
  .role-tab.active { color: #00d2ff; border-bottom-color: #00d2ff; }
  .panel { padding: 32px; max-width: 1200px; margin: 0 auto; }
  .stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 32px; }
  .stat-card {
    background: rgba(0,180,255,0.05); border: 1px solid rgba(0,180,255,0.15);
    border-radius: 16px; padding: 20px; transition: all 0.2s;
  }
  .stat-card:hover { border-color: rgba(0,180,255,0.35); background: rgba(0,180,255,0.08); transform: translateY(-2px); }
  .stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: rgba(255,255,255,0.4); margin-bottom: 8px; }
  .stat-value { font-family: 'Orbitron', monospace; font-size: 22px; font-weight: 700; color: #00d2ff; }
  .stat-sub { font-size: 12px; color: rgba(255,255,255,0.35); margin-top: 4px; }
  .menu-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
  .menu-card {
    background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
    border-radius: 18px; padding: 24px; cursor: pointer; transition: all 0.25s;
  }
  .menu-card:hover { border-color: rgba(0,180,255,0.4); transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,180,255,0.12); }
  .menu-card.in-cart { border-color: #00d2ff; background: rgba(0,180,255,0.08); }
  .drink-emoji { font-size: 42px; margin-bottom: 12px; display: block; }
  .drink-name { font-weight: 600; font-size: 14px; margin-bottom: 6px; }
  .price-typto { font-family: 'Orbitron', monospace; font-size: 13px; color: #00d2ff; font-weight: 600; }
  .complexity-badge { display: inline-block; font-size: 10px; padding: 2px 8px; border-radius: 100px; text-transform: uppercase; letter-spacing: 1px; margin-top: 8px; }
  .complexity-easy   { background: rgba(0,255,120,0.12); color: #00ff78; border: 1px solid rgba(0,255,120,0.3); }
  .complexity-medium { background: rgba(255,180,0,0.12); color: #ffcc44; border: 1px solid rgba(255,180,0,0.3); }
  .complexity-hard   { background: rgba(255,60,60,0.12);  color: #ff6060; border: 1px solid rgba(255,60,60,0.3); }
  .cart-panel { background: rgba(0,180,255,0.05); border: 1px solid rgba(0,180,255,0.2); border-radius: 20px; padding: 24px; margin-top: 24px; }
  .cart-title { font-family: 'Orbitron', monospace; font-size: 13px; letter-spacing: 2px; color: #00d2ff; margin-bottom: 16px; }
  .cart-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 14px; }
  .btn { padding: 12px 28px; border-radius: 100px; border: none; cursor: pointer; font-family: 'Orbitron', monospace; font-size: 12px; letter-spacing: 1.5px; font-weight: 600; transition: all 0.2s; text-transform: uppercase; }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-primary { background: linear-gradient(135deg, #0066ff, #00d2ff); color: #fff; box-shadow: 0 4px 20px rgba(0,180,255,0.3); }
  .btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,180,255,0.45); }
  .btn-ghost { background: transparent; border: 1px solid rgba(0,180,255,0.3); color: #00d2ff; }
  .btn-ghost:hover:not(:disabled) { background: rgba(0,180,255,0.1); border-color: rgba(0,180,255,0.6); }
  .btn-warning { background: rgba(255,180,0,0.15); border: 1px solid rgba(255,180,0,0.4); color: #ffcc44; }
  .btn-success { background: rgba(0,255,120,0.15); border: 1px solid rgba(0,255,120,0.4); color: #00ff78; }
  .order-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
  .order-card { border-radius: 18px; padding: 20px; position: relative; overflow: hidden; transition: all 0.25s; }
  .order-card:hover { transform: translateY(-3px); }
  .order-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
  .order-id { font-family: 'Orbitron', monospace; font-size: 11px; color: rgba(255,255,255,0.4); }
  .status-chip { font-family: 'Orbitron', monospace; font-size: 10px; padding: 4px 10px; border-radius: 100px; border: 1px solid; letter-spacing: 1px; }
  .customer-info { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
  .customer-avatar { font-size: 28px; }
  .customer-name { font-size: 13px; font-weight: 600; }
  .vip-badge { font-family: 'Orbitron', monospace; font-size: 9px; background: rgba(255,180,0,0.2); border: 1px solid rgba(255,180,0,0.5); color: #ffcc44; padding: 2px 7px; border-radius: 100px; letter-spacing: 1px; margin-top: 4px; }
  .order-items { font-size: 13px; color: rgba(255,255,255,0.6); margin-bottom: 14px; line-height: 1.7; }
  .order-footer { display: flex; justify-content: space-between; align-items: center; }
  .order-total { font-family: 'Orbitron', monospace; font-size: 16px; color: #00d2ff; font-weight: 700; }
  .table-badge { font-size: 11px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; padding: 4px 10px; color: rgba(255,255,255,0.5); }
  .ar-overlay { position: fixed; inset: 0; background: rgba(0,8,20,0.94); z-index: 200; overflow-y: auto; }
  .ar-hud { padding: 0; min-height: 100vh; position: relative; }
  .ar-hud::before {
    content: ''; position: fixed; inset: 0;
    background: radial-gradient(ellipse 100% 60% at 50% 0%, rgba(0,180,255,0.08) 0%, transparent 60%),
      repeating-linear-gradient(0deg, transparent, transparent 59px, rgba(0,180,255,0.04) 59px, rgba(0,180,255,0.04) 60px),
      repeating-linear-gradient(90deg, transparent, transparent 59px, rgba(0,180,255,0.03) 59px, rgba(0,180,255,0.03) 60px);
    pointer-events: none;
  }
  .ar-corner { position: fixed; width: 40px; height: 40px; border-color: rgba(0,210,255,0.5); border-style: solid; border-width: 0; }
  .ar-corner-tl { top: 20px; left: 20px; border-top-width: 2px; border-left-width: 2px; }
  .ar-corner-tr { top: 20px; right: 20px; border-top-width: 2px; border-right-width: 2px; }
  .ar-corner-bl { bottom: 20px; left: 20px; border-bottom-width: 2px; border-left-width: 2px; }
  .ar-corner-br { bottom: 20px; right: 20px; border-bottom-width: 2px; border-right-width: 2px; }
  .ar-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 32px; border-bottom: 1px solid rgba(0,210,255,0.15); position: relative; z-index: 1; }
  .ar-logo { font-family: 'Orbitron', monospace; font-size: 18px; font-weight: 900; color: #00d2ff; letter-spacing: 4px; text-shadow: 0 0 20px rgba(0,210,255,0.6); }
  .ar-status { display: flex; align-items: center; gap: 8px; font-family: 'Orbitron', monospace; font-size: 11px; color: rgba(0,210,255,0.7); letter-spacing: 2px; }
  .ar-live { width: 8px; height: 8px; border-radius: 50%; background: #00ff78; box-shadow: 0 0 12px #00ff78; animation: pulse 1.5s infinite; }
  .ar-orders { padding: 24px 32px; position: relative; z-index: 1; display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
  .ar-order-card { border-radius: 12px; padding: 18px; border: 1px solid; backdrop-filter: blur(10px); position: relative; transition: all 0.2s; }
  .ar-order-card:hover { transform: scale(1.02); }
  .ar-scan-line { position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, #00d2ff, transparent); }
  @keyframes scan { 0%{top:0;opacity:1} 90%{opacity:1} 100%{top:100%;opacity:0} }
  .ar-scan-anim { animation: scan 3s linear infinite; }
  .ar-timer { font-family: 'Orbitron', monospace; font-size: 28px; font-weight: 700; color: #00d2ff; text-shadow: 0 0 15px rgba(0,210,255,0.5); }
  .ar-timer.urgent { color: #ff6060; text-shadow: 0 0 15px rgba(255,60,60,0.6); animation: timerPulse .5s infinite; }
  @keyframes timerPulse { 0%,100%{opacity:1} 50%{opacity:.5} }
  .section-title { font-family: 'Orbitron', monospace; font-size: 13px; letter-spacing: 3px; color: rgba(0,210,255,0.6); text-transform: uppercase; margin-bottom: 20px; display: flex; align-items: center; gap: 12px; }
  .section-title::after { content: ''; flex: 1; height: 1px; background: rgba(0,210,255,0.15); }
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(8px); z-index: 300; display: flex; align-items: center; justify-content: center; padding: 20px; }
  .modal { background: #0a0f1e; border: 1px solid rgba(0,180,255,0.3); border-radius: 24px; padding: 36px; max-width: 440px; width: 100%; box-shadow: 0 0 60px rgba(0,180,255,0.15); }
  .modal-title { font-family: 'Orbitron', monospace; font-size: 16px; font-weight: 700; color: #00d2ff; margin-bottom: 24px; }
  .confirm-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 14px; }
  .confirm-row .label { color: rgba(255,255,255,0.45); }
  .success-state { text-align: center; padding: 20px 0; }
  .success-icon { font-size: 56px; margin-bottom: 16px; display: block; }
  .success-title { font-family: 'Orbitron', monospace; font-size: 18px; font-weight: 700; margin-bottom: 8px; }
  .tx-link { font-family: 'Orbitron', monospace; font-size: 11px; color: #00d2ff; text-decoration: none; }
  .tx-link:hover { text-decoration: underline; }
  .progress-bar { height: 4px; background: rgba(0,180,255,0.15); border-radius: 100px; overflow: hidden; margin: 16px 0; }
  .progress-fill { height: 100%; background: linear-gradient(90deg, #0066ff, #00d2ff); border-radius: 100px; }
  @keyframes fillProgress { from{width:0} to{width:85%} }
  .network-banner { padding: 12px 32px; background: rgba(255,180,0,0.1); border-bottom: 1px solid rgba(255,180,0,0.3); display: flex; align-items: center; justify-content: space-between; font-size: 13px; color: #ffcc44; }
  .alert { padding: 14px 18px; border-radius: 12px; font-size: 13px; margin-bottom: 16px; }
  .alert-error { background: rgba(255,60,60,0.1); border: 1px solid rgba(255,60,60,0.3); color: #ff8080; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-thumb { background: rgba(0,180,255,0.2); border-radius: 100px; }
`;

// ─── Timer ────────────────────────────────────────────────────────────────────
function LiveTimer({ startMinutes }: { startMinutes: number }) {
  const [secs, setSecs] = useState(startMinutes * 60);
  useEffect(() => {
    const i = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(i);
  }, []);
  const m = Math.floor(secs / 60), s = secs % 60;
  const urgent = m >= 5;
  return <div className={`ar-timer${urgent ? " urgent" : ""}`}>{String(m).padStart(2,"0")}:{String(s).padStart(2,"0")}</div>;
}

// ─── Wallet Connect Modal ─────────────────────────────────────────────────────
function WalletModal({ onClose }: { onClose: () => void }) {
  const { connect, connectors, isPending } = useConnect();
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">🔗 CONNECT WALLET</div>
        <p style={{fontSize:13,color:"rgba(255,255,255,0.45)",marginBottom:24,lineHeight:1.7}}>
          Connect a Web3 wallet to pay with TYPTO and interact with the TYPTO AR ecosystem.
        </p>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {connectors.map(connector => (
            <button
              key={connector.id}
              className="btn btn-ghost"
              style={{width:"100%",padding:"14px 20px",fontSize:13}}
              disabled={isPending}
              onClick={() => { connect({ connector }); onClose(); }}
            >
              {connector.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Customer View ────────────────────────────────────────────────────────────
function CustomerView() {
  const { address, isConnected } = useAccount();
  const { balance, refetch: refetchBalance } = useTYPTOBalance();
  const { payBar, isPending, isConfirming, isSuccess, txHash, error } = usePayBar();
  const { claimFaucet, isPending: faucetPending, isSuccess: faucetSuccess, canClaim } = useFaucet();

  const [cart, setCart] = useState<typeof MENU>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderId] = useState(`typto-order-${Date.now()}`);
  const [tableNum] = useState(Math.floor(Math.random() * 12) + 1);
  const isPaid = useOrderPaid(orderId);

  const total = cart.reduce((sum, d) => sum + d.typto, 0);

  const addToCart = (drink: typeof MENU[0]) => {
    setCart(c => c.find(x => x.id === drink.id) ? c.filter(x => x.id !== drink.id) : [...c, drink]);
  };

  const handlePay = async () => {
    try {
      await payBar(total, orderId);
    } catch(e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isSuccess) { refetchBalance(); setTimeout(() => { setShowCheckout(false); setCart([]); }, 4000); }
  }, [isSuccess]);

  return (
    <div className="panel">
      {!isConnected ? (
        <div style={{textAlign:"center",padding:"60px 0"}}>
          <div style={{fontSize:56,marginBottom:16}}>🔗</div>
          <div style={{fontFamily:"'Orbitron',monospace",fontSize:22,background:"linear-gradient(135deg,#0066ff,#00d2ff)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:12}}>Connect Your Wallet</div>
          <p style={{color:"rgba(255,255,255,0.4)",maxWidth:360,margin:"0 auto",fontSize:14}}>Connect MetaMask or any Web3 wallet to start ordering with TYPTO.</p>
        </div>
      ) : (
        <>
          <div className="stat-grid">
            {[
              { label: "TYPTO Balance", value: parseFloat(balance).toFixed(2), sub: `≈ $${(parseFloat(balance)*2.87).toFixed(2)} USD` },
              { label: "Table Number",  value: `#${tableNum}`, sub: "Scan QR to verify" },
              { label: "Cart Items",    value: cart.length.toString(), sub: cart.length ? "Ready to order" : "Browse menu" },
              { label: "Network",       value: "Polygon", sub: "Amoy Testnet" },
            ].map(s => (
              <div className="stat-card" key={s.label}>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-sub">{s.sub}</div>
              </div>
            ))}
          </div>

          <div style={{display:"flex",gap:12,marginBottom:28,flexWrap:"wrap"}}>
            <button
              className={`btn ${canClaim ? "btn-success" : "btn-ghost"}`}
              onClick={() => claimFaucet()}
              disabled={!canClaim || faucetPending}
              style={{fontSize:11}}
            >
              {faucetPending ? "Claiming..." : faucetSuccess ? "✅ Claimed!" : canClaim ? "🚰 Get Free TYPTO (Faucet)" : "⏳ Faucet Cooldown"}
            </button>
          </div>

          <div className="section-title">MENU</div>
          <div className="menu-grid">
            {MENU.map(drink => {
              const inCart = !!cart.find(x => x.id === drink.id);
              return (
                <div key={drink.id} className={`menu-card${inCart ? " in-cart" : ""}`} onClick={() => addToCart(drink)}>
                  <span className="drink-emoji">{drink.emoji}</span>
                  <div className="drink-name">{drink.name}</div>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8}}>
                    <span style={{fontSize:13,color:"rgba(255,255,255,0.4)"}}>${drink.price}</span>
                    <span className="price-typto">⬡ {drink.typto}</span>
                  </div>
                  <span className={`complexity-badge complexity-${drink.complexity}`}>{drink.complexity}</span>
                  <div style={{marginTop:10,fontSize:12,color:inCart?"#00d2ff":"rgba(255,255,255,0.3)"}}>
                    {inCart ? "✓ Added" : `~${drink.time} min`}
                  </div>
                </div>
              );
            })}
          </div>

          {cart.length > 0 && (
            <div className="cart-panel">
              <div className="cart-title">⬡ CART — {cart.length} ITEM{cart.length > 1 ? "S" : ""}</div>
              {cart.map(d => (
                <div className="cart-item" key={d.id}>
                  <span>{d.emoji} {d.name}</span>
                  <span className="price-typto">⬡ {d.typto}</span>
                </div>
              ))}
              <div className="cart-item" style={{borderBottom:"none",marginTop:6}}>
                <span style={{fontWeight:700,fontSize:15}}>TOTAL</span>
                <span style={{fontFamily:"'Orbitron',monospace",color:"#00d2ff",fontSize:18}}>⬡ {total.toFixed(2)}</span>
              </div>
              <div style={{display:"flex",gap:12,marginTop:20}}>
                <button className="btn btn-primary" onClick={() => setShowCheckout(true)}>Pay with TYPTO →</button>
                <button className="btn btn-ghost" onClick={() => setCart([])}>Clear Cart</button>
              </div>
            </div>
          )}
        </>
      )}

      {showCheckout && (
        <div className="modal-overlay" onClick={() => !isPending && !isConfirming && setShowCheckout(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            {isSuccess || isPaid ? (
              <div className="success-state">
                <span className="success-icon">✅</span>
                <div className="success-title" style={{color:"#00ff78"}}>PAYMENT CONFIRMED</div>
                <p style={{color:"rgba(255,255,255,0.5)",fontSize:14,marginBottom:12}}>Your order is live on-chain. The bartender can see it in AR.</p>
                {txHash && (
                  <a className="tx-link" href={`https://amoy.polygonscan.com/tx/${txHash}`} target="_blank" rel="noopener noreferrer">
                    View on Polygonscan →
                  </a>
                )}
              </div>
            ) : (
              <>
                <div className="modal-title">⬡ CONFIRM PAYMENT</div>
                {error && <div className="alert alert-error">{(error as Error).message.slice(0,120)}</div>}
                {cart.map(d => (
                  <div className="confirm-row" key={d.id}>
                    <span className="label">{d.emoji} {d.name}</span>
                    <span style={{fontWeight:600}}>⬡ {d.typto}</span>
                  </div>
                ))}
                <div className="confirm-row">
                  <span className="label">Network fee</span>
                  <span style={{color:"rgba(0,210,255,0.6)"}}>~0.001 MATIC</span>
                </div>
                <div className="confirm-row" style={{borderBottom:"none",marginTop:4}}>
                  <span className="label" style={{fontSize:16,color:"rgba(255,255,255,0.8)"}}>Total</span>
                  <span style={{fontFamily:"'Orbitron',monospace",color:"#00d2ff",fontSize:20}}>⬡ {total.toFixed(2)}</span>
                </div>
                {(isPending || isConfirming) && (
                  <div>
                    <div className="progress-bar"><div className="progress-fill" style={{width:isConfirming?"85%":"40%",transition:"width 1s"}} /></div>
                    <p style={{fontSize:12,color:"rgba(0,210,255,0.6)",textAlign:"center",fontFamily:"'Orbitron',monospace",letterSpacing:2}}>
                      {isPending ? "CONFIRM IN WALLET..." : "BROADCASTING TX..."}
                    </p>
                  </div>
                )}
                <div style={{display:"flex",gap:12,marginTop:24}}>
                  <button className="btn btn-primary" onClick={handlePay} disabled={isPending||isConfirming} style={{flex:1}}>
                    {isPending ? "Confirm in Wallet..." : isConfirming ? "Confirming..." : "Confirm & Pay →"}
                  </button>
                  {!isPending && !isConfirming && <button className="btn btn-ghost" onClick={() => setShowCheckout(false)}>Cancel</button>}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Bartender View ───────────────────────────────────────────────────────────
function BartenderView({ arMode, setArMode }: { arMode: boolean; setArMode: (v: boolean) => void }) {
  const [orders, setOrders] = useState(MOCK_ORDERS);

  const updateStatus = (id: string, status: string) => {
    setOrders(o => o.map(ord => ord.id === id ? { ...ord, status } : ord));
  };

  const nextStatus: Record<string, string> = { pending: "making", making: "ready", ready: "paid" };
  const nextLabel: Record<string, string>  = { pending: "Start Making", making: "Mark Ready", ready: "Confirm Pickup" };

  const activeOrders = orders.filter(o => o.status !== "paid");

  const Inner = () => (
    <>
      {!arMode && (
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:28}}>
          <div className="section-title" style={{marginBottom:0}}>ACTIVE ORDERS</div>
          <button className="btn btn-primary" onClick={() => setArMode(true)}>🥽 Enter AR Mode</button>
        </div>
      )}
      <div className={arMode ? "ar-orders" : "order-grid"}>
        {activeOrders.map(order => {
          const sc = statusColors[order.status as keyof typeof statusColors];
          return (
            <div key={order.id} className={arMode ? "ar-order-card" : "order-card"} style={{background:sc.bg,border:`1px solid ${sc.border}`}}>
              {arMode && <div className="ar-scan-line ar-scan-anim" />}
              <div className="order-header">
                <div>
                  <div className="order-id">{order.id}</div>
                  <div className="table-badge" style={{marginTop:4}}>TABLE {order.table}</div>
                </div>
                <div>
                  <span className="status-chip" style={{color:sc.text,borderColor:sc.border}}>{sc.label}</span>
                  {order.vip && <div className="vip-badge">⭐ VIP</div>}
                </div>
              </div>
              <div className="customer-info">
                <span className="customer-avatar">{order.avatar}</span>
                <div>
                  <div className="customer-name">{order.customer}</div>
                  <div style={{fontSize:11,color:"rgba(0,210,255,0.5)",fontFamily:"'Orbitron',monospace"}}>{order.customer}</div>
                </div>
                {arMode && <div style={{marginLeft:"auto"}}><LiveTimer startMinutes={order.time} /></div>}
              </div>
              <div className="order-items">{order.items.map((item, i) => <div key={i}>→ {item}</div>)}</div>
              <div className="order-footer">
                <div className="order-total">⬡ {order.total}</div>
                {nextStatus[order.status] && (
                  <button className="btn btn-ghost" style={{padding:"8px 16px",fontSize:11,borderColor:sc.border,color:sc.text}} onClick={() => updateStatus(order.id, nextStatus[order.status])}>
                    {nextLabel[order.status]} →
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );

  if (arMode) {
    return (
      <div className="ar-overlay">
        <div className="ar-hud">
          <div className="ar-corner ar-corner-tl" />
          <div className="ar-corner ar-corner-tr" />
          <div className="ar-corner ar-corner-bl" />
          <div className="ar-corner ar-corner-br" />
          <div className="ar-header">
            <div className="ar-logo">TYPTO AR</div>
            <div className="ar-status"><div className="ar-live" />XREAL AIR 2 · LIVE</div>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <div style={{fontFamily:"'Orbitron',monospace",fontSize:11,color:"rgba(0,210,255,0.6)"}}>{activeOrders.length} ACTIVE</div>
              <button className="btn btn-ghost" style={{padding:"8px 16px",fontSize:11}} onClick={() => setArMode(false)}>Exit AR</button>
            </div>
          </div>
          <Inner />
        </div>
      </div>
    );
  }

  return <div className="panel"><Inner /></div>;
}

// ─── Admin View ───────────────────────────────────────────────────────────────
function AdminView() {
  return (
    <div className="panel">
      <div className="stat-grid">
        {[
          { label: "Revenue Today", value: "⬡ 847", sub: "≈ $2,431 USD" },
          { label: "Orders Served", value: "312",   sub: "+18% vs yesterday" },
          { label: "Contract",      value: "Amoy",  sub: "Polygon Testnet" },
          { label: "TYPTO Price",   value: "$2.87",  sub: "Per TYPTO token" },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>
      <div className="section-title">TYPTO CONTRACT</div>
      <div style={{background:"rgba(0,0,0,0.3)",borderRadius:12,padding:18,fontFamily:"'Orbitron',monospace",fontSize:11,color:"rgba(0,210,255,0.5)",lineHeight:2}}>
        <div>Paste your deployed contract address here after running the deploy script</div>
        <div style={{color:"rgba(255,255,255,0.2)"}}>ERC-20 · Polygon Amoy · 18 decimals · 100M max supply</div>
      </div>
    </div>
  );
}

// ─── Main App (needs Wagmi Provider) ─────────────────────────────────────────
function AppInner() {
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const { isCorrectNetwork, switchToAmoy } = useCorrectNetwork();
  const { balance } = useTYPTOBalance();

  const [role, setRole] = useState<"customer"|"bartender"|"admin">("customer");
  const [arMode, setArMode] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);

  const shortAddr = address ? `${address.slice(0,6)}...${address.slice(-4)}` : "";

  return (
    <>
      <style>{css}</style>
      <div className="typto-app">
        <div className="grid-bg" />
        <div className="content">
          {/* Wrong network banner */}
          {isConnected && !isCorrectNetwork && (
            <div className="network-banner">
              <span>⚠️ Wrong network — please switch to Polygon Amoy Testnet</span>
              <button className="btn btn-warning" style={{padding:"8px 18px",fontSize:11}} onClick={switchToAmoy}>
                Switch Network
              </button>
            </div>
          )}

          <nav className="nav">
            <div className="nav-logo">TYPTO<span>AR</span></div>
            <div style={{display:"flex",gap:12,alignItems:"center"}}>
              {isConnected && (
                <div style={{fontFamily:"'Orbitron',monospace",fontSize:11,color:"rgba(0,210,255,0.6)"}}>
                  ⬡ {parseFloat(balance).toFixed(2)} TYPTO
                </div>
              )}
              <button className="wallet-badge" onClick={() => isConnected ? disconnect() : setShowWalletModal(true)}>
                <div className="wallet-dot pulse-anim" style={{background:isConnected?"#00ff78":"#ff6060",boxShadow:`0 0 8px ${isConnected?"#00ff78":"#ff6060"}`}} />
                <span style={{fontFamily:"'Orbitron',monospace",fontSize:11,color:"rgba(255,255,255,0.7)"}}>
                  {isConnected ? shortAddr : "Connect Wallet"}
                </span>
              </button>
            </div>
          </nav>

          {!arMode && (
            <div className="role-tabs">
              {[{id:"customer",label:"Customer",icon:"👤"},{id:"bartender",label:"Bartender",icon:"🍸"},{id:"admin",label:"Admin",icon:"⚡"}].map(r => (
                <button key={r.id} className={`role-tab${role===r.id?" active":""}`} onClick={() => setRole(r.id as any)}>
                  {r.icon} {r.label}
                </button>
              ))}
            </div>
          )}

          {role === "customer" ? <CustomerView /> :
           role === "bartender" ? <BartenderView arMode={arMode} setArMode={setArMode} /> :
           <AdminView />}
        </div>
        {showWalletModal && <WalletModal onClose={() => setShowWalletModal(false)} />}
      </div>
    </>
  );
}

// ─── Root: wrap with providers ────────────────────────────────────────────────
export default function TYPTOAppWeb3() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AppInner />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
