import { motion } from "framer-motion";
import { Trophy, Crown } from "lucide-react";
import { useMemo } from "react";
import { getStoredStats } from "@/utils/storage";

const MOCK_PLAYERS = [
  { username: "VoidReaper",       powerLevel: 12450, fragments: 89 },
  { username: "EmberWitch",       powerLevel: 9870,  fragments: 74 },
  { username: "IronPhantom",      powerLevel: 8230,  fragments: 61 },
  { username: "StarShatter",      powerLevel: 6990,  fragments: 55 },
  { username: "RuneHunter",       powerLevel: 5810,  fragments: 47 },
  { username: "DoomCrawler",      powerLevel: 4750,  fragments: 38 },
  { username: "NightForge",       powerLevel: 3620,  fragments: 30 },
  { username: "AshWalker",        powerLevel: 2480,  fragments: 22 },
  { username: "GloomStriker",     powerLevel: 1350,  fragments: 15 },
];

function getRankTitle(power: number): string {
  if (power >= 7000) return "Legend";
  if (power >= 3000) return "Champion";
  if (power >= 1500) return "Warrior";
  if (power >= 500) return "Hunter";
  return "Novice";
}

const rankColors: Record<string, string> = {
  Novice:   "text-muted-foreground",
  Hunter:   "text-blue-400",
  Warrior:  "text-amber-400",
  Champion: "text-primary",
  Legend:   "text-[hsl(258,90%,66%)]",
};

const topMedals = ["🥇", "🥈", "🥉"];

export default function Leaderboard() {
  const playerStats = getStoredStats();

  const allPlayers = useMemo(() => {
    const userEntry = {
      username: playerStats.username,
      powerLevel: playerStats.powerLevel,
      fragments: 0,
      isYou: true,
    };
    const combined = [
      ...MOCK_PLAYERS.map(p => ({ ...p, isYou: false })),
      userEntry,
    ].sort((a, b) => b.powerLevel - a.powerLevel);
    return combined;
  }, [playerStats]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8" data-testid="leaderboard-page">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-8"
      >
        <Trophy className="w-6 h-6 text-primary" />
        <h1 className="font-display text-xl text-foreground">Leaderboard</h1>
      </motion.div>

      <div className="space-y-2">
        {allPlayers.map((player, i) => {
          const rank = getRankTitle(player.powerLevel);
          const isTop3 = i < 3;
          return (
            <motion.div
              key={player.username}
              data-testid={`leaderboard-row-${i}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.35 }}
              className={`relative flex items-center gap-4 rounded-xl border px-4 py-3 transition-all
                ${player.isYou
                  ? "bg-primary/10 border-primary/50 shadow-[0_0_20px_hsl(29_100%_50%/0.15)]"
                  : "bg-card border-primary/10 hover:border-primary/25"
                }
              `}
            >
              <div className="w-8 text-center">
                {isTop3
                  ? <span className="text-lg">{topMedals[i]}</span>
                  : <span className="text-sm font-bold text-muted-foreground">#{i + 1}</span>
                }
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {player.isYou && <Crown className="w-3.5 h-3.5 text-primary shrink-0" />}
                  <p className={`font-semibold text-sm truncate ${player.isYou ? "text-primary" : "text-foreground"}`}>
                    {player.isYou ? "You" : player.username}
                    {player.isYou && <span className="text-muted-foreground font-normal ml-1 text-xs">({player.username})</span>}
                  </p>
                </div>
                <p className={`text-xs mt-0.5 ${rankColors[rank]}`}>{rank}</p>
              </div>

              <div className="text-right shrink-0">
                <p className="font-bold text-sm text-primary">{player.powerLevel.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground">Power</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
