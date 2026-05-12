export const CDN = "https://psibadkdncspgikzzmnu.supabase.co/storage/v1/object/public/Fragments";

export const FRAGMENTS: Record<string, { name: string; file: string }> = {
  sword: { name: "Sword", file: "sword.png" },
  helm: { name: "Helm", file: "helm.png" },
  plate: { name: "Armor", file: "armor.png" },
  gloves: { name: "Gloves", file: "gloves.png" },
  boots: { name: "Boots", file: "boots.png" },
  doom_potion: { name: "Doom Potion", file: "potion.png" },
  book_of_reincarnation: { name: "Book of Reincarnation", file: "book-of-reincarnation.png" },
  dragon_heart: { name: "Dragon Heart", file: "dragon-heart.png" },
};

export const FRAGMENT_TYPES = Object.keys(FRAGMENTS);
