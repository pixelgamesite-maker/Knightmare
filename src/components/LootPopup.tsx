import { motion, AnimatePresence } from "framer-motion";
import { Fragment } from "@/data/fragmentsData";
import { useEffect } from "react";

interface LootPopupProps {
  fragment: Fragment | null;
  onClose: () => void;
}

const rarityColors: Record<string, string> = {
  Common: "text-white/80",
  Rare:   "text-blue-400",
  Epic:   "text-amber-400",
  Mythic: "text-[hsl(258,90%,66%)]",
};

const rarityGlows: Record<string, string> = {
  Common: "shadow-white/20",
  Rare:   "shadow-blue-500/50",
  Epic:   "shadow-amber-400/60",
  Mythic: "shadow-purple-500/70",
};

export default function LootPopup({ fragment, onClose }: LootPopupProps) {
  useEffect(() => {
    if (!fragment) return;
    const timer = setTimeout(onClose, 2500);
    return () => clearTimeout(timer);
  }, [fragment, onClose]);

  return (
    <AnimatePresence>
      {fragment && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          data-testid="loot-popup"
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          <motion.div
            className="relative z-10 flex flex-col items-center gap-4 pointer-events-none"
            initial={{ y: -80, opacity: 0, scale: 0.6 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
          >
            <motion.p
              className="font-display text-xs tracking-widest text-primary uppercase"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              Fragment Obtained
            </motion.p>

            <motion.div
              className={`w-32 h-32 rounded-2xl bg-card border-2 flex flex-col items-center justify-center gap-2 shadow-2xl
                ${fragment.rarity === "Mythic" ? "border-purple-500/70" : fragment.rarity === "Epic" ? "border-amber-400/60" : fragment.rarity === "Rare" ? "border-blue-500/50" : "border-white/20"}
                ${rarityGlows[fragment.rarity]}
              `}
              animate={{ boxShadow: ["0 0 20px rgba(0,0,0,0.2)", "0 0 60px rgba(255,122,0,0.4)", "0 0 20px rgba(0,0,0,0.2)"] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <span className="text-5xl">{fragment.icon}</span>
              <span className={`text-xs font-semibold ${rarityColors[fragment.rarity]}`}>
                {fragment.rarity}
              </span>
            </motion.div>

            <motion.p
              className="font-display text-lg text-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
            >
              {fragment.name}
            </motion.p>

            {fragment.description && (
              <motion.p
                className="text-xs text-muted-foreground max-w-xs text-center px-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {fragment.description}
              </motion.p>
            )}

            <motion.p
              className="text-xs text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              Tap to dismiss
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
