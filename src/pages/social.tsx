import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { usePlayer } from "@/hooks/usePlayer";
import TopBar from "@/components/layout/TopBar";

const EMBER_ICON = `https://psibadkdncspgikzzmnu.supabase.co/storage/v1/object/public/Fragments/ember.png`;

const ENGAGEMENT_TWEET_URLS = [
  "https://x.com/KnightmaresETH/status/2058812155391033648",
];

const ENGAGEMENT_TWEET_IDS = [
  "2058812155391033648",
];

const THIRTY_SECONDS = 30 * 1000;

type TaskStatus = "locked" | "available" | "timer" | "completed";

interface EngagementTask {
  id: string;
  label: string;
  ember: number;
  action: "like" | "retweet" | "comment" | "quote" | "follow";
  url: string;
  optional?: boolean;
}

const FOLLOW_URL = "https://x.com/KnightmaresETH";

const FOLLOW_TASKS: EngagementTask[] = [
  { id: "follow_knightmares", label: "FOLLOW", ember: 250, action: "follow", url: FOLLOW_URL },
];

const ENGAGEMENT_TASK_GROUPS: EngagementTask[][] = [
  [
    { id: "like_5",    label: "LIKE",    ember: 250, action: "like",    url: ENGAGEMENT_TWEET_URLS[0] },
    { id: "retweet_5", label: "RETWEET", ember: 250, action: "retweet", url: ENGAGEMENT_TWEET_URLS[0] },
    { id: "comment_5", label: "COMMENT", ember: 250, action: "comment", url: ENGAGEMENT_TWEET_URLS[0] },
  ],
];

