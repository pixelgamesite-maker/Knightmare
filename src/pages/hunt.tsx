import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayer } from "@/hooks/usePlayer";
import { useInventory } from "@/hooks/useInventory";
import { supabase } from "@/lib/supabase";
import { FRAGMENTS, CDN } from "@/lib/fragments";
import TopBar from "@/components/layout/TopBar";

export default function Hunt() {
  const { player, invalidate: refreshPlayer } = usePlayer();
  const { invalidate: refreshInv } = useInventory();
  const [loot, setLoot] = useState<any>(null);
  const [opening, setOpening] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const openChest = async () => {
    if ((player?.gold || 0) < 500) return;
    setOpening(true);
    const { data } = await supabase.rpc("open_chest");
    setOpening(false);
    if (data?.success) {
      setLoot(data);
      refreshPlayer(); refreshInv();
      setTimeout(() => setLoot(null), 3500);
    }
  };

  const claimGold = async () => {
    setClaiming(true);
    const { data } = await supabase.rpc("claim_gold");
    setClaiming(false);
    if (data?.success) refreshPlayer();
    else alert(data?.error || "Cooldown");
  };

  const canClaim = !player?.last_gold_claim ||
    new Date(player.last_gold_claim).getTime() + 2 * 60 * 60 * 1000 < Date.now();

  const msLeft = player?.last_gold_claim
    ? Math.max(0, new Date(player.last_gold_claim).getTime() + 7200000 - Date.now())
    : 0;
  const fmt = (ms: number) => {
    const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m}m`;
  };

  return (
    <div className="min-h-[100dvh] bg-[#04020c] text-white relative overflow-hidden">
      <TopBar />
      <div className="absolute inset-0 pointer-events-none z-10 opacity-30"
        style={{ background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(168,85,247,0.03) 2px,rgba(168,85,247,0.03) 4px)" }} />
      <div className="absolute inset-0 pointer-events-none z-10"
        style={{ background: "radial-gradient(ellipse 100% 100% at 50% 50%,transparent 40%,rgba(4,2,12,0.9) 100%)" }} />

      <div className="pt-24 pb-10 px-4 flex flex-col items-center justify-center min-h-[100dvh] relative z-20">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
          <p className="font-['Press_Start_2P'] text-[10px] text-[#6b5a80] mb-2">CHEST COST</p>
          <p className="font-['Press_Start_2P'] text-[14px] text-amber-400" style={{ textShadow: "0 0 15px rgba(251,191,36,0.4)" }}>
            500 GOLD
          </p>
        </motion.div>

        {/* Chest */}
        <motion.div
          animate={opening ? { scale: [1,1.08,0.95,1.05,1], rotate: [0,-3,3,-2,0] } : {}}
          transition={{ repeat: opening ? Infinity : 0, duration: 0.8 }}
          className="relative w-56 h-56 mb-10 cursor-pointer"
          onClick={!opening ? openChest : undefined}>
          <div className="absolute inset-0 bg-purple-600/20 blur-3xl rounded-full" />
          <img
            src={opening ? `${CDN}/chest-open.png` : `${CDN}/chest-close.png`}
            alt="chest"
            className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_30px_rgba(168,85,247,0.5)]"
          />
        </motion.div>

        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          onClick={openChest} disabled={opening || (player?.gold || 0) < 500}
          className="relative font-['Press_Start_2P'] text-[10px] px-10 py-4 bg-[#7c3aed] text-white rounded disabled:opacity-30 disabled:cursor-not-allowed border-2 border-[#a855f7] tracking-wider"
          style={{ boxShadow: "0 0 20px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.1)" }}>
          {opening ? "OPENING..." : "OPEN CRATE"}
          <div className="absolute -top-1 -left-1 w-1.5 h-1.5 bg-[#22d3ee]" />
          <div className="absolute -bottom-1 -right-1 w-1.5 h-1.5 bg-[#22d3ee]" />
        </motion.button>

        <div className="mt-6 text-center">
          <motion.button whileHover={{ scale: canClaim ? 1.05 : 1 }} whileTap={{ scale: canClaim ? 0.95 : 1 }}
            onClick={claimGold} disabled={!canClaim || claiming}
            className={`font-['Press_Start_2P'] text-[8px] px-6 py-2 rounded border-2 tracking-wider transition-all ${
              canClaim ? "bg-amber-500/20 border-amber-500/50 text-amber-400 hover:bg-amber-500/30" :
              "bg-[#0d0420] border-[#1a0a2e] text-[#2d1a4e] cursor-not-allowed"}`}>
            {claiming ? "..." : canClaim ? "CLAIM GOLD (100-200)" : `CLAIM IN ${fmt(msLeft)}`}
          </motion.button>
        </div>

        <div className="mt-8 flex gap-6 text-center">
          <div><p className="font-['Press_Start_2P'] text-[8px] text-[#6b5a80]">OPENED</p><p className="text-[10px] text-cyan-400 mt-1">{player?.total_chests_opened||0}</p></div>
          <div><p className="font-['Press_Start_2P'] text-[8px] text-[#6b5a80]">GTD</p><p className="text-[10px] text-purple-400 mt-1">{player?.forged_gtd?"YES":"NO"}</p></div>
          <div><p className="font-['Press_Start_2P'] text-[8px] text-[#6b5a80]">FCFS</p><p className="text-[10px] text-purple-400 mt-1">{player?.forged_fcfs?"YES":"NO"}</p></div>
        </div>
      </div>

      <AnimatePresence>
        {loot && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
            <motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, rotate: 10 }}
              transition={{ type: "spring", damping: 15 }}
              className="bg-[#0a0614] border-2 border-[#7c3aed] p-8 rounded text-center relative max-w-xs w-full mx-4"
              style={{ boxShadow: "0 0 40px rgba(124,58,237,0.3)" }}>
              <div className="absolute -top-1 -left-1 w-2 h-2 bg-[#22d3ee]" />
              <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#22d3ee]" />
              {loot.type === "fragment" && (
                <>
                  <motion.img initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                    src={`${CDN}/${FRAGMENTS[loot.fragment].file}`} className="w-20 h-20 mx-auto mb-4 object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.6)]" alt="" />
                  <p className="font-['Press_Start_2P'] text-[10px] text-cyan-400 mb-2">FRAGMENT FOUND!</p>
                  <p className="font-['VT323'] text-xl text-[#c4b5d4]">{FRAGMENTS[loot.fragment].name}</p>
                </>
              )}
              {loot.type === "gold" && (
                <>
                  <p className="font-['Press_Start_2P'] text-[24px] text-amber-400 mb-2" style={{ textShadow: "0 0 20px rgba(251,191,36,0.5)" }}>+{loot.amount}</p>
                  <p className="font-['Press_Start_2P'] text-[10px] text-amber-400/70">GOLD!</p>
                </>
              )}
              {loot.type === "empty" && (
                <>
                  <p className="font-['Press_Start_2P'] text-[10px] text-[#6b5a80] mb-2">EMPTY CRATE</p>
                  <p className="font-['VT323'] text-lg text-[#2d1a4e]">Nothing but dust...</p>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
