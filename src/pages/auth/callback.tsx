import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const [, navigate] = useLocation();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let handled = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (handled) return;
        if (event === "SIGNED_IN" && session) {
          handled = true;
          await persist(session.user);
        }
      }
    );

    supabase.auth.getSession().then(({ data }) => {
      if (!handled && data.session) {
        handled = true;
        persist(data.session.user);
      }
    });

    const timeout = setTimeout(() => { if (!handled) setFailed(true); }, 10000);

    async function persist(u: any) {
      const meta = u.user_metadata || {};
      const username = meta.preferred_username || meta.user_name || meta.screen_name || null;
      const displayName = meta.name || meta.full_name || username || null;
      const avatarUrl = meta.avatar_url || meta.profile_image_url || null;
      const twitterId = meta.provider_id || meta.sub || null;

      const { error } = await supabase.from("players").upsert({
        id: u.id,
        twitter_id: twitterId,
        username: username,
        display_name: displayName,
        avatar_url: avatarUrl,
      }, { onConflict: "id", ignoreDuplicates: false });

      if (error) { console.error(error.message); setFailed(true); return; }
      navigate("/hunt");
    }

    return () => { clearTimeout(timeout); subscription.unsubscribe(); };
  }, [navigate]);

  if (failed) return (
    <div className="min-h-[100dvh] bg-[#04020c] flex flex-col items-center justify-center gap-4">
      <p className="font-['Press_Start_2P'] text-[10px] text-red-500 tracking-widest">AUTH FAILED</p>
      <button onClick={() => navigate("/")}
        className="font-['Press_Start_2P'] text-[8px] text-[#a855f7] bg-transparent border-2 border-[#3b1d6e] px-6 py-2">
        RETURN
      </button>
    </div>
  );

  return (
    <div className="min-h-[100dvh] bg-[#04020c] flex items-center justify-center">
      <p className="font-['Press_Start_2P'] text-[9px] text-[#3b1d6e] tracking-[0.2em]">ENTERING REALM...</p>
    </div>
  );
}
