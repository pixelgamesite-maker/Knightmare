import { useEffect, useState } from "react";
import { useLocation } from "wouter";
// Change this line to use the @ alias pointing to your src folder
import { supabase } from "@/lib/supabase"; 

export default function AuthCallback() {
  const [, navigate] = useLocation();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    async function handle() {
      // Ensure the @supabase/supabase-js package is installed
      const { data, error } = await supabase.auth.getSession();

      if (error || !data.session) {
        console.error("Auth callback error:", error?.message);
        setFailed(true);
        return;
      }

      const u = data.session.user;

      // This logic remains the same, but relies on the correct supabase import above
      await supabase.from("players").upsert(
        {
          id:           u.id,
          twitter_id:   u.user_metadata?.provider_id ?? null,
          username:     u.user_metadata?.user_name   ?? null,
          display_name: u.user_metadata?.full_name   ?? null,
          avatar_url:   u.user_metadata?.avatar_url  ?? null,
        },
        { onConflict: "id", ignoreDuplicates: false }
      );

      navigate("/fragments");
    }

    handle();
  }, [navigate]);

  const shared: React.CSSProperties = {
    minHeight: "100vh",
    background: "#04020c",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  };

  if (failed) return (
    <div style={shared}>
      <p style={{ fontFamily:"'Press Start 2P',monospace", color:"#ef4444", fontSize:10, letterSpacing:"0.15em" }}>
        AUTH FAILED
      </p>
      <button
        onClick={() => navigate("/")}
        style={{ fontFamily:"'Press Start 2P',monospace", fontSize:8, color:"#a855f7", background:"none", border:"2px solid #3b1d6e", padding:"10px 24px", cursor:"pointer" }}
      >
        RETURN
      </button>
    </div>
  );

  return (
    <div style={shared}>
      <p style={{ fontFamily:"'Press Start 2P',monospace", color:"#3b1d6e", fontSize:9, letterSpacing:"0.2em" }}>
        ENTERING REALM...
      </p>
    </div>
  );
}
