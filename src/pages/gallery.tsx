import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import TopBar from "@/components/layout/TopBar";

export default function Gallery() {
  const [peeks, setPeeks] = useState<{ id: number; image_url: string; assigned_to?: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("sneak_peeks")
      .select("id, image_url, assigned_to")
      .order("id")
      .then(({ data }) => {
        setPeeks(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-[100dvh] bg-[#04020c] text-white relative">
      <TopBar />
      <div className="pt-20 pb-10 px-4 max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1
            className="font-['Press_Start_2P'] text-[12px] text-[#a855f7] mb-2"
            style={{ textShadow: "0 0 10px rgba(168,85,247,0.5)" }}
          >
            👁 SNEAK PEEKS
          </h1>
          <p className="text-[10px] text-[#6b5a80] font-['VT323'] text-lg">
            {peeks.length.toLocaleString()} knights await. Forge an artifact to reveal yours.
          </p>
        </motion.div>

        {loading ? (
          <div className="mt-10 text-center text-[#6b5a80] font-['Press_Start_2P'] text-[8px]">
            LOADING...
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {peeks.map((peek, i) => (
              <motion.div
                key={peek.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: Math.min(i * 0.002, 0.5) }}
                className={`aspect-square bg-[#0d0420] border rounded overflow-hidden transition-all ${
                  peek.assigned_to
                    ? "border-emerald-900/50 opacity-40"
                    : "border-[#1a0a2e] hover:border-[#7c3aed]"
                }`}
              >
                <img
                  src={peek.image_url}
                  alt={`Knight #${peek.id}`}
                  className={`w-full h-full object-cover ${
                    peek.assigned_to ? "grayscale" : "hover:opacity-100"
                  } transition-opacity`}
                  loading="lazy"
                />
                {peek.assigned_to && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-['Press_Start_2P'] text-[8px] text-emerald-400/50">
                      CLAIMED
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
