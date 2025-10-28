import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Bridges from "./pages/Bridges";
import BridgeDetail from "./pages/BridgeDetail";
import NewJob from "./pages/NewJob";
import Journal from "./pages/Journal";
import Contacts from "./pages/Contacts";
import WorkGroups from "./pages/WorkGroups";
import Chat from "./pages/Chat";
import TrafficWarnings from "./pages/TrafficWarnings";
import Documents from "./pages/Documents";
import Deviations from "./pages/Deviations";
import AIAssistant from "./pages/AIAssistant";
import AdminPanel from "./pages/AdminPanel";
import Settings from "./pages/Settings";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path="/bridges" component={Bridges} />
      <Route path="/bridges/:id" component={BridgeDetail} />
      <Route path="/new-job" component={NewJob} />
      <Route path="/journal" component={Journal} />
      <Route path="/contacts" component={Contacts} />
      <Route path="/work-groups" component={WorkGroups} />
      <Route path="/chat" component={Chat} />
      <Route path="/chat/:chatId" component={Chat} />
      <Route path="/traffic" component={TrafficWarnings} />
      <Route path="/documents" component={Documents} />
      <Route path="/deviations" component={Deviations} />
      <Route path="/ai-assistant" component={AIAssistant} />
      <Route path="/admin" component={AdminPanel} />
      <Route path="/settings" component={Settings} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
