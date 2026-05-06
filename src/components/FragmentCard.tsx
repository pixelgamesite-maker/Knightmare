import { motion } from "framer-motion";
import { Fragment, Rarity } from "@/data/fragmentsData";

interface FragmentCardProps {
  fragment: Fragment;
  quantity: number;
  selected?: boolean;
  onClick?: () => void;
  size?: "sm" | "md";
}

const rarityStyles: Record<Rarity, { border: string; glow: string; badge: string; text: string }> = {
  Common:  { border: "border-white/20",   glow: "hover:shadow-white/20",    badge: "bg-white/10 text-white/70",          text: "text-white/70" },
  Rare:    { border: "border-blue-500/40", glow: "hover:shadow-blue-500/30",  badge: "bg-blue-500/20 text-blue-300",        text: "text-blue-300" },
  Epic:    { border: "border-amber-400/50", glow: "hover:shadow-amber-400/40", badge: "bg-amber-400/20 text-amber-300",     text: "text-amber-300" },
  Mythic:  { border: "border-purple-500/60", glow: "hover:shadow-purple-500/50", badge: "bg-purple-500/20 text-purple-300", text: "text-purple-300" },
};

export default function FragmentCard({ fragment, quantity, selected, onClick, size = "md" }: FragmentCardProps) {
  const owned = quantity > 0;
  const styles = rarityStyles[fragment.rarity];
  const isMythic = fragment.rarity === "Mythic";

  return (
    <motion.div
      whileHover={{ scale: owned ? 1.06 : 1.02 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      data-testid={`fragment-card-${fragment.id}`}
      className={`relative rounded-lg border cursor-pointer transition-all duration-200 select-none
        ${size === "sm" ? "p-2" : "p-3"}
        ${owned ? styles.border : "border-white/10"}
        ${selected ? `ring-2 ring-primary ${styles.border}` : ""}
        ${owned ? `hover:shadow-lg ${styles.glow}` : "opacity-40"}
        bg-card
      `}
      style={isMythic && owned ? { boxShadow: "0 0 18px hsl(258 90% 66% / 0.35)" } : undefined}
    >
      {isMythic && owned && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ boxShadow: "inset 0 0 20px hsl(258 90% 66% / 0.2)" }}
        />
      )}

      <div className="flex flex-col items-center gap-1">
        <span
          className={`${size === "sm" ? "text-2xl" : "text-3xl"} leading-none ${!owned ? "grayscale brightness-30" : ""}`}
          style={!owned ? { filter: "grayscale(1) brightness(0.25)" } : undefined}
        >
          {fragment.icon}
        </span>

        <p className={`font-medium text-center leading-tight ${size === "sm" ? "text-[10px]" : "text-xs"} ${owned ? "text-foreground" : "text-muted-foreground/50"}`}>
          {fragment.name}
        </p>

        <div className="flex items-center justify-between w-full gap-1">
          <span className={`text-[9px] font-semibold px-1 py-0.5 rounded ${owned ? styles.badge : "bg-white/5 text-white/20"}`}>
            {fragment.rarity}
          </span>
          <span className={`text-xs font-bold ${owned ? "text-primary" : "text-muted-foreground/30"}`}>
            ×{quantity}
          </span>
        </div>
      </div>

      {selected && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
      )}
    </motion.div>
  );
}
