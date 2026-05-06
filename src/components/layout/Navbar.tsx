import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Swords } from "lucide-react";

const navLinks = [
  { href: "/fragments", label: "Hunt" },
  { href: "/forge", label: "Forge" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export default function Navbar() {
  const [location] = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-6 border-b border-primary/20 bg-background/90 backdrop-blur-md">
      <div className="flex items-center gap-2 mr-8">
        <Swords className="w-5 h-5 text-primary" />
        <Link href="/">
          <span className="font-display text-sm text-primary text-glow tracking-widest cursor-pointer hover:opacity-80 transition-opacity">
            FRAGMENT
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-1">
        {navLinks.map(({ href, label }) => {
          const isActive = location === href || (href !== "/" && location.startsWith(href));
          return (
            <Link key={href} href={href}>
              <div className="relative px-4 py-1 cursor-pointer group">
                <span
                  className={`text-sm font-medium tracking-wider transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full"
                    style={{ boxShadow: "0 0 8px hsl(29 100% 50% / 0.8)" }}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
        }
