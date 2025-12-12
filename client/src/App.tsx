import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/lib/store";
import Layout from "@/components/layout";
import NotFound from "@/pages/not-found";

// Pages
import SearchPage from "@/pages/search";
import ContactsPage from "@/pages/contacts";
import CampaignPage from "@/pages/campaign";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={SearchPage} />
        <Route path="/contacts" component={ContactsPage} />
        <Route path="/campaign" component={CampaignPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AppProvider>
    </QueryClientProvider>
  );
}

export default App;
