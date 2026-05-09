// components/layout/PlayerDrawer.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayer } from "@/hooks/usePlayer";
import { useInventory } from "@/hooks/useInventory";
import { supabase } from "@/lib/supabase";
import { useLocation } from "wouter";

const FRAGMENT_NAMES: Record<string, string> = {
  sword: "Sword", helm: "Helm", plate: "Armor",
  gloves: "Gloves", boots: "Boots",
  doom_potion: "Doom Potion",
  book_of_reincarnation: "Book of Reincarnation",
  heart_of_fire: "Heart of Fire",
};

export default function PlayerDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { player, mutate } = usePlayer();
  const { inventory } = useInventory();
  const [, navigate] = useLocation();
  const [referralInput, setReferralInput] = useState("");
  const [referralMsg, setReferralMsg] = useState("");

  const applyRef = async () => {
    const { data, error } = await supabase.rpc("apply_referral", { p_code: referralInput.trim() });
    if (error || !data?.success) {
      setReferralMsg(data?.error || "Failed");
    } else {
      setReferralMsg(`+${data.bonus} gold!`);
      mutate();
    }
  };

  const fragCount = Object.values(inventory).reduce((a, b) => a + (b || 0), 0);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-40"
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-80 max-w-[85vw] bg-[#0a0614] border-l border-purple-900/40 z-50 overflow-y-auto"
            style={{ boxShadow: "-10px 0 40px rgba(124,58,237,0.15)" }}
          >
            {/* Profile Header */}
            <div className="p-6 border-b border-purple-900/30">
              <div className="flex items-center gap-3">
                <img
                  src={player?.avatar_url || "/default-avatar.png"}
                  className="w-12 h-12 rounded-lg border-2 border-purple-600"
                  alt="avatar"
                />
                <div>
                  <p className="font-['Press_Start_2P'] text-[10px] text-purple-400">
                    {player?.display_name || player?.username || "HUNTER"}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    @{player?.username || "unknown"}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-purple-900/20 rounded p-2 text-center border border-purple-800/30">
                  <p className="font-['Press_Start_2P'] text-[8px] text-amber-400">{player?.gold || 0}</p>
                  <p className="text-[8px] text-gray-500 mt-1">GOLD</p>
                </div>
                <div className="bg-purple-900/20 rounded p-2 text-center border border-purple-800/30">
                  <p className="font-['Press_Start_2P'] text-[8px] text-cyan-400">{fragCount}</p>
                  <p className="text-[8px] text-gray-500 mt-1">FRAGMENTS</p>
                </div>
              </div>
            </div>

            {/* Inventory */}
            <div className="p-4 border-b border-purple-900/30">
              <p className="font-['Press_Start_2P'] text-[8px] text-purple-400 mb-3 tracking-wider">INVENTORY</p>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(FRAGMENT_NAMES).map(([key, name]) => (
                  <div key={key} className="bg-black/40 rounded p-2 text-center border border-purple-900/20">
                    <img src={`${CDN}/${key}.png`} className="w-8 h-8 mx-auto opacity-80" alt={name} />
                    <p className="text-[8px] text-gray-400 mt-1">{inventory[key] || 0}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Referral */}
            <div className="p-4 border-b border-purple-900/30">
              <p className="font-['Press_Start_2P'] text-[8px] text-purple-400 mb-2">REFERRAL</p>
              <div className="bg-black/40 rounded p-2 border border-purple-900/20 mb-3">
                <p className="text-[10px] text-cyan-400 font-mono">{player?.referral_code}</p>
                <p className="text-[8px] text-gray-500">Your code</p>
              </div>
              {!player?.referred_by && (
                <div className="flex gap-2">
                  <input
                    value={referralInput}
                    onChange={e => setReferralInput(e.target.value)}
                    placeholder="Enter code"
                    className="flex-1 bg-black/40 border border-purple-900/30 rounded px-2 py-1 text-[10px] text-white outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={applyRef}
                    className="bg-purple-700 text-white text-[8px] px-3 rounded font-['Press_Start_2P']"
                  >
                    USE
                  </button>
                </div>
              )}
              {referralMsg && <p className="text-[8px] mt-2 text-amber-400">{referralMsg}</p>}
            </div>

            {/* Navigation */}
            <div className="p-4 space-y-2">
              <DrawerBtn onClick={() => { navigate("/forge"); onClose(); }}>⚒ FORGE</DrawerBtn>
              <DrawerBtn onClick={() => { navigate("/trades"); onClose(); }}>⇄ TRADES</DrawerBtn>
              <DrawerBtn onClick={() => { navigate("/leaderboard"); onClose(); }}>🏆 LEADERBOARD</DrawerBtn>
              <DrawerBtn onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }} className="text-red-400">
                SIGN OUT
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
    <button
      onClick={onClick}
      className={`w-full text-left py-3 px-4 rounded bg-purple-900/10 border border-purple-900/20 text-[10px] font-['Press_Start_2P'] tracking-wider hover:bg-purple-900/20 transition-colors ${className}`}
    >
      {children}
    </button>
  );
}
