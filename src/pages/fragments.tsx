import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayer } from "@/hooks/usePlayer";
import { useInventory } from "@/hooks/useInventory";
import { supabase } from "@/lib/supabase";
import PlayerDrawer from "@/components/layout/PlayerDrawer";

export default function Hunt() {
  const { player, mutate } = usePlayer();
  const { mutate: invMutate } = useInventory();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loot, setLoot] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const openChest = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("open_chest");
    setLoading(false);
    if (data?.success) {
      setLoot(data);
      mutate();
      invMutate();
      setTimeout(() => setLoot(null), 3000);
    }
  };

  const claimGold = async () => {
    const { data } = await supabase.rpc("claim_gold");
    if (data?.success) mutate();
    else alert(data?.error || "Cooldown active");
  };

  const canClaim = !player?.last_gold_claim || 
    new Date(player.last_gold_claim).getTime() + 2 * 60 * 60 * 1000 < Date.now();

  return (
    <div className="min-h-[100dvh] bg-[#04020c] text-white relative overflow-hidden">
      {/* Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 bg-[#04020c]/90 backdrop-blur border-b border-purple-900/20">
        <h1 className="font-['Press_Start_2P'] text-[10px] text-purple-400">KNIGHTMARE</h1>
        <button onClick={() => setDrawerOpen(true)} className="flex items-center gap-2">
          <span className="text-amber-400 text-[10px] font-['Press_Start_2P']">{player?.gold || 0}G</span>
          <img src={player?.avatar_url} className="w-8 h-8 rounded border border-purple-600" alt="me" />
        </button>
      </div>

      {/* Main Content */}
      <div className="pt-20 pb-10 px-4 flex flex-col items-center justify-center min-h-[100dvh]">
        {/* Chest */}
        <motion.div
          animate={loading ? { scale: [1, 1.05, 1], rotate: [0, -2, 2, 0] } : {}}
          transition={{ repeat: loading ? Infinity : 0, duration: 0.5 }}
          className="relative w-48 h-48 mb-8"
        >
          <img src={`${CDN}/chest.png`} alt="chest" className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(168,85,247,0.4)]" />
        </motion.div>

        {/* Open Button */}
        <button
          onClick={openChest}
          disabled={loading || (player?.gold || 0) < 500}
          className="font-['Press_Start_2P'] text-[10px] px-8 py-4 bg-purple-700 text-white rounded border-2 border-purple-500 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ boxShadow: "0 0 20px rgba(124,58,237,0.4)" }}
        >
          {loading ? "OPENING..." : `OPEN CRATE (500G)`}
        </button>

        {/* Gold Claim */}
        <button
          onClick={claimGold}
          disabled={!canClaim}
          className="mt-4 text-[8px] text-gray-400 font-['Press_Start_2P'] disabled:text-gray-700"
        >
          {canClaim ? "CLAIM GOLD" : "CLAIM IN 2H"}
        </button>

        {/* Loot Popup */}
        <AnimatePresence>
          {loot && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
            >
              <div className="bg-[#0a0614] border-2 border-purple-600 p-8 rounded text-center">
                {loot.type === "fragment" && (
                  <>
                    <img src={`${CDN}/${loot.fragment}.png`} className="w-16 h-16 mx-auto mb-4" alt="" />
                    <p className="font-['Press_Start_2P'] text-[10px] text-cyan-400">
                      {FRAGMENT_NAMES[loot.fragment]} FOUND!
                    </p>
                  </>
                )}
                {loot.type === "gold" && (
                  <p className="font-['Press_Start_2P'] text-[12px] text-amber-400">
                    +{loot.amount} GOLD!
                  </p>
                )}
                {loot.type === "empty" && (
                  <p className="font-['Press_Start_2P'] text-[10px] text-gray-500">
                    EMPTY CRATE...
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <PlayerDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}

const FRAGMENT_NAMES: Record<string, string> = {
  sword: "Sword", helm: "Helm", plate: "Armor",
  gloves: "Gloves", boots: "Boots",
  doom_potion: "Doom Potion",
  book_of_reincarnation: "Book of Reincarnation",
  heart_of_fire: "Heart of Fire",
};
