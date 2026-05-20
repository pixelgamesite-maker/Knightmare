import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { usePlayer } from "@/hooks/usePlayer";
import { supabase } from "@/lib/supabase";
import TopBar from "@/components/layout/TopBar";

type Task = {
  id: string;
  title: string;
  description: string;
  reward: number;
  action_url: string;
  icon: string;
  completed: boolean;
};

export default function Social() {
  const { player, invalidate: refreshPlayer } = usePlayer();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      if (!player?.id) return;

      const [{ data: allTasks }, { data: completions }] = await Promise.all([
        supabase.from("social_tasks").select("*").order("sort_order", { ascending: true }),
        supabase.from("task_completions").select("task_id").eq("user_id", player.id),
      ]);

      const completedIds = new Set(completions?.map((c) => c.task_id) || []);
      const merged = (allTasks || []).map((t) => ({
        ...t,
        completed: completedIds.has(t.id),
      }));

      setTasks(merged);
      setLoading(false);
    };

    fetchTasks();
  }, [player?.id]);

  const claimTask = async (task: Task) => {
    setClaiming(task.id);
    setMsg(null);

    const { data, error } = await supabase.rpc("complete_social_task", {
      p_task_id: task.id,
    });

    if (error || !data?.success) {
      setMsg(data?.error || "Claim failed. Try again.");
    } else {
      setMsg(`+${task.reward} GOLD CLAIMED!`);
      refreshPlayer();
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, completed: true } : t))
      );
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
            Complete tasks to earn gold. Each task can only be claimed once.
          </p>
        </motion.div>

        {msg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 text-center">
            <p className="font-['Press_Start_2P'] text-[10px] text-amber-400" style={{ textShadow: "0 0 10px rgba(251,191,36,0.5)" }}>
              {msg}
            </p>
          </motion.div>
        )}

        {loading ? (
          <div className="text-center text-[#6b5a80] font-['Press_Start_2P'] text-[8px] mt-10">LOADING...</div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task, i) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`relative bg-[#0a0614] border-2 rounded p-4 transition-all ${
                  task.completed ? "border-emerald-900/50 opacity-50" : "border-[#2d1a4e] hover:border-[#7c3aed]"
                }`}
              >
                <div className="absolute -top-1 -left-1 w-2 h-2 bg-[#22d3ee]" />
                <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#22d3ee]" />

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#1a0a2e] border border-[#7c3aed]/30 rounded flex items-center justify-center text-lg shrink-0">
                    {task.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-['Press_Start_2P'] text-[8px] text-[#c4b5d4]">{task.title}</h3>
                      <span className="font-['Press_Start_2P'] text-[8px] text-amber-400 shrink-0">+{task.reward}</span>
                    </div>
                    <p className="text-[#6b5a80] font-['VT323'] text-lg leading-relaxed mb-3">
                      {task.description}
                    </p>

                    {!task.completed ? (
                      <div className="flex gap-2">
                        <a
                          href={task.action_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block px-3 py-1.5 bg-[#1a0a2e] border border-[#2d1a4e] rounded font-['Press_Start_2P'] text-[7px] text-[#6b5a80] hover:text-cyan-400 hover:border-[#7c3aed] transition-all"
                        >
                          GO →
                        </a>
                        <button
                          onClick={() => claimTask(task)}
                          disabled={claiming === task.id}
                          className="px-3 py-1.5 bg-[#7c3aed] border border-[#a855f7] rounded font-['Press_Start_2P'] text-[7px] text-white hover:bg-[#9333ea] transition-colors disabled:opacity-50"
                        >
                          {claiming === task.id ? "..." : "CLAIM"}
                        </button>
                      </div>
                    ) : (
                      <span className="font-['Press_Start_2P'] text-[7px] text-emerald-500/70">COMPLETED ✓</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {tasks.length === 0 && (
              <div className="text-center text-[#6b5a80] font-['Press_Start_2P'] text-[8px] mt-10">
                NO TASKS AVAILABLE
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
      }
                  
