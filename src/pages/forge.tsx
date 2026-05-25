import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayer } from "@/hooks/usePlayer";
import { useInventory } from "@/hooks/useInventory";
import { supabase } from "@/lib/supabase";
import { FRAGMENTS, CDN } from "@/lib/fragments";
import TopBar from "@/components/layout/TopBar";

const GALLERY_CDN =
  "https://psibadkdncspgikzzmnu.supabase.co/storage/v1/object/public/Fragments/Gallery";
const TOTAL_KNIGHTS = 1234;
const FORGE_KNIGHT_KEY = "km_forge_knight";
const FORGE_WALLET_SUBMITTED_KEY = "km_forge_wallet_submitted";

function randomKnightId() {
  return Math.floor(Math.random() * TOTAL_KNIGHTS) + 1;
}

// ── Download helper ──────────────────────────────────────────────────────────
async function downloadGif(url: string, filename: string) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  } catch {
    window.open(url, "_blank");
  }
}

// ── Main Forge page ──────────────────────────────────────────────────────────
export default function Forge() {
  const { player, invalidate: refreshPlayer } = usePlayer();
  const { inventory, invalidate: refreshInv } = useInventory();

  const [forging, setForging] = useState(false);
  const [knightId, setKnightId] = useState<number | null>(null);
  const [walletSubmitted, setWalletSubmitted] = useState(false);
  const [wallet, setWallet] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [walletDone, setWalletDone] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const REQUIRED_FRAGMENTS = ["sword", "helm", "armor", "gloves", "boots", "potion", "book-of-reincarnation", "dragon-heart"];
  const unique = REQUIRED_FRAGMENTS.filter(key => ((inventory[key] as number) ?? 0) > 0).length;
  const hasAll8 = REQUIRED_FRAGMENTS.every(key => ((inventory[key] as number) ?? 0) > 0);
  const alreadyForged = !!player?.forged_gtd;

  // ── On mount: restore persisted knight + wallet state ─────────────────────
  useEffect(() => {
    const savedKnight = localStorage.getItem(FORGE_KNIGHT_KEY);
    const savedWalletSubmitted = localStorage.getItem(FORGE_WALLET_SUBMITTED_KEY);

    if (savedKnight) {
      setKnightId(parseInt(savedKnight, 10));
    }
    if (savedWalletSubmitted === "true") {
      setWalletSubmitted(true);
      setWalletDone(true);
    }
  }, []);

  // ── Forge handler ─────────────────────────────────────────────────────────
  const handleForge = async () => {
    if (!hasAll8 || alreadyForged || forging) return;

    setForging(true);
    const { data } = await supabase.rpc("attempt_forge", { p_type: "gtd" });
    setForging(false);

    if (data?.success) {
      refreshPlayer();
      refreshInv();

      // Assign a random knight and persist it
      const id = randomKnightId();
      setKnightId(id);
      localStorage.setItem(FORGE_KNIGHT_KEY, String(id));
    } else {
      alert(data?.error || "Forge failed");
    }
  };

  // ── Wallet submit ─────────────────────────────────────────────────────────
  const handleWalletSubmit = async () => {
    if (!wallet.trim() || submitting) return;
    setSubmitting(true);

    const { data } = await supabase.rpc("submit_forge_wallet", {
      p_type: "gtd",
      p_wallet: wallet.trim(),
    });

    setSubmitting(false);

    if (data?.success) {
      setWalletDone(true);
      setWalletSubmitted(true);
      localStorage.setItem(FORGE_WALLET_SUBMITTED_KEY, "true");
    } else {
      alert(data?.error || "Wallet save failed");
    }
  };

  const knightUrl = knightId ? `${GALLERY_CDN}/${knightId}.gif` : null;

  const handleDownload = async () => {
    if (!knightUrl || !knightId) return;
    setDownloading(true);
    await downloadGif(knightUrl, `arcane-knight-${knightId}.gif`);
    setDownloading(false);
  };

  const handleTweet = () => {
    if (!knightId) return;
    const text = encodeURIComponent(
      `Just forged my GTD artifact in @KnightmaresETH ⚔️\n\nKnight #${knightId} is mine. 🔥\n\n#Knightmares #NFT`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };

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

      <div className="pt-24 pb-10 px-4 flex flex-col items-center min-h-[100dvh] relative z-20 max-w-lg mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 w-full"
        >
          <h1
            className="font-['Press_Start_2P'] text-[14px] text-[#a855f7] mb-3"
            style={{ textShadow: "0 0 15px rgba(168,85,247,0.5)" }}
          >
            ⚒ THE FORGE
          </h1>
          <p className="font-['VT323'] text-xl text-[#6b5a80]">
            Collect all 8 fragments to forge your artifact.
          </p>
        </motion.div>

        {/* Fragment collection bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full bg-[#0d0420] border-2 border-[#2d1a4e] rounded-lg p-4 mb-8 relative"
        >
          <div className="absolute -top-1 -left-1 w-1.5 h-1.5 bg-[#22d3ee]" />
          <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-[#22d3ee]" />
          <p className="font-['Press_Start_2P'] text-[8px] text-[#a855f7] mb-3 tracking-widest">
            FRAGMENT COLLECTION
          </p>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {Object.entries(FRAGMENTS).map(([key, meta]) => {
              const qty = (inventory[key] || 0) as number;
              const has = qty > 0;
              return (
                <div
                  key={key}
                  className={`bg-[#04020c] rounded border p-2 text-center relative transition-all ${
                    has ? "border-[#7c3aed]" : "border-[#1a0a2e] opacity-40"
                  }`}
                >
                  <img
                    src={`${CDN}/${(meta as any).file}`}
                    className="w-8 h-8 mx-auto object-contain"
                    alt=""
                  />
                  <p className="text-[7px] text-[#6b5a80] mt-1 truncate">{(meta as any).name}</p>
                  {has && (
                    <span className="absolute -top-1.5 -right-1.5 bg-[#7c3aed] text-white font-['Press_Start_2P'] text-[6px] w-4 h-4 flex items-center justify-center rounded-full">
                      {qty}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="h-2 bg-[#04020c] rounded-full overflow-hidden border border-[#1a0a2e]">
            <motion.div
              className="h-full bg-gradient-to-r from-[#7c3aed] to-[#a855f7]"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((unique / 8) * 100, 100)}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
          <p className="text-[8px] text-[#6b5a80] mt-1 text-right font-['Press_Start_2P']">
            {unique}/8 UNIQUE
          </p>
        </motion.div>

        {/* ── Knight reveal (shown after forge or on refresh if forged) ── */}
        <AnimatePresence mode="wait">
          {knightUrl && knightId ? (
            <motion.div
              key="knight-reveal"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ type: "spring", damping: 16 }}
              className="w-full flex flex-col items-center"
            >
              {/* Knight box — styled like gallery */}
              <motion.div
                animate={
                  forging
                    ? { scale: [1, 1.03, 0.97, 1.02, 1], rotate: [0, -2, 2, -1, 0] }
                    : {}
                }
                transition={{ repeat: forging ? Infinity : 0, duration: 0.35 }}
                className="relative w-72 h-72 sm:w-96 sm:h-96 mb-6"
              >
                <div className="absolute inset-0 bg-purple-600/20 blur-3xl rounded-full" />
                <div className="relative w-full h-full bg-[#0a0614] border-2 border-[#7c3aed] rounded-lg overflow-hidden shadow-[0_0_50px_rgba(124,58,237,0.35)]">
                  <img
                    src={knightUrl}
                    alt={`Knight #${knightId}`}
                    className="w-full h-full object-cover"
                  />
                  {/* ID Badge */}
                  <div className="absolute top-3 left-3 bg-[#0a0614]/80 border border-[#7c3aed]/50 rounded px-2.5 py-1.5 backdrop-blur-sm">
                    <span className="font-['Press_Start_2P'] text-[9px] text-[#a855f7]">
                      #{knightId}
                    </span>
                  </div>
                  {/* GTD badge */}
                  <div className="absolute top-3 right-3 bg-[#7c3aed]/80 border border-[#a855f7]/50 rounded px-2 py-1 backdrop-blur-sm">
                    <span className="font-['Press_Start_2P'] text-[7px] text-white">GTD</span>
                  </div>
                </div>
                <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-[#22d3ee]" />
                <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-[#22d3ee]" />
              </motion.div>

              {/* GTD FORGED label */}
              <p
                className="font-['Press_Start_2P'] text-[10px] text-emerald-400 mb-1"
                style={{ textShadow: "0 0 10px rgba(52,211,153,0.4)" }}
              >
                GTD FORGED ✓
              </p>
              <p className="font-['VT323'] text-[#6b5a80] text-base mb-6">
                Your knight has been chosen
              </p>

              {/* Download + Tweet row */}
              <div className="flex gap-3 mb-6 w-full max-w-xs">
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex-1 font-['Press_Start_2P'] text-[7px] px-3 py-2.5 bg-[#0d0420] border-2 border-[#4a3a5e] text-[#a855f7] rounded hover:border-[#7c3aed] disabled:opacity-40 transition-colors"
                >
                  {downloading ? "..." : "⬇ DOWNLOAD"}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleTweet}
                  className="flex-1 font-['Press_Start_2P'] text-[7px] px-3 py-2.5 bg-[#0d0420] border-2 border-[#4a3a5e] text-[#a855f7] rounded hover:border-[#7c3aed] transition-colors"
                >
                  POST 𝕏
                </motion.button>
              </div>

              {/* ── Wallet submission box ── */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="w-full max-w-xs bg-[#0a0614] border-2 border-[#7c3aed] rounded-lg p-5 relative"
                style={{ boxShadow: "0 0 30px rgba(124,58,237,0.25)" }}
              >
                <div className="absolute -top-1 -left-1 w-2 h-2 bg-[#22d3ee]" />
                <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#22d3ee]" />

                <AnimatePresence mode="wait">
                  {walletDone ? (
                    <motion.div
                      key="done"
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center py-2"
                    >
                      <p
                        className="font-['Press_Start_2P'] text-[10px] text-emerald-400 mb-2"
                        style={{ textShadow: "0 0 8px rgba(52,211,153,0.4)" }}
                      >
                        ✓ WALLET SAVED
                      </p>
                      <p className="font-['VT323'] text-[#6b5a80] text-base">
                        You're all set, knight.
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div key="form">
                      <p className="font-['Press_Start_2P'] text-[9px] text-[#a855f7] mb-1 text-center">
                        CLAIM YOUR ARTIFACT
                      </p>
                      <p className="font-['VT323'] text-[#6b5a80] text-base text-center mb-4">
                        Submit your wallet address to receive your GTD artifact.
                      </p>
                      <input
                        type="text"
                        value={wallet}
                        onChange={(e) => setWallet(e.target.value)}
                        placeholder="0x... or wallet address"
                        className="w-full bg-[#04020c] border border-[#2d1a4e] rounded px-3 py-2 text-[10px] text-white placeholder-[#2d1a4e] focus:border-[#a855f7] focus:outline-none mb-3 font-mono"
                      />
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleWalletSubmit}
                        disabled={!wallet.trim() || submitting}
                        className="w-full font-['Press_Start_2P'] text-[8px] px-3 py-3 bg-[#7c3aed] border-2 border-[#a855f7] text-white rounded hover:bg-[#9333ea] disabled:opacity-30 transition-colors"
                        style={{ boxShadow: "0 0 15px rgba(124,58,237,0.4)" }}
                      >
                        {submitting ? "SUBMITTING..." : "SUBMIT WALLET"}
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>

          ) : (
            /* ── Pre-forge state ── */
            <motion.div
              key="forge-btn"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 w-full max-w-xs"
            >
              {/* GTD card */}
              <div
                className={`w-full bg-[#0d0420] border-2 rounded-lg p-5 relative transition-all ${
                  hasAll8 ? "border-[#7c3aed]" : "border-[#1a0a2e]"
                }`}
                style={hasAll8 ? { boxShadow: "0 0 25px rgba(124,58,237,0.2)" } : {}}
              >
                <div className="absolute -top-1 -left-1 w-1.5 h-1.5 bg-[#22d3ee]" />
                <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-[#22d3ee]" />

                <p
                  className={`font-['Press_Start_2P'] text-[10px] mb-1 ${
                    hasAll8 ? "text-[#c4b5d4]" : "text-[#2d1a4e]"
                  }`}
                >
                  GTD ARTIFACT
                </p>
                <p className="font-['VT323'] text-base text-[#6b5a80] mb-5">
                  Requires all 8 unique fragments. A random knight will be revealed.
                </p>

                <motion.button
                  whileHover={hasAll8 && !forging ? { scale: 1.03 } : {}}
                  whileTap={hasAll8 && !forging ? { scale: 0.97 } : {}}
                  onClick={handleForge}
                  disabled={!hasAll8 || forging}
                  className={`w-full font-['Press_Start_2P'] text-[9px] px-4 py-3 rounded-lg border-2 tracking-wider transition-colors ${
                    hasAll8
                      ? "bg-[#7c3aed] border-[#a855f7] text-white hover:bg-[#9333ea]"
                      : "bg-[#04020c] border-[#1a0a2e] text-[#2d1a4e] cursor-not-allowed"
                  }`}
                  style={hasAll8 ? { boxShadow: "0 0 20px rgba(124,58,237,0.4)" } : {}}
                >
                  {forging ? "FORGING..." : hasAll8 ? "⚒ FORGE" : `NEED ${8 - unique} MORE`}
                </motion.button>
              </div>

              {!hasAll8 && (
                <p className="font-['VT323'] text-[#4a3a5e] text-base text-center">
                  Collect fragments by hunting to unlock the forge.
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="mt-12 text-center max-w-sm">
          <p className="font-['Press_Start_2P'] text-[7px] text-[#2d1a4e] leading-relaxed">
            GTD ARTIFACT. ONE PER HUNTER. WALLET REQUIRED TO CLAIM.
          </p>
        </div>
      </div>
    </div>
  );
}