export default function SocialTasks() {
  const { player, invalidate: refreshPlayer } = usePlayer();
  const [unlockedGroups, setUnlockedGroups] = useState<boolean[]>([true]);
  const [completedEngagement, setCompletedEngagement] = useState<Set<string>>(new Set());
  const [engagementTimers, setEngagementTimers] = useState<Record<string, number>>({});
  const [showCommentModal, setShowCommentModal] = useState<string | null>(null);
  const [commentLink, setCommentLink] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [flashTask, setFlashTask] = useState<string | null>(null);
  const [commentModalGroup, setCommentModalGroup] = useState(0);

  const intervalRefs = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  // ── Load state from DB + localStorage on mount ───────────────────────────
  useEffect(() => {
    const savedTimers = localStorage.getItem("km_engagement_timers");
    if (savedTimers) setEngagementTimers(JSON.parse(savedTimers));

    // Load completed tasks from DB so localStorage wipe doesn't let users re-earn
    supabase.from("social_tasks").select("task_id").then(({ data }) => {
      if (data && data.length > 0) {
        const ids = new Set<string>(data.map((r: any) => r.task_id));
        setCompletedEngagement(ids);
        localStorage.setItem("km_engagement", JSON.stringify([...ids]));
      } else {
        const savedEngagement = localStorage.getItem("km_engagement");
        if (savedEngagement) setCompletedEngagement(new Set<string>(JSON.parse(savedEngagement)));
      }
    });
  }, []);

  // ── Global countdown ticker ────────────────────────────────────────────────
  useEffect(() => {
    const tick = setInterval(() => {
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

  // ── Unlock next group ──────────────────────────────────────────────────────
  const unlockNextGroup = useCallback((groupIndex: number) => {
    setUnlockedGroups((prev) => {
      const next = [...prev];
      if (groupIndex + 1 < next.length) next[groupIndex + 1] = true;
      return next;
    });
  }, []);

  // ── Engagement Task Handler ────────────────────────────────────────────────
  const handleEngagement = useCallback((task: EngagementTask, groupIndex: number) => {
    if (!unlockedGroups[groupIndex] || completedEngagement.has(task.id)) return;

    if (task.action === "comment") {
      setCommentModalGroup(groupIndex);
      setShowCommentModal(task.id);
      return;
    }

    // All actions — like, retweet, quote, follow — open the tweet/profile directly
    window.open(task.url, "_blank");

    setEngagementTimers((prev) => ({ ...prev, [task.id]: THIRTY_SECONDS }));

    setTimeout(() => {
      setCompletedEngagement((prev) => {
        const next = new Set([...prev, task.id]);
        localStorage.setItem("km_engagement", JSON.stringify([...next]));
        return next;
      });

      supabase.rpc("complete_social_task", {
        p_task_id: task.id,
        p_cycle_start: new Date().toISOString(),
      }).then(({ data }) => {
        if (data?.success) refreshPlayer();
      });

      unlockNextGroup(groupIndex);

      setFlashTask(task.id);
      setTimeout(() => setFlashTask(null), 2000);
    }, THIRTY_SECONDS);
  }, [unlockedGroups, completedEngagement, refreshPlayer, unlockNextGroup]);

  // ── Submit Comment Link ────────────────────────────────────────────────────
  const submitComment = useCallback((groupIndex: number) => {
    if (!commentLink.trim() || !showCommentModal) return;

    setLoading(showCommentModal);
    const taskId = showCommentModal;

    supabase.from("pending_comments").insert({
      user_id: player?.id,
      task_id: taskId,
      comment_url: commentLink,
      submitted_at: new Date().toISOString(),
    }).then(() => {
      setLoading(null);
      setShowCommentModal(null);
      setCommentLink("");

      setCompletedEngagement((prev) => {
        const next = new Set([...prev, taskId]);
        localStorage.setItem("km_engagement", JSON.stringify([...next]));
        return next;
      });

      supabase.rpc("complete_social_task", {
        p_task_id: taskId,
        p_cycle_start: new Date().toISOString(),
      }).then(({ data }) => {
        if (data?.success) refreshPlayer();
      });

      unlockNextGroup(groupIndex);

      setFlashTask(taskId);
      setTimeout(() => setFlashTask(null), 2000);
    });
  }, [commentLink, showCommentModal, player?.id, refreshPlayer, unlockNextGroup]);

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

        {/* ── FOLLOW TASKS ──────────────────────────────────────────────────── */}
        <div className="mb-3">
          <p className="font-['Press_Start_2P'] text-[8px] text-[#4a3a5e] mb-3 tracking-widest">
            FOLLOW
          </p>
        </div>

        {FOLLOW_TASKS.map((task) => {
          const done = completedEngagement.has(task.id);
          const timer = engagementTimers[task.id] || 0;
          const isActive = !done && timer === 0;

          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="relative rounded-xl border-2 overflow-hidden mb-4 border-amber-600/50 bg-[#0d0a04]"
            >
              <div className="p-4 pb-2">
                <div className="flex items-center gap-2 mb-3">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-amber-400">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span className="font-['Press_Start_2P'] text-[8px] text-amber-400/70">
                    @KnightmaresETH
                  </span>
                </div>
                <a
                  href={task.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => !done && handleEngagement(task, -1)}
                  className="block border rounded-lg p-3 text-center bg-amber-900/10 border-amber-800/20 hover:bg-amber-900/20 hover:border-amber-600/40 transition-all cursor-pointer"
                >
                  <p className="font-['VT323'] text-amber-400/70 text-base">
                    {done ? "✓ Following @KnightmaresETH" : "Follow to earn 250 EMBER"}
                  </p>
                </a>
              </div>

              <div className="grid border-t border-amber-900/30 grid-cols-1">
                <button
                  onClick={() => handleEngagement(task, -1)}
                  disabled={!isActive}
                  className={`relative p-3 flex flex-col items-center gap-1 transition-all ${
                    done
                      ? "bg-emerald-900/10"
                      : isActive
                      ? "hover:bg-amber-900/10 cursor-pointer"
                      : "cursor-not-allowed opacity-40"
                  }`}
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
                      <span className="font-['Press_Start_2P'] text-[10px] text-amber-300">
                        +{task.ember}
                      </span>
                      <span className="font-['Press_Start_2P'] text-[6px] text-amber-600/70">
                        {task.label}
                      </span>
                    </>
                  )}
                  {flashTask === task.id && (
                    <motion.div
                      initial={{ opacity: 0.6 }}
                      animate={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0 bg-amber-400/20 pointer-events-none"
                    />
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}

        {/* ── ENGAGEMENT TASK ───────────────────────────────────────────────── */}
        <div className="mb-3">
          <p className="font-['Press_Start_2P'] text-[8px] text-[#4a3a5e] mb-3 tracking-widest">
            TWEET ENGAGEMENT
          </p>
        </div>

        {ENGAGEMENT_TASK_GROUPS.map((group, groupIndex) => {
          const isUnlocked = unlockedGroups[groupIndex];
          const tweetId = ENGAGEMENT_TWEET_IDS[groupIndex];
          const tweetUrl = ENGAGEMENT_TWEET_URLS[groupIndex];

          return (
            <motion.div
              key={groupIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative rounded-xl border-2 overflow-hidden mb-4 border-amber-600/50 bg-[#0d0a04]"
            >
              {/* Tweet Header */}
              <div className="p-4 pb-2">
                <div className="flex items-center gap-2 mb-3">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-amber-400">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span className="font-['Press_Start_2P'] text-[8px] text-amber-400/70">
                    POST #{tweetId.slice(-6)}
                  </span>
                  <a
                    href={tweetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto font-['Press_Start_2P'] text-[6px] text-amber-600/60 hover:text-amber-400 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    OPEN ON X
                  </a>
                </div>

                <div className="border rounded-lg p-3 text-center bg-amber-900/10 border-amber-800/20">
                  <p className="font-['VT323'] text-amber-400/70 text-base">
                    750 EMBER total — Like, Retweet &amp; Comment
                  </p>
                </div>
              </div>

              {/* Engagement Buttons */}
              <div className="grid border-t border-amber-900/30 grid-cols-3">
                {group.map((task, taskIndex) => {
                  const done = completedEngagement.has(task.id);
                  const timer = engagementTimers[task.id] || 0;
                  const isActive = isUnlocked && !done && timer === 0;
                  const isLast = taskIndex === group.length - 1;

                  return (
                    <button
                      key={task.id}
                      onClick={() => handleEngagement(task, groupIndex)}
                      disabled={!isActive}
                      className={`relative p-3 flex flex-col items-center gap-1 transition-all ${
                        done
                          ? "bg-emerald-900/10"
                          : isActive
                          ? "hover:bg-amber-900/10 cursor-pointer"
                          : "cursor-not-allowed opacity-40"
                      } ${!isLast ? "border-r border-amber-900/30" : ""}`}
                    >
                      {task.optional && !done && (
                        <span className="font-['Press_Start_2P'] text-[5px] text-amber-600/60 mb-0.5">
                          OPTIONAL
                        </span>
                      )}

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
                          <span className="font-['Press_Start_2P'] text-[10px] text-amber-300">
                            +{task.ember}
                          </span>
                          <span className="font-['Press_Start_2P'] text-[6px] text-amber-600/70">
                            {task.label}
                          </span>
                        </>
                      )}

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
            </motion.div>
          );
        })}

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
                  onClick={() => submitComment(commentModalGroup)}
                  disabled={!commentLink.trim() || loading === showCommentModal}
                  className="flex-1 font-['Press_Start_2P'] text-[8px] px-4 py-2.5 bg-[#7c3aed] border border-[#a855f7] text-white rounded disabled:opacity-40"
                >
                  {loading === showCommentModal ? "..." : "SUBMIT +250"}
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
