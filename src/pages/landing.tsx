import { Link } from "wouter";
import { motion } from "framer-motion";
import { Swords, Flame, Trophy } from "lucide-react";

function EmberParticle({ delay, x, size }: { delay: number; x: number; size: number }) {
  return (
    <motion.div
      className="absolute bottom-0 rounded-full bg-primary pointer-events-none"
      style={{ left: `${x}%`, width: size, height: size, opacity: 0 }}
      animate={{
        y: [0, -300 - Math.random() * 200],
        opacity: [0, 0.8, 0],
        x: [0, (Math.random() - 0.5) * 80],
        scale: [1, 0.3],
      }}
      transition={{
        duration: 3 + Math.random() * 3,
        delay,
        repeat: Infinity,
        repeatDelay: Math.random() * 2,
        ease: "easeOut",
      }}
    />
  );
}

const PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  delay: i * 0.3,
  x: Math.random() * 100,
  size: 2 + Math.random() * 4,
}));

const features = [
  {
    icon: <Swords className="w-6 h-6" />,
    title: "Collect Fragments",
    desc: "Complete quests to earn fragments ranging from Common to Mythic rarity.",
  },
  {
    icon: <Flame className="w-6 h-6" />,
    title: "Forge Upgrades",
    desc: "Combine fragments in the Forge to craft powerful enhanced and ascended gear.",
  },
  {
    icon: <Trophy className="w-6 h-6" />,
    title: "Compete Globally",
    desc: "Climb the leaderboard by increasing your power level through strategic collecting.",
  },
];

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden" data-testid="landing-page">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {PARTICLES.map(p => (
          <EmberParticle key={p.id} delay={p.delay} x={p.x} size={p.size} />
        ))}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 100%, hsl(29 100% 50% / 0.08) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 50% 40% at 50% 30%, hsl(258 90% 66% / 0.04) 0%, transparent 70%)",
          }}
        />
      </div>

      <div className="relative flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-3xl mx-auto"
        >
          <motion.p
            className="text-xs tracking-[0.4em] text-primary/70 uppercase mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            The Dark Realm Awaits
          </motion.p>

          <motion.h1
            className="font-display text-3xl md:text-5xl leading-tight text-foreground mb-6"
            style={{ textShadow: "0 0 40px hsl(29 100% 50% / 0.3)" }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
          >
            Collect the Fragments.
            <br />
            <span className="text-primary text-glow">Become More.</span>
          </motion.h1>

          <motion.p
            className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            In the shattered realm of Emberveil, ancient power lies scattered across the void.
            Hunt down mystical fragments, forge them into legendary gear, and etch your name
            into the eternal leaderboard.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
          >
            <Link href="/fragments">
              <motion.button
                data-testid="button-start-hunting"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-3 bg-primary text-background font-semibold rounded-lg tracking-wider text-sm transition-all"
                style={{ boxShadow: "0 0 24px hsl(29 100% 50% / 0.5)" }}
              >
                Start Hunting
              </motion.button>
            </Link>
            <Link href="/leaderboard">
              <motion.button
                data-testid="button-view-leaderboard"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-3 bg-transparent border border-primary/40 text-primary font-semibold rounded-lg tracking-wider text-sm hover:border-primary/70 transition-all"
              >
                View Leaderboard
              </motion.button>
            </Link>
          </motion.div>
        </motion.div>

        <motion.div
          className="relative w-full max-w-4xl mx-auto mt-24 px-4 grid grid-cols-1 sm:grid-cols-3 gap-4"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.85, duration: 0.6 }}
        >
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + i * 0.1 }}
              className="bg-card border border-primary/15 rounded-xl p-5 text-left hover:border-primary/35 transition-colors group"
            >
              <div className="text-primary mb-3 group-hover:text-glow transition-all">{f.icon}</div>
              <h3 className="font-display text-sm text-foreground mb-2">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
