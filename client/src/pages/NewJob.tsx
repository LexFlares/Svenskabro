import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function NewJob() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [bridgeId, setBridgeId] = useState("");
  const [bridgeName, setBridgeName] = useState("");
  const [beskrivning, setBeskrivning] = useState("");
  
  const { data: bridges } = trpc.bridges.getAll.useQuery();
  const createJobMutation = trpc.jobs.create.useMutation({
    onSuccess: () => {
      toast.success("Jobb skapat!");
      setLocation("/journal");
    },
    onError: (error) => {
      toast.error("Kunde inte skapa jobb: " + error.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bridgeName) {
      toast.error("Välj en bro");
      return;
    }

    createJobMutation.mutate({
      bridgeId: bridgeId || undefined,
      bridgeName,
      startTid: new Date(),
      beskrivning: beskrivning || undefined,
    });
  };

  const handleBridgeChange = (value: string) => {
    const bridge = bridges?.find(b => b.id === value);
    if (bridge) {
      setBridgeId(bridge.id);
      setBridgeName(bridge.name);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Briefcase className="w-8 h-8" />
            Nytt Jobb
          </h1>
          <p className="text-muted-foreground mt-1">
            Registrera ett nytt arbetsjobb
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Jobbinformation</CardTitle>
            <CardDescription>
              Fyll i information om jobbet. Starttiden sätts automatiskt.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bridge">Bro *</Label>
                <Select value={bridgeId} onValueChange={handleBridgeChange}>
                  <SelectTrigger id="bridge">
                    <SelectValue placeholder="Välj en bro" />
                  </SelectTrigger>
                  <SelectContent>
                    {bridges?.map((bridge) => (
                      <SelectItem key={bridge.id} value={bridge.id}>
                        {bridge.name} ({bridge.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="beskrivning">Beskrivning (valfritt)</Label>
                <Textarea
                  id="beskrivning"
                  placeholder="Beskriv arbetet som ska utföras..."
                  value={beskrivning}
                  onChange={(e) => setBeskrivning(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Starttid:</strong> {new Date().toLocaleString('sv-SE')}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  <strong>Användare:</strong> {user?.name || user?.email}
                </p>
              </div>

              <div className="flex gap-3">
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={createJobMutation.isPending}
                >
                  {createJobMutation.isPending ? "Skapar..." : "Starta Jobb"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setLocation("/dashboard")}
                >
                  Avbryt
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
