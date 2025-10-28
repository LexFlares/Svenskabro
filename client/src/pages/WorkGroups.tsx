import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Plus, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function WorkGroups() {
  const [newGroupName, setNewGroupName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  
  const utils = trpc.useUtils();
  const { data: myGroups, isLoading } = trpc.workGroups.getMine.useQuery();

  const createGroupMutation = trpc.workGroups.create.useMutation({
    onSuccess: () => {
      toast.success("Arbetsgrupp skapad!");
      setCreateDialogOpen(false);
      setNewGroupName("");
      utils.workGroups.getMine.invalidate();
    },
    onError: (error) => {
      toast.error("Kunde inte skapa grupp: " + error.message);
    }
  });

  const joinGroupMutation = trpc.workGroups.join.useMutation({
    onSuccess: () => {
      toast.success("Du har gått med i gruppen!");
      setJoinDialogOpen(false);
      setJoinCode("");
      utils.workGroups.getMine.invalidate();
    },
    onError: (error) => {
      toast.error("Kunde inte gå med i grupp: " + error.message);
    }
  });

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      toast.error("Ange ett gruppnamn");
      return;
    }
    const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
    createGroupMutation.mutate({ name: newGroupName, inviteCode });
  };

  const handleJoinGroup = () => {
    if (!joinCode.trim()) {
      toast.error("Ange en inbjudningskod");
      return;
    }
    joinGroupMutation.mutate({ inviteCode: joinCode });
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="w-8 h-8" />
              Arbetsgrupper
            </h1>
            <p className="text-muted-foreground mt-1">
              Hantera dina arbetsgrupper
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Gå med
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Gå med i arbetsgrupp</DialogTitle>
                  <DialogDescription>
                    Ange inbjudningskoden du fick från gruppledaren
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="joinCode">Inbjudningskod</Label>
                    <Input
                      id="joinCode"
                      placeholder="ABC123XY"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    />
                  </div>
                  <Button 
                    onClick={handleJoinGroup} 
                    className="w-full"
                    disabled={joinGroupMutation.isPending}
                  >
                    {joinGroupMutation.isPending ? "Går med..." : "Gå med"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Skapa Grupp
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Skapa arbetsgrupp</DialogTitle>
                  <DialogDescription>
                    Skapa en ny arbetsgrupp och bjud in medlemmar
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="groupName">Gruppnamn</Label>
                    <Input
                      id="groupName"
                      placeholder="T.ex. Bro Team Stockholm"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleCreateGroup} 
                    className="w-full"
                    disabled={createGroupMutation.isPending}
                  >
                    {createGroupMutation.isPending ? "Skapar..." : "Skapa Grupp"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Laddar grupper...</p>
          </div>
        ) : myGroups && myGroups.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {myGroups.map((group) => group && (
              <Card key={group.id}>
                <CardHeader>
                  <CardTitle>{group.name}</CardTitle>
                  <CardDescription>
                    Inbjudningskod: <code className="font-mono bg-muted px-2 py-1 rounded">{group.inviteCode}</code>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Skapad {group.createdAt ? new Date(group.createdAt).toLocaleDateString('sv-SE') : 'N/A'}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Inga arbetsgrupper</p>
              <p className="text-muted-foreground mb-4">Skapa en ny grupp eller gå med i en befintlig</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
