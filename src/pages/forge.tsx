import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, CheckCircle, Lock } from "lucide-react";
import { FRAGMENTS } from "@/data/fragmentsData";
import { Fragment } from "@/data/fragmentsData";
import { Inventory } from "@/utils/gameLogic";
import {
  getStoredInventory,
  saveInventory,
  recalcAndSaveStats,
  getStoredStats,
  incrementForgeCount,
} from "@/utils/storage";

interface Recipe {
  id: string;
  name: string;
  ingredients: { id: string; qty: number }[];
  resultId: string;
  resultQty: number;
  description: string;
}

const RECIPES: Recipe[] = [
  {
    id: "enhanced_sword",
    name: "Enhanced Sword",
    ingredients: [{ id: "sword", qty: 2 }],
    resultId: "enhanced_sword",
    resultQty: 1,
    description: "Temper two blades into one sharper edge.",
  },
  {
    id: "reinforced_helm",
    name: "Reinforced Helm",
    ingredients: [{ id: "helm", qty: 2 }],
    resultId: "reinforced_helm",
    resultQty: 1,
    description: "Fuse two helms into an unbreakable crown.",
  },
  {
    id: "ascended_armor",
    name: "Ascended Armor",
    ingredients: [
      { id: "sword", qty: 1 },
      { id: "helm", qty: 1 },
      { id: "plate", qty: 1 },
      { id: "gloves", qty: 1 },
      { id: "boots", qty: 1 },
    ],
    resultId: "ascended_armor",
    resultQty: 1,
    description: "Unite the full gear set into a transcendent form.",
  },
  {
    id: "mythic_fire",
    name: "Mythic Fire Crystal",
    ingredients: [{ id: "fire_crystal", qty: 3 }],
    resultId: "heart_fire",
    resultQty: 1,
    description: "Three crystals fused into the Heart of Fire.",
  },
  {
    id: "mythic_void",
    name: "Mythic Void Essence",
    ingredients: [{ id: "void_essence", qty: 3 }],
    resultId: "doom_potion",
    resultQty: 1,
    description: "Three essences distilled into a Doom Potion.",
  },
  {
    id: "mythic_shadow",
    name: "Book of Reincarnation",
    ingredients: [{ id: "shadow_shard", qty: 3 }],
    resultId: "book_reincarnation",
    resultQty: 1,
    description: "Three shadow shards awaken the ancient tome.",
  },
];

function canCraft(recipe: Recipe, inventory: Inventory): boolean {
  return recipe.ingredients.every(({ id, qty }) => (inventory[id] || 0) >= qty);
}

function getResultFragment(recipe: Recipe): Fragment | undefined {
  return FRAGMENTS[recipe.resultId];
}

