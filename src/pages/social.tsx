import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { usePlayer } from "@/hooks/usePlayer";
import TopBar from "@/components/layout/TopBar";

const EMBER_ICON = `https://psibadkdncspgikzzmnu.supabase.co/storage/v1/object/public/Fragments/ember.png`;

// ─── Task definitions ────────────────────────────────────────────────────────
// Each task has an id, label, a tweet template, and whether it needs user input.
const TASK_TEMPLATES = [
  {
    id: "hype",
    label: "POST HYPE TWEET",
    icon: "⚔️",
    template:
      "The forge is alive. Knights are being summoned. @ArcaneKnights — the hunt begins. 🔥\n\n#ArcaneKnights #NFT",
  },
  {
    id: "flex",
    label: "FLEX YOUR LOOT",
    icon: "🏆",
    template:
      "Just cracked open a chest in @ArcaneKnights and the loot was INSANE 👀\n\nJoin the hunt 👇\n#ArcaneKnights",
  },
  {
    id: "recruit",
    label: "RECRUIT A KNIGHT",
    icon: "🛡️",
    template:
      "My squad is forging knights. You in? @ArcaneKnights — collect artifacts, build your knight, win a sneak.\n\n#ArcaneKnights #Web3",
  },
];

// 8-hour cycle in ms
const CYCLE_MS = 8 * 60 * 60 * 1000;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getNextCycleStart(): number {
  // Align to 8-hour UTC windows: 00:00, 08:00, 16:00
  const now = Date.now();
  const slot = Math.floor(now / CYCLE_MS);
  return (slot + 1) * CYCLE_MS;
}

function getCurrentCycleStart(): number {
  const now = Date.now();
  const slot = Math.floor(now / CYCLE_MS);
  return slot * CYCLE_MS;
}

