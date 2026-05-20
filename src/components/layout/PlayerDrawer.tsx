import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { usePlayer } from "@/hooks/usePlayer";
import { useInventory } from "@/hooks/useInventory";
import { supabase } from "@/lib/supabase";
import { FRAGMENTS, CDN } from "@/lib/fragments";

const EMBER_ICON = `${CDN}/ember.png`;

export default function PlayerDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { player, invalidate: refreshPlayer } = usePlayer();
  const { inventory } = useInventory();
  const [, navigate] = useLocation();
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const fragCount = Object.values(inventory).reduce((a, b) => a + (b || 0), 0);

  const applyRef = async () => {
    setMsg(null);
    if (!code.trim()) return;
    const { data } = await supabase.rpc("apply_referral", { p_code: code.trim() });
    if (!data?.success) { setMsg(data?.error || "Failed"); return; }
    setMsg(`+${data.bonus} EMBER!`);
    refreshPlayer();
  };

  const go = (path: string) => { navigate(path); onClose(); };

  const referralLink = typeof window !== "undefined" 
    ? `${window.location.origin}/?ref=${player?.referral_code}` 
    : `/?ref=${player?.referral_code}`;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 bg-black/80 z-40 backdrop-blur-sm" />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-80 max-w-[85vw] bg-[#0a0614] border-l-2 border-[#7c3aed] z-50 overflow-y-auto"
            style={{ boxShadow: "-10px 0 40px rgba(124,58,237,0.2)" }}>
            
            <div className="absolute top-0 left-0 w-2 h-2 bg-[#22d3ee]" />
            <div className="absolute bottom-0 left-0 w-2 h-2 bg-[#22d3ee]" />

            {/* Profile */}
            <div className="p-5 border-b-2 border-[#1a0a2e]">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded border-2 border-[#7c3aed] overflow-hidden bg-[#0d0420]">
                  <img src={player?.avatar_url || "/default-avatar.png"} className="w-full h-full object-cover" alt="" />
                </div>
                <div>
                  <p className="font-['Press_Start_2P'] text-[9px] text-[#a855f7]" style={{ textShadow: "0 0 8px rgba(168,85,247,0.6)" }}>
                    {player?.display_name || player?.username || "HUNTER"}
                  </p>
                  <p className="text-[10px] text-[#6b5a80] mt-1 font-mono">@{player?.username || "unknown"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-[#0d0420] rounded border-2 border-[#2d1a4e] p-2 text-center relative">
                  <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-[#22d3ee]" />
                  <div className="flex items-center justify-center gap-1">
                    <img src={EMBER_ICON} alt="" className="w-3 h-3 object-contain" />
                    <p className="font-['Press_Start_2P'] text-[9px] text-amber-400">{player?.gold || 0}</p>
                  </div>
                  <p className="text-[7px] text-[#6b5a80] mt-1 tracking-wider">EMBER</p>
                </div>
                <div className="bg-[#0d0420] rounded border-2 border-[#2d1a4e] p-2 text-center relative">
                  <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-[#22d3ee]" />
                  <p className="font-['Press_Start_2P'] text-[9px] text-cyan-400">{fragCount}</p>
                  <p className="text-[7px] text-[#6b5a80] mt-1 tracking-wider">FRAGMENTS</p>
                </div>
              </div>
            </div>

            {/* Inventory */}
            <div className="p-4 border-b-2 border-[#1a0a2e]">
              <p className="font-['Press_Start_2P'] text-[8px] text-[#a855f7] mb-3 tracking-widest">// INVENTORY //</p>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(FRAGMENTS).map(([key, meta]) => (
                  <div key={key} className="bg-[#0d0420] rounded border border-[#2d1a4e] p-2 text-center">
                    <img src={`${CDN}/${meta.file}`} className="w-8 h-8 mx-auto object-contain opacity-80" alt="" />
                    <p className="text-[7px] text-[#6b5a80] mt-1 truncate">{meta.name}</p>
                    <p className={`text-[9px] font-['Press_Start_2P'] mt-0.5 ${(inventory[key]||0)>0?"text-cyan-400":"text-[#2d1a4e]"}`}>
                      {inventory[key] || 0}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Referral */}
            <div className="p-4 border-b-2 border-[#1a0a2e]">
              <p className="font-['Press_Start_2P'] text-[8px] text-[#a855f7] mb-2 tracking-widest">// REFERRAL //</p>
              
              <div className="bg-[#0d0420] rounded border border-[#2d1a4e] p-2 mb-3 relative">
                <div className="absolute -top-1 -left-1 w-1.5 h-1.5 bg-[#a855f7]" />
                <p className="text-[8px] text-cyan-400 font-mono break-all leading-tight">
                  {referralLink}
                </p>
                <p className="text-[7px] text-[#6b5a80] mt-0.5">YOUR LINK</p>
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(referralLink);
                  setMsg("Link copied!");
                  setTimeout(() => setMsg(null), 2000);
                }}
                className="w-full py-2 bg-[#7c3aed] border-2 border-[#a855f7] rounded font-['Press_Start_2P'] text-[8px] text-white hover:bg-[#9333ea] mb-3">
                COPY LINK
              </button>

              {!player?.referred_by && (
                <div className="flex gap-2">
                  <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="ENTER CODE"
                    className="flex-1 bg-[#0d0420] border border-[#2d1a4e] rounded px-2 py-1.5 text-[9px] text-white outline-none focus:border-[#7c3aed] font-mono uppercase placeholder:text-[#2d1a4e]" />
                  <button onClick={applyRef}
                    className="bg-[#7c3aed] text-white text-[7px] px-3 rounded font-['Press_Start_2P'] hover:bg-[#9333ea] border border-[#a855f7]">
                    USE
                  </button>
                </div>
              )}
              {msg && <p className={`text-[8px] mt-2 font-['Press_Start_2P'] ${msg.includes("copied") || msg.includes("+") ? "text-amber-400" : "text-red-400"}`}>{msg}</p>}
            </div>

            {/* Nav */}
            <div className="p-4 space-y-2">
              <DrawerBtn onClick={() => go("/hunt")}>⚔ HUNT</DrawerBtn>
              <DrawerBtn onClick={() => go("/forge")}>⚒ FORGE</DrawerBtn>
              <DrawerBtn onClick={() => go("/trades")}>⇄ TRADES</DrawerBtn>
              <DrawerBtn onClick={() => go("/social")}>★ TASKS</DrawerBtn>
              <DrawerBtn onClick={() => go("/gallery")}>👁 GALLERY</DrawerBtn>
              <DrawerBtn onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }}
             className="text-red-400/70 hover:text-red-400 border-red-900/30 hover:border-red-900/50">
           ✕ SIGN OUT
            </DrawerBtn>
           </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function DrawerBtn({ children, onClick, className = "" }: any) {
  return (
    <button onClick={onClick}
      className={`w-full text-left py-3 px-4 rounded bg-[#0d0420] border border-[#2d1a4e] text-[9px] font-['Press_Start_2P'] tracking-wider hover:bg-[#160830] hover:border-[#7c3aed] transition-all text-[#c4b5d4] ${className}`}>
      {children}
    </button>
  );
}
