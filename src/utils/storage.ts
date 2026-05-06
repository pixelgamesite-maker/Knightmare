import { Inventory, PlayerStats, Quest } from "@/utils/gameLogic";
import { getPowerLevel, generateDailyQuest } from "@/utils/gameLogic";

const KEYS = {
  INVENTORY: "fc_inventory",
  STATS: "fc_stats",
  DAILY_QUEST: "fc_daily_quest",
  DAILY_DATE: "fc_daily_date",
  FORGE_COUNT: "fc_forge_count",
};

const DEFAULT_STATS: PlayerStats = {
  username: `Hunter_${Math.floor(1000 + Math.random() * 9000)}`,
  xp: 0,
  level: 0,
  powerLevel: 0,
  multiplier: 1,
};

export function getStoredInventory(): Inventory {
  try {
    const raw = localStorage.getItem(KEYS.INVENTORY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveInventory(inv: Inventory): void {
  localStorage.setItem(KEYS.INVENTORY, JSON.stringify(inv));
}

export function getStoredStats(): PlayerStats {
  try {
    const raw = localStorage.getItem(KEYS.STATS);
    if (!raw) {
      const fresh = { ...DEFAULT_STATS };
      saveStats(fresh);
      return fresh;
    }
    return JSON.parse(raw);
  } catch {
    return { ...DEFAULT_STATS };
  }
}

export function saveStats(stats: PlayerStats): void {
  localStorage.setItem(KEYS.STATS, JSON.stringify(stats));
}

export function recalcAndSaveStats(inventory: Inventory): PlayerStats {
  const current = getStoredStats();
  const updated: PlayerStats = {
    ...current,
    powerLevel: getPowerLevel(inventory),
  };
  saveStats(updated);
  return updated;
}

export function addXP(amount: number): PlayerStats {
  const stats = getStoredStats();
  const gained = Math.round(amount * stats.multiplier);
  const updated: PlayerStats = {
    ...stats,
    xp: stats.xp + gained,
  };
  saveStats(updated);
  return updated;
}

export function getForgeCount(): number {
  return parseInt(localStorage.getItem(KEYS.FORGE_COUNT) ?? "0", 10);
}

export function incrementForgeCount(): number {
  const count = getForgeCount() + 1;
  localStorage.setItem(KEYS.FORGE_COUNT, count.toString());
  return count;
}

export function getOrCreateDailyQuest(): Quest {
  const today = new Date().toDateString();
  const savedDate = localStorage.getItem(KEYS.DAILY_DATE);
  if (savedDate === today) {
    try {
      const raw = localStorage.getItem(KEYS.DAILY_QUEST);
      if (raw) return JSON.parse(raw);
    } catch { /* fall through */ }
  }
  const quest = generateDailyQuest();
  localStorage.setItem(KEYS.DAILY_DATE, today);
  localStorage.setItem(KEYS.DAILY_QUEST, JSON.stringify(quest));
  return quest;
}

export function saveDailyQuest(quest: Quest): void {
  localStorage.setItem(KEYS.DAILY_QUEST, JSON.stringify(quest));
}
