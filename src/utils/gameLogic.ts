import { FRAGMENTS, GEAR_SET_IDS, RARITY_WEIGHTS, Rarity } from "../data/fragmentsData";

export type Inventory = Record<string, number>;

export interface PlayerStats {
  username: string;
  xp: number;
  level: number;
  powerLevel: number;
  multiplier: number;
}

export interface Quest {
  id: string;
  description: string;
  requirement: number;
  progress: number;
  rewardType: "fragment" | "power";
  rewardRarity?: Rarity;
  rewardAmount?: number;
  completed: boolean;
}

export const getPowerLevel = (inventory: Inventory): number => {
  return Object.entries(inventory).reduce((total, [id, qty]) => {
    const fragment = FRAGMENTS[id];
    if (!fragment) return total;
    return total + (qty * RARITY_WEIGHTS[fragment.rarity]);
  }, 0);
};

export const checkGearSet = (inventory: Inventory): boolean => {
  return GEAR_SET_IDS.every(id => (inventory[id] || 0) >= 1);
};

export const getGearSetProgress = (inventory: Inventory): number => {
  return GEAR_SET_IDS.filter(id => (inventory[id] || 0) >= 1).length;
};

export const getRandomFragment = (guaranteedRarity?: Rarity): string => {
  const rand = Math.random();
  let rarity: Rarity = "Common";
  
  if (guaranteedRarity) {
    rarity = guaranteedRarity;
  } else {
    // Common 60%, Rare 25%, Epic 12%, Mythic 3%
    if (rand < 0.03) rarity = "Mythic";
    else if (rand < 0.15) rarity = "Epic";
    else if (rand < 0.40) rarity = "Rare";
  }

  const possibleFragments = Object.values(FRAGMENTS).filter(f => f.rarity === rarity && !f.id.includes("enhanced") && !f.id.includes("reinforced") && !f.id.includes("ascended"));
  if (possibleFragments.length === 0) return "stone";
  
  return possibleFragments[Math.floor(Math.random() * possibleFragments.length)].id;
};

export const getRankTitle = (power: number): string => {
  if (power >= 7000) return "Legend";
  if (power >= 3000) return "Champion";
  if (power >= 1500) return "Warrior";
  if (power >= 500) return "Hunter";
  return "Novice";
};

export const getXPThreshold = (xp: number) => {
  const thresholds = [0, 500, 1500, 3000, 7000];
  const currentLevel = thresholds.reduce((acc, threshold, index) => (xp >= threshold ? index : acc), 0);
  
  const currentThreshold = thresholds[currentLevel];
  const nextThreshold = currentLevel < thresholds.length - 1 
    ? thresholds[currentLevel + 1] 
    : currentThreshold + 5000; // Infinity cap or prestige level
  
  const progress = Math.min(100, ((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100);
    
  return { currentLevel, nextThreshold, progress };
};

export const generateDailyQuest = (): Quest => {
  const types = [
    { desc: "Collect 5 fragments", req: 5, type: "fragment" as const, rarity: "Epic" as Rarity },
    { desc: "Complete 3 actions", req: 3, type: "fragment" as const, rarity: "Rare" as Rarity },
    { desc: "Forge 2 items", req: 2, type: "power" as const, amount: 500 }
  ];
  
  const selected = types[Math.floor(Math.random() * types.length)];
  
  return {
    id: Math.random().toString(36).substring(7),
    description: selected.desc,
    requirement: selected.req,
    progress: 0,
    rewardType: selected.type,
    rewardRarity: selected.rarity,
    rewardAmount: selected.amount,
    completed: false
  };
};
                                                            
