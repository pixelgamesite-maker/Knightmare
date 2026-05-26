import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { usePlayer } from "@/hooks/usePlayer";
import { supabase } from "@/lib/supabase";
import TopBar from "@/components/layout/TopBar";

const EMBER_ICON = `https://psibadkdncspgikzzmnu.supabase.co/storage/v1/object/public/Fragments/ember.png`;

export default function Hunt() {
  const { player, invalidate: refreshPlayer } = usePlayer();
  const [claiming, setClaiming] = useState(false);
  const [msLeft, setMsLeft] = useState(0);

  const emberBalance = (player as any)?.ember ?? 0;

  // ── 4-hour cooldown using last_ember_claim ────────────────────────────────
  const FOUR_HOURS = 4 * 60 * 60 * 1000;
  const lastClaim = (player as any)?.last_ember_claim;
  const canClaim =
    !lastClaim ||
    new Date(lastClaim).getTime() + FOUR_HOURS < Date.now();

  useEffect(() => {
    if (canClaim) { setMsLeft(0); return; }
    const tick = () => {
      const left = Math.max(
        0,
        new Date(lastClaim).getTime() + FOUR_HOURS - Date.now()
      );
      setMsLeft(left);
      if (left === 0) refreshPlayer();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lastClaim, canClaim]);

  const fmt = (ms: number) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${h}h ${m}m ${s}s`;
  };

  // ── Claim ember ────────────────────────────────────────────────────────────
  const claimEmber = async () => {
    if (!canClaim) return;
    setClaiming(true);
    const { data } = await supabase.rpc("claim_ember");
    setClaiming(false);
    if (data?.success) refreshPlayer();
    else alert(data?.error || "Cooldown active");
  };

  return (
    <div className="min-h-[100dvh] bg-[#04020c] text-white relative overflow-hidden">
      <TopBar />
      <div
        className="absolute inset-0 pointer-events-none z-10 opacity-30"
        style={{
          background:
            "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(168,85,247,0.03) 2px,rgba(168,85,247,0.03) 4px)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            "radial-gradient(ellipse 100% 100% at 50% 50%,transparent 40%,rgba(4,2,12,0.9) 100%)",
        }}
      />

      <div className="pt-24 pb-10 px-4 flex flex-col items-center justify-center min-h-[100dvh] relative z-20">
        
        {/* Balance display */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <p className="font-['Press_Start_2P'] text-[10px] text-[#6b5a80] mb-2">
            EMBER BALANCE
          </p>
          <div className="flex items-center justify-center gap-2">
            <img src={EMBER_ICON} alt="ember" className="w-5 h-5 object-contain" />
            <p
              className="font-['Press_Start_2P'] text-[16px] text-amber-400"
              style={{ textShadow: "0 0 15px rgba(251,191,36,0.4)" }}
            >
              {emberBalance.toLocaleString()}
            </p>
          </div>
        </motion.div>

        {/* Claim Ember */}
        <div className="text-center">
          <motion.button
            whileHover={{ scale: canClaim ? 1.05 : 1 }}
            whileTap={{ scale: canClaim ? 0.95 : 1 }}
            onClick={claimEmber}
            disabled={!canClaim || claiming}
            className={`font-['Press_Start_2P'] text-[10px] px-8 py-4 rounded border-2 tracking-wider transition-all ${
              canClaim
                ? "bg-amber-500/20 border-amber-500/50 text-amber-400 hover:bg-amber-500/30"
                : "bg-[#0d0420] border-[#1a0a2e] text-[#2d1a4e] cursor-not-allowed"
            }`}
            style={canClaim ? {
              boxShadow: "0 0 20px rgba(245,158,11,0.3), inset 0 1px 0 rgba(255,255,255,0.1)"
            } : {}}
          >
            {claiming
              ? "CLAIMING..."
              : canClaim
              ? "CLAIM EMBER"
              : `CLAIM IN ${fmt(msLeft)}`}
          </motion.button>
          {canClaim && (
            <p className="font-['VT323'] text-[#4a3a5e] text-sm mt-2">
              100 – 1000 EMBER every 4 hours
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="mt-10 flex gap-8 text-center">
          <div>
            <p className="font-['Press_Start_2P'] text-[8px] text-[#6b5a80]">GTD</p>
            <p className="text-[10px] text-purple-400 mt-1">
              {player?.forged_gtd ? "-" : "-"}
            </p>
          </div>
          <div>
            <p className="font-['Press_Start_2P'] text-[8px] text-[#6b5a80]">FCFS</p>
            <p className="text-[10px] text-purple-400 mt-1">
              {player?.forged_fcfs ? "-" : "-"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
