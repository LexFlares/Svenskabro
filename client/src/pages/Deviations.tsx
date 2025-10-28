import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Deviations() {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bridgeId, setBridgeId] = useState("");
  const [bridgeName, setBridgeName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<"low" | "medium" | "high" | "critical">("medium");

  const utils = trpc.useUtils();
  const { data: bridges } = trpc.bridges.getAll.useQuery();
  const { data: deviations, isLoading } = user?.role === 'admin' 
    ? trpc.deviations.getAll.useQuery()
    : { data: [], isLoading: false };

  const createDeviationMutation = trpc.deviations.create.useMutation({
    onSuccess: () => {
      toast.success("Avvikelse rapporterad!");
      setDialogOpen(false);
      resetForm();
      if (user?.role === 'admin') {
        utils.deviations.getAll.invalidate();
      }
    },
    onError: (error) => {
      toast.error("Kunde inte rapportera avvikelse: " + error.message);
    }
  });

  const resetForm = () => {
    setBridgeId("");
    setBridgeName("");
    setTitle("");
    setDescription("");
    setSeverity("medium");
  };

  const handleBridgeChange = (value: string) => {
    const bridge = bridges?.find(b => b.id === value);
    if (bridge) {
      setBridgeId(bridge.id);
      setBridgeName(bridge.name);
    }
  };

  const handleSubmit = () => {
    if (!bridgeName || !title || !description) {
      toast.error("Fyll i alla obligatoriska fält");
      return;
    }

    createDeviationMutation.mutate({
      bridgeId: bridgeId || undefined,
      bridgeName,
      title,
      description,
      severity,
    });
  };

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-600';
      case 'medium': return 'bg-yellow-600';
      case 'low': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-600';
      case 'in_progress': return 'bg-yellow-600';
      case 'resolved': return 'bg-green-600';
      case 'closed': return 'bg-gray-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <AlertCircle className="w-8 h-8" />
              Avvikelser
            </h1>
            <p className="text-muted-foreground mt-1">
              Rapportera och hantera avvikelser
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Rapportera Avvikelse
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Rapportera Avvikelse</DialogTitle>
                <DialogDescription>
                  Fyll i information om avvikelsen
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
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
                  <Label htmlFor="title">Titel *</Label>
                  <Input
                    id="title"
                    placeholder="Kort beskrivning av avvikelsen"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Beskrivning *</Label>
                  <Textarea
                    id="description"
                    placeholder="Detaljerad beskrivning av avvikelsen..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="severity">Allvarlighetsgrad</Label>
                  <Select value={severity} onValueChange={(v: any) => setSeverity(v)}>
                    <SelectTrigger id="severity">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Låg</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">Hög</SelectItem>
                      <SelectItem value="critical">Kritisk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={handleSubmit} 
                    className="flex-1"
                    disabled={createDeviationMutation.isPending}
                  >
                    {createDeviationMutation.isPending ? "Rapporterar..." : "Rapportera"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setDialogOpen(false)}
                  >
                    Avbryt
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {user?.role === 'admin' ? (
          isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Laddar avvikelser...</p>
            </div>
          ) : deviations && deviations.length > 0 ? (
            <div className="space-y-4">
              {deviations.map((deviation) => (
                <Card key={deviation.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2 flex-wrap">
                          {deviation.title}
                          <Badge className={getSeverityColor(deviation.severity)}>
                            {deviation.severity}
                          </Badge>
                          <Badge className={getStatusColor(deviation.status)}>
                            {deviation.status}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {deviation.bridgeName} • {new Date(deviation.createdAt).toLocaleDateString('sv-SE')}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{deviation.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">Inga avvikelser</p>
              </CardContent>
            </Card>
          )
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Rapportera Avvikelser</p>
              <p className="text-muted-foreground mb-4">
                Klicka på "Rapportera Avvikelse" för att rapportera problem
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
