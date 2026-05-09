import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Swords, Flame, Trophy, ChevronRight } from "lucide-react";

// ── Pixel art fragment images (replace src with real paths) ──────────────────
const FRAGMENTS = [
  { name: "Sword",               src: "/assets/sword.jpg" },
  { name: "Helm",                src: "/assets/helm.jpg" },
  { name: "Plate",               src: "/assets/plate.jpg" },
  { name: "Gloves",              src: "/assets/gloves.jpg" },
  { name: "Boots",               src: "/assets/boots.jpg" },
  { name: "Doom Potion",         src: "/assets/doom-potion.jpg" },
  { name: "Book of Reincarnation", src: "/assets/book.jpg" },
  { name: "Heart of Fire",       src: "/assets/heart.jpg" },
];

// ── Typewriter lines ─────────────────────────────────────────────────────────
const LINES = [
  "The world was shattered.",
  "Its power broken into fragments…",
  "",
  "Only those who collect the relics",
  "can rebuild the armor…",
  "",
  "and survive what comes next.",
];

// ── Hamburger nav links ──────────────────────────────────────────────────────
const NAV_LINKS = [
  { href: "/fragments", label: "Hunt" },
  { href: "/forge",     label: "Forge" },
  { href: "/leaderboard", label: "Leaderboard" },
];

// ── Ember particles ──────────────────────────────────────────────────────────
const EMBERS = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  size: 2 + Math.random() * 3,
  delay: i * 0.25,
  duration: 4 + Math.random() * 4,
}));

// ── Typewriter hook ──────────────────────────────────────────────────────────
function useTypewriter(lines: string[], speed = 38) {
  const [displayed, setDisplayed] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (currentLine >= lines.length) { setDone(true); return; }
    const line = lines[currentLine];

    if (line === "") {
      const t = setTimeout(() => {
        setDisplayed(d => [...d, ""]);
        setCurrentLine(l => l + 1);
        setCurrentChar(0);
      }, 400);
      return () => clearTimeout(t);
    }

    if (currentChar < line.length) {
      const t = setTimeout(() => setCurrentChar(c => c + 1), speed);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        setDisplayed(d => [...d, line]);
        setCurrentLine(l => l + 1);
        setCurrentChar(0);
      }, 600);
      return () => clearTimeout(t);
    }
  }, [currentLine, currentChar, lines, speed]);

  const partial = currentLine < lines.length && lines[currentLine] !== ""
    ? lines[currentLine].slice(0, currentChar)
    : null;

  return { displayed, partial, done };
}

