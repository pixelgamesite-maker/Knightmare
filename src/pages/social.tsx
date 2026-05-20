import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayer } from "@/hooks/usePlayer";
import { supabase } from "@/lib/supabase";
import TopBar from "@/components/layout/TopBar";

const EMBER_ICON = "https://psibadkdncspgikzzmnu.supabase.co/storage/v1/object/public/Fragments/ember.png";
const EIGHT_HOURS = 8 * 60 * 60 * 1000;
const TEN_MINUTES = 10 * 60 * 1000;

type SocialTask = {
  id: string;
  tweet_url: string;
  title: string;
  description: string;
  reward: number;
  created_at: string;
  active: boolean;
};

export default function Social() {
  const { player, invalidate: refreshPlayer } = usePlayer();
  const [tasks, setTasks] = useState<SocialTask[]>([]);
  const [completedIds, setCompletedIds] = useState<<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!player?.id) return;
    const fetchData = async () => {
      const [{ data: allTasks }, { data: completions }] = await Promise.all([
        supabase.from("social_tasks").select("*").eq("active", true).order("created_at", { ascending: false }),
        supabase.from("social_completions").select("task_id").eq("user_id", player.id),
      ]);
      setTasks(allTasks || []);
      setCompletedIds(new Set(completions?.map((c: any) => c.task_id) || []));
      setLoading(false);
    };
    fetchData();
  }, [player?.id]);

  const availableTasks = useMemo(() => {
    return tasks.filter((t) => !completedIds.has(t.id));
  }, [tasks, completedIds]);

  const nextDropAt = useMemo(() => {
    if (availableTasks.length > 0) return null;
    if (tasks.length > 0) {
      const latest = new Date(tasks[0].created_at).getTime();
      return latest + EIGHT_HOURS;
    }
    return null;
  }, [availableTasks.length, tasks]);

  const msUntilNext = nextDropAt ? Math.max(0, nextDropAt - now) : 0;
  const isAlmostTime = nextDropAt !== null && msUntilNext > 0 && msUntilNext < TEN_MINUTES;
  const isActive = nextDropAt !== null && msUntilNext <= 0;

  const fmtCountdown = (ms: number) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const claimTask = async (task: SocialTask) => {
    setClaiming(task.id);
    setMsg(null);
    const { data, error } = await supabase.rpc("complete_social_task", { p_task_id: task.id });
    if (error || !data?.success) {
      setMsg(data?.error || "Claim failed. Try again.");
    } else {
      setMsg(`+${task.reward} EMBER CLAIMED!`);
      setCompletedIds((prev) => new Set(prev).add(task.id));
      refreshPlayer();
    }
    setClaiming(null);
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div className="min-h-[100dvh] bg-[#04020c] text-white relative overflow-hidden">
      <TopBar />
      <div className="absolute inset-0 pointer-events-none z-10 opacity-30"
        style={{ background: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(168,85,247,0.03) 2px,rgba(168,85,247,0.03) 4px)" }} />
      
      <div className="pt-24 pb-10 px-4 max-w-2xl mx-auto relative z-20">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
          <h1 className="font-['Press_Start_2P'] text-[12px] text-[#a855f7] mb-2" style={{ textShadow: "0 0 10px rgba(168,85,247,0.5)" }}>
            ★ SOCIAL TASKS
          </h1>
          <p className="text-[#6b5a80] font-['VT323'] text-lg">
            Complete quests. Earn EMBER. Reveal the knights.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 flex items-center justify-center gap-2 bg-[#0a0614] border border-[#2d1a4e] rounded p-3"
        >
          <img src={EMBER_ICON} alt="ember" className="w-5 h-5 object-contain" />
          <span className="font-['Press_Start_2P'] text-[10px] text-amber-400">
            {player?.gold?.toLocaleString() || 0}
          </span>
          <span className="font-['Press_Start_2P'] text-[8px] text-[#6b5a80]">EMBER</span>
        </motion.div>

        <AnimatePresence>
          {msg && (
            <motion.div 
              initial={{ opacity: 0, y: -10, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 text-center"
            >
              <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded px-4 py-2">
                <img src={EMBER_ICON} alt="ember" className="w-4 h-4 object-contain" />
                <p className="font-['Press_Start_2P'] text-[10px] text-amber-400" style={{ textShadow: "0 0 10px rgba(251,191,36,0.5)" }}>
                  {msg}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {availableTasks.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative bg-[#0a0614] border-2 rounded p-8 text-center transition-all ${
              isAlmostTime 
                ? "border-[#22d3ee] shadow-[0_0_40px_rgba(34,211,238,0.25)]" 
                : "border-[#2d1a4e]"
            }`}
          >
            <div className="absolute -top-1 -left-1 w-2 h-2 bg-[#22d3ee]" />
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#22d3ee]" />
            
            <p className="font-['Press_Start_2P'] text-[10px] text-[#6b5a80] mb-4">
              {isActive ? "// NEW TASK ACTIVE //" : "// NEXT DROP IN //"}
            </p>
            
            {nextDropAt ? (
              <div 
                className={`font-['VT323'] text-5xl mb-2 ${isAlmostTime ? "text-[#22d3ee]" : "text-cyan-400"}`} 
                style={{ textShadow: isAlmostTime ? "0 0 25px rgba(34,211,238,0.6)" : "0 0 20px rgba(34,211,238,0.4)" }}
              >
                {fmtCountdown(msUntilNext)}
              </div>
            ) : (
              <p className="font-['VT323'] text-2xl text-[#6b5a80]">NO SCHEDULED DROPS</p>
            )}
            
            <p className="font-['Press_Start_2P'] text-[7px] text-[#4a3a5e] mt-3 tracking-wider">
              {isAlmostTime ? "STANDBY... TASK IMMINENT" : "RETURN LATER FOR MORE EMBER"}
            </p>

            {isAlmostTime && (
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 rounded border border-[#22d3ee]/30 pointer-events-none"
              />
            )}
          </motion.div>
        )}

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {availableTasks.map((task, i) => (
              <motion.div
                key={task.id}
                layout
                initial={{ x: 300, opacity: 0, scale: 0.8, rotate: 8 }}
                animate={{ x: 0, opacity: 1, scale: 1, rotate: 0 }}
                exit={{ x: -300, opacity: 0, scale: 0.8, rotate: -8 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 100, 
                  damping: 12, 
                  delay: i * 0.12 
                }}
                className="relative bg-[#0a0614] border-2 border-[#2d1a4e] hover:border-[#7c3aed] rounded p-5 transition-colors"
              >
                <div className="absolute -top-1 -left-1 w-2 h-2 bg-[#22d3ee]" />
                <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#22d3ee]" />

                <div className="absolute -top-3 -right-2 bg-[#7c3aed] border border-[#a855f7] rounded px-2 py-1 flex items-center gap-1 shadow-[0_0_15px_rgba(124,58,237,0.4)]">
                  <img src={EMBER_ICON} alt="ember" className="w-3 h-3 object-contain" />
                  <span className="font-['Press_Start_2P'] text-[7px] text-white">500</span>
                </div>

                <div className="mb-3 pr-6">
                  <h3 className="font-['Press_Start_2P'] text-[9px] text-[#c4b5d4] mb-2 leading-relaxed">{task.title}</h3>
                  <p className="text-[#6b5a80] font-['VT323'] text-lg leading-relaxed">
                    {task.description}
                  </p>
                </div>

                <div className="flex items-center gap-3 mb-4 bg-[#0d0420] rounded border border-[#1a0a2e] p-2.5">
                  <span className="text-[#4a3a5e] font-['Press_Start_2P'] text-[6px] shrink-0">SOURCE</span>
                  <a 
                    href={task.tweet_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-cyan-400/80 font-['VT323'] text-sm truncate hover:text-cyan-400 hover:underline transition-colors"
                  >
                    {task.tweet_url.replace("https://x.com/i/status/", "x.com/...")}
                  </a>
                </div>

                <div className="flex gap-2">
                  <a
                    href={task.tweet_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-center py-2.5 bg-[#1a0a2e] border border-[#2d1a4e] rounded font-['Press_Start_2P'] text-[7px] text-[#6b5a80] hover:text-cyan-400 hover:border-[#7c3aed] transition-all"
                  >
                    VIEW TWEET →
                  </a>
                  <button
                    onClick={() => claimTask(task)}
                    disabled={claiming === task.id}
                    className="flex-1 py-2.5 bg-[#7c3aed] border border-[#a855f7] rounded font-['Press_Start_2P'] text-[7px] text-white hover:bg-[#9333ea] transition-colors disabled:opacity-50 shadow-[0_0_15px_rgba(124,58,237,0.3)]"
                  >
                    {claiming === task.id ? "..." : "CLAIM 500"}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {loading && (
          <div className="text-center text-[#6b5a80] font-['Press_Start_2P'] text-[8px] mt-10 animate-pulse">
            SCANNING FOR TASKS...
          </div>
        )}
      </div>
    </div>
  );
}
