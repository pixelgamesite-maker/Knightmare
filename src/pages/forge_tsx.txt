import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import TopBar from "@/components/layout/TopBar";

// ── Forge Closed Page ────────────────────────────────────────────────────────
export default function Forge() {
  const [clicked, setClicked] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);

  const handleClick = () => {
    if (!clicked) setClicked(true);
  };

  // Spawn a small burst of particles on click
  const handleParticleClick = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const newParticles = Array.from({ length: 6 }, (_, i) => ({
      id: Date.now() + i,
      x,
      y,
    }));
    setParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles((prev) =>
        prev.filter((p) => !newParticles.find((np) => np.id === p.id))
      );
    }, 1000);
    handleClick();
  };

  return (
    <div
      className="min-h-[100dvh] bg-[#04020c] text-white relative overflow-hidden cursor-pointer select-none"
      onClick={handleParticleClick}
    >
      <TopBar />

      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none z-10 opacity-20"
        style={{
          background:
            "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(168,85,247,0.03) 2px,rgba(168,85,247,0.03) 4px)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            "radial-gradient(ellipse 100% 100% at 50% 50%,transparent 40%,rgba(4,2,12,0.9) 100%)",
        }}
      />

      {/* Click particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute pointer-events-none z-50 w-1 h-1 bg-[#a855f7] rounded-full"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
          initial={{ opacity: 1, scale: 1 }}
          animate={{
            opacity: 0,
            scale: 0,
            x: (Math.random() - 0.5) * 60,
            y: (Math.random() - 0.5) * 60,
          }}
          transition={{ duration: 0.8 }}
        />
      ))}

      <div className="pt-24 pb-10 px-4 flex flex-col items-center justify-center min-h-[100dvh] relative z-20 max-w-lg mx-auto gap-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1
            className="font-['Press_Start_2P'] text-[14px] text-[#a855f7] mb-3"
            style={{ textShadow: "0 0 15px rgba(168,85,247,0.5)" }}
          >
            ⚒ THE FORGE
          </h1>
        </motion.div>

        {/* Main announcement box */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="w-full bg-[#0a0614] border-2 border-[#7c3aed] rounded-lg p-7 relative text-center"
          style={{ boxShadow: "0 0 40px rgba(124,58,237,0.25)" }}
        >
          {/* Corner accents */}
          <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-[#22d3ee]" />
          <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-[#22d3ee]" />
          <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-[#22d3ee]" />
          <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-[#22d3ee]" />

          <AnimatePresence mode="wait">
            {!clicked ? (
              <motion.div
                key="prompt"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <p
                  className="font-['Press_Start_2P'] text-[9px] text-[#4a3a6e] leading-relaxed tracking-widest"
                  style={{ textShadow: "0 0 8px rgba(74,58,110,0.4)" }}
                >
                  [ CLICK TO REVEAL ]
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="message"
                initial={{ opacity: 0, scale: 0.92, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", damping: 14, stiffness: 120 }}
                className="flex flex-col items-center gap-4"
              >
                {/* Glow orb */}
                <motion.div
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ repeat: Infinity, duration: 2.4 }}
                  className="w-10 h-10 rounded-full bg-[#7c3aed]/30 blur-xl mb-1"
                />

                <p
                  className="font-['Press_Start_2P'] text-[10px] text-emerald-400 tracking-widest"
                  style={{ textShadow: "0 0 12px rgba(52,211,153,0.5)" }}
                >
                  ⚔ FORGE CLOSED ⚔
                </p>

                <p className="font-['VT323'] text-[22px] text-[#c4b5d4] leading-snug px-2">
                  The forge has come to an end, and all forged participants has been knighted.
                </p>

                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "60%" }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="h-px bg-gradient-to-r from-transparent via-[#7c3aed] to-transparent"
                />

                <p className="font-['Press_Start_2P'] text-[7px] text-[#4a3a6e] leading-relaxed">
                  ALL HUNTERS HAVE BEEN HONORED
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: clicked ? 0 : 1 }}
          transition={{ delay: 0.4 }}
          className="font-['Press_Start_2P'] text-[7px] text-[#2d1a4e] text-center"
        >
          TAP ANYWHERE TO CONTINUE
        </motion.p>

      </div>
    </div>
  );
}
