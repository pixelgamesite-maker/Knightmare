import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlayer } from "@/hooks/usePlayer";
import { useInventory } from "@/hooks/useInventory";
import { supabase } from "@/lib/supabase";
import { FRAGMENTS, CDN } from "@/lib/fragments";
import TopBar from "@/components/layout/TopBar";

const GALLERY_CDN =
  "https://psibadkdncspgikzzmnu.supabase.co/storage/v1/object/public/Fragments/Gallery";
const TOTAL_KNIGHTS = 1234;

function randomKnight() {
  return Math.floor(Math.random() * TOTAL_KNIGHTS) + 1;
}

// ── Download helper (fetches as blob so it forces download) ──────────────────
async function downloadGif(url: string, filename: string) {
  const res = await fetch(url);
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ── Knight reveal modal shown after forge ────────────────────────────────────
function KnightReveal({
  type,
  onClose,
  onAddWallet,
}: {
  type: string;
  onClose: () => void;
  onAddWallet: () => void;
}) {
  const [knightId] = useState(randomKnight);
  const url = `${GALLERY_CDN}/${knightId}.gif`;
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    await downloadGif(url, `arcane-knight-${knightId}.gif`);
    setDownloading(false);
  };

  const tweetIt = () => {
    const text = encodeURIComponent(
      `Just forged my ${type === "gtd" ? "GTD" : "FCFS"} artifact in @ArcaneKnights ⚔️\n\nKnight #${knightId} is mine. 🔥\n\n#ArcaneKnights #NFT`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.7, rotate: -8 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0.7 }}
        transition={{ type: "spring", damping: 14 }}
        className="bg-[#0a0614] border-2 border-[#7c3aed] rounded-lg w-full max-w-sm relative text-center"
        style={{ boxShadow: "0 0 60px rgba(124,58,237,0.5)" }}
      >
        <div className="absolute -top-1 -left-1 w-2 h-2 bg-[#22d3ee]" />
        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#22d3ee]" />

        {/* Header */}
        <div className="p-5 pb-3">
          <p
            className="font-['Press_Start_2P'] text-[11px] text-[#a855f7]"
            style={{ textShadow: "0 0 12px rgba(168,85,247,0.6)" }}
          >
            {type === "gtd" ? "GTD FORGED!" : "FCFS FORGED!"}
          </p>
          <p className="font-['VT323'] text-[#6b5a80] text-base mt-1">
            Your knight has been chosen
          </p>
        </div>

        {/* Knight GIF */}
        <div className="relative mx-4 rounded-lg overflow-hidden border-2 border-[#2d1a4e] aspect-square bg-[#0d0420]">
          <div className="absolute inset-0 bg-purple-600/10 blur-2xl" />
          <img
            src={url}
            alt={`Knight #${knightId}`}
            className="w-full h-full object-cover relative z-10"
          />
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent py-2 z-20">
            <p className="font-['Press_Start_2P'] text-[8px] text-[#a855f7]">
              KNIGHT #{knightId}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 grid grid-cols-2 gap-2">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleDownload}
            disabled={downloading}
            className="font-['Press_Start_2P'] text-[7px] px-3 py-2.5 bg-[#0d0420] border-2 border-[#4a3a5e] text-[#a855f7] rounded hover:border-[#7c3aed] disabled:opacity-40 transition-colors"
          >
            {downloading ? "..." : "⬇ DOWNLOAD"}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={tweetIt}
            className="font-['Press_Start_2P'] text-[7px] px-3 py-2.5 bg-[#0d0420] border-2 border-[#4a3a5e] text-[#a855f7] rounded hover:border-[#7c3aed] transition-colors"
          >
            POST 𝕏
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onAddWallet}
            className="col-span-2 font-['Press_Start_2P'] text-[8px] px-3 py-3 bg-[#7c3aed] border-2 border-[#a855f7] text-white rounded hover:bg-[#9333ea] transition-colors"
            style={{ boxShadow: "0 0 15px rgba(124,58,237,0.4)" }}
          >
            ADD WALLET
          </motion.button>

          <button
            onClick={onClose}
            className="col-span-2 font-['Press_Start_2P'] text-[7px] text-[#4a3a5e] hover:text-[#6b5a80] transition-colors py-1"
          >
            SKIP FOR NOW
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Wallet modal (standalone, reusable for re-entry) ─────────────────────────
function WalletModal({
  type,
  onClose,
}: {
  type: string;
  onClose: () => void;
}) {
  const [wallet, setWallet] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!wallet.trim()) return;
    setSubmitting(true);
    const { data } = await supabase.rpc("submit_forge_wallet", {
      p_type: type,
      p_wallet: wallet.trim(),
    });
    setSubmitting(false);
    if (data?.success) {
      setDone(true);
      setTimeout(onClose, 1500);
    } else {
      alert(data?.error || "Wallet save failed");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-[#0a0614] border-2 border-[#7c3aed] p-6 rounded max-w-sm w-full relative"
        style={{ boxShadow: "0 0 40px rgba(124,58,237,0.3)" }}
      >
        <div className="absolute -top-1 -left-1 w-2 h-2 bg-[#22d3ee]" />
        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#22d3ee]" />

        {done ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-4"
          >
            <p className="font-['Press_Start_2P'] text-[10px] text-emerald-400 mb-2">
              ✓ WALLET SAVED
            </p>
            <p className="font-['VT323'] text-[#6b5a80] text-base">
              You're all set, knight.
            </p>
          </motion.div>
        ) : (
          <>
            <p className="font-['Press_Start_2P'] text-[10px] text-[#a855f7] mb-1 text-center">
              {type === "gtd" ? "GTD" : "FCFS"} WALLET
            </p>
            <p className="font-['VT323'] text-[#6b5a80] text-base text-center mb-5">
              Enter your wallet address to claim your artifact.
            </p>

            <input
              type="text"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              placeholder="0x... or wallet address"
              className="w-full bg-[#04020c] border border-[#2d1a4e] rounded px-3 py-2 text-[10px] text-white placeholder-[#2d1a4e] focus:border-[#a855f7] focus:outline-none mb-4 font-mono"
            />

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 font-['Press_Start_2P'] text-[8px] px-3 py-2 rounded border border-[#2d1a4e] text-[#6b5a80] hover:border-[#6b5a80] transition-colors"
              >
                CANCEL
              </button>
              <button
                onClick={submit}
                disabled={!wallet.trim() || submitting}
                className="flex-1 font-['Press_Start_2P'] text-[8px] px-3 py-2 rounded bg-[#7c3aed] border border-[#a855f7] text-white hover:bg-[#9333ea] disabled:opacity-30 transition-colors"
              >
                {submitting ? "..." : "SUBMIT"}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Main Forge page ──────────────────────────────────────────────────────────
export default function Forge() {
  const { player, invalidate: refreshPlayer } = usePlayer();
  const { inventory, invalidate: refreshInv } = useInventory();
  const [forging, setForging] = useState<string | null>(null);
  const [revealType, setRevealType] = useState<string | null>(null);
  const [walletModal, setWalletModal] = useState<string | null>(null);

  const unique = Object.entries(inventory).filter(([_, q]) => (q as number) > 0).length;

  const forge = async (type: string) => {
    setForging(type);
    const { data } = await supabase.rpc("attempt_forge", { p_type: type });
    setForging(null);
    if (data?.success) {
      refreshPlayer();
      refreshInv();
      setRevealType(type); // show knight reveal first
    } else {
      alert(data?.error || "Forge failed");
    }
  };

  // Check if forged but wallet possibly missing — we query gtd/fcfs tables
  // Since we can't know client-side if wallet was submitted, we just always
  // show "ADD WALLET" on the card if forged, so they can re-submit anytime.

  return (
    <div className="min-h-[100dvh] bg-[#04020c] text-white relative">
      <TopBar />
      <div className="pt-20 pb-10 px-4 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1
            className="font-['Press_Start_2P'] text-[12px] text-[#a855f7] mb-2"
            style={{ textShadow: "0 0 10px rgba(168,85,247,0.5)" }}
          >
            ⚒ THE FORGE
          </h1>
          <p className="font-['VT323'] text-lg text-[#6b5a80]">
            Collect fragments to forge legendary artifacts.
          </p>
        </motion.div>

        {/* Fragment collection */}
        <div className="mt-6 bg-[#0d0420] border-2 border-[#2d1a4e] rounded p-4 relative">
          <div className="absolute -top-1 -left-1 w-1.5 h-1.5 bg-[#22d3ee]" />
          <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-[#22d3ee]" />
          <p className="font-['Press_Start_2P'] text-[8px] text-[#a855f7] mb-3">
            FRAGMENT COLLECTION
          </p>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {Object.entries(FRAGMENTS).map(([key, meta]) => {
              const qty = (inventory[key] || 0) as number;
              const has = qty > 0;
              return (
                <div
                  key={key}
                  className={`bg-[#04020c] rounded border p-2 text-center relative ${
                    has ? "border-[#7c3aed]" : "border-[#1a0a2e] opacity-40"
                  }`}
                >
                  <img
                    src={`${CDN}/${(meta as any).file}`}
                    className="w-8 h-8 mx-auto object-contain"
                    alt=""
                  />
                  <p className="text-[7px] text-[#6b5a80] mt-1">{(meta as any).name}</p>
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
              animate={{ width: `${(unique / 7) * 100}%` }}
            />
          </div>
          <p className="text-[8px] text-[#6b5a80] mt-1 text-right">{unique}/7 UNIQUE</p>
        </div>

        {/* Forge cards */}
        <div className="mt-6 grid grid-cols-1 gap-4">
          <ForgeCard
            title="GTD ARTIFACT"
            desc="Requires all 7 unique fragments."
            ready={unique >= 7 && !player?.forged_gtd}
            done={player?.forged_gtd}
            onForge={() => forge("gtd")}
            onAddWallet={() => setWalletModal("gtd")}
            forging={forging === "gtd"}
          />
          <ForgeCard
            title="FCFS ARTIFACT"
            desc="Requires 4 unique fragments."
            ready={unique >= 4 && !player?.forged_fcfs}
            done={player?.forged_fcfs}
            onForge={() => forge("fcfs")}
            onAddWallet={() => setWalletModal("fcfs")}
            forging={forging === "fcfs"}
          />
        </div>
      </div>

      {/* Knight reveal modal (shown immediately after forge) */}
      <AnimatePresence>
        {revealType && (
          <KnightReveal
            type={revealType}
            onClose={() => setRevealType(null)}
            onAddWallet={() => {
              setWalletModal(revealType);
              setRevealType(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Wallet modal (also accessible from forged card) */}
      <AnimatePresence>
        {walletModal && (
          <WalletModal
            type={walletModal}
            onClose={() => setWalletModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Forge card ────────────────────────────────────────────────────────────────
function ForgeCard({
  title,
  desc,
  ready,
  done,
  onForge,
  onAddWallet,
  forging,
}: {
  title: string;
  desc: string;
  ready: boolean;
  done: boolean;
  onForge: () => void;
  onAddWallet: () => void;
  forging: boolean;
}) {
  return (
    <div
      className={`bg-[#0d0420] border-2 rounded p-4 relative ${
        ready
          ? "border-[#7c3aed]"
          : done
          ? "border-emerald-900/50"
          : "border-[#1a0a2e]"
      }`}
    >
      <div className="absolute -top-1 -left-1 w-1.5 h-1.5 bg-[#22d3ee]" />
      <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-[#22d3ee]" />
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <p
            className={`font-['Press_Start_2P'] text-[10px] ${
              done ? "text-emerald-400" : "text-[#c4b5d4]"
            }`}
          >
            {title}
          </p>
          <p className="font-['VT323'] text-base text-[#6b5a80] mt-1">{desc}</p>
        </div>

        <div className="flex flex-col gap-2 items-end">
          <button
            onClick={onForge}
            disabled={!ready || forging}
            className={`font-['Press_Start_2P'] text-[8px] px-4 py-2 rounded border-2 tracking-wider transition-colors ${
              done
                ? "bg-emerald-900/30 border-emerald-800 text-emerald-400 cursor-default"
                : ready
                ? "bg-[#7c3aed] border-[#a855f7] text-white hover:bg-[#9333ea]"
                : "bg-[#04020c] border-[#1a0a2e] text-[#2d1a4e] cursor-not-allowed"
            }`}
          >
            {done ? "FORGED ✓" : forging ? "..." : "FORGE"}
          </button>

          {/* Always show ADD WALLET when forged so they can re-enter */}
          {done && (
            <button
              onClick={onAddWallet}
              className="font-['Press_Start_2P'] text-[7px] px-3 py-1.5 rounded border border-[#2d1a4e] text-[#6b5a80] hover:border-[#7c3aed] hover:text-[#a855f7] transition-colors"
            >
              + WALLET
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
