import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const [, navigate] = useLocation();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let handled = false;

    const processAuth = async (session: any) => {
      if (handled || !session) return;
      handled = true;

      const u = session.user;
      const meta = u.user_metadata || {};
      const username = meta.preferred_username || meta.user_name || meta.screen_name || null;
      const displayName = meta.name || meta.full_name || username || null;
      const avatarUrl = meta.avatar_url || meta.profile_image_url || null;
      const twitterId = meta.provider_id || meta.sub || null;

      // 1. Upsert player profile
      const { error: upsertError } = await supabase.from("players").upsert({
        id: u.id,
        twitter_id: twitterId,
        username: username,
        display_name: displayName,
        avatar_url: avatarUrl,
      }, { onConflict: "id", ignoreDuplicates: false });

      if (upsertError) {
        console.error("Profile upsert failed:", upsertError.message);
        setFailed(true);
        return;
      }

      // 2. Check for pending referral from URL
      // Try sessionStorage first, then fallback to URL params directly
      let pendingRef = sessionStorage.getItem("pending_referral");
      
      if (!pendingRef && typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        pendingRef = params.get("ref") || null;
      }

      if (pendingRef) {
        console.log("Applying referral:", pendingRef);
        const { data, error } = await supabase.rpc("apply_referral", { 
          p_code: pendingRef.toUpperCase() 
        });
        
        if (error) {
          console.error("Referral RPC error:", error.message);
        } else if (data?.success) {
          console.log("Referral applied! Bonus:", data.bonus);
          sessionStorage.removeItem("pending_referral");
        } else {
          console.log("Referral failed:", data?.error);
        }
      }

      navigate("/hunt");
    };

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          await processAuth(session);
        }
      }
    );

    // Fallback: check if session already exists
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        processAuth(data.session);
      }
    });

    const timeout = setTimeout(() => {
      if (!handled) setFailed(true);
    }, 15000);

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
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
