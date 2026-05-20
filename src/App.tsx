import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";

import Landing from "@/pages/landing";
import Hunt from "@/pages/hunt";
import Forge from "@/pages/forge";
import Trades from "@/pages/trades";
import Gallery from "@/pages/gallery";
import Social from "@/pages/social";
import AuthCallback from "@/pages/auth/callback";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  const [location] = useLocation();
  const { user, loading } = useAuth();

  if (loading) return <div className="min-h-[100dvh] bg-[#04020c]" />;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#04020c] text-white selection:bg-purple-500/30">
      <main className="flex-1 w-full">
        <Switch>
          <Route path="/" component={user ? () => <Redirect to="/hunt" /> : Landing} />
          <Route path="/auth/callback" component={AuthCallback} />
          <Route path="/hunt" component={user ? Hunt : () => <Redirect to="/" />} />
          <Route path="/forge" component={user ? Forge : () => <Redirect to="/" />} />
          <Route path="/trades" component={user ? Trades : () => <Redirect to="/" />} />
          <Route path="/gallery" component={user ? Gallery : () => <Redirect to="/" />} />
          <Route path="/social" component={user ? Social : () => <Redirect to="/" />} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
    if (!document.getElementById("pixel-fonts")) {
      const link = document.createElement("link");
      link.id = "pixel-fonts";
      link.href = "https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap";
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
