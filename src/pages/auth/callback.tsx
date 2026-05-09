import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const [, navigate] = useLocation();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // Listen for SIGNED_IN instead of calling getSession immediately
    // This fixes the PKCE race condition
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          const u = session.user;

          const { error } = await supabase.from("players").upsert(
            {
              id:           u.id,
              twitter_id:   u.user_metadata?.provider_id ?? null,
              username:     u.user_metadata?.user_name   ?? null,
              display_name: u.user_metadata?.full_name   ?? null,
              avatar_url:   u.user_metadata?.avatar_url  ?? null,
            },
            { onConflict: "id" }
          );

          if (error) console.error("Upsert error:", error.message);

          subscription.unsubscribe();
          navigate("/fragments");
        }

        if (event === "SIGNED_OUT") {
          setFailed(true);
        }
      }
    );

    // Fallback timeout — if nothing fires in 10s, show error
    const timeout = setTimeout(() => setFailed(true), 10000);
    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (failed) return (
    <div style={{ minHeight:"100vh", background:"#04020c", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16 }}>
      <p style={{ fontFamily:"'Press Start 2P',monospace", color:"#ef4444", fontSize:10, letterSpacing:"0.15em" }}>
        AUTH FAILED
      </p>
      <button onClick={() => navigate("/")}
        style={{ fontFamily:"'Press Start 2P',monospace", fontSize:8, color:"#a855f7", background:"none", border:"2px solid #3b1d6e", padding:"10px 24px", cursor:"pointer" }}>
        RETURN
      </button>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#04020c", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <p style={{ fontFamily:"'Press Start 2P',monospace", color:"#3b1d6e", fontSize:9, letterSpacing:"0.2em" }}>
        ENTERING REALM...
      </p>
    </div>
  );
}
