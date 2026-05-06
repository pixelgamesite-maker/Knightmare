import { motion } from "framer-motion";

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  sublabel?: string;
  color?: "primary" | "mythic" | "gold";
  showPercent?: boolean;
  animate?: boolean;
}

const colorMap = {
  primary: { fill: "bg-primary", glow: "shadow-[0_0_12px_hsl(29_100%_50%/0.6)]" },
  mythic:  { fill: "bg-[hsl(258,90%,66%)]", glow: "shadow-[0_0_12px_hsl(258_90%_66%/0.6)]" },
  gold:    { fill: "bg-[hsl(51,100%,50%)]", glow: "shadow-[0_0_12px_hsl(51_100%_50%/0.5)]" },
};

export default function ProgressBar({
  value,
  max,
  label,
  sublabel,
  color = "primary",
  showPercent = false,
  animate = true,
}: ProgressBarProps) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const { fill, glow } = colorMap[color];

  return (
    <div className="w-full" data-testid="progress-bar">
      {(label || sublabel || showPercent) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-xs text-muted-foreground font-medium">{label}</span>}
          {showPercent && (
            <span className="text-xs text-primary font-semibold">{Math.round(pct)}%</span>
          )}
          {sublabel && (
            <span className="text-xs text-muted-foreground">{sublabel}</span>
          )}
        </div>
      )}
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${fill} ${glow}`}
          initial={animate ? { width: 0 } : { width: `${pct}%` }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
