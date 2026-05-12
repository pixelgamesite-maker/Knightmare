import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayer } from "@/hooks/usePlayer";
import { useInventory } from "@/hooks/useInventory";
import { supabase } from "@/lib/supabase";
import { FRAGMENTS, CDN } from "@/lib/fragments";
import TopBar from "@/components/layout/TopBar";

export default function Forge() {
  const { player, invalidate: refreshPlayer } = usePlayer();
  const { inventory, invalidate: refreshInv } = useInventory();
  const [forging, setForging] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const unique = Object.entries(inventory).filter(([_, q]) => (q as number) > 0).length;

  const forge = async (type: string) => {
    setForging(type);
    const { data } = await supabase.rpc("attempt_forge", { p_type: type });
    setForging(null);
    if (data?.success) {
      setResult(type); refreshPlayer(); refreshInv();
      setTimeout(() => setResult(null), 3000);
    } else {
      alert(data?.error);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#04020c] text-white relative">
      <TopBar />
      <div className="pt-20 pb-10 px-4 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-['Press_Start_2P'] text-[12px] text-[#a855f7] mb-2" style={{ textShadow: "0 0 10px rgba(168,85,247,0.5)" }}>
            ⚒ THE FORGE
          </h1>
          <p className="text-[10px] text-[#6b5a80] font-['VT323'] text-lg">Collect fragments to forge legendary artifacts.</p>
        </motion.div>

        <div className="mt-6 bg-[#0d0420] border-2 border-[#2d1a4e] rounded p-4 relative">
          <div className="absolute -top-1 -left-1 w-1.5 h-1.5 bg-[#22d3ee]" />
          <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-[#22d3ee]" />
          <p className="font-['Press_Start_2P'] text-[8px] text-[#a855f7] mb-3">FRAGMENT COLLECTION</p>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {Object.entries(FRAGMENTS).map(([key, meta]) => {
              const has = (inventory[key] || 0) > 0;
              return (
                <div key={key} className={`bg-[#04020c] rounded border p-2 text-center ${has ? "border-[#7c3aed]" : "border-[#1a0a2e] opacity-40"}`}>
                  <img src={`${CDN}/${meta.file}`} className="w-8 h-8 mx-auto object-contain" alt="" />
                  <p className="text-[7px] text-[#6b5a80] mt-1">{meta.name}</p>
                </div>
              );
            })}
          </div>
          <div className="h-2 bg-[#04020c] rounded-full overflow-hidden border border-[#1a0a2e]">
            <motion.div className="h-full bg-gradient-to-r from-[#7c3aed] to-[#a855f7]"
              initial={{ width: 0 }} animate={{ width: `${(unique / 7) * 100}%` }} />
          </div>
          <p className="text-[8px] text-[#6b5a80] mt-1 text-right">{unique}/7 UNIQUE</p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4">
          <ForgeCard title="GTD ARTIFACT" desc="Requires all 7 unique fragments." ready={unique >= 7 && !player?.forged_gtd}
            done={player?.forged_gtd} onForge={() => forge("gtd")} forging={forging === "gtd"} />
          <ForgeCard title="FCFS ARTIFACT" desc="Requires 4 unique fragments." ready={unique >= 4 && !player?.forged_fcfs}
            done={player?.forged_fcfs} onForge={() => forge("fcfs")} forging={forging === "fcfs"} />
        </div>

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="mt-6 bg-[#7c3aed]/20 border-2 border-[#a855f7] p-4 rounded text-center">
              <p className="font-['Press_Start_2P'] text-[10px] text-[#a855f7]">
                {result === "gtd" ? "GTD ARTIFACT FORGED!" : "FCFS ARTIFACT FORGED!"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ForgeCard({ title, desc, ready, done, onForge, forging }: any) {
  return (
    <div className={`bg-[#0d0420] border-2 rounded p-4 relative ${ready ? "border-[#7c3aed]" : done ? "border-emerald-900/50" : "border-[#1a0a2e]"}`}>
      <div className="absolute -top-1 -left-1 w-1.5 h-1.5 bg-[#22d3ee]" />
      <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-[#22d3ee]" />
      <div className="flex items-center justify-between">
        <div>
          <p className={`font-['Press_Start_2P'] text-[10px] ${done ? "text-emerald-400" : "text-[#c4b5d4]"}`}>{title}</p>
          <p className="text-[9px] text-[#6b5a80] mt-1">{desc}</p>
        </div>
        <button onClick={onForge} disabled={!ready || forging}
          className={`font-['Press_Start_2P'] text-[8px] px-4 py-2 rounded border-2 tracking-wider ${
            done ? "bg-emerald-900/30 border-emerald-800 text-emerald-400 cursor-default" :
            ready ? "bg-[#7c3aed] border-[#a855f7] text-white hover:bg-[#9333ea]" :
            "bg-[#04020c] border-[#1a0a2e] text-[#2d1a4e] cursor-not-allowed"}`}>
          {done ? "FORGED" : forging ? "..." : "FORGE"}
        </button>
      </div>
    </div>
  );
}
