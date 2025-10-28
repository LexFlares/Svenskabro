import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function Journal() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: jobs, isLoading } = user?.role === 'admin' 
    ? trpc.jobs.getAll.useQuery()
    : trpc.jobs.getMine.useQuery();

  const updateJobMutation = trpc.jobs.update.useMutation({
    onSuccess: () => {
      toast.success("Jobb uppdaterat!");
      utils.jobs.getMine.invalidate();
      if (user?.role === 'admin') {
        utils.jobs.getAll.invalidate();
      }
    },
    onError: (error) => {
      toast.error("Kunde inte uppdatera jobb: " + error.message);
    }
  });

  const handleCompleteJob = (jobId: number) => {
    updateJobMutation.mutate({
      id: jobId,
      slutTid: new Date(),
      status: 'avslutad'
    });
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="w-8 h-8" />
              Journal
            </h1>
            <p className="text-muted-foreground mt-1">
              {user?.role === 'admin' ? 'Alla jobb i systemet' : 'Dina registrerade jobb'}
            </p>
          </div>
          <Link href="/new-job">
            <Button>Nytt Jobb</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Laddar jobb...</p>
          </div>
        ) : jobs && jobs.length > 0 ? (
          <div className="space-y-4">
            {jobs.map((job) => (
              <Card key={job.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {job.bridgeName}
                        {job.status === 'pågående' ? (
                          <Badge variant="default" className="bg-blue-600">
                            <Clock className="w-3 h-3 mr-1" />
                            Pågående
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Avslutad
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {user?.role === 'admin' && `Användare: ${job.userName} • `}
                        Bro ID: {job.bridgeId || 'N/A'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {job.beskrivning && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Beskrivning</p>
                      <p className="text-sm">{job.beskrivning}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-muted-foreground">Starttid</p>
                      <p>{new Date(job.startTid).toLocaleString('sv-SE')}</p>
                    </div>
                    {job.slutTid && (
                      <div>
                        <p className="font-medium text-muted-foreground">Sluttid</p>
                        <p>{new Date(job.slutTid).toLocaleString('sv-SE')}</p>
                      </div>
                    )}
                  </div>
                  {job.status === 'pågående' && (
                    <Button 
                      onClick={() => handleCompleteJob(job.id)}
                      disabled={updateJobMutation.isPending}
                      className="w-full"
                    >
                      Avsluta Jobb
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Inga jobb registrerade</p>
              <p className="text-muted-foreground mb-4">Kom igång genom att skapa ditt första jobb</p>
              <Link href="/new-job">
                <Button>Skapa Nytt Jobb</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
