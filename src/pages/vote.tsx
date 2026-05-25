import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayer } from "@/hooks/usePlayer";
import { supabase } from "@/lib/supabase";
import TopBar from "@/components/layout/TopBar";

const EMBER_ICON = `https://psibadkdncspgikzzmnu.supabase.co/storage/v1/object/public/Fragments/ember.png`;
const CDN_COMMUNITIES = "/communities";

// ⬇️ SET THIS to your actual vote end time. All users count down to this exact moment.
// Change the date/time string and redeploy — that's all you need to do.
const VOTE_END_TS: number = new Date("2025-06-01T20:00:00Z").getTime();

const VOTE_COST = 250; // EMBER per vote
const MAX_VOTES = 2;
const TOP_N = 5;

const COMMUNITIES = [
  { id: "slonks",        name: "Slonks",        image: `${CDN_COMMUNITIES}/Slonks.jpg` },
  { id: "goblynz",       name: "Goblynz",       image: `${CDN_COMMUNITIES}/Goblynz.jpg` },
  { id: "florentines",   name: "The Florentines",image: `${CDN_COMMUNITIES}/The-Florentines.jpg` },
  { id: "normies",       name: "Normies",        image: `${CDN_COMMUNITIES}/Normies.jpg` },
  { id: "chimpers",      name: "Chimpers",       image: `${CDN_COMMUNITIES}/Chimpers.jpg` },
  { id: "funkari",       name: "Funkari",        image: `${CDN_COMMUNITIES}/Funkari.jpg` },
  { id: "booa",          name: "BOOA",           image: `${CDN_COMMUNITIES}/BOOA.jpg` },
  { id: "doomsayers",    name: "Doomsayers",     image: `${CDN_COMMUNITIES}/Doomsayers.jpg` },
  { id: "zorgz",         name: "zorgz",          image: `${CDN_COMMUNITIES}/zorgz.jpg` },
  { id: "nopunkism",     name: "No Punkism",     image: `${CDN_COMMUNITIES}/No-punkism.jpg` },
  { id: "megabadgers",   name: "Mega Badgers",   image: `${CDN_COMMUNITIES}/Mega-Honey-badgers.jpg` },
  { id: "shellmates",    name: "Shellmates",     image: `${CDN_COMMUNITIES}/Shellmates.jpg` },
];

function fmtCountdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return {
    h: String(h).padStart(2, "0"),
    m: String(m).padStart(2, "0"),
    s: String(sec).padStart(2, "0"),
  };
}

// ── Supabase helpers ──────────────────────────────────────────────────────────
// Expected tables:
//   community_votes(id, community_id, user_id, created_at)  — one row per vote cast
//   community_vote_counts(community_id, vote_count)          — live aggregated view or table

async function fetchVoteCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("community_vote_counts")
    .select("community_id, vote_count");
  if (error || !data) return {};
  return Object.fromEntries(data.map((r: any) => [r.community_id, r.vote_count]));
}

async function fetchUserVotes(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("community_votes")
    .select("community_id")
    .eq("user_id", userId);
  if (error || !data) return [];
  return data.map((r: any) => r.community_id);
}

async function castVote(
  userId: string,
  communityId: string
): Promise<{ success: boolean; error?: string }> {
  // Uses an RPC that atomically: checks vote count, awards EMBER, inserts vote, upserts count
  const { data, error } = await supabase.rpc("cast_community_vote", {
    p_community_id: communityId,
  });
  if (error) return { success: false, error: error.message };
  if (!data?.success) return { success: false, error: data?.error || "Vote failed" };
  return { success: true };
}