// ── Twitter sign-in modal ────────────────────────────────────────────────────
function TwitterModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        className="relative z-10 w-[340px] rounded-2xl border border-[#e8c97e]/30 bg-[#0a0806] p-8 text-center shadow-[0_0_60px_rgba(232,201,126,0.15)]"
        initial={{ scale: 0.85, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.85, y: 30, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
      >
        {/* pixel crate icon */}
        <div className="mx-auto mb-5 w-16 h-16 flex items-center justify-center">
          <img src="/assets/crate-closed.jpg" alt="crate" className="w-full h-full object-contain pixelated" />
        </div>

        <h2 className="font-display text-xl text-[#e8c97e] mb-2 tracking-widest uppercase">
          Begin Your Quest
        </h2>
        <p className="text-[11px] text-[#8a7a60] mb-7 leading-relaxed">
          Sign in with X to enter the Fragment Forge campaign and start collecting relics.
        </p>

        <a
          href="/api/auth/twitter"
          className="flex items-center justify-center gap-3 w-full py-3 rounded-xl bg-white text-black font-bold text-sm tracking-wide hover:bg-[#e8e8e8] transition-colors"
        >
          {/* X logo */}
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-black shrink-0">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Continue with X
        </a>

        <button
          onClick={onClose}
          className="mt-4 text-[11px] text-[#4a3f2e] hover:text-[#8a7a60] transition-colors"
        >
          Maybe later
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Main Landing ─────────────────────────────────────────────────────────────
export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showButtons, setShowButtons] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [bgVisible, setBgVisible] = useState(false);
  const { displayed, partial, done } = useTypewriter(LINES, 36);

  // Fade in background a beat after component mounts
  useEffect(() => {
    const t = setTimeout(() => setBgVisible(true), 300);
    return () => clearTimeout(t);
  }, []);

  // Show CTA buttons once typewriter finishes
  useEffect(() => {
    if (done) {
      const t = setTimeout(() => setShowButtons(true), 500);
      return () => clearTimeout(t);
    }
  }, [done]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050302] text-[#e8dcc8]" style={{ fontFamily: "'IM Fell English', serif" }}>

      {/* ── Google Fonts ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=Cinzel+Decorative:wght@400;700&family=Share+Tech+Mono&display=swap');

        .font-display  { font-family: 'Cinzel Decorative', serif; }
        .font-mono-px  { font-family: 'Share Tech Mono', monospace; }
        .pixelated     { image-rendering: pixelated; }

        /* scanline overlay */
        .scanlines::before {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            to bottom,
            transparent 0px,
            transparent 3px,
            rgba(0,0,0,0.08) 3px,
            rgba(0,0,0,0.08) 4px
          );
          pointer-events: none;
          z-index: 2;
        }

        /* cursor blink */
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        .cursor { display:inline-block; width:2px; height:1em; background:#e8c97e; margin-left:3px; vertical-align:middle; animation: blink 0.9s step-start infinite; }

        /* glow text */
        .gold-glow { text-shadow: 0 0 20px rgba(232,201,126,0.7), 0 0 40px rgba(232,201,126,0.3); }
        .ember-glow { box-shadow: 0 0 30px rgba(232,120,30,0.6), 0 0 60px rgba(232,120,30,0.2); }

        /* btn hover line-sweep */
        .btn-accept {
          position: relative;
          overflow: hidden;
        }
        .btn-accept::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%);
          transform: translateX(-100%);
          transition: transform 0.4s ease;
        }
        .btn-accept:hover::after { transform: translateX(100%); }
      `}</style>

      {/* ── Scanlines ── */}
      <div className="scanlines absolute inset-0 pointer-events-none z-10" />

      {/* ── Background: pixel art character / scene ── */}
      <motion.div
        className="absolute inset-0 z-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: bgVisible ? 1 : 0 }}
        transition={{ duration: 3, ease: "easeInOut" }}
      >
        {/* dark vignette gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050302] via-[#050302]/70 to-[#050302]/30 z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050302]/90 via-transparent to-[#050302]/90 z-10" />

        {/* floating fragment silhouettes as ambient background */}
        <div className="absolute inset-0 flex items-center justify-center z-0 opacity-10">
          <div className="w-full h-full max-w-4xl grid grid-cols-4 grid-rows-2 gap-8 p-16 items-center">
            {FRAGMENTS.map((f, i) => (
              <motion.img
                key={f.name}
                src={f.src}
                alt={f.name}
                className="w-full object-contain pixelated opacity-60"
                animate={{ y: [0, -8, 0], rotate: [0, i % 2 === 0 ? 3 : -3, 0] }}
                transition={{ duration: 5 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Ember particles ── */}
      <div className="absolute inset-0 z-[3] pointer-events-none overflow-hidden">
        {EMBERS.map(e => (
          <motion.div
            key={e.id}
            className="absolute bottom-0 rounded-full"
            style={{
              left: `${e.x}%`,
              width: e.size,
              height: e.size,
              background: `radial-gradient(circle, #ff8c30 0%, #e85010 100%)`,
            }}
            animate={{
              y: [0, -(350 + Math.random() * 250)],
              opacity: [0, 0.9, 0],
              x: [0, (Math.random() - 0.5) * 120],
              scale: [1, 0.2],
            }}
            transition={{
              duration: e.duration,
              delay: e.delay,
              repeat: Infinity,
              repeatDelay: Math.random() * 3,
              ease: "easeOut",
            }}
          />
        ))}
      </div>

      {/* ── Hamburger Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-4">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <img src="/assets/crate-closed.jpg" alt="logo" className="w-6 h-6 object-contain pixelated" />
          <span className="font-display text-xs text-[#e8c97e] tracking-[0.25em] gold-glow">FRAGMENT FORGE</span>
        </a>

        {/* Hamburger button */}
        <button
          onClick={() => setMenuOpen(m => !m)}
          className="relative z-50 w-9 h-9 flex flex-col items-center justify-center gap-[5px] group"
          aria-label="Toggle menu"
        >
          <motion.span
            className="block w-6 h-[1.5px] bg-[#e8c97e] origin-center transition-all"
            animate={{ rotate: menuOpen ? 45 : 0, y: menuOpen ? 6.5 : 0 }}
          />
          <motion.span
            className="block w-6 h-[1.5px] bg-[#e8c97e] transition-all"
            animate={{ opacity: menuOpen ? 0 : 1 }}
          />
          <motion.span
            className="block w-6 h-[1.5px] bg-[#e8c97e] origin-center transition-all"
            animate={{ rotate: menuOpen ? -45 : 0, y: menuOpen ? -6.5 : 0 }}
          />
        </button>
      </nav>

      {/* ── Slide-down mobile menu ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-[#050302]/97 backdrop-blur-md"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* pixel corner decorations */}
            <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-[#e8c97e]/30" />
            <div className="absolute top-6 right-16 w-8 h-8 border-t-2 border-r-2 border-[#e8c97e]/30" />
            <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-[#e8c97e]/30" />
            <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-[#e8c97e]/30" />

            <div className="flex flex-col items-center gap-8">
              {NAV_LINKS.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="font-display text-2xl text-[#e8c97e]/80 hover:text-[#e8c97e] tracking-[0.2em] transition-colors"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.08 }}
                >
                  {link.label}
                </motion.a>
              ))}

              <motion.div
                className="mt-4 h-px w-32 bg-gradient-to-r from-transparent via-[#e8c97e]/30 to-transparent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              />

              <motion.button
                onClick={() => { setMenuOpen(false); setShowModal(true); }}
                className="mt-2 px-6 py-2 border border-[#e8c97e]/40 text-[#e8c97e] text-sm tracking-widest hover:border-[#e8c97e] transition-colors font-mono-px"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
              >
                [ SIGN IN ]
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero: Typewriter intro ── */}
      <div className="relative z-20 flex flex-col items-center justify-center min-h-screen px-6 text-center">

        {/* Top rune separator */}
        <motion.div
          className="mb-10 flex items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#e8c97e]/40" />
          <span className="text-[#e8c97e]/40 font-mono-px text-[10px] tracking-[0.5em]">◆ FRAGMENT FORGE ◆</span>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#e8c97e]/40" />
        </motion.div>

        {/* Typewriter text block */}
        <div className="max-w-lg text-left space-y-1 min-h-[220px]">
          {displayed.map((line, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className={`leading-relaxed ${
                line === ""
                  ? "h-4"
                  : i === displayed.length - 1 && done
                  ? "text-[#e8c97e] text-lg italic gold-glow"
                  : "text-[#c8b89a] text-base"
              }`}
            >
              {line}
            </motion.p>
          ))}

          {/* Current typing line */}
          {partial !== null && (
            <p className="text-[#c8b89a] text-base leading-relaxed">
              {partial}
              <span className="cursor" />
            </p>
          )}
        </div>

        {/* CTA buttons — appear after typewriter */}
        <AnimatePresence>
          {showButtons && (
            <motion.div
              className="mt-14 flex flex-col sm:flex-row gap-4 items-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              {/* ACCEPT QUEST */}
              <motion.button
                onClick={() => setShowModal(true)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="btn-accept relative px-10 py-4 bg-[#e8781e] text-[#0a0806] font-display text-xs tracking-[0.2em] uppercase rounded-sm ember-glow transition-all"
              >
                ▶ Accept Quest
              </motion.button>

              {/* REJECT QUEST */}
              <motion.button
                whileHover={{ scale: 1.02, borderColor: "rgba(232,201,126,0.5)" }}
                whileTap={{ scale: 0.97 }}
                className="px-10 py-4 border border-[#4a3f2e] text-[#6a5a40] font-display text-xs tracking-[0.2em] uppercase rounded-sm hover:text-[#8a7560] transition-all"
                onClick={() => window.history.back()}
              >
                ✕ Reject Quest
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fragment row — fades in after buttons */}
        <AnimatePresence>
          {showButtons && (
            <motion.div
              className="mt-16 flex items-center gap-3 flex-wrap justify-center"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.7 }}
            >
              {FRAGMENTS.map((f, i) => (
                <motion.div
                  key={f.name}
                  className="relative group"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.55 + i * 0.06 }}
                  whileHover={{ scale: 1.15, y: -4 }}
                >
                  <div className="w-10 h-10 rounded border border-[#3a2e1e]/60 bg-[#0f0a05] p-1 group-hover:border-[#e8c97e]/50 transition-colors">
                    <img
                      src={f.src}
                      alt={f.name}
                      className="w-full h-full object-contain pixelated"
                    />
                  </div>
                  {/* tooltip */}
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-[#1a1208] border border-[#e8c97e]/20 text-[9px] text-[#e8c97e] font-mono-px whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded">
                    {f.name}
                  </div>
                </motion.div>
              ))}
              <motion.div
                className="text-[10px] text-[#4a3f2e] font-mono-px ml-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                8 / 8 relics
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom pixel border */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 2 }}
        >
          <span className="font-mono-px text-[9px] text-[#3a2e1e] tracking-widest">SCROLL TO EXPLORE</span>
        </motion.div>
      </div>

      {/* ── Twitter sign-in modal ── */}
      <AnimatePresence>
        {showModal && <TwitterModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </div>
  );
}
