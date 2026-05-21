import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { usePlayer } from "@/hooks/usePlayer";
import TopBar from "@/components/layout/TopBar";

const EMBER_ICON = `https://psibadkdncspgikzzmnu.supabase.co/storage/v1/object/public/Fragments/ember.png`;

// ─── Task Configuration ─────────────────────────────────────────────────────

const TASK_1_TWEET = `Fragments have begun surfacing from the forge. ⚔️🔥
Helms. Swords. Relics long thought lost.
Complete your set and earn your place among the Knightmares.
@KnightmaresETH
#Knightmares`;

const TASK_1_URL = `https://twitter.com/intent/tweet?text=${encodeURIComponent(TASK_1_TWEET)}`;

const ENGAGEMENT_TWEET_URLS = [
  "https://x.com/KnightmaresETH/status/2057538104030814295",
  "https://x.com/knightmareseth/status/2056407954455212476?s=46",
];

const EIGHT_HOURS = 8 * 60 * 60 * 1000;
const THIRTY_SECONDS = 30 * 1000;

// ─── Types ───────────────────────────────────────────────────────────────────

type TaskStatus = "locked" | "available" | "timer" | "completed";

interface EngagementTask {
  id: string;
  label: string;
  ember: number;
  action: "like" | "retweet" | "comment";
  url: string;
}

