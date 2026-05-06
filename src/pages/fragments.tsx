import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Shield, Swords } from "lucide-react";
import { FRAGMENTS } from "@/data/fragmentsData";
import { Fragment } from "@/data/fragmentsData";
import { getRandomFragment, getGearSetProgress, checkGearSet } from "@/utils/gameLogic";
import {
  getStoredInventory,
  saveInventory,
  getStoredStats,
  recalcAndSaveStats,
  addXP,
  getOrCreateDailyQuest,
  saveDailyQuest,
  getForgeCount,
} from "@/utils/storage";
import RankPanel from "@/components/RankPanel";
import InventoryGrid from "@/components/InventoryGrid";
import ProgressBar from "@/components/ProgressBar";
import LootPopup from "@/components/LootPopup";

export default function Fragments() {
  const [inventory, setInventory] = useState(getStoredInventory);
  const [stats, setStats] = useState(getStoredStats);
  const [lootFragment, setLootFragment] = useState<Fragment | null>(null);
  const [dailyQuest, setDailyQuest] = useState(getOrCreateDailyQuest);
  const [questClaimed, setQuestClaimed] = useState(dailyQuest.completed);
  const [questProgress, setQuestProgress] = useState(dailyQuest.progress);

  const gearProgress = getGearSetProgress(inventory);
  const hasFullSet = checkGearSet(inventory);
  const fragmentsOwned = Object.values(inventory).reduce((a, b) => a + b, 0);

  const completeQuest = useCallback(() => {
    const fragmentId = getRandomFragment();
    const fragment = FRAGMENTS[fragmentId];
    if (!fragment) return;

    const newInventory = { ...inventory, [fragmentId]: (inventory[fragmentId] || 0) + 1 };
    saveInventory(newInventory);
    setInventory(newInventory);

    const updatedStats = recalcAndSaveStats(newInventory);
    const withXP = addXP(100);
    setStats({ ...updatedStats, xp: withXP.xp });

    setLootFragment(fragment);

    const newProgress = questProgress + 1;
    setQuestProgress(newProgress);
    const updatedQuest = { ...dailyQuest, progress: newProgress };
    saveDailyQuest(updatedQuest);
    setDailyQuest(updatedQuest);
  }, [inventory, questProgress, dailyQuest]);

  const claimDailyReward = useCallback(() => {
    if (questClaimed || questProgress < dailyQuest.requirement) return;

    let rewardId: string | null = null;
    if (dailyQuest.rewardType === "fragment" && dailyQuest.rewardRarity) {
      rewardId = getRandomFragment(dailyQuest.rewardRarity);
    }

    const newInventory = rewardId
      ? { ...inventory, [rewardId]: (inventory[rewardId] || 0) + 1 }
      : { ...inventory };

    saveInventory(newInventory);
    setInventory(newInventory);

    const updatedStats = recalcAndSaveStats(newInventory);
    const withXP = addXP(dailyQuest.rewardType === "power" ? (dailyQuest.rewardAmount ?? 0) : 200);
    setStats({ ...updatedStats, xp: withXP.xp });

    const completedQuest = { ...dailyQuest, completed: true, progress: questProgress };
    saveDailyQuest(completedQuest);
    setDailyQuest(completedQuest);
    setQuestClaimed(true);

    if (rewardId) setLootFragment(FRAGMENTS[rewardId] ?? null);
  }, [questClaimed, questProgress, dailyQuest, inventory]);

  const forgeCount = getForgeCount();

  return (
    <div className="max-w-6xl mx-auto px-4 py-6" data-testid="fragments-page">
      <LootPopup fragment={lootFragment} onClose={() => setLootFragment(null)} />

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 shrink-0 space-y-4">
          <RankPanel stats={stats} fragmentsOwned={fragmentsOwned} />

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card border border-primary/20 rounded-xl p-4 space-y-3"
          >
            <div className="flex items-center gap-2 text-primary">
              <Shield className="w-4 h-4" />
              <span className="font-display text-xs tracking-wider">Gear Set</span>
            </div>

            <ProgressBar
              value={gearProgress}
              max={5}
              label="Armor Progress"
              sublabel={`${gearProgress}/5`}
              color={hasFullSet ? "mythic" : "primary"}
            />

            {hasFullSet && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-2 rounded-lg bg-purple-500/10 border border-purple-500/30"
                style={{ boxShadow: "0 0 20px hsl(258 90% 66% / 0.2)" }}
              >
                <p className="font-display text-xs text-[hsl(258,90%,66%)] text-glow-mythic">
                  Full Armor Form
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Unlocked</p>
              </motion.div>
            )}

            <div className="grid grid-cols-5 gap-1">
              {["sword", "helm", "plate", "gloves", "boots"].map(id => {
                const frag = FRAGMENTS[id];
                const owned = (inventory[id] || 0) > 0;
                return (
                  <div
                    key={id}
                    className={`aspect-square rounded flex items-center justify-center text-lg transition-all ${
                      owned ? "opacity-100" : "opacity-20 grayscale"
                    }`}
                    style={owned ? { filter: "drop-shadow(0 0 4px hsl(29 100% 50% / 0.6))" } : undefined}
                    title={frag?.name}
                  >
                    {frag?.icon}
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-card border border-primary/20 rounded-xl p-4 space-y-3"
          >
            <p className="font-display text-xs text-foreground tracking-wider">Daily Quest</p>
            <p className="text-xs text-muted-foreground">{dailyQuest.description}</p>
            <ProgressBar
              value={questProgress}
              max={dailyQuest.requirement}
              sublabel={`${Math.min(questProgress, dailyQuest.requirement)}/${dailyQuest.requirement}`}
              color="gold"
              showPercent
            />
            <p className="text-[10px] text-muted-foreground">
              Reward: {dailyQuest.rewardType === "fragment"
                ? `Guaranteed ${dailyQuest.rewardRarity} Fragment`
                : `+${dailyQuest.rewardAmount} Power`}
            </p>
            <motion.button
              data-testid="button-claim-quest"
              whileHover={{ scale: questProgress >= dailyQuest.requirement && !questClaimed ? 1.03 : 1 }}
              whileTap={{ scale: 0.97 }}
              onClick={claimDailyReward}
              disabled={questClaimed || questProgress < dailyQuest.requirement}
              className={`w-full py-2 rounded-lg text-xs font-semibold tracking-wider transition-all ${
                questClaimed
                  ? "bg-muted text-muted-foreground cursor-default"
                  : questProgress >= dailyQuest.requirement
                  ? "bg-amber-500/20 border border-amber-500/50 text-amber-400 hover:bg-amber-500/30"
                  : "bg-muted/30 text-muted-foreground/50 cursor-not-allowed"
              }`}
            >
              {questClaimed ? "Claimed" : questProgress >= dailyQuest.requirement ? "Claim Reward" : "In Progress"}
            </motion.button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-primary/20 rounded-xl p-4 text-center space-y-3"
          >
            <div className="flex items-center justify-center gap-2 text-primary">
              <Swords className="w-4 h-4" />
              <span className="font-display text-xs tracking-wider">Quest</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Complete a quest to earn a random fragment
            </p>
            <motion.button
              data-testid="button-complete-quest"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={completeQuest}
              className="w-full py-3 rounded-lg bg-primary text-background font-semibold text-sm tracking-wider transition-all"
              style={{ boxShadow: "0 0 16px hsl(29 100% 50% / 0.4)" }}
            >
              Complete Quest
            </motion.button>
            {forgeCount > 0 && (
              <p className="text-[10px] text-muted-foreground">Forged: {forgeCount} times</p>
            )}
          </motion.div>
        </div>

        <div className="flex-1 min-w-0">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-4"
          >
            <h2 className="font-display text-base text-foreground">Inventory</h2>
            <span className="text-xs text-muted-foreground">{fragmentsOwned} collected</span>
          </motion.div>
          <InventoryGrid inventory={inventory} />
        </div>
      </div>
    </div>
  );
}
