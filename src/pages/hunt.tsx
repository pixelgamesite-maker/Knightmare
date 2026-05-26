import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayer } from "@/hooks/usePlayer";
import { useInventory } from "@/hooks/useInventory";
import { supabase } from "@/lib/supabase";
import { FRAGMENTS, CDN } from "@/lib/fragments";
import TopBar from "@/components/layout/TopBar";

const EMBER_ICON = `https://psibadkdncspgikzzmnu.supabase.co/storage/v1/object/public/Fragments/ember.png`;

// ── 48-hour hunt reset timer key ─────────────────────────────────────────────
const HUNT_TIMER_KEY = "km_hunt_reset_end";
const FORTY_EIGHT_HOURS = (48 * 60 + 210) * 60 * 1000; // 51h 30m (48h + 3h30m)

type AggregatedLoot = {
  fragments: Record<string, number>;
  ember: number;
  empty: number;
  total: number;
};

export default function Hunt() {
  const { player, invalidate: refreshPlayer } = usePlayer();
  const { invalidate: refreshInv } = useInventory();
  const [loot, setLoot] = useState<AggregatedLoot | null>(null);
  const [opening, setOpening] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [count, setCount] = useState(1);
  const [msLeft, setMsLeft] = useState(0);

  // ── 48-hour countdown (persisted in localStorage) ─────────────────────────
  const [huntMsLeft, setHuntMsLeft] = useState(0);

  useEffect(() => {
    // Read (or initialise) the end timestamp
    const stored = localStorage.getItem(HUNT_TIMER_KEY);
    let endTs: number;

    if (stored) {
      endTs = parseInt(stored, 10);
    } else {
      // First visit — start the 48 h clock from now
      endTs = Date.now() + FORTY_EIGHT_HOURS;
      localStorage.setItem(HUNT_TIMER_KEY, String(endTs));
    }

    const tick = () => {
      const left = Math.max(0, endTs - Date.now());
      setHuntMsLeft(left);

      // When it hits 0, restart the 48 h window automatically
      if (left === 0) {
        const next = Date.now() + FORTY_EIGHT_HOURS;
        localStorage.setItem(HUNT_TIMER_KEY, String(next));
        endTs = next;
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const fmtHunt = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return {
      h: String(h).padStart(2, "0"),
      m: String(m).padStart(2, "0"),
      s: String(s).padStart(2, "0"),
    };
  };

  const huntTime = fmtHunt(huntMsLeft);

  // ── Use player.ember ───────────────────────────────────────────────────────
  const emberBalance = (player as any)?.ember ?? 0;

  const maxChests = useMemo(() => {
    return Math.floor(emberBalance / 500);
  }, [emberBalance]);

  const cappedCount = Math.min(count, maxChests);
  const totalCost = cappedCount * 500;
  const setMax = () => setCount(maxChests);

  // ── 1-hour cooldown using last_ember_claim ────────────────────────────────
  const ONE_HOUR = 60 * 60 * 1000;
  const lastClaim = (player as any)?.last_ember_claim;
  const canClaim =
    !lastClaim ||
    new Date(lastClaim).getTime() + ONE_HOUR < Date.now();

  useEffect(() => {
    if (canClaim) { setMsLeft(0); return; }
    const tick = () => {
      const left = Math.max(
        0,
        new Date(lastClaim).getTime() + ONE_HOUR - Date.now()
      );
      setMsLeft(left);
      if (left === 0) refreshPlayer();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lastClaim, canClaim]);

  const fmt = (ms: number) => {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${m}m ${s}s`;
  };

  // ── Open chests ────────────────────────────────────────────────────────────
  const openChests = async () => {
    if (maxChests < 1 || cappedCount < 1) return;
    setOpening(true);
    const aggregated: AggregatedLoot = {
      fragments: {},
      ember: 0,
      empty: 0,
      total: cappedCount,
    };

    const promises = Array.from({ length: cappedCount }, () =>
      supabase.rpc("open_chest")
    );
    const results = await Promise.all(promises);

    results.forEach(({ data }) => {
      if (!data?.success) return;
      if (data.type === "fragment") {
        const key = data.fragment as string;
        aggregated.fragments[key] = (aggregated.fragments[key] || 0) + 1;
      } else if (data.type === "gold") {
        aggregated.ember += (data.amount as number) || 0;
      } else if (data.type === "empty") {
        aggregated.empty += 1;
      }
    });

    setOpening(false);
    setLoot(aggregated);
    refreshPlayer();
    refreshInv();
    setTimeout(() => setLoot(null), 5000);
  };

  // ── Claim ember ────────────────────────────────────────────────────────────
  const claimEmber = async () => {
    if (!canClaim) return;
    setClaiming(true);
    const { data } = await supabase.rpc("claim_ember");
    setClaiming(false);
    if (data?.success) refreshPlayer();
    else alert(data?.error || "Cooldown active");
  };

  const ticks = [1, 25, 50, 75, 100];

  // Percentage remaining for the ring
  const huntPct = huntMsLeft / FORTY_EIGHT_HOURS;
  const RING_R = 36;
  const RING_CIRC = 2 * Math.PI * RING_R;

  return (
    <div className="min-h-[100dvh] bg-[#04020c] text-white relative overflow-hidden">
      <TopBar />
      <div
        className="absolute inset-0 pointer-events-none z-10 opacity-30"
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

        {/* ── 48-HOUR HUNT RESET COUNTDOWN ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8 w-full max-w-xs"
        >
          <div
            className="relative rounded-xl border border-[#2d1a4e] bg-[#0a0614] p-4 flex items-center gap-4 overflow-hidden"
            style={{ boxShadow: "0 0 20px rgba(124,58,237,0.08)" }}
          >
            {/* Subtle glow strip */}
            <div
              className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl"
              style={{
                background: "linear-gradient(to bottom, #7c3aed, #22d3ee, #7c3aed)",
                opacity: 0.6,
              }}
            />

            {/* SVG ring */}
            <div className="relative shrink-0 w-[88px] h-[88px] flex items-center justify-center">
              <svg
                width="88"
                height="88"
                viewBox="0 0 88 88"
                className="-rotate-90 absolute inset-0"
              >
                {/* Track */}
                <circle
                  cx="44"
                  cy="44"
                  r={RING_R}
                  fill="none"
                  stroke="#1a0a2e"
                  strokeWidth="5"
                />
                {/* Progress */}
                <circle
                  cx="44"
                  cy="44"
                  r={RING_R}
                  fill="none"
                  stroke="url(#huntGrad)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={RING_CIRC}
                  strokeDashoffset={RING_CIRC * (1 - huntPct)}
                  style={{ transition: "stroke-dashoffset 1s linear" }}
                />
                <defs>
                  <linearGradient id="huntGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#22d3ee" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Time digits inside ring */}
              <div className="flex flex-col items-center z-10">
                <span
                  className="font-['Press_Start_2P'] text-[11px] text-cyan-400 leading-none"
                  style={{ textShadow: "0 0 10px rgba(34,211,238,0.5)" }}
                >
                  {huntTime.h}:{huntTime.m}
                </span>
                <span
                  className="font-['Press_Start_2P'] text-[8px] text-[#6b5a80] mt-0.5"
                >
                  :{huntTime.s}
                </span>
              </div>
            </div>

            {/* Labels */}
            <div className="flex flex-col gap-1 pl-1">
              <p className="font-['Press_Start_2P'] text-[8px] text-[#a855f7]">
                THE HUNT ENDs
              </p>
              <p className="font-['VT323'] text-[#6b5a80] text-sm leading-snug">
                Forge your knight before the timer hits zero
              </p>
              <div className="flex gap-2 mt-1">
                {(["h", "m", "s"] as const).map((unit) => (
                  <div key={unit} className="flex flex-col items-center">
                    <span className="font-['Press_Start_2P'] text-[9px] text-white">
                      {huntTime[unit]}
                    </span>
                    <span className="font-['Press_Start_2P'] text-[5px] text-[#4a3a5e] mt-0.5">
                      {unit === "h" ? "HRS" : unit === "m" ? "MIN" : "SEC"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Chest cost */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 text-center"
        >
          <p className="font-['Press_Start_2P'] text-[10px] text-[#6b5a80] mb-2">
            CHEST COST
          </p>
          <div className="flex items-center justify-center gap-2">
            <img src={EMBER_ICON} alt="ember" className="w-4 h-4 object-contain" />
            <p
              className="font-['Press_Start_2P'] text-[14px] text-amber-400"
              style={{ textShadow: "0 0 15px rgba(251,191,36,0.4)" }}
            >
              500 EMBER
            </p>
          </div>
        </motion.div>

        {/* Quantity slider */}
        <div className="w-full max-w-xs mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-['Press_Start_2P'] text-[8px] text-[#6b5a80]">
              QUANTITY
            </span>
            <div className="flex items-center gap-3">
              <span className="font-['VT323'] text-xl text-cyan-400">
                {cappedCount}
              </span>
              <button
                onClick={setMax}
                disabled={maxChests < 1}
                className="font-['Press_Start_2P'] text-[7px] px-2 py-1 bg-[#1a0a2e] border border-[#7c3aed] text-[#a855f7] rounded hover:bg-[#7c3aed] hover:text-white transition-colors disabled:opacity-30"
              >
                MAX
              </button>
            </div>
          </div>

          <div className="relative h-10 flex items-center">
            <div className="absolute w-full h-2 bg-[#1a0a2e] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#7c3aed] to-[#22d3ee]"
                initial={false}
                animate={{
                  width: `${maxChests > 0 ? (cappedCount / maxChests) * 100 : 0}%`,
                }}
              />
            </div>
            <input
              type="range"
              min={1}
              max={Math.max(1, maxChests)}
              value={cappedCount}
              onChange={(e) => setCount(Number(e.target.value))}
              disabled={maxChests < 1 || opening}
              className="absolute w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-20"
            />
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 w-5 h-8 bg-[#0a0614] border-2 border-[#22d3ee] rounded shadow-[0_0_10px_rgba(34,211,238,0.5)] z-10 pointer-events-none flex items-center justify-center"
              initial={false}
              animate={{
                left: `calc(${
                  maxChests > 0 ? (cappedCount / maxChests) * 100 : 0
                }% - 10px)`,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <div className="w-1 h-4 bg-[#22d3ee]/50 rounded-full" />
            </motion.div>
          </div>

          <div className="flex justify-between mt-1 px-0.5">
            {ticks.map((t) => (
              <span
                key={t}
                className={`font-['Press_Start_2P'] text-[6px] ${
                  t <= maxChests ? "text-[#4a3a5e]" : "text-[#1a0a2e]"
                }`}
              >
                {t > maxChests ? "" : t}
              </span>
            ))}
          </div>
        </div>

        {/* Total cost */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 text-center"
        >
          <p className="font-['Press_Start_2P'] text-[8px] text-[#6b5a80]">
            TOTAL COST
          </p>
          <div className="flex items-center justify-center gap-1.5">
            <img
              src={EMBER_ICON}
              alt="ember"
              className="w-3.5 h-3.5 object-contain opacity-80"
            />
            <p className="font-['VT323'] text-lg text-amber-400/80">
              {totalCost.toLocaleString()} EMBER
            </p>
          </div>
        </motion.div>

        {/* Chest */}
        <motion.div
          animate={
            opening
              ? { scale: [1, 1.08, 0.95, 1.05, 1], rotate: [0, -3, 3, -2, 0] }
              : {}
          }
          transition={{ repeat: opening ? Infinity : 0, duration: 0.8 }}
          className="relative w-56 h-56 mb-10 cursor-pointer"
          onClick={!opening ? openChests : undefined}
        >
          <div className="absolute inset-0 bg-purple-600/20 blur-3xl rounded-full" />
          <img
            src={opening ? `${CDN}/chest-open.png` : `${CDN}/chest-close.png`}
            alt="chest"
            className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_30px_rgba(168,85,247,0.5)]"
          />
          {cappedCount > 1 && !opening && (
            <div className="absolute -top-2 -right-2 bg-[#7c3aed] text-white font-['Press_Start_2P'] text-[8px] px-2 py-1 rounded border border-[#a855f7] z-20">
              x{cappedCount}
            </div>
          )}
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={openChests}
          disabled={opening || maxChests < 1}
          className="relative font-['Press_Start_2P'] text-[10px] px-10 py-4 bg-[#7c3aed] text-white rounded disabled:opacity-30 disabled:cursor-not-allowed border-2 border-[#a855f7] tracking-wider"
          style={{
            boxShadow:
              "0 0 20px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          {opening ? "OPENING..." : `OPEN x${cappedCount}`}
          <div className="absolute -top-1 -left-1 w-1.5 h-1.5 bg-[#22d3ee]" />
          <div className="absolute -bottom-1 -right-1 w-1.5 h-1.5 bg-[#22d3ee]" />
        </motion.button>

        {/* Claim Ember */}
        <div className="mt-6 text-center">
          <motion.button
            whileHover={{ scale: canClaim ? 1.05 : 1 }}
            whileTap={{ scale: canClaim ? 0.95 : 1 }}
            onClick={claimEmber}
            disabled={!canClaim || claiming}
            className={`font-['Press_Start_2P'] text-[8px] px-6 py-2 rounded border-2 tracking-wider transition-all ${
              canClaim
                ? "bg-amber-500/20 border-amber-500/50 text-amber-400 hover:bg-amber-500/30"
                : "bg-[#0d0420] border-[#1a0a2e] text-[#2d1a4e] cursor-not-allowed"
            }`}
          >
            {claiming
              ? "..."
              : canClaim
              ? "CLAIM EMBER"
              : `CLAIM IN ${fmt(msLeft)}`}
          </motion.button>
          {canClaim && (
            <p className="font-['VT323'] text-[#4a3a5e] text-sm mt-1">
              100 – 1000 EMBER
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="mt-8 flex gap-6 text-center">
          <div>
            <p className="font-['Press_Start_2P'] text-[8px] text-[#6b5a80]">OPENED</p>
            <p className="text-[10px] text-cyan-400 mt-1">
              {player?.total_chests_opened || 0}
            </p>
          </div>
          <div>
            <p className="font-['Press_Start_2P'] text-[8px] text-[#6b5a80]">GTD</p>
            <p className="text-[10px] text-purple-400 mt-1">
              {player?.forged_gtd ? "YES" : "NO"}
            </p>
          </div>
          <div>
            <p className="font-['Press_Start_2P'] text-[8px] text-[#6b5a80]">FCFS</p>
            <p className="text-[10px] text-purple-400 mt-1">
              {player?.forged_fcfs ? "YES" : "NO"}
            </p>
          </div>
        </div>
      </div>

      {/* Loot Modal */}
      <AnimatePresence>
        {loot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 10 }}
              transition={{ type: "spring", damping: 15 }}
              className="bg-[#0a0614] border-2 border-[#7c3aed] p-6 rounded text-center relative max-w-sm w-full max-h-[80dvh] overflow-y-auto"
              style={{ boxShadow: "0 0 40px rgba(124,58,237,0.3)" }}
            >
              <div className="absolute -top-1 -left-1 w-2 h-2 bg-[#22d3ee]" />
              <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#22d3ee]" />

              <p className="font-['Press_Start_2P'] text-[10px] text-cyan-400 mb-1">
                CRATES OPENED
              </p>
              <p className="font-['VT323'] text-2xl text-white mb-4">{loot.total}</p>

              <div className="space-y-3">
                {loot.ember > 0 && (
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-amber-500/10 border border-amber-500/30 rounded p-3 flex items-center justify-center gap-2"
                  >
                    <img src={EMBER_ICON} alt="ember" className="w-5 h-5 object-contain" />
                    <div>
                      <p
                        className="font-['Press_Start_2P'] text-[16px] text-amber-400"
                        style={{ textShadow: "0 0 20px rgba(251,191,36,0.5)" }}
                      >
                        +{loot.ember.toLocaleString()}
                      </p>
                      <p className="font-['Press_Start_2P'] text-[8px] text-amber-400/70 mt-1">
                        TOTAL EMBER
                      </p>
                    </div>
                  </motion.div>
                )}

                {Object.entries(loot.fragments).map(([key, qty], i) => (
                  <motion.div
                    key={key}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 + i * 0.08 }}
                    className="flex items-center gap-3 bg-[#1a0a2e] border border-[#7c3aed]/30 rounded p-3"
                  >
                    <img
                      src={`${CDN}/${FRAGMENTS[key].file}`}
                      alt=""
                      className="w-10 h-10 object-contain drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                    />
                    <div className="text-left flex-1">
                      <p className="font-['VT323'] text-lg text-[#c4b5d4]">
                        {FRAGMENTS[key].name}
                      </p>
                      <p className="font-['Press_Start_2P'] text-[8px] text-cyan-400">
                        x{qty}
                      </p>
                    </div>
                  </motion.div>
                ))}

                {loot.empty > 0 && (
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-[#0d0420] border border-[#2d1a4e] rounded p-3"
                  >
                    <p className="font-['Press_Start_2P'] text-[10px] text-[#6b5a80]">
                      {loot.empty} EMPTY {loot.empty === 1 ? "CRATE" : "CRATES"}
                    </p>
                  </motion.div>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setLoot(null)}
                className="mt-5 font-['Press_Start_2P'] text-[8px] px-4 py-2 bg-[#7c3aed]/20 border border-[#7c3aed] text-[#a855f7] rounded hover:bg-[#7c3aed]/40 transition-colors"
              >
                CLOSE
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