function IngredientPill({ id, qty, inventory }: { id: string; qty: number; inventory: Inventory }) {
  const frag = FRAGMENTS[id];
  const have = inventory[id] || 0;
  const ok = have >= qty;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border
        ${ok ? "bg-primary/10 border-primary/30 text-primary" : "bg-muted border-muted-foreground/20 text-muted-foreground"}
      `}
    >
      <span>{frag?.icon}</span>
      <span>{frag?.name}</span>
      <span className={ok ? "text-primary/70" : "text-muted-foreground/50"}>×{qty}</span>
      <span className={ok ? "text-emerald-400" : "text-red-400"}>({have})</span>
    </span>
  );
}

export default function Forge() {
  const [inventory, setInventory] = useState(getStoredInventory);
  const [stats, setStats] = useState(getStoredStats);
  const [forgingId, setForgingId] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ fragment: Fragment; recipeId: string } | null>(null);

  const craft = useCallback((recipe: Recipe) => {
    if (!canCraft(recipe, inventory) || forgingId) return;

    setForgingId(recipe.id);
    setLastResult(null);

    setTimeout(() => {
      const newInventory = { ...inventory };
      recipe.ingredients.forEach(({ id, qty }) => {
        newInventory[id] = (newInventory[id] || 0) - qty;
        if (newInventory[id] <= 0) delete newInventory[id];
      });
      newInventory[recipe.resultId] = (newInventory[recipe.resultId] || 0) + recipe.resultQty;

      saveInventory(newInventory);
      setInventory(newInventory);

      const updatedStats = recalcAndSaveStats(newInventory);
      setStats(updatedStats);

      incrementForgeCount();
      setForgingId(null);

      const result = getResultFragment(recipe);
      if (result) setLastResult({ fragment: result, recipeId: recipe.id });
    }, 1200);
  }, [inventory, forgingId]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6" data-testid="forge-page">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-2"
      >
        <Flame className="w-6 h-6 text-primary" />
        <h1 className="font-display text-xl text-foreground">The Forge</h1>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-xs text-muted-foreground mb-6"
      >
        Combine fragments to craft powerful upgrades. Numbers in parentheses show your current stock.
      </motion.p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {RECIPES.map((recipe, i) => {
          const available = canCraft(recipe, inventory);
          const result = getResultFragment(recipe);
          const isForging = forgingId === recipe.id;
          const justForged = lastResult?.recipeId === recipe.id;

          return (
            <motion.div
              key={recipe.id}
              data-testid={`recipe-card-${recipe.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`relative rounded-xl border p-4 space-y-3 transition-all overflow-hidden
                ${available ? "border-primary/30 bg-card" : "border-primary/10 bg-card/60"}
              `}
            >
              {isForging && (
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  animate={{ opacity: [0, 0.6, 0] }}
                  transition={{ duration: 0.6, repeat: 2 }}
                  style={{ background: "radial-gradient(circle at center, hsl(29 100% 50% / 0.25) 0%, transparent 70%)" }}
                />
              )}

              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-xs text-foreground">{recipe.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{recipe.description}</p>
                </div>
                <div className="shrink-0 text-2xl" title={result?.name}>
                  {result?.icon}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {recipe.ingredients.map(({ id, qty }) => (
                  <IngredientPill key={id} id={id} qty={qty} inventory={inventory} />
                ))}
              </div>

              <div className="flex items-center justify-between gap-2">
                {result && (
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full
                    ${result.rarity === "Mythic" ? "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                    : result.rarity === "Epic" ? "bg-amber-400/15 text-amber-400 border border-amber-400/30"
                    : "bg-blue-500/15 text-blue-400 border border-blue-500/30"}
                  `}>
                    → {result.name} ({result.rarity})
                  </span>
                )}

                <motion.button
                  data-testid={`button-forge-${recipe.id}`}
                  whileHover={available && !isForging ? { scale: 1.04 } : {}}
                  whileTap={available && !isForging ? { scale: 0.96 } : {}}
                  onClick={() => craft(recipe)}
                  disabled={!available || !!forgingId}
                  className={`ml-auto flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold tracking-wider transition-all
                    ${available && !forgingId
                      ? "bg-primary text-background hover:opacity-90"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                    }
                  `}
                  style={available && !forgingId ? { boxShadow: "0 0 12px hsl(29 100% 50% / 0.35)" } : undefined}
                >
                  {isForging ? (
                    <motion.span
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      Forging...
                    </motion.span>
                  ) : available ? (
                    <>
                      <Flame className="w-3 h-3" />
                      Forge
                    </>
                  ) : (
                    <>
                      <Lock className="w-3 h-3" />
                      Locked
                    </>
                  )}
                </motion.button>
              </div>

              <AnimatePresence>
                {justForged && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5 text-emerald-400 text-xs"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Crafted successfully!
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-6 p-4 rounded-xl border border-primary/10 bg-card/40"
      >
        <p className="text-xs text-muted-foreground text-center">
          Power Level: <span className="text-primary font-bold">{stats.powerLevel.toLocaleString()}</span>
        </p>
      </motion.div>
    </div>
  );
                                       }
        
