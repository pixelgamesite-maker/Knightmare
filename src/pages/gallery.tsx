import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayer } from "@/hooks/usePlayer";
import TopBar from "@/components/layout/TopBar";

const CDN = "https://psibadkdncspgikzzmnu.supabase.co/storage/v1/object/public/Fragments";
const TOTAL = 1234;
const PAGE_SIZE = 50;

// Generate all URLs sorted numerically (1, 2, 3 ... 1234)
const ALL_KNIGHTS = Array.from({ length: TOTAL }, (_, i) => ({
  id: i + 1,
  url: `${CDN}/Gallery/${i + 1}.gif`,
}));

// ── Raffle Modal ──────────────────────────────────────────────────────────────
function RaffleModal({ onClose }: { onClose: () => void }) {
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<{ id: number; url: string } | null>(null);
  const [currentDisplay, setCurrentDisplay] = useState(1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const roll = () => {
    setRolling(true);
    setResult(null);

    // Slot machine effect
    let ticks = 0;
    const maxTicks = 30;
    intervalRef.current = setInterval(() => {
      setCurrentDisplay(Math.floor(Math.random() * TOTAL) + 1);
      ticks++;
      if (ticks >= maxTicks) {
        clearInterval(intervalRef.current!);
        const winner = Math.floor(Math.random() * TOTAL) + 1;
        setCurrentDisplay(winner);
        setResult({ id: winner, url: `${CDN}/Gallery/${winner}.gif` });
        setRolling(false);
      }
    }, 60);
  };

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const tweetResult = () => {
    if (!result) return;
    const text = encodeURIComponent(
      `Just raffled Knight #${result.id} from @ArcaneKnights ⚔️\n\nThe forge has spoken. 🔥\n\n#ArcaneKnights #NFT`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.8, rotate: -6 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0.8, rotate: 6 }}
        transition={{ type: "spring", damping: 16 }}
        className="bg-[#0a0614] border-2 border-[#7c3aed] rounded-lg p-6 w-full max-w-sm text-center relative"
        style={{ boxShadow: "0 0 60px rgba(124,58,237,0.4)" }}
      >
        <div className="absolute -top-1 -left-1 w-2 h-2 bg-[#22d3ee]" />
        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#22d3ee]" />

        <h2
          className="font-['Press_Start_2P'] text-[11px] text-[#a855f7] mb-1"
          style={{ textShadow: "0 0 10px rgba(168,85,247,0.5)" }}
        >
          🎲 KNIGHT RAFFLE
        </h2>
        <p className="font-['VT323'] text-[#6b5a80] text-base mb-5">
          Spin to reveal your knight
        </p>

        {/* Display frame */}
        <div className="relative mx-auto w-44 h-44 mb-5 rounded-lg overflow-hidden border-2 border-[#2d1a4e] bg-[#0d0420]">
          <div className="absolute inset-0 bg-purple-600/10 blur-xl" />
          {(rolling || result) ? (
            <img
              src={`${CDN}/Gallery/${currentDisplay}.gif`}
              alt={`Knight #${currentDisplay}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="font-['Press_Start_2P'] text-[8px] text-[#2d1a4e]">???</span>
            </div>
          )}
          {rolling && (
            <div className="absolute inset-0 bg-purple-500/10 animate-pulse" />
          )}
        </div>

        {result && !rolling && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <p
              className="font-['Press_Start_2P'] text-[13px] text-cyan-400 mb-1"
              style={{ textShadow: "0 0 10px rgba(34,211,238,0.4)" }}
            >
              KNIGHT #{result.id}
            </p>
            <p className="font-['VT323'] text-[#6b5a80] text-base">
              Your knight has been chosen
            </p>
          </motion.div>
        )}

        <div className="flex gap-3 justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={roll}
            disabled={rolling}
            className="font-['Press_Start_2P'] text-[8px] px-5 py-2.5 bg-[#7c3aed] border-2 border-[#a855f7] text-white rounded disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ boxShadow: "0 0 15px rgba(124,58,237,0.4)" }}
          >
            {rolling ? "ROLLING..." : result ? "REROLL" : "ROLL"}
          </motion.button>

          {result && !rolling && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={tweetResult}
              className="font-['Press_Start_2P'] text-[8px] px-5 py-2.5 bg-[#0d0420] border-2 border-[#4a3a5e] text-[#a855f7] rounded hover:border-[#7c3aed] transition-colors"
            >
              POST 𝕏
            </motion.button>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-4 font-['Press_Start_2P'] text-[7px] text-[#4a3a5e] hover:text-[#6b5a80] transition-colors"
        >
          CLOSE
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Main Gallery ──────────────────────────────────────────────────────────────
export default function Gallery() {
  const { player } = usePlayer();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showRaffle, setShowRaffle] = useState(false);
  const [lightbox, setLightbox] = useState<{ id: number; url: string } | null>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Filter by search (knight number)
  const filtered = search.trim()
    ? ALL_KNIGHTS.filter((k) => String(k.id).includes(search.trim()))
    : ALL_KNIGHTS;

  const visible = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = visible.length < filtered.length;

  // Infinite scroll
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting && hasMore) setPage((p) => p + 1); },
      { threshold: 0.1 }
    );
    if (loaderRef.current) obs.observe(loaderRef.current);
    return () => obs.disconnect();
  }, [hasMore]);

  // Reset page on search
  useEffect(() => { setPage(1); }, [search]);

  return (
    <div className="min-h-[100dvh] bg-[#04020c] text-white relative">
      <TopBar />

      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none z-10 opacity-20"
        style={{
          background:
            "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(168,85,247,0.03) 2px,rgba(168,85,247,0.03) 4px)",
        }}
      />

      <div className="pt-20 pb-16 px-4 max-w-6xl mx-auto relative z-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1
                className="font-['Press_Start_2P'] text-[12px] text-[#a855f7] mb-2"
                style={{ textShadow: "0 0 10px rgba(168,85,247,0.5)" }}
              >
                ⚔️ KNIGHT GALLERY
              </h1>
              <p className="font-['VT323'] text-lg text-[#6b5a80]">
                {TOTAL.toLocaleString()} knights forged in the dark
              </p>
            </div>

            {/* Raffle button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowRaffle(true)}
              className="font-['Press_Start_2P'] text-[8px] px-4 py-2.5 bg-[#7c3aed]/20 border-2 border-[#7c3aed] text-[#a855f7] rounded hover:bg-[#7c3aed]/40 transition-all"
              style={{ boxShadow: "0 0 15px rgba(124,58,237,0.2)" }}
            >
              🎲 RAFFLE
            </motion.button>
          </div>

          {/* Search */}
          <div className="mt-4 relative max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-['Press_Start_2P'] text-[8px] text-[#4a3a5e]">
              #
            </span>
            <input
              type="number"
              placeholder="SEARCH KNIGHT NO."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0d0420] border border-[#2d1a4e] rounded px-8 py-2 font-['VT323'] text-base text-[#c4b5d4] placeholder-[#2d1a4e] focus:outline-none focus:border-[#7c3aed] transition-colors"
            />
          </div>

          {/* Count */}
          <p className="font-['Press_Start_2P'] text-[7px] text-[#2d1a4e] mt-3">
            SHOWING {visible.length} / {filtered.length}
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
          {visible.map((knight, i) => (
            <motion.div
              key={knight.id}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: Math.min(i * 0.003, 0.3) }}
              className="group aspect-square bg-[#0d0420] border border-[#1a0a2e] rounded overflow-hidden cursor-pointer hover:border-[#7c3aed] transition-all duration-200 relative"
              onClick={() => setLightbox(knight)}
            >
              <img
                src={knight.url}
                alt={`Knight #${knight.id}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              {/* ID badge on hover */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity py-1 text-center">
                <span className="font-['Press_Start_2P'] text-[6px] text-[#a855f7]">
                  #{knight.id}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Infinite scroll trigger */}
        {hasMore && (
          <div ref={loaderRef} className="mt-8 text-center">
            <p className="font-['Press_Start_2P'] text-[8px] text-[#2d1a4e] animate-pulse">
              LOADING...
            </p>
          </div>
        )}

        {!hasMore && filtered.length > 0 && (
          <p className="mt-10 text-center font-['Press_Start_2P'] text-[7px] text-[#1a0a2e]">
            ALL {filtered.length} KNIGHTS LOADED
          </p>
        )}

        {filtered.length === 0 && (
          <div className="mt-20 text-center">
            <p className="font-['Press_Start_2P'] text-[9px] text-[#4a3a5e]">
              NO KNIGHT FOUND
            </p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
            onClick={() => setLightbox(null)}
          >
            <motion.div
              initial={{ scale: 0.7 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.7 }}
              transition={{ type: "spring", damping: 18 }}
              className="relative max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="bg-[#0a0614] border-2 border-[#7c3aed] rounded-lg overflow-hidden"
                style={{ boxShadow: "0 0 60px rgba(124,58,237,0.4)" }}
              >
                <img
                  src={lightbox.url}
                  alt={`Knight #${lightbox.id}`}
                  className="w-full aspect-square object-cover"
                />
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <p
                      className="font-['Press_Start_2P'] text-[11px] text-[#a855f7]"
                      style={{ textShadow: "0 0 8px rgba(168,85,247,0.5)" }}
                    >
                      KNIGHT #{lightbox.id}
                    </p>
                    <p className="font-['VT323'] text-[#6b5a80] text-base mt-0.5">
                      Arcane Knights Collection
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={() => {
                      const text = encodeURIComponent(
                        `Knight #${lightbox.id} from @ArcaneKnights ⚔️\n\n#ArcaneKnights #NFT`
                      );
                      window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
                    }}
                    className="font-['Press_Start_2P'] text-[7px] px-3 py-2 bg-[#0d0420] border border-[#4a3a5e] text-[#a855f7] rounded hover:border-[#7c3aed] transition-colors"
                  >
                    POST 𝕏
                  </motion.button>
                </div>
              </div>
              <button
                onClick={() => setLightbox(null)}
                className="mt-3 w-full font-['Press_Start_2P'] text-[7px] text-[#4a3a5e] hover:text-[#6b5a80] transition-colors text-center"
              >
                CLOSE
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Raffle Modal */}
      <AnimatePresence>
        {showRaffle && <RaffleModal onClose={() => setShowRaffle(false)} />}
      </AnimatePresence>
    </div>
  );
}
