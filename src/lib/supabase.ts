import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    detectSessionInUrl: true,
    flowType: "pkce",
    persistSession: true,
    autoRefreshToken: true,
  }
});

// Supabase Storage CDN base for all fragment assets
export const CDN = "https://psibadkdncspgikzzmnu.supabase.co/storage/v1/object/public/Fragments";

export const FRAGMENT_IMAGES: Record<string, string> = {
  sword:                   `${CDN}/sword.png`,
  helm:                    `${CDN}/helm.png`,
  armor:                   `${CDN}/armor.png`,
  gloves:                  `${CDN}/gloves.png`,
  boots:                   `${CDN}/boots.png`,
  potion:                  `${CDN}/potion.png`,
  "book-of-reincarnation": `${CDN}/book-of-reincarnation.png`,
  "dragon-heart":          `${CDN}/dragon-heart.png`,
};
