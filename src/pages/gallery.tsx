import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayer } from "@/hooks/usePlayer";
import TopBar from "@/components/layout/TopBar";

const CDN =
  "https://psibadkdncspgikzzmnu.supabase.co/storage/v1/object/public/Fragments";
const TOTAL = 1234;
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
const COOLDOWN_KEY = "knight_shuffle_cooldown";
const WON_KNIGHT_KEY = "knight_shuffle_won";

const ALL_KNIGHTS = Array.from({ length: TOTAL }, (_, i) => ({
  id: i + 1,
  url: `${CDN}/Gallery/${i + 1}.gif`,
}));

function getRandomKnight() {
  return ALL_KNIGHTS[Math.floor(Math.random() * ALL_KNIGHTS.length)];
}

function formatTime(ms: number) {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${hours}h ${minutes}m ${seconds}s`;
}

export default function Gallery() {
  const { player } = usePlayer();
  const [displayKnight, setDisplayKnight] = useState(getRandomKnight);
  const [wonKnight, setWonKnight] = useState<(typeof ALL_KNIGHTS)[0] | null>(
    null
  );
  const [isShuffling, setIsShuffling] = useState(false);
  const [cooldownEnd, setCooldownEnd] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<<typeof setInterval> | null>(null);

  // ── Load persisted cooldown + won knight on mount ──
  useEffect(() => {
    const savedCooldown = localStorage.getItem(COOLDOWN_KEY);
    const savedWon = localStorage.getItem(WON_KNIGHT_KEY);

    if (savedCooldown) {
      const end = parseInt(savedCooldown, 10);
      if (end > Date.now()) {
        setCooldownEnd(end);
        if (savedWon) {
          const parsed = JSON.parse(savedWon);
          setWonKnight(parsed);
          setDisplayKnight(parsed);
        }
        return;
      }
      localStorage.removeItem(COOLDOWN_KEY);
      localStorage.removeItem(WON_KNIGHT_KEY);
    }
  }, []);

  // ── Countdown ticker ──
  useEffect(() => {
    if (!cooldownEnd) return;
    const tick = setInterval(() => {
      if (Date.now() >= cooldownEnd) {
        setCooldownEnd(null);
        localStorage.removeItem(COOLDOWN_KEY);
        localStorage.removeItem(WON_KNIGHT_KEY);
        clearInterval(tick);
      }
    }, 1000);
    return () => clearInterval(tick);
  }, [cooldownEnd]);

  const canShuffle = !cooldownEnd || Date.now() >= cooldownEnd;
  const msLeft = cooldownEnd ? Math.max(0, cooldownEnd - Date.now()) : 0;

  // ── Shuffle handler ──
  const handleShuffle = () => {
    if (!canShuffle || isShuffling) return;

    setIsShuffling(true);
    setWonKnight(null);

    let ticks = 0;
    const maxTicks = 28;

    intervalRef.current = setInterval(() => {
      setDisplayKnight(getRandomKnight());
      ticks++;

      if (ticks >= maxTicks) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        const final = getRandomKnight();
        setDisplayKnight(final);
        setWonKnight(final);
        setIsShuffling(false);

        const next = Date.now() + TWENTY_FOUR_HOURS;
        setCooldownEnd(next);
        localStorage.setItem(COOLDOWN_KEY, String(next));
        localStorage.setItem(WON_KNIGHT_KEY, JSON.stringify(final));
      }
    }, 70);
  };

  // ── Download handler ──
  const downloadKnight = async () => {
    if (!wonKnight) return;
    try {
      const res = await fetch(wonKnight.url);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Knight_${wonKnight.id}.gif`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(wonKnight.url, "_blank");
    }
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="min-h-[100dvh] bg-[#04020c] text-white relative overflow-hidden">
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

      <div className="pt-24 pb-10 px-4 flex flex-col items-center justify-center min-h-[100dvh] relative z-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1
            className="font-['Press_Start_2P'] text-[14px] text-[#a855f7] mb-3"
            style={{ textShadow: "0 0 15px rgba(168,85,247,0.5)" }}
          >
            KNIGHT SHUFFLE
          </h1>
          <p className="font-['VT323'] text-xl text-[#6b5a80]">
            {TOTAL.toLocaleString()} knights await in the dark
          </p>
        </motion.div>

        {/* Character Box */}
        <motion.div
          animate={
            isShuffling
              ? {
                  scale: [1, 1.03, 0.97, 1.02, 1],
                  rotate: [0, -2, 2, -1, 0],
                }
              : {}
          }
          transition={{ repeat: isShuffling ? Infinity : 0, duration: 0.35 }}
          className="relative w-72 h-72 sm:w-96 sm:h-96 mb-10"
        >
          <div className="absolute inset-0 bg-purple-600/20 blur-3xl rounded-full" />

          <div className="relative w-full h-full bg-[#0a0614] border-2 border-[#7c3aed] rounded-lg overflow-hidden shadow-[0_0_50px_rgba(124,58,237,0.35)]">
            <img
              src={displayKnight.url}
              alt={`Knight #${displayKnight.id}`}
              className="w-full h-full object-cover"
            />

            {/* ID Badge */}
            <div className="absolute top-3 left-3 bg-[#0a0614]/80 border border-[#7c3aed]/50 rounded px-2.5 py-1.5 backdrop-blur-sm">
              <span className="font-['Press_Start_2P'] text-[9px] text-[#a855f7]">
                #{displayKnight.id}
              </span>
            </div>

            {isShuffling && (
              <div className="absolute inset-0 bg-purple-500/10 animate-pulse pointer-events-none" />
            )}
          </div>

          {/* Corner accents */}
          <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-[#22d3ee]" />
          <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-[#22d3ee]" />
        </motion.div>

        {/* Shuffle Button */}
        <motion.button
          whileHover={canShuffle && !isShuffling ? { scale: 1.04 } : {}}
          whileTap={canShuffle && !isShuffling ? { scale: 0.96 } : {}}
          onClick={handleShuffle}
          disabled={!canShuffle || isShuffling}
          className="relative font-['Press_Start_2P'] text-[10px] px-12 py-4 bg-[#7c3aed] text-white rounded disabled:opacity-30 disabled:cursor-not-allowed border-2 border-[#a855f7] tracking-wider mb-3"
          style={{
            boxShadow:
              "0 0 25px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          {isShuffling
            ? "SUMMONING..."
            : canShuffle
            ? "SHUFFLE KNIGHT"
            : `WAIT ${formatTime(msLeft)}`}
          <div className="absolute -top-1 -left-1 w-2 h-2 bg-[#22d3ee]" />
          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#22d3ee]" />
        </motion.button>

        {!canShuffle && (
          <p className="font-['VT323'] text-[#4a3a5e] text-lg mb-6">
            Next summon available in {formatTime(msLeft)}
          </p>
        )}

        {/* Download & Share — only after a shuffle */}
        <AnimatePresence>
          {wonKnight && !isShuffling && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="flex flex-col items-center gap-3"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={downloadKnight}
                className="font-['Press_Start_2P'] text-[9px] px-10 py-3.5 bg-amber-500/20 border-2 border-amber-500/50 text-amber-400 rounded hover:bg-amber-500/30 transition-all tracking-wider"
                style={{ boxShadow: "0 0 20px rgba(245,158,11,0.3)" }}
              >
                DOWNLOAD KNIGHT #{wonKnight.id}
              </motion.button>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  const text = encodeURIComponent(
                    `Just summoned Knight #${wonKnight.id} from @ArcaneKnights\n\nThe forge has spoken.\n\n#ArcaneKnights #NFT`
                  );
                  window.open(
                    `https://twitter.com/intent/tweet?text=${text}`,
                    "_blank"
                  );
                }}
                className="font-['Press_Start_2P'] text-[7px] px-5 py-2 bg-[#0d0420] border border-[#4a3a5e] text-[#a855f7] rounded hover:border-[#7c3aed] transition-colors"
              >
                POST X
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer info */}
        <div className="mt-12 text-center max-w-sm">
          <p className="font-['Press_Start_2P'] text-[7px] text-[#2d1a4e] leading-relaxed">
            ONE SUMMON PER DAY. YOUR KNIGHT IS REVEALED WHEN THE SHUFFLE
            COMPLETES.
          </p>
        </div>
      </div>
    </div>
  );
}
