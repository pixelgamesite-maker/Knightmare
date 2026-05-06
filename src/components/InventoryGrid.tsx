import { motion } from "framer-motion";
import { FRAGMENTS } from "@/data/fragmentsData";
import { Inventory } from "@/utils/gameLogic";
import FragmentCard from "@/components/FragmentCard";

interface InventoryGridProps {
  inventory: Inventory;
  selectable?: boolean;
  selectedIds?: string[];
  onSelect?: (id: string) => void;
}

const RARITY_ORDER = { Mythic: 0, Epic: 1, Rare: 2, Common: 3 };

export default function InventoryGrid({ inventory, selectable, selectedIds = [], onSelect }: InventoryGridProps) {
  const allFragments = Object.values(FRAGMENTS).sort((a, b) => {
    const rarityDiff = RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity];
    if (rarityDiff !== 0) return rarityDiff;
    const aOwned = (inventory[a.id] || 0) > 0 ? 0 : 1;
    const bOwned = (inventory[b.id] || 0) > 0 ? 0 : 1;
    return aOwned - bOwned;
  });

  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))" }}
      data-testid="inventory-grid"
    >
      {allFragments.map((fragment, i) => (
        <motion.div
          key={fragment.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.025, duration: 0.3 }}
        >
          <FragmentCard
            fragment={fragment}
            quantity={inventory[fragment.id] || 0}
            selected={selectedIds.includes(fragment.id)}
            onClick={selectable ? () => onSelect?.(fragment.id) : undefined}
            size="sm"
          />
        </motion.div>
      ))}
    </div>
  );
}
