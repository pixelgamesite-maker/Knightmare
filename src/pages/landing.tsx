import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { supabase } from "../lib/supabase";

// ── Supabase asset URLs ───────────────────────────────────────────────────────
const ASSETS = {
  character: "https://psibadkdncspgikzzmnu.supabase.co/storage/v1/object/public/Fragments/character-1.png",
  background: "https://psibadkdncspgikzzmnu.supabase.co/storage/v1/object/public/Fragments/background.png",
};

// ── Typewriter script ─────────────────────────────────────────────────────────
const SCRIPT = [
  { text: "The world was shattered.",          pause: 1800, showChar: false },
  { text: "Its power broken into fragments…",  pause: 1600, showChar: true  },
  { text: "",                                  pause: 700,  showChar: false },
  { text: "Only those who collect the relics", pause: 1200, showChar: false },
  { text: "can rebuild the armor…",            pause: 1500, showChar: false },
  { text: "",                                  pause: 500,  showChar: false },
  { text: "and survive what comes next.",      pause: 2200, showChar: false },
];

const CHAR_MS = 72; // ms per character — slow, deliberate

// ── Scanline / pixel noise effect ────────────────────────────────────────────
const SCANLINE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=VT323&family=Press+Start+2P&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:       #0d0b14;
    --bg2:      #13101f;
    --cyan:     #00e5ff;
    --purple:   #9b30ff;
    --orange:   #ff4d00;
    --gold:     #ffd166;
    --text:     #c8d8e8;
    --text-dim: #4a5a6a;
    --border:   #1e2a3a;
  }

  body { background: var(--bg); }

  /* Pixel fonts */
  .f-title { font-family: 'Press Start 2P', monospace; }
  .f-body  { font-family: 'VT323', monospace; font-size: 20px; letter-spacing: 0.04em; }
  .f-ui    { font-family: 'Press Start 2P', monospace; font-size: 8px; }

  /* CRT scanlines */
  .scanlines {
    position: fixed; inset: 0; z-index: 100; pointer-events: none;
    background: repeating-linear-gradient(
      to bottom,
      transparent 0px, transparent 2px,
      rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px
    );
  }

  /* Pixel cursor */
  @keyframes blink { 0%,49%{opacity:1} 50%,100%{opacity:0} }
  .px-cursor {
    display: inline-block; width: 10px; height: 14px;
    background: var(--cyan); margin-left: 3px; vertical-align: middle;
    animation: blink 0.9s step-start infinite;
  }

  /* Character flicker */
  @keyframes char-flicker {
    0%,94%,100% { opacity: 0.9; }
    95%          { opacity: 0.7; }
    97%          { opacity: 0.85; }
  }
  .char-flicker { animation: char-flicker 7s ease-in-out infinite; }

  /* Image pixelated */
  .px { image-rendering: pixelated; image-rendering: crisp-edges; }

  /* Dialog border glow */
  @keyframes border-pulse {
    0%,100% { box-shadow: 0 0 8px var(--cyan), inset 0 0 8px rgba(0,229,255,0.05); }
    50%     { box-shadow: 0 0 20px var(--cyan), inset 0 0 12px rgba(0,229,255,0.08); }
  }
  .dialog-glow { animation: border-pulse 3s ease-in-out infinite; }

  /* Button hover sweep */
  .px-btn {
    position: relative; overflow: hidden; cursor: pointer;
    transition: all 0.1s;
  }
  .px-btn::after {
    content: '';
    position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
    transition: left 0.35s;
  }
  .px-btn:hover::after { left: 150%; }
  .px-btn:active { transform: scale(0.97); }
