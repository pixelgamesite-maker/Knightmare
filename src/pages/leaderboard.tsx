import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import TopBar from "@/components/layout/TopBar";

export default function Leaderboard() {
  const [players, setPlayers] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("players").select("username, display_name, gold, total_chests_opened, forged_gtd")
      .order("gold", { ascending: false }).limit(50)
      .then(({ data }) => setPlayers(data || []));
  }, []);

  return (
    <div className="min-h-[100dvh] bg-[#04020c] text-white">
      <TopBar />
      <div className="pt-20 pb-10 px-4 max-w-2xl mx-auto">
        <h1 className="font-['Press_Start_2P'] text-[12px] text-[#a855f7] mb-6">🏆 LEADERBOARD</h1>
        <div className="space-y-2">
          {players.map((p, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
              className="flex items-center gap-3 bg-[#0d0420] border border-[#2d1a4e] rounded p-3">
              <span className={`font-['Press_Start_2P'] text-[10px] w-6 ${i < 3 ? "text-amber-400" : "text-[#6b5a80]"}`}>{i + 1}</span>
              <div className="flex-1">
                <p className="text-[10px] text-[#c4b5d4]">{p.display_name || p.username || "Unknown"}</p>
                <p className="text-[8px] text-[#6b5a80]">{p.total_chests_opened || 0} chests</p>
              </div>
              <div className="text-right">
                <p className="font-['Press_Start_2P'] text-[9px] text-amber-400">{p.gold || 0}G</p>
                {p.forged_gtd && <span className="text-[7px] text-purple-400">GTD</span>}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
