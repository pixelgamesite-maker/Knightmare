import { useState } from "react";
import { usePlayer } from "@/hooks/usePlayer";
import PlayerDrawer from "./PlayerDrawer";

const EMBER_ICON = `https://psibadkdncspgikzzmnu.supabase.co/storage/v1/object/public/Fragments/ember.png`;

export default function TopBar() {
  const [open, setOpen] = useState(false);
  const { player } = usePlayer();
  
  // Use ember instead of gold
  const emberBalance = (player as any)?.ember ?? 0;

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 bg-[#04020c]/90 backdrop-blur-sm border-b border-[#7c3aed]/20">
        <h1
          className="font-['Press_Start_2P'] text-[10px] text-[#a855f7] tracking-widest"
          style={{ textShadow: "0 0 10px rgba(168,85,247,0.5)" }}
        >
          KNIGHTMARE
        </h1>
        <button onClick={() => setOpen(true)} className="flex items-center gap-2 group">
          <div className="flex items-center gap-1.5">
            <img src={EMBER_ICON} alt="ember" className="w-3.5 h-3.5 object-contain" />
            <span className="text-amber-400 text-[10px] font-['Press_Start_2P'] group-hover:text-amber-300 transition-colors">
              {emberBalance.toLocaleString()}
            </span>
          </div>
          <div className="w-8 h-8 rounded border-2 border-[#7c3aed] overflow-hidden bg-[#0d0420]">
            <img
              src={player?.avatar_url || "/default-avatar.png"}
              className="w-full h-full object-cover"
              alt=""
            />
          </div>
        </button>
      </div>
      <PlayerDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
