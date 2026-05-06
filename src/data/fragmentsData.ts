export type Rarity = "Common" | "Rare" | "Epic" | "Mythic";

export interface Fragment {
  id: string;
  name: string;
  icon: string;
  rarity: Rarity;
  description?: string;
  isGear?: boolean;
}

export const RARITY_WEIGHTS: Record<Rarity, number> = {
  Common: 1,
  Rare: 3,
  Epic: 8,
  Mythic: 25,
};

export const FRAGMENTS: Record<string, Fragment> = {
  // Common Gear
  sword: { id: "sword", name: "Sword", icon: "⚔️", rarity: "Common", isGear: true },
  helm: { id: "helm", name: "Helm", icon: "⛑️", rarity: "Common", isGear: true },
  plate: { id: "plate", name: "Plate", icon: "🛡️", rarity: "Common", isGear: true },
  gloves: { id: "gloves", name: "Gloves", icon: "🧤", rarity: "Common", isGear: true },
  boots: { id: "boots", name: "Boots", icon: "👢", rarity: "Common", isGear: true },
  // Common Mats
  stone: { id: "stone", name: "Stone", icon: "🪨", rarity: "Common" },
  scroll: { id: "scroll", name: "Scroll", icon: "📜", rarity: "Common" },
  vial: { id: "vial", name: "Vial", icon: "🧪", rarity: "Common" },
  
  // Rare
  fire_crystal: { id: "fire_crystal", name: "Fire Crystal", icon: "🔥", rarity: "Rare" },
  shadow_shard: { id: "shadow_shard", name: "Shadow Shard", icon: "🌑", rarity: "Rare" },
  storm_rune: { id: "storm_rune", name: "Storm Rune", icon: "⚡", rarity: "Rare" },
  void_essence: { id: "void_essence", name: "Void Essence", icon: "🌀", rarity: "Rare" },
  
  // Epic
  dragon_scale: { id: "dragon_scale", name: "Dragon Scale", icon: "🐉", rarity: "Epic" },
  moon_fragment: { id: "moon_fragment", name: "Moon Fragment", icon: "🌙", rarity: "Epic" },
  suncore: { id: "suncore", name: "Suncore", icon: "☀️", rarity: "Epic" },
  
  // Mythic
  doom_potion: { id: "doom_potion", name: "Doom Potion", icon: "💀", rarity: "Mythic", description: "Risk/Reward — grants 50 power but may curse your inventory" },
  book_reincarnation: { id: "book_reincarnation", name: "Book of Reincarnation", icon: "📖", rarity: "Mythic", description: "Reset all fragments but multiply future gains by 2x" },
  heart_fire: { id: "heart_fire", name: "Heart of Fire", icon: "❤️‍🔥", rarity: "Mythic", description: "Final Evolution — grants legendary status permanently" },

  // Forged items (Special/Enhanced)
  enhanced_sword: { id: "enhanced_sword", name: "Enhanced Sword", icon: "⚔️", rarity: "Rare", isGear: true },
  reinforced_helm: { id: "reinforced_helm", name: "Reinforced Helm", icon: "⛑️", rarity: "Rare", isGear: true },
  ascended_armor: { id: "ascended_armor", name: "Ascended Armor", icon: "✨", rarity: "Epic", isGear: true },
};

export const GEAR_SET_IDS = ["sword", "helm", "plate", "gloves", "boots"];