const ENGAGEMENT_TASKS: EngagementTask[] = [
  { id: "like_1", label: "LIKE", ember: 150, action: "like", url: ENGAGEMENT_TWEET_URLS[0] },
  { id: "retweet_1", label: "RETWEET", ember: 150, action: "retweet", url: ENGAGEMENT_TWEET_URLS[0] },
  { id: "comment_1", label: "COMMENT", ember: 200, action: "comment", url: ENGAGEMENT_TWEET_URLS[0] },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(ms: number): string {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatShortTime(ms: number): string {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}m ${s}s`;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SocialTasks() {
  const { player, invalidate: refreshPlayer } = usePlayer();
  const [task1Status, setTask1Status] = useState<TaskStatus>("available");
  const [task1Timer, setTask1Timer] = useState(0);
  const [engagementUnlocked, setEngagementUnlocked] = useState(false);
  const [unlockTimer, setUnlockTimer] = useState(0);
  const [completedEngagement, setCompletedEngagement] = useState<Set<string>>(new Set());
  const [engagementTimers, setEngagementTimers] = useState<Record<string, number>>({});
  const [showCommentModal, setShowCommentModal] = useState<string | null>(null);
  const [commentLink, setCommentLink] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [flashTask, setFlashTask] = useState<string | null>(null);

  const intervalRefs = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  // ── Load state from localStorage on mount ──────────────────────────────────
  useEffect(() => {
    const savedTask1 = localStorage.getItem("km_task1");
    const savedUnlock = localStorage.getItem("km_unlock_time");
    const savedEngagement = localStorage.getItem("km_engagement");
    const savedTimers = localStorage.getItem("km_engagement_timers");

    if (savedTask1 === "completed") {
      setTask1Status("completed");

      if (savedEngagement) {
        // Engagement tasks have been started/completed — timer for 2B may be running
        const completed = new Set<string>(JSON.parse(savedEngagement));
        setCompletedEngagement(completed);

        if (savedUnlock) {
          const unlockTime = parseInt(savedUnlock, 10);
          if (Date.now() < unlockTime) {
            setUnlockTimer(unlockTime - Date.now());
          }
        }
        // Engagement section stays locked (2B timer running), but engagement 1 tasks visible
        // We still show engagement 1 tasks as completed, so keep engagementUnlocked true
        setEngagementUnlocked(true);
      } else {
        // No engagement done yet — unlock engagement 1 immediately
        setEngagementUnlocked(true);
      }
    }

    if (savedTimers) {
      setEngagementTimers(JSON.parse(savedTimers));
    }
  }, []);

  // ── Global countdown ticker ──────────────────────────────────────────────
  useEffect(() => {
    const tick = setInterval(() => {
      setUnlockTimer((prev) => {
        if (prev <= 1000) {
          return 0;
        }
        return prev - 1000;
      });

      setTask1Timer((prev) => (prev > 1000 ? prev - 1000 : 0));

      setEngagementTimers((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((k) => {
          if (next[k] > 1000) next[k] -= 1000;
          else delete next[k];
        });
        return next;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  // ── Task 1: Post Tweet ─────────────────────────────────────────────────────
  const handleTask1 = useCallback(() => {
    if (task1Status !== "available") return;

    window.open(TASK_1_URL, "_blank");
    setTask1Status("timer");
    setTask1Timer(THIRTY_SECONDS);

    // Auto-complete after 30s
    setTimeout(() => {
      setTask1Status("completed");
      localStorage.setItem("km_task1", "completed");

      // Award 500 EMBER
      supabase.rpc("complete_social_task", {
        p_task_id: "post_bullish_tweet",
        p_cycle_start: new Date().toISOString(),
      }).then(({ data }) => {
        if (data?.success) refreshPlayer();
      });

      // Unlock engagement 1 immediately — NO timer here
      setEngagementUnlocked(true);

      setFlashTask("task1");
      setTimeout(() => setFlashTask(null), 2000);
    }, THIRTY_SECONDS);
  }, [task1Status, refreshPlayer]);

  // ── Start 8h timer for Tweet 2B ───────────────────────────────────────────
  const startTweet2BTimer = useCallback(() => {
    const unlockTime = Date.now() + EIGHT_HOURS;
    localStorage.setItem("km_unlock_time", String(unlockTime));
    setUnlockTimer(EIGHT_HOURS);
  }, []);

  // ── Engagement Task Handler ────────────────────────────────────────────────
  const handleEngagement = useCallback((task: EngagementTask) => {
    if (!engagementUnlocked || completedEngagement.has(task.id)) return;

    // For comment task, show modal instead of timer
    if (task.action === "comment") {
      setShowCommentModal(task.id);
      return;
    }

    // Open the tweet
    window.open(task.url, "_blank");

    // Start 30s verification timer
    setEngagementTimers((prev) => ({ ...prev, [task.id]: THIRTY_SECONDS }));

    setTimeout(() => {
      setCompletedEngagement((prev) => {
        const next = new Set([...prev, task.id]);
        localStorage.setItem("km_engagement", JSON.stringify([...next]));
        return next;
      });

      // Award EMBER
      supabase.rpc("complete_social_task", {
        p_task_id: task.id,
        p_cycle_start: new Date().toISOString(),
      }).then(({ data }) => {
        if (data?.success) refreshPlayer();
      });

      // Start 8h timer for Tweet 2B on first completed engagement task
      startTweet2BTimer();

      setFlashTask(task.id);
      setTimeout(() => setFlashTask(null), 2000);
    }, THIRTY_SECONDS);
  }, [engagementUnlocked, completedEngagement, refreshPlayer, startTweet2BTimer]);

  // ── Submit Comment Link ────────────────────────────────────────────────────
  const submitComment = useCallback(() => {
    if (!commentLink.trim() || !showCommentModal) return;

    setLoading(showCommentModal);

    // Store for approval (in real app, send to admin queue)
    supabase.from("pending_comments").insert({
      user_id: player?.id,
      task_id: showCommentModal,
      comment_url: commentLink,
      submitted_at: new Date().toISOString(),
    }).then(() => {
      setLoading(null);
      setShowCommentModal(null);
      setCommentLink("");

      // Mark as completed
      setCompletedEngagement((prev) => {
        const next = new Set([...prev, showCommentModal]);
        localStorage.setItem("km_engagement", JSON.stringify([...next]));
        return next;
      });

      // Award immediately for UX (admin can revoke if fake)
      supabase.rpc("complete_social_task", {
        p_task_id: showCommentModal,
        p_cycle_start: new Date().toISOString(),
      }).then(({ data }) => {
        if (data?.success) refreshPlayer();
      });

      // Start 8h timer for Tweet 2B
      startTweet2BTimer();

      setFlashTask(showCommentModal);
      setTimeout(() => setFlashTask(null), 2000);
    });
  }, [commentLink, showCommentModal, player?.id, refreshPlayer, startTweet2BTimer]);

  const emberBalance = (player as any)?.ember ?? 0;

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
            SOCIALS
          </h1>
          <p className="font-['VT323'] text-lg text-[#6b5a80]">
            Complete tasks. Earn EMBER.
          </p>
        </motion.div>

        {/* ── TASK 1: POST BULLISH TWEET ───────────────────────────────────── */}
        <div className="mb-3">
          <p className="font-['Press_Start_2P'] text-[8px] text-[#4a3a5e] mb-3 tracking-widest">
            TWEET TASK
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative rounded-xl border-2 overflow-hidden transition-all duration-300 ${
            task1Status === "completed"
              ? "border-emerald-700/40 bg-[#061a0f]"
              : flashTask === "task1"
              ? "border-amber-400 bg-[#1a0a2e]"
              : "border-[#2d1a4e] bg-[#0a0614]"
          }`}
        >
          <div className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#a855f7] shrink-0">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span
                    className={`font-['Press_Start_2P'] text-[9px] ${
                      task1Status === "completed" ? "text-emerald-400" : "text-[#c4b5d4]"
                    }`}
                  >
                    {task1Status === "completed" ? "COMPLETED" : "POST BULLISH TWEET"}
                  </span>
                </div>
                <p className="font-['VT323'] text-[15px] text-[#6b5a80] leading-snug line-clamp-3">
                  {TASK_1_TWEET}
                </p>
              </div>

              {/* Right side: Timer or Button */}
              <div className="shrink-0 flex flex-col items-end gap-2">
                {task1Status === "available" && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleTask1}
                    className="font-['Press_Start_2P'] text-[8px] px-4 py-2 bg-[#7c3aed] border border-[#a855f7] text-white rounded-lg hover:bg-[#6d28d9] transition-colors"
                    style={{ boxShadow: "0 0 15px rgba(124,58,237,0.4)" }}
                  >
                    GO +500
                  </motion.button>
                )}

                {task1Status === "timer" && (
                  <div className="text-center">
                    <p
                      className="font-['Press_Start_2P'] text-[14px] text-cyan-400"
                      style={{ textShadow: "0 0 10px rgba(34,211,238,0.4)" }}
                    >
                      {Math.ceil(task1Timer / 1000)}s
                    </p>
                    <p className="font-['Press_Start_2P'] text-[6px] text-[#4a3a5e] mt-1">
                      VERIFYING
                    </p>
                  </div>
                )}

                {task1Status === "completed" && (
                  <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-700/30 rounded-lg px-3 py-2">
                    <img src={EMBER_ICON} alt="ember" className="w-3 h-3 object-contain" />
                    <span className="font-['Press_Start_2P'] text-[8px] text-emerald-400">
                      +500
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── TASK 2: ENGAGEMENT ──────────────────────────────────────────── */}
        <div className="mt-8 mb-3">
          <p className="font-['Press_Start_2P'] text-[8px] text-[#4a3a5e] mb-3 tracking-widest">
            TWEET ENGAGEMENT
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`relative rounded-xl border-2 overflow-hidden mb-4 ${
            engagementUnlocked ? "border-[#2d1a4e] bg-[#0a0614]" : "border-[#1a0a2e] bg-[#06030f] opacity-60"
          }`}
        >
          {/* Tweet Header */}
          <div className="p-4 pb-2">
            <div className="flex items-center gap-2 mb-3">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#a855f7]">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span className="font-['Press_Start_2P'] text-[8px] text-[#6b5a80]">
                POST #2056754762163376307
              </span>
              <a
                href={ENGAGEMENT_TWEET_URLS[0]}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto font-['Press_Start_2P'] text-[6px] text-[#4a3a5e] hover:text-[#a855f7] transition-colors flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                OPEN ON X
              </a>
            </div>

            <div className="bg-[#0d0420] border border-[#1a0a2e] rounded-lg p-4 text-center">
              <p className="font-['VT323'] text-[#4a3a5e] text-base">
                {engagementUnlocked
                  ? "Like, retweet or comment to earn EMBER"
                  : "Complete Tweet Task to unlock engagement rewards"}
              </p>
            </div>
          </div>

          {/* Engagement Buttons */}
          <div className="grid grid-cols-3 border-t border-[#1a0a2e]">
            {ENGAGEMENT_TASKS.map((task) => {
              const done = completedEngagement.has(task.id);
              const timer = engagementTimers[task.id] || 0;
              const isActive = engagementUnlocked && !done && timer === 0;

              return (
                <button
                  key={task.id}
                  onClick={() => handleEngagement(task)}
                  disabled={!isActive}
                  className={`relative p-3 flex flex-col items-center gap-1 transition-all ${
                    done
                      ? "bg-emerald-900/10"
                      : isActive
                      ? "hover:bg-[#1a0a2e] cursor-pointer"
                      : "cursor-not-allowed opacity-40"
                  } ${task.id !== "comment_1" ? "border-r border-[#1a0a2e]" : ""}`}
                >
                  {done ? (
                    <>
                      <span className="font-['Press_Start_2P'] text-[10px] text-emerald-400">
                        +{task.ember}
                      </span>
                      <span className="font-['Press_Start_2P'] text-[6px] text-emerald-600">
                        EMBER
                      </span>
                    </>
                  ) : timer > 0 ? (
                    <>
                      <span
                        className="font-['Press_Start_2P'] text-[12px] text-cyan-400"
                        style={{ textShadow: "0 0 8px rgba(34,211,238,0.3)" }}
                      >
                        {Math.ceil(timer / 1000)}s
                      </span>
                      <span className="font-['Press_Start_2P'] text-[6px] text-[#4a3a5e]">
                        VERIFYING
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="font-['Press_Start_2P'] text-[10px] text-white">
                        +{task.ember}
                      </span>
                      <span className="font-['Press_Start_2P'] text-[6px] text-[#6b5a80]">
                        {task.label}
                      </span>
                    </>
                  )}

                  {/* Flash effect */}
                  {flashTask === task.id && (
                    <motion.div
                      initial={{ opacity: 0.6 }}
                      animate={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0 bg-amber-400/20 pointer-events-none"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Lock overlay when task 1 not done */}
          {!engagementUnlocked && (
            <div className="absolute inset-0 bg-[#04020c]/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
              <p className="font-['Press_Start_2P'] text-[9px] text-[#4a3a5e]">
                COMPLETE TWEET TASK TO UNLOCK
              </p>
            </div>
          )}
        </motion.div>

        {/* ── TASK 2B: Second Tweet — locked behind 8h timer ───────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative rounded-xl border-2 border-[#1a0a2e] bg-[#06030f] overflow-hidden"
          style={{ opacity: unlockTimer > 0 ? 0.6 : 1 }}
        >
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#4a3a5e]">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span className="font-['Press_Start_2P'] text-[8px] text-[#2d1a4e]">
                POST #2056407954455212476
              </span>
            </div>
            <div className="bg-[#0d0420] border border-[#1a0a2e] rounded-lg p-4 text-center">
              <p className="font-['VT323'] text-[#2d1a4e] text-base">
                Available after 8-hour cooldown
              </p>
            </div>
          </div>

          {/* Lock overlay with countdown — only shows after first engagement done */}
          {unlockTimer > 0 && (
            <div className="absolute inset-0 bg-[#04020c]/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
              <p className="font-['Press_Start_2P'] text-[10px] text-[#a855f7] mb-2">
                LOCKED
              </p>
              <p
                className="font-['Press_Start_2P'] text-[16px] text-cyan-400"
                style={{ textShadow: "0 0 12px rgba(34,211,238,0.4)" }}
              >
                {formatTime(unlockTimer)}
              </p>
              <p className="font-['VT323'] text-[#4a3a5e] text-sm mt-1">
                Until next engagement tasks
              </p>
            </div>
          )}

          {/* No engagement done yet — show generic locked */}
          {unlockTimer === 0 && completedEngagement.size === 0 && task1Status === "completed" && (
            <div className="absolute inset-0 bg-[#04020c]/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
              <p className="font-['Press_Start_2P'] text-[9px] text-[#4a3a5e]">
                COMPLETE ENGAGEMENT TASK TO UNLOCK
              </p>
            </div>
          )}

          {/* Not started at all */}
          {task1Status !== "completed" && (
            <div className="absolute inset-0 bg-[#04020c]/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
              <p className="font-['Press_Start_2P'] text-[9px] text-[#4a3a5e]">
                LOCKED
              </p>
            </div>
          )}
        </motion.div>

        {/* Balance Footer */}
        <div className="mt-8 flex items-center justify-center gap-2 opacity-50">
          <img src={EMBER_ICON} alt="ember" className="w-3 h-3 object-contain" />
          <span className="font-['Press_Start_2P'] text-[7px] text-[#4a3a5e]">
            BALANCE: {emberBalance.toLocaleString()} EMBER
          </span>
        </div>
      </div>

      {/* ── Comment Modal ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showCommentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            onClick={() => setShowCommentModal(null)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              transition={{ type: "spring", damping: 16 }}
              className="bg-[#0a0614] border-2 border-[#7c3aed] rounded-lg p-6 w-full max-w-sm relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute -top-1 -left-1 w-2 h-2 bg-[#22d3ee]" />
              <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#22d3ee]" />

              <h2 className="font-['Press_Start_2P'] text-[10px] text-[#a855f7] mb-4">
                SUBMIT COMMENT LINK
              </h2>
              <p className="font-['VT323'] text-[#6b5a80] text-base mb-4">
                Paste the URL to your comment for verification
              </p>

              <input
                type="url"
                placeholder="https://x.com/.../status/..."
                value={commentLink}
                onChange={(e) => setCommentLink(e.target.value)}
                className="w-full bg-[#0d0420] border border-[#2d1a4e] rounded px-3 py-2 font-['VT323'] text-base text-[#c4b5d4] placeholder-[#4a3a5e] focus:outline-none focus:border-[#7c3aed] transition-colors mb-4"
              />

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={submitComment}
                  disabled={!commentLink.trim() || loading === showCommentModal}
                  className="flex-1 font-['Press_Start_2P'] text-[8px] px-4 py-2.5 bg-[#7c3aed] border border-[#a855f7] text-white rounded disabled:opacity-40"
                >
                  {loading === showCommentModal ? "..." : "SUBMIT +200"}
                </motion.button>
                <button
                  onClick={() => setShowCommentModal(null)}
                  className="font-['Press_Start_2P'] text-[8px] px-4 py-2.5 bg-[#1a0a2e] border border-[#4a3a5e] text-[#6b5a80] rounded hover:border-[#7c3aed] transition-colors"
                >
                  CANCEL
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
