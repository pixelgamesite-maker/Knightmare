import { motion } from "framer-motion";
import { Zap, Star, TrendingUp, Package } from "lucide-react";
import { PlayerStats } from "@/utils/gameLogic";
import { getRankTitle, getXPThreshold } from "@/utils/gameLogic";
import ProgressBar from "@/components/ProgressBar";

interface RankPanelProps {
  stats: PlayerStats;
  fragmentsOwned: number;
}

const rankColors: Record<string, string> = {
  Novice:   "text-muted-foreground",
  Hunter:   "text-blue-400",
  Warrior:  "text-amber-400",
  Champion: "text-primary",
  Legend:   "text-[hsl(258,90%,66%)]",
};

export default function RankPanel({ stats, fragmentsOwned }: RankPanelProps) {
  const rankTitle = getRankTitle(stats.powerLevel);
  const { nextThreshold, progress, currentLevel } = getXPThreshold(stats.xp);
  const rankColor = rankColors[rankTitle] ?? "text-foreground";

  const levelNames = ["Novice", "Hunter", "Warrior", "Champion", "Legend"];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-card border border-primary/20 rounded-xl p-4 space-y-4 box-glow"
      data-testid="rank-panel"
    >
      <div className="text-center border-b border-primary/10 pb-3">
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Hunter</p>
        <p className="font-display text-base text-foreground truncate">{stats.username}</p>
        <motion.p
          className={`font-display text-xl mt-1 ${rankColor}`}
          animate={rankTitle === "Legend" ? { opacity: [0.7, 1, 0.7] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          style={rankTitle === "Legend" ? { textShadow: "0 0 15px hsl(258 90% 66% / 0.7)" } : undefined}
        >
          {rankTitle}
        </motion.p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatBox icon={<Zap className="w-3.5 h-3.5" />} label="Power" value={stats.powerLevel.toLocaleString()} color="text-primary" />
        <StatBox icon={<TrendingUp className="w-3.5 h-3.5" />} label="Multiplier" value={`${stats.multiplier.toFixed(1)}x`} color="text-amber-400" />
        <StatBox icon={<Star className="w-3.5 h-3.5" />} label="Level" value={`${currentLevel + 1}`} color="text-blue-400" />
        <StatBox icon={<Package className="w-3.5 h-3.5" />} label="Fragments" value={fragmentsOwned.toString()} color="text-emerald-400" />
      </div>

      <div className="space-y-1">
        <ProgressBar
          value={stats.xp}
          max={nextThreshold}
          label="XP"
          sublabel={`${stats.xp} / ${nextThreshold}`}
          color="primary"
        />
        <div className="flex justify-between text-[9px] text-muted-foreground px-0.5">
          <span>{levelNames[currentLevel]}</span>
          <span>{levelNames[Math.min(currentLevel + 1, levelNames.length - 1)]}</span>
        </div>
      </div>
    </motion.div>
  );
}

function StatBox({ icon, label, value, color }: { icon: import("react").ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bg-background/60 border border-primary/10 rounded-lg p-2 text-center">
      <div className={`flex items-center justify-center gap-1 ${color} mb-1`}>
        {icon}
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <p className={`font-bold text-sm ${color}`}>{value}</p>
    </div>
  );
}
