import React from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Landing from "@/pages/landing";
import Fragments from "@/pages/fragments";
import Forge from "@/pages/forge";
import Leaderboard from "@/pages/leaderboard";
import Navbar from "@/components/layout/Navbar";
import AuthCallback from "@/pages/auth/callback";  // ← add this

const queryClient = new QueryClient();

function Router() {
  const [location] = useLocation();                 // ← add this
  const isLanding = location === "/";               // ← add this

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground dark selection:bg-primary/30">
      {!isLanding && <Navbar />}                    {/* ← hide nav on landing */}
      <main className={`flex-1 w-full ${!isLanding ? "pt-16" : ""}`}>
        <Switch>
          <Route path="/" component={Landing} />
          <Route path="/auth/callback" component={AuthCallback} />  {/* ← add this */}
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
  // Force adding dark class to html
  React.useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