// ── Leaderboard bar ───────────────────────────────────────────────────────────
function LeaderBar({
  rank,
  community,
  votes,
  total,
  isTop,
  isVoted,
}: {
  rank: number;
  community: (typeof COMMUNITIES)[0];
  votes: number;
  total: number;
  isTop: boolean;
  isVoted: boolean;
}) {
  const pct = total > 0 ? (votes / total) * 100 : 0;
  const rankColors = ["#f59e0b", "#94a3b8", "#b87333", "#7c3aed", "#22d3ee"];
  const color = rankColors[rank - 1] ?? "#4a3a5e";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`relative flex items-center gap-3 px-3 py-2.5 rounded border transition-all ${
        isTop
          ? "border-[#7c3aed]/40 bg-[#0d0420]/80"
          : "border-[#1a0a2e] bg-[#080312]/60"
      }`}
    >
      {/* rank badge */}
      <div
        className="shrink-0 w-7 h-7 rounded flex items-center justify-center font-['Press_Start_2P'] text-[9px]"
        style={{ color, border: `1px solid ${color}40`, background: `${color}15` }}
      >
        {rank}
      </div>

      {/* avatar */}
      <img
        src={community.image}
        alt={community.name}
        className="shrink-0 w-8 h-8 rounded object-cover border border-[#2d1a4e]"
      />

      {/* name + bar */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="font-['Press_Start_2P'] text-[7px] text-[#c4b5d4] truncate">
            {community.name}
            {isVoted && (
              <span className="ml-1.5 text-amber-400">✓</span>
            )}
          </p>
          <p className="font-['VT323'] text-sm text-[#a855f7] shrink-0 ml-2">
            {votes.toLocaleString()}
          </p>
        </div>
        <div className="h-1.5 bg-[#1a0a2e] rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${color}, ${color}99)` }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ── Community card ────────────────────────────────────────────────────────────
function CommunityCard({
  community,
  votes,
  rank,
  userVotedFor,
  votesUsed,
  votingOpen,
  emberBalance,
  onVote,
  voting,
}: {
  community: (typeof COMMUNITIES)[0];
  votes: number;
  rank: number | null;
  userVotedFor: boolean;
  votesUsed: number;
  votingOpen: boolean;
  emberBalance: number;
  onVote: (id: string) => void;
  voting: boolean;
}) {
  const canVote =
    votingOpen &&
    !userVotedFor &&
    votesUsed < MAX_VOTES;

  const isTop5 = rank !== null && rank <= TOP_N;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`relative flex flex-col rounded border-2 overflow-hidden transition-all ${
        isTop5
          ? "border-[#7c3aed]/70 shadow-[0_0_20px_rgba(124,58,237,0.2)]"
          : "border-[#1a0a2e]"
      } bg-[#0a0614]`}
    >
      {/* top-5 glow strip */}
      {isTop5 && (
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{
            background: "linear-gradient(90deg, #7c3aed, #22d3ee, #7c3aed)",
          }}
        />
      )}

      {/* rank badge */}
      {rank !== null && rank <= TOP_N && (
        <div className="absolute top-2 right-2 z-10 bg-[#7c3aed] font-['Press_Start_2P'] text-[7px] text-white px-1.5 py-0.5 rounded border border-[#a855f7]">
          #{rank}
        </div>
      )}

      {/* image */}
      <div className="relative w-full aspect-square overflow-hidden">
        <img
          src={community.image}
          alt={community.name}
          className="w-full h-full object-cover"
        />
        {/* voted overlay */}
        {userVotedFor && (
          <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
            <span className="font-['Press_Start_2P'] text-[10px] text-amber-400 bg-black/70 px-2 py-1 rounded">
              VOTED
            </span>
          </div>
        )}
      </div>

      {/* info */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <p className="font-['Press_Start_2P'] text-[8px] text-[#c4b5d4] leading-tight">
          {community.name}
        </p>
        <div className="flex items-center gap-1">
          <span className="font-['VT323'] text-base text-[#a855f7]">
            {votes.toLocaleString()}
          </span>
          <span className="font-['Press_Start_2P'] text-[6px] text-[#4a3a5e]">
            VOTES
          </span>
        </div>

        {/* vote button */}
        <motion.button
          whileHover={{ scale: canVote ? 1.04 : 1 }}
          whileTap={{ scale: canVote ? 0.96 : 1 }}
          onClick={() => canVote && onVote(community.id)}
          disabled={!canVote || voting}
          className={`mt-auto w-full py-2 rounded border font-['Press_Start_2P'] text-[7px] tracking-wider transition-all flex items-center justify-center gap-1.5 ${
            userVotedFor
              ? "bg-amber-500/10 border-amber-500/30 text-amber-400 cursor-default"
              : canVote
              ? "bg-[#7c3aed]/20 border-[#7c3aed] text-[#a855f7] hover:bg-[#7c3aed]/40 cursor-pointer"
              : "bg-[#0d0420] border-[#1a0a2e] text-[#2d1a4e] cursor-not-allowed"
          }`}
        >
          {userVotedFor ? (
            "✓ VOTED"
          ) : voting ? (
            "..."
          ) : (
            <>
              <img src={EMBER_ICON} alt="" className="w-3 h-3 object-contain" />
              VOTE +{VOTE_COST.toLocaleString()}
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function VotePage() {
  const { player, invalidate: refreshPlayer } = usePlayer();
  const emberBalance = (player as any)?.ember ?? 0;
  const userId = (player as any)?.id ?? null;

  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [userVotes, setUserVotes] = useState<string[]>([]);
  const [voting, setVoting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [msLeft, setMsLeft] = useState(NINE_HOURS);
  const [loading, setLoading] = useState(true);

  // ── Timer ─────────────────────────────────────────────────────────────────
  // All users count down to the same fixed VOTE_END_TS — no per-user drift.
  useEffect(() => {
    const tick = () => setMsLeft(Math.max(0, VOTE_END_TS - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const votingOpen = msLeft > 0;
  const timer = fmtCountdown(msLeft);

  // ── Load data ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    const counts = await fetchVoteCounts();
    setVoteCounts(counts);
    if (userId) {
      const uv = await fetchUserVotes(userId);
      setUserVotes(uv);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    loadData();
    // Real-time subscription to vote count changes
    const channel = supabase
      .channel("community_vote_counts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "community_vote_counts" },
        (payload: any) => {
          setVoteCounts((prev) => ({
            ...prev,
            [payload.new.community_id]: payload.new.vote_count,
          }));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadData]);

  // ── Derived: sorted leaderboard ───────────────────────────────────────────
  const sorted = [...COMMUNITIES]
    .map((c) => ({ ...c, votes: voteCounts[c.id] ?? 0 }))
    .sort((a, b) => b.votes - a.votes);

  const rankMap: Record<string, number> = {};
  sorted.forEach((c, i) => { rankMap[c.id] = i + 1; });

  const totalVotes = sorted.reduce((acc, c) => acc + c.votes, 0);
  const votesUsed = userVotes.length;

  // ── Cast vote ─────────────────────────────────────────────────────────────
  const handleVote = async (communityId: string) => {
    if (!userId || votesUsed >= MAX_VOTES || userVotes.includes(communityId)) return;
    setVoting(communityId);
    const res = await castVote(userId, communityId);
    if (res.success) {
      setUserVotes((prev) => [...prev, communityId]);
      setVoteCounts((prev) => ({
        ...prev,
        [communityId]: (prev[communityId] ?? 0) + 1,
      }));
      refreshPlayer();
      showToast("Vote cast! +250 EMBER", true);
    } else {
      showToast(res.error ?? "Failed", false);
    }
    setVoting(null);
  };

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[100dvh] bg-[#04020c] text-white relative overflow-hidden">
      <TopBar />

      {/* scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-10 opacity-20"
        style={{
          background:
            "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(168,85,247,0.04) 2px,rgba(168,85,247,0.04) 4px)",
        }}
      />
      {/* vignette */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            "radial-gradient(ellipse 100% 100% at 50% 0%,transparent 60%,rgba(4,2,12,0.95) 100%)",
        }}
      />

      <div className="relative z-20 pt-20 pb-16 px-4 max-w-6xl mx-auto">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <p
            className="font-['Press_Start_2P'] text-[8px] text-[#a855f7] tracking-[0.3em] mb-2"
            style={{ textShadow: "0 0 12px rgba(168,85,247,0.6)" }}
          >
            SEASON I · COMMUNITY VOTE
          </p>
          <h1
            className="font-['Press_Start_2P'] text-lg md:text-2xl text-white leading-tight"
            style={{ textShadow: "0 0 30px rgba(168,85,247,0.4)" }}
          >
            5 WILL RISE
          </h1>
          <p className="font-['VT323'] text-base text-[#6b5a80] mt-1">
            Top 5 communities earn their place. Each player gets 2 votes.
          </p>
        </motion.div>

        {/* ── Timer + ember bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
        >
          {/* countdown */}
          <div
            className="flex items-center gap-3 bg-[#0a0614] border border-[#2d1a4e] rounded-xl px-5 py-3"
            style={{ boxShadow: "0 0 20px rgba(124,58,237,0.08)" }}
          >
            <div className="text-center">
              <p className="font-['Press_Start_2P'] text-[7px] text-[#6b5a80] mb-1">ENDS IN</p>
              <div className="flex items-center gap-1">
                {[timer.h, timer.m, timer.s].map((v, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <span
                      className="font-['VT323'] text-2xl text-[#22d3ee]"
                      style={{ textShadow: "0 0 10px rgba(34,211,238,0.5)" }}
                    >
                      {v}
                    </span>
                    {i < 2 && <span className="font-['VT323'] text-xl text-[#4a3a5e]">:</span>}
                  </span>
                ))}
              </div>
            </div>
            {/* vote slots */}
            <div className="w-px h-8 bg-[#1a0a2e]" />
            <div className="text-center">
              <p className="font-['Press_Start_2P'] text-[7px] text-[#6b5a80] mb-1">YOUR VOTES</p>
              <div className="flex gap-1.5 justify-center">
                {Array.from({ length: MAX_VOTES }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-sm border transition-all ${
                      i < votesUsed
                        ? "bg-amber-400 border-amber-500"
                        : "bg-[#0d0420] border-[#2d1a4e]"
                    }`}
                  />
                ))}
              </div>
            </div>
            {/* ember */}
            <div className="w-px h-8 bg-[#1a0a2e]" />
            <div className="text-center">
              <p className="font-['Press_Start_2P'] text-[7px] text-[#6b5a80] mb-1">EMBER</p>
              <div className="flex items-center gap-1">
                <img src={EMBER_ICON} alt="" className="w-3.5 h-3.5 object-contain" />
                <span className="font-['VT323'] text-xl text-amber-400">{emberBalance.toLocaleString()}</span>
              </div>
            </div>
          </div>


        </motion.div>

        {/* ── Main 2-col layout ── */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* LEFT: community grid */}
          <div className="flex-1">
            <p className="font-['Press_Start_2P'] text-[8px] text-[#a855f7] mb-4 tracking-widest">
              // COMMUNITIES //
            </p>
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {COMMUNITIES.map((c) => (
                  <div key={c.id} className="aspect-square bg-[#0a0614] rounded border border-[#1a0a2e] animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {COMMUNITIES.map((c) => (
                  <CommunityCard
                    key={c.id}
                    community={c}
                    votes={voteCounts[c.id] ?? 0}
                    rank={rankMap[c.id] ?? null}
                    userVotedFor={userVotes.includes(c.id)}
                    votesUsed={votesUsed}
                    votingOpen={votingOpen}
                    emberBalance={emberBalance}
                    onVote={handleVote}
                    voting={voting === c.id}
                  />
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: live leaderboard */}
          <div className="lg:w-72 xl:w-80 shrink-0">
            <div className="sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <p className="font-['Press_Start_2P'] text-[8px] text-[#a855f7] tracking-widest">
                  // LIVE STANDINGS //
                </p>
                {/* live dot */}
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="font-['Press_Start_2P'] text-[6px] text-green-400">LIVE</span>
                </div>
              </div>

              {/* top 5 label */}
              <div
                className="mb-2 text-center py-1.5 rounded border border-[#7c3aed]/40 bg-[#7c3aed]/10"
              >
                <p className="font-['Press_Start_2P'] text-[7px] text-[#a855f7]">
                  ── TOP 5 ADVANCING ──
                </p>
              </div>

              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {sorted.map((c, i) => (
                    <LeaderBar
                      key={c.id}
                      rank={i + 1}
                      community={c}
                      votes={c.votes}
                      total={totalVotes}
                      isTop={i < TOP_N}
                      isVoted={userVotes.includes(c.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>

              {/* total votes */}
              <div className="mt-4 text-center bg-[#0a0614] border border-[#1a0a2e] rounded p-3">
                <p className="font-['Press_Start_2P'] text-[6px] text-[#6b5a80]">TOTAL VOTES CAST</p>
                <p
                  className="font-['VT323'] text-2xl text-[#22d3ee] mt-0.5"
                  style={{ textShadow: "0 0 10px rgba(34,211,238,0.4)" }}
                >
                  {totalVotes.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Voting closed banner ── */}
        <AnimatePresence>
          {!votingOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0a0614] border-2 border-[#7c3aed] rounded-xl px-8 py-4 text-center"
              style={{ boxShadow: "0 0 40px rgba(124,58,237,0.4)" }}
            >
              <p className="font-['Press_Start_2P'] text-[10px] text-[#a855f7]">VOTING HAS ENDED</p>
              <p className="font-['VT323'] text-base text-[#6b5a80] mt-1">Results are final</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Toast ── */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 30, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 10, x: "-50%" }}
              className={`fixed bottom-8 left-1/2 z-50 px-5 py-3 rounded border font-['Press_Start_2P'] text-[8px] ${
                toast.ok
                  ? "bg-[#0a0614] border-green-500/50 text-green-400"
                  : "bg-[#0a0614] border-red-500/50 text-red-400"
              }`}
              style={{ boxShadow: toast.ok ? "0 0 20px rgba(34,197,94,0.2)" : "0 0 20px rgba(239,68,68,0.2)" }}
            >
              {toast.msg}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
