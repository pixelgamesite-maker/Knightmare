import { supabase } from "@/lib/supabase";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Supabase Storage base URL ───────────────────────────────────────────────
const CDN = "https://psibadkdncspgikzzmnu.supabase.co/storage/v1/object/public/Fragments";

// ─── Typewriter script ───────────────────────────────────────────────────────
const LINES = [
  { text: "The world was shattered.",           pause: 2000 },
  { text: "Its power broken into fragments…",   pause: 1800, showChar: true },
  { text: "",                                   pause: 700  },
  { text: "Only those who collect the relics",  pause: 1400 },
  { text: "can rebuild the armor…",             pause: 1800 },
  { text: "",                                   pause: 500  },
  { text: "and survive what comes next.",       pause: 2600 },
];

const CHAR_SPEED = 72; // ms per character — slow, dread-building

// ─── Arcane rune particle ────────────────────────────────────────────────────
const RUNES = ["᛭","ᚠ","ᚢ","ᚦ","ᚨ","ᚱ","ᚲ","ᚷ","ᚹ","ᚺ","ᚾ","ᛁ","ᛃ","ᛇ","ᛈ","ᛉ","ᛊ","ᛏ","ᛒ","ᛖ","ᛗ","ᛚ","ᛜ","ᛞ","ᛟ"];
const PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  x: 3 + Math.random() * 94,
  rune: RUNES[Math.floor(Math.random() * RUNES.length)],
  size: 10 + Math.random() * 8,
  delay: i * 0.9 + Math.random() * 3,
  duration: 8 + Math.random() * 8,
  drift: (Math.random() - 0.5) * 80,
  color: Math.random() > 0.6 ? "#22d3ee" : Math.random() > 0.5 ? "#a855f7" : "#4ade80",
}));

