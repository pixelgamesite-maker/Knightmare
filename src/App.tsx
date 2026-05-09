import React, { useEffect } from "react";
// Added useLocation to the import list
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster.tsx"; // Added .tsx
import { TooltipProvider } from "@/components/ui/tooltip.tsx"; // Added .tsx

// Component Imports with explicit extensions
import Landing from "@/pages/landing.tsx";
import Fragments from "@/pages/fragments.tsx";
import Forge from "@/pages/forge.tsx";
import Leaderboard from "@/pages/leaderboard.tsx";
import AuthCallback from "@/pages/auth/callback.tsx";
import NotFound from "@/pages/not-found.tsx";
import Navbar from "@/components/layout/Navbar.tsx";

const queryClient = new QueryClient();

function Router() {
  const [location] = useLocation();
  const isLanding = location === "/";

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground dark selection:bg-primary/30">
      {!isLanding && <Navbar />}
      <main className={`flex-1 w-full ${!isLanding ? "pt-16" : ""}`}>
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/auth/callback" component={AuthCallback} />
          <Route path="/fragments" component={Fragments} />
          <Route path="/forge" component={Forge} />
          <Route path="/leaderboard" component={Leaderboard} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* Base URL handling for Railway/Vite */}
        <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