function fmt(ms: number) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(
    s
  ).padStart(2, "0")}`;
}

// ─── Flying tweet animation ───────────────────────────────────────────────────
function FlyingTweet({ text, onDone }: { text: string; onDone: () => void }) {
  return (
    <motion.div
      className="fixed bottom-16 left-1/2 z-[100] pointer-events-none"
      initial={{ x: "-50%", y: 0, opacity: 1, scale: 1 }}
      animate={{ x: "60vw", y: "-80vh", opacity: 0, scale: 0.4, rotate: 15 }}
      transition={{ duration: 1.2, ease: "easeIn" }}
      onAnimationComplete={onDone}
    >
      <div className="bg-[#0d0420] border-2 border-[#7c3aed] rounded-xl px-4 py-3 max-w-[240px] shadow-[0_0_30px_rgba(124,58,237,0.6)]">
        <div className="flex items-center gap-2 mb-2">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#a855f7]">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span className="font-['Press_Start_2P'] text-[7px] text-[#a855f7]">
            POSTED
          </span>
        </div>
        <p className="font-['VT323'] text-[13px] text-[#c4b5d4] leading-tight line-clamp-3">
          {text}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SocialTasks() {
  const { player, invalidate: refreshPlayer } = usePlayer();

  // Countdown to next cycle
  const [msLeft, setMsLeft] = useState(() => getNextCycleStart() - Date.now());
  // Which cycle is currently active (changes every 8h)
  const [cycleKey, setCycleKey] = useState(() => getCurrentCycleStart());
  // Completed task ids for the current cycle (stored locally + optionally in DB)
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  // Flying tweet state
  const [flyingTweet, setFlyingTweet] = useState<string | null>(null);
  // Task being previewed
  const [preview, setPreview] = useState<string | null>(null);
  // Loading state per task
  const [loading, setLoading] = useState<string | null>(null);
  // Success flash
  const [flash, setFlash] = useState<string | null>(null);

  // ── Tick every second ──────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      const newCycle = getCurrentCycleStart();
      if (newCycle !== cycleKey) {
        // New cycle started — reset completions
        setCycleKey(newCycle);
        setCompleted(new Set());
      }
      setMsLeft(getNextCycleStart() - now);
    }, 1000);
    return () => clearInterval(id);
  }, [cycleKey]);

  // ── Load completed tasks for current cycle from DB ─────────────────────────
  useEffect(() => {
    if (!player?.id) return;
    supabase
      .from("social_tasks")
      .select("task_id")
      .eq("user_id", player.id)
      .gte("completed_at", new Date(cycleKey).toISOString())
      .then(({ data }) => {
        if (data) setCompleted(new Set(data.map((r) => r.task_id)));
      });
  }, [player?.id, cycleKey]);

  // ── Submit a task ──────────────────────────────────────────────────────────
  const submitTask = useCallback(
    async (taskId: string, tweetText: string) => {
      if (!player?.id || completed.has(taskId)) return;
      setLoading(taskId);
      setPreview(null);

      // Open Twitter intent
      const encoded = encodeURIComponent(tweetText);
      window.open(`https://twitter.com/intent/tweet?text=${encoded}`, "_blank");

      // Record in DB + award 500 ember
      const { data } = await supabase.rpc("complete_social_task", {
        p_task_id: taskId,
        p_cycle_start: new Date(cycleKey).toISOString(),
      });

      setLoading(null);

      if (data?.success) {
        setCompleted((prev) => new Set([...prev, taskId]));
        setFlyingTweet(tweetText);
        setFlash(taskId);
        setTimeout(() => setFlash(null), 2000);
        refreshPlayer();
      } else {
        alert(data?.error || "Could not record task. Try again.");
      }
    },
    [player?.id, completed, cycleKey, refreshPlayer]
  );

  const isActive = true; // tasks are always available; timer shows next refresh
  const allDone = TASK_TEMPLATES.every((t) => completed.has(t.id));

  return (
    <div className="min-h-[100dvh] bg-[#04020c] text-white relative overflow-hidden">
      <TopBar />

      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none z-10 opacity-20"
        style={{
          background:
            "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(168,85,247,0.04) 2px,rgba(168,85,247,0.04) 4px)",
        }}
      />

      <div className="pt-24 pb-16 px-4 max-w-lg mx-auto relative z-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1
            className="font-['Press_Start_2P'] text-[12px] text-[#a855f7] mb-2"
            style={{ textShadow: "0 0 12px rgba(168,85,247,0.6)" }}
          >
            📣 SOCIAL TASKS
          </h1>
          <p className="font-['VT323'] text-lg text-[#6b5a80]">
            Spread the word. Earn EMBER.
          </p>
        </motion.div>

        {/* 8-hour countdown */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8 bg-[#0a0614] border border-[#1a0a2e] rounded-lg p-4 text-center"
        >
          <p className="font-['Press_Start_2P'] text-[8px] text-[#4a3a5e] mb-2">
            NEXT REFRESH IN
          </p>
          <p
            className="font-['Press_Start_2P'] text-[20px] text-cyan-400 tracking-widest"
            style={{ textShadow: "0 0 10px rgba(34,211,238,0.4)" }}
          >
            {fmt(msLeft)}
          </p>
          <p className="font-['VT323'] text-[#4a3a5e] text-sm mt-1">
            Tasks reset every 8 hours
          </p>
        </motion.div>

        {/* Reward badge */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#2d1a4e]" />
          <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1">
            <img src={EMBER_ICON} alt="ember" className="w-3.5 h-3.5 object-contain" />
            <span className="font-['Press_Start_2P'] text-[8px] text-amber-400">
              500 EMBER / TASK
            </span>
          </div>
          <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#2d1a4e]" />
        </div>

        {/* Tasks */}
        <div className="space-y-4">
          {TASK_TEMPLATES.map((task, i) => {
            const done = completed.has(task.id);
            const isLoading = loading === task.id;
            const isFlashing = flash === task.id;

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative rounded-lg border-2 overflow-hidden transition-all duration-300 ${
                  done
                    ? "border-emerald-700/40 bg-[#061a0f]"
                    : isFlashing
                    ? "border-amber-400 bg-[#1a0a2e]"
                    : "border-[#2d1a4e] bg-[#0a0614] hover:border-[#7c3aed]"
                }`}
              >
                {/* Glow when flashing */}
                {isFlashing && (
                  <div className="absolute inset-0 bg-amber-400/5 pointer-events-none" />
                )}

                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{task.icon}</span>
                        <span
                          className={`font-['Press_Start_2P'] text-[9px] ${
                            done ? "text-emerald-400" : "text-[#c4b5d4]"
                          }`}
                        >
                          {done ? "✓ COMPLETED" : task.label}
                        </span>
                      </div>
                      <p className="font-['VT323'] text-[14px] text-[#6b5a80] leading-snug line-clamp-2">
                        {task.template}
                      </p>
                    </div>

                    {!done && (
                      <div className="flex flex-col gap-2 shrink-0">
                        <button
                          onClick={() =>
                            setPreview(preview === task.id ? null : task.id)
                          }
                          className="font-['Press_Start_2P'] text-[7px] px-2 py-1 bg-[#1a0a2e] border border-[#4a3a5e] text-[#6b5a80] rounded hover:border-[#7c3aed] hover:text-[#a855f7] transition-colors"
                        >
                          PREVIEW
                        </button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => submitTask(task.id, task.template)}
                          disabled={isLoading || !!loading}
                          className="font-['Press_Start_2P'] text-[7px] px-2 py-1.5 bg-[#7c3aed] border border-[#a855f7] text-white rounded disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                          style={{
                            boxShadow: "0 0 10px rgba(124,58,237,0.4)",
                          }}
                        >
                          {isLoading ? "..." : "TWEET"}
                        </motion.button>
                      </div>
                    )}

                    {done && (
                      <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-700/30 rounded px-2 py-1">
                        <img
                          src={EMBER_ICON}
                          alt="ember"
                          className="w-3 h-3 object-contain"
                        />
                        <span className="font-['Press_Start_2P'] text-[7px] text-emerald-400">
                          +500
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Preview expand */}
                  <AnimatePresence>
                    {preview === task.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 pt-3 border-t border-[#1a0a2e]">
                          <div className="bg-[#0d0420] border border-[#2d1a4e] rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <svg
                                viewBox="0 0 24 24"
                                className="w-3.5 h-3.5 fill-[#a855f7]"
                              >
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                              </svg>
                              <span className="font-['Press_Start_2P'] text-[7px] text-[#4a3a5e]">
                                TWEET PREVIEW
                              </span>
                            </div>
                            <p className="font-['VT323'] text-[15px] text-[#c4b5d4] leading-snug whitespace-pre-wrap">
                              {task.template}
                            </p>
                          </div>
                          <p className="font-['VT323'] text-[#4a3a5e] text-sm mt-2 text-center">
                            Clicking TWEET opens X/Twitter. Come back after posting to
                            receive your EMBER.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* All done banner */}
        <AnimatePresence>
          {allDone && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="mt-8 bg-emerald-900/20 border-2 border-emerald-700/40 rounded-lg p-5 text-center"
            >
              <p className="font-['Press_Start_2P'] text-[10px] text-emerald-400 mb-1">
                ALL TASKS DONE
              </p>
              <p className="font-['VT323'] text-lg text-emerald-400/70">
                Come back in {fmt(msLeft)} for a new set of tasks.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ember balance note */}
        <div className="mt-8 flex items-center justify-center gap-2 opacity-50">
          <img src={EMBER_ICON} alt="ember" className="w-3 h-3 object-contain" />
          <span className="font-['Press_Start_2P'] text-[7px] text-[#4a3a5e]">
            BALANCE: {(player?.gold || 0).toLocaleString()} EMBER
          </span>
        </div>
      </div>

      {/* Flying tweet animation */}
      <AnimatePresence>
        {flyingTweet && (
          <FlyingTweet
            text={flyingTweet}
            onDone={() => setFlyingTweet(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