`;

// ── Pixel dialog box ──────────────────────────────────────────────────────────
function PixelDialog({
  title, body, options,
}: {
  title: string;
  body: string;
  options: { label: string; action: () => void; primary?: boolean; loading?: boolean }[];
}) {
  return (
    <motion.div
      style={{ position:"fixed", inset:0, zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 16px" }}
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
    >
      {/* dim overlay */}
      <div style={{ position:"absolute", inset:0, background:"rgba(13,11,20,0.88)" }} />

      <motion.div
        style={{ position:"relative", zIndex:10, width:"100%", maxWidth:380 }}
        initial={{ scale:0.8, opacity:0 }}
        animate={{ scale:1, opacity:1 }}
        exit={{ scale:0.8, opacity:0 }}
        transition={{ type:"spring", stiffness:320, damping:28 }}
      >
        {/* Outer border — double pixel frame */}
        <div
          className="dialog-glow"
          style={{
            border: "3px solid #00e5ff",
            outline: "3px solid #0d0b14",
            outlineOffset: "3px",
            background: "#0d0b14",
            imageRendering: "pixelated",
          }}
        >
          {/* Title bar */}
          <div style={{
            background: "repeating-linear-gradient(90deg, #0a1520 0px, #0a1520 2px, #0d0b14 2px, #0d0b14 4px)",
            borderBottom: "2px solid #00e5ff",
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <div style={{ width:8, height:8, background:"#00e5ff", flexShrink:0 }} />
            <p className="f-ui" style={{ color:"#00e5ff", letterSpacing:"0.15em", textTransform:"uppercase", fontSize:7 }}>
              {title}
            </p>
          </div>

          {/* Body text */}
          <div style={{ padding:"20px 16px 8px" }}>
            <p className="f-body" style={{ color:"#c8d8e8", lineHeight:1.5, textAlign:"left", fontSize:18 }}>
              {body}
            </p>
          </div>

          {/* Arrow indicator (classic RPG) */}
          <div style={{ padding:"4px 16px 4px", textAlign:"right" }}>
            <motion.span
              className="f-ui"
              style={{ color:"#00e5ff", fontSize:7 }}
              animate={{ opacity:[1,0,1] }}
              transition={{ duration:0.8, repeat:Infinity }}
            >
              ▼
            </motion.span>
          </div>

          {/* Options */}
          <div style={{ padding:"8px 16px 16px", display:"flex", gap:8, flexWrap:"wrap" }}>
            {options.map(opt => (
              <button
                key={opt.label}
                className="px-btn f-ui"
                onClick={opt.action}
                disabled={opt.loading}
                style={{
                  fontSize: 8,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  padding: "10px 18px",
                  opacity: opt.loading ? 0.6 : 1,
                  ...(opt.primary
                    ? {
                        background: "#ff4d00",
                        color: "#0d0b14",
                        border: "2px solid #ff4d00",
                        boxShadow: "4px 4px 0 #7a2000",
                      }
                    : {
                        background: "transparent",
                        color: "#4a5a6a",
                        border: "2px solid #1e2a3a",
                        boxShadow: "4px 4px 0 #0a0d12",
                      }),
                }}
              >
                {opt.loading ? "▓▓▓" : `▶ ${opt.label}`}
              </button>
            ))}
          </div>

          {/* Pixel corner squares */}
          {[
            { top:-3, left:-3 }, { top:-3, right:-3 },
            { bottom:-3, left:-3 }, { bottom:-3, right:-3 },
          ].map((s, i) => (
            <div key={i} style={{ position:"absolute", width:6, height:6, background:"#00e5ff", ...s }} />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Landing ──────────────────────────────────────────────────────────────
export default function Landing() {
  const [, navigate] = useLocation();

  // Auth — if already signed in, skip to app
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/fragments");
    });
  }, [navigate]);

  // Typewriter state
  const [lineIdx, setLineIdx]         = useState(0);
  const [charIdx, setCharIdx]         = useState(0);
  const [committed, setCommitted]     = useState<string[]>([]);
  const [charVisible, setCharVisible] = useState(false);
  const [scriptDone, setScriptDone]   = useState(false);
  const [showCTA, setShowCTA]         = useState(false);

  // Dialog state
  const [dialog, setDialog]           = useState<null|"confirm"|"connect">(null);
  const [connecting, setConnecting]   = useState(false);

  // Typewriter engine
  useEffect(() => {
    if (scriptDone) return;
    if (lineIdx >= SCRIPT.length) {
      setScriptDone(true);
      setTimeout(() => setShowCTA(true), 800);
      return;
    }
    const entry = SCRIPT[lineIdx];
    if (entry.text === "") {
      const t = setTimeout(() => {
        setCommitted(c => [...c, ""]);
        setLineIdx(i => i + 1);
        setCharIdx(0);
      }, entry.pause);
      return () => clearTimeout(t);
    }
    if (charIdx < entry.text.length) {
      const t = setTimeout(() => setCharIdx(c => c + 1), CHAR_MS);
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

  const currentEntry   = lineIdx < SCRIPT.length ? SCRIPT[lineIdx] : null;
  const currentPartial = currentEntry && currentEntry.text !== ""
    ? currentEntry.text.slice(0, charIdx)
    : null;

  const handleConnect = async () => {
    setConnecting(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "twitter",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      console.error(error);
      setConnecting(false);
    }
  };

  return (
    <>
      <style>{SCANLINE_CSS}</style>

      {/* CRT scanlines overlay */}
      <div className="scanlines" />

      <div style={{ position:"relative", minHeight:"100vh", background:"var(--bg)", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}>

        {/* ── Background image (used after sign-in, dimmed here for cinematic) ── */}
        {/* Kept very dim so it doesn't distract from the intro */}
        <div style={{ position:"absolute", inset:0, zIndex:0 }}>
          <img
            src={ASSETS.background}
            alt=""
            className="px"
            style={{ width:"100%", height:"100%", objectFit:"cover", opacity:0.07, filter:"brightness(0.4) saturate(0.5)" }}
          />
          <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 100% 100% at 50% 100%, rgba(13,11,20,0) 0%, rgba(13,11,20,0.98) 70%)" }} />
        </div>

        {/* ── Pixel particle embers ── */}
        <div style={{ position:"absolute", inset:0, zIndex:1, pointerEvents:"none", overflow:"hidden" }}>
          {Array.from({length:16},(_,i)=>(
            <motion.div key={i}
              style={{
                position:"absolute", bottom:0,
                left:`${8+Math.random()*84}%`,
                width: i%3===0 ? 3 : 2,
                height: i%3===0 ? 3 : 2,
                background: i%4===0 ? "#00e5ff" : i%3===0 ? "#9b30ff" : "#ff4d00",
              }}
              animate={{ y:[0,-(300+Math.random()*300)], x:[0,(Math.random()-0.5)*80], opacity:[0,0.9,0] }}
              transition={{ duration:4+Math.random()*5, delay:i*0.8+Math.random()*3, repeat:Infinity, repeatDelay:2+Math.random()*4, ease:"easeOut" }}
            />
          ))}
        </div>

        {/* ── Character fade-in ── */}
        <AnimatePresence>
          {charVisible && (
            <motion.div
              style={{ position:"absolute", inset:0, zIndex:2, pointerEvents:"none", display:"flex", alignItems:"flex-end", justifyContent:"center" }}
              initial={{ opacity:0 }}
              animate={{ opacity:1 }}
              transition={{ duration:4.5, ease:"easeInOut" }}
            >
              {/* Side fade */}
              <div style={{ position:"absolute", inset:0, zIndex:3, background:"linear-gradient(to right, #0d0b14 0%, transparent 20%, transparent 80%, #0d0b14 100%)" }} />
              {/* Bottom fade */}
              <div style={{ position:"absolute", inset:0, zIndex:3, background:"linear-gradient(to top, #0d0b14 0%, transparent 45%)" }} />
              <img
                src={ASSETS.character}
                alt=""
                className="px char-flicker"
                style={{
                  height:"85vh",
                  width:"auto",
                  objectFit:"contain",
                  objectPosition:"bottom",
                  position:"relative",
                  zIndex:2,
                  filter:"drop-shadow(0 0 30px rgba(0,229,255,0.25))",
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Typewriter + CTA ── */}
        <div style={{ position:"relative", zIndex:10, width:"100%", maxWidth:520, padding:"0 28px" }}>

          {/* Text block */}
          <div style={{ minHeight:180 }}>
            {committed.map((line, i) => (
              <div key={i}>
                {line === ""
                  ? <div style={{ height:20 }} />
                  : <motion.p
                      initial={{ opacity:0 }}
                      animate={{ opacity:1 }}
                      transition={{ duration:0.2 }}
                      className="f-body"
                      style={{
                        color: line === "and survive what comes next."
                          ? "#00e5ff"
                          : "#8a9aaa",
                        fontSize: line === "and survive what comes next." ? 22 : 19,
                        textShadow: line === "and survive what comes next."
                          ? "0 0 20px rgba(0,229,255,0.8), 0 0 40px rgba(0,229,255,0.3)"
                          : "none",
                        lineHeight: 1.5,
                      }}
                    >
                      {line}
                    </motion.p>
                }
              </div>
            ))}

            {/* Typing line */}
            {currentPartial !== null && (
              <p className="f-body" style={{ color:"#8a9aaa", fontSize:19, lineHeight:1.5 }}>
                {currentPartial}<span className="px-cursor" />
              </p>
            )}

            {/* Idle cursor between lines */}
            {currentEntry?.text === "" && !scriptDone && (
              <p className="f-body" style={{ color:"#8a9aaa", fontSize:19 }}>
                <span className="px-cursor" />
              </p>
            )}
          </div>

          {/* CTA buttons */}
          <AnimatePresence>
            {showCTA && (
              <motion.div
                initial={{ opacity:0, y:20 }}
                animate={{ opacity:1, y:0 }}
                transition={{ duration:0.8, ease:"easeOut" }}
                style={{ marginTop:48, display:"flex", flexDirection:"column", gap:12, alignItems:"flex-start" }}
              >
                <button
                  className="px-btn f-ui"
                  onClick={() => setDialog("confirm")}
                  style={{
                    fontSize:8, letterSpacing:"0.12em", textTransform:"uppercase",
                    padding:"14px 32px", background:"#ff4d00", color:"#0d0b14",
                    border:"2px solid #ff4d00",
                    boxShadow:"4px 4px 0 #7a2000, 0 0 20px rgba(255,77,0,0.4)",
                    minWidth:220,
                  }}
                >
                  ▶ ACCEPT QUEST
                </button>

                <button
                  className="px-btn f-ui"
                  style={{
                    fontSize:8, letterSpacing:"0.12em", textTransform:"uppercase",
                    padding:"14px 32px", background:"transparent", color:"#2a3a4a",
                    border:"2px solid #1a2a3a",
                    boxShadow:"4px 4px 0 #080c12",
                    minWidth:220,
                  }}
                >
                  ✕ REJECT QUEST
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Dialog: Confirm ── */}
      <AnimatePresence>
        {dialog === "confirm" && (
          <PixelDialog
            title="Quest Pending"
            body="The fragments are scattered. Eight relics. Endless danger. Will you answer the call?"
            options={[
              { label:"Yes", primary:true, action:()=>setDialog("connect") },
              { label:"No",  action:()=>setDialog(null) },
            ]}
          />
        )}
      </AnimatePresence>

      {/* ── Dialog: Connect X ── */}
      <AnimatePresence>
        {dialog === "connect" && (
          <PixelDialog
            title="Identity Required"
            body="The realm demands proof of who you are. Connect your X account to enter."
            options={[
              { label:"Connect X", primary:true, loading:connecting, action:handleConnect },
              { label:"Back", action:()=>{ if(!connecting) setDialog("confirm"); } },
            ]}
          />
        )}
      </AnimatePresence>
    </>
  );
}