// ─── Pixel dialog box ────────────────────────────────────────────────────────
function PixelDialog({
  title,
  body,
  options,
}: {
  title: string;
  body: string;
  options: { label: string; action: () => void; primary?: boolean; loading?: boolean }[];
}) {
  return (
    <motion.div
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "0 20px",
      }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      {/* Overlay */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(4,2,12,0.88)" }} />

      <motion.div
        style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 380 }}
        initial={{ scale: 0.82, y: 28, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.82, y: 28, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
      >
        {/* Outer pixel border — 3-layer technique */}
        <div style={{
          background: "#04020c",
          border: "3px solid #7c3aed",
          boxShadow: `
            0 0 0 1px #04020c,
            0 0 0 2px #a855f7,
            inset 0 0 0 1px #1a0a2e,
            0 0 40px rgba(168,85,247,0.25),
            0 0 80px rgba(168,85,247,0.1)
          `,
          position: "relative",
          imageRendering: "pixelated",
        }}>
          {/* Pixel corner dots */}
          {["0,0","0,100","100,0","100,100"].map(xy => {
            const [x, y] = xy.split(",").map(Number);
            return (
              <div key={xy} style={{
                position: "absolute",
                width: 4, height: 4,
                background: "#22d3ee",
                ...(x===0 && y===0   ? { top: -1, left: -1 }   : {}),
                ...(x===0 && y===100 ? { bottom: -1, left: -1 } : {}),
                ...(x===100 && y===0  ? { top: -1, right: -1 }  : {}),
                ...(x===100 && y===100? { bottom: -1, right: -1 }: {}),
              }} />
            );
          })}

          {/* Title bar */}
          <div style={{
            borderBottom: "2px solid #1a0a2e",
            padding: "10px 16px",
            background: "linear-gradient(90deg, #0d0420 0%, #160830 50%, #0d0420 100%)",
          }}>
            <p style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 8,
              letterSpacing: "0.15em",
              color: "#a855f7",
              textAlign: "center",
              margin: 0,
              textShadow: "0 0 10px rgba(168,85,247,0.8)",
            }}>
              {title}
            </p>
          </div>

          {/* Body */}
          <div style={{ padding: "22px 20px 8px" }}>
            <p style={{
              fontFamily: "'VT323', monospace",
              fontSize: 20,
              color: "#c4b5d4",
              lineHeight: 1.5,
              textAlign: "center",
              margin: 0,
            }}>
              {body}
            </p>
          </div>

          {/* Separator */}
          <div style={{ margin: "12px 20px", height: 1, background: "linear-gradient(90deg,transparent,#3b1d6e,transparent)" }} />

          {/* Buttons */}
          <div style={{ padding: "4px 20px 20px", display: "flex", gap: 12, justifyContent: "center" }}>
            {options.map(opt => (
              <button
                key={opt.label}
                onClick={opt.action}
                disabled={opt.loading}
                style={{
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: 8,
                  letterSpacing: "0.1em",
                  padding: "10px 20px",
                  cursor: opt.loading ? "wait" : "pointer",
                  opacity: opt.loading ? 0.6 : 1,
                  border: "none",
                  outline: "none",
                  transition: "all 0.12s",
                  imageRendering: "pixelated",
                  ...(opt.primary
                    ? {
                        background: "#7c3aed",
                        color: "#fff",
                        boxShadow: "0 0 0 2px #a855f7, 0 0 20px rgba(124,58,237,0.6), inset 0 1px 0 rgba(255,255,255,0.1)",
                      }
                    : {
                        background: "#0d0420",
                        color: "#6b5a80",
                        boxShadow: "0 0 0 2px #2d1a4e",
                      }
                  ),
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget;
                  if (opt.primary) el.style.background = "#9333ea";
                  else el.style.color = "#a855f7";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget;
                  if (opt.primary) el.style.background = "#7c3aed";
                  else el.style.color = "#6b5a80";
                }}
              >
                {opt.loading ? "..." : opt.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Landing ────────────────────────────────────────────────────────────
export default function Landing() {
  const [lineIdx, setLineIdx]           = useState(0);
  const [charIdx, setCharIdx]           = useState(0);
  const [committed, setCommitted]       = useState<string[]>([]);
  const [charVisible, setCharVisible]   = useState(false);
  const [scriptDone, setScriptDone]     = useState(false);
  const [showCTA, setShowCTA]           = useState(false);
  const [dialog, setDialog]             = useState<null | "confirm" | "connect">(null);
  const [connecting, setConnecting]     = useState(false);

  // ── Typewriter ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (scriptDone) return;

    if (lineIdx >= LINES.length) {
      setScriptDone(true);
      setTimeout(() => setShowCTA(true), 800);
      return;
    }

    const entry = LINES[lineIdx];

    if (entry.text === "") {
      const t = setTimeout(() => {
        setCommitted(c => [...c, ""]);
        setLineIdx(i => i + 1);
        setCharIdx(0);
      }, entry.pause);
      return () => clearTimeout(t);
    }

    if (charIdx < entry.text.length) {
      const t = setTimeout(() => setCharIdx(c => c + 1), CHAR_SPEED);
      return () => clearTimeout(t);
    }

    if (entry.showChar && !charVisible) setCharVisible(true);

    const t = setTimeout(() => {
      setCommitted(c => [...c, entry.text]);
      setLineIdx(i => i + 1);
      setCharIdx(0);
    }, entry.pause);
    return () => clearTimeout(t);
  }, [lineIdx, charIdx, scriptDone, charVisible]);

  const currentEntry   = lineIdx < LINES.length ? LINES[lineIdx] : null;
  const currentPartial = currentEntry && currentEntry.text !== ""
    ? currentEntry.text.slice(0, charIdx)
    : null;

  const handleConnectX = async () => {
  setConnecting(true);
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "twitter",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) {
    console.error(error.message);
    setConnecting(false);
  }
};

  return (
    <div style={{
      position: "relative",
      minHeight: "100vh",
      overflow: "hidden",
      background: "#04020c",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>

      {/* ── Fonts ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap');

        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        @keyframes charFlicker {
          0%,88%,90%,95%,100% { opacity: 0.85; }
          89% { opacity: 0.6; }
          91%,94% { opacity: 0.75; }
          96% { opacity: 0.55; }
        }
        @keyframes runeFloat {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 0.4; }
          100% { transform: translateY(-500px) translateX(var(--drift)); opacity: 0; }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes vignettePulse {
          0%,100% { opacity: 0.6; }
          50% { opacity: 0.5; }
        }

        .cursor-pixel {
          display: inline-block;
          width: 10px; height: 2px;
          background: #a855f7;
          margin-left: 3px;
          vertical-align: middle;
          box-shadow: 0 0 6px rgba(168,85,247,0.8);
          animation: blink 1s step-start infinite;
        }
        .char-art {
          animation: charFlicker 10s ease-in-out infinite;
          image-rendering: pixelated;
          image-rendering: crisp-edges;
        }
        .scanline {
          position: absolute;
          left: 0; right: 0;
          height: 2px;
          background: rgba(168,85,247,0.06);
          animation: scanline 8s linear infinite;
          pointer-events: none;
          z-index: 5;
        }
      `}</style>

      {/* ── CRT scanline ── */}
      <div className="scanline" />

      {/* ── Screen vignette ── */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none",
        background: "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(4,2,12,0.85) 100%)",
        animation: "vignettePulse 4s ease-in-out infinite",
      }} />

      {/* ── Rune particles ── */}
      <div style={{ position:"absolute",inset:0,zIndex:2,pointerEvents:"none",overflow:"hidden" }}>
        {PARTICLES.map(p => (
          <motion.span
            key={p.id}
            style={{
              position: "absolute",
              bottom: -20,
              left: `${p.x}%`,
              fontFamily: "monospace",
              fontSize: p.size,
              color: p.color,
              opacity: 0,
              userSelect: "none",
              filter: `drop-shadow(0 0 4px ${p.color})`,
            }}
            animate={{
              y: [0, -(480 + Math.random() * 200)],
              x: [0, p.drift],
              opacity: [0, 0.6, 0],
              rotate: [0, Math.random() > 0.5 ? 90 : -90],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              repeatDelay: 4 + Math.random() * 6,
              ease: "easeOut",
            }}
          />
        ))}
      </div>

      {/* ── Character art ── */}
      <AnimatePresence>
        {charVisible && (
          <motion.div
            style={{
              position: "absolute", inset: 0, zIndex: 4,
              pointerEvents: "none",
              display: "flex", alignItems: "flex-end", justifyContent: "center",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 4.5, ease: "easeInOut" }}
          >
            {/* Bottom gradient so character bleeds into void */}
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(to top, #04020c 0%, rgba(4,2,12,0.7) 30%, rgba(4,2,12,0.2) 60%, transparent 100%)",
              zIndex: 2,
            }} />
            {/* Side gradients */}
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(to right, #04020c 0%, transparent 30%, transparent 70%, #04020c 100%)",
              zIndex: 2,
            }} />
            {/* Purple arcane glow behind character */}
            <div style={{
              position: "absolute",
              bottom: 0, left: "50%",
              transform: "translateX(-50%)",
              width: "60%", height: "70%",
              background: "radial-gradient(ellipse at 50% 100%, rgba(124,58,237,0.18) 0%, transparent 70%)",
              zIndex: 1,
            }} />
            <img
              src={`${CDN}/character-1.png`}
              alt="character"
              className="char-art"
              style={{
                height: "85vh",
                width: "auto",
                objectFit: "contain",
                objectPosition: "bottom",
                position: "relative",
                zIndex: 2,
                maxWidth: "50vw",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Typewriter + CTA ── */}
      <div style={{
        position: "relative",
        zIndex: 10,
        width: "100%",
        maxWidth: 520,
        padding: "0 28px",
      }}>
        {/* Text lines */}
        <div style={{ minHeight: 220 }}>
          {committed.map((line, i) => (
            <div key={i}>
              {line === "" ? (
                <div style={{ height: 20 }} />
              ) : (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  style={{
                    fontFamily: "'VT323', monospace",
                    margin: 0,
                    lineHeight: 1.6,
                    ...(line === "and survive what comes next."
                      ? {
                          fontSize: 26,
                          color: "#a855f7",
                          textShadow: "0 0 20px rgba(168,85,247,0.9), 0 0 40px rgba(168,85,247,0.4)",
                        }
                      : {
                          fontSize: 22,
                          color: "#7c6a96",
                        }
                    ),
                  }}
                >
                  {line}
                </motion.p>
              )}
            </div>
          ))}

          {/* Currently typing */}
          {currentPartial !== null && (
            <p style={{
              fontFamily: "'VT323', monospace",
              fontSize: 22,
              color: "#7c6a96",
              lineHeight: 1.6,
              margin: 0,
            }}>
              {currentPartial}
              <span className="cursor-pixel" />
            </p>
          )}

          {/* Idle cursor */}
          {currentEntry?.text === "" && !scriptDone && (
            <p style={{ fontFamily: "'VT323', monospace", fontSize: 22, color: "#7c6a96", margin: 0 }}>
              <span className="cursor-pixel" />
            </p>
          )}
        </div>

        {/* ── CTA buttons ── */}
        <AnimatePresence>
          {showCTA && (
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              style={{ marginTop: 48, display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }}
            >
              {/* Accept — glowing primary */}
              <button
                onClick={() => setDialog("confirm")}
                style={{
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: 9,
                  letterSpacing: "0.1em",
                  padding: "13px 28px",
                  background: "#7c3aed",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  minWidth: 220,
                  textAlign: "left",
                  boxShadow: "0 0 0 2px #a855f7, 0 0 30px rgba(124,58,237,0.55), inset 0 1px 0 rgba(255,255,255,0.1)",
                  transition: "all 0.15s",
                  imageRendering: "pixelated",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "#9333ea";
                  e.currentTarget.style.boxShadow = "0 0 0 2px #c084fc, 0 0 40px rgba(147,51,234,0.7), inset 0 1px 0 rgba(255,255,255,0.15)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "#7c3aed";
                  e.currentTarget.style.boxShadow = "0 0 0 2px #a855f7, 0 0 30px rgba(124,58,237,0.55), inset 0 1px 0 rgba(255,255,255,0.1)";
                }}
              >
                ▶ ACCEPT QUEST
              </button>

              {/* Reject — ghost */}
              <button
                style={{
                  fontFamily: "'Press Start 2P', monospace",
                  fontSize: 9,
                  letterSpacing: "0.1em",
                  padding: "13px 28px",
                  background: "transparent",
                  color: "#2d1a4e",
                  border: "none",
                  cursor: "pointer",
                  minWidth: 220,
                  textAlign: "left",
                  boxShadow: "0 0 0 2px #1a0a30",
                  transition: "all 0.15s",
                  imageRendering: "pixelated",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = "#4c306e";
                  e.currentTarget.style.boxShadow = "0 0 0 2px #3b1d6e";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = "#2d1a4e";
                  e.currentTarget.style.boxShadow = "0 0 0 2px #1a0a30";
                }}
              >
                ✕ REJECT QUEST
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Dialog: Confirm ── */}
      <AnimatePresence>
        {dialog === "confirm" && (
          <PixelDialog
            title="// QUEST DETECTED //"
            body="The fragments are scattered. The realm awaits a champion. Will you answer the call?"
            options={[
              { label: "YES", primary: true, action: () => setDialog("connect") },
              { label: "NO",  action: () => setDialog(null) },
            ]}
          />
        )}
      </AnimatePresence>

      {/* ── Dialog: Connect X ── */}
      <AnimatePresence>
        {dialog === "connect" && (
          <PixelDialog
            title="// IDENTITY REQUIRED //"
            body="You must be known to enter this realm. Connect your X account to continue."
            options={[
              { label: "CONNECT X", primary: true, loading: connecting, action: handleConnectX },
              { label: "BACK", action: () => { if (!connecting) setDialog("confirm"); } },
            ]}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
