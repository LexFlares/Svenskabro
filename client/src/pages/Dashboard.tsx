import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction, Briefcase, AlertCircle, FileText, Users, MessageSquare } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: jobs, isLoading: jobsLoading } = trpc.jobs.getMine.useQuery();
  const { data: bridges, isLoading: bridgesLoading } = trpc.bridges.getAll.useQuery();
  const { data: deviations, isLoading: deviationsLoading } = user?.role === 'admin' 
    ? trpc.deviations.getAll.useQuery()
    : { data: undefined, isLoading: false };

  const activeJobs = jobs?.filter(j => j.status === 'pågående') || [];
  const completedJobs = jobs?.filter(j => j.status === 'avslutad') || [];
  const openDeviations = deviations?.filter(d => d.status === 'open') || [];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Välkommen, {user?.name || user?.email}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Här är en översikt över din aktivitet
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Aktiva Jobb"
            value={activeJobs.length}
            icon={<Briefcase className="w-5 h-5 text-blue-600" />}
            loading={jobsLoading}
          />
          <StatsCard
            title="Avslutade Jobb"
            value={completedJobs.length}
            icon={<FileText className="w-5 h-5 text-green-600" />}
            loading={jobsLoading}
          />
          <StatsCard
            title="Broar i Systemet"
            value={bridges?.length || 0}
            icon={<Construction className="w-5 h-5 text-orange-600" />}
            loading={bridgesLoading}
          />
          {user?.role === 'admin' && (
            <StatsCard
              title="Öppna Avvikelser"
              value={openDeviations.length}
              icon={<AlertCircle className="w-5 h-5 text-red-600" />}
              loading={deviationsLoading}
            />
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Snabbåtgärder</CardTitle>
            <CardDescription>Vanliga uppgifter och funktioner</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              <Link href="/new-job">
                <Button variant="outline" className="w-full justify-start">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Starta Nytt Jobb
                </Button>
              </Link>
              <Link href="/bridges">
                <Button variant="outline" className="w-full justify-start">
                  <Construction className="w-4 h-4 mr-2" />
                  Visa Broregister
                </Button>
              </Link>
              <Link href="/deviations">
                <Button variant="outline" className="w-full justify-start">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Rapportera Avvikelse
                </Button>
              </Link>
              <Link href="/journal">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Visa Journal
                </Button>
              </Link>
              <Link href="/chat">
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Öppna LexChat
                </Button>
              </Link>
              <Link href="/documents">
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Dokument
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Senaste Aktivitet</CardTitle>
            <CardDescription>Dina senaste jobb och händelser</CardDescription>
          </CardHeader>
          <CardContent>
            {jobsLoading ? (
              <p className="text-muted-foreground">Laddar...</p>
            ) : jobs && jobs.length > 0 ? (
              <div className="space-y-3">
                {jobs.slice(0, 5).map((job) => (
                  <div key={job.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <p className="font-medium">{job.bridgeName}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(job.startTid).toLocaleDateString('sv-SE')} - {job.status}
                      </p>
                    </div>
                    <Link href="/journal">
                      <Button variant="ghost" size="sm">Visa</Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">Inga jobb registrerade än</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function StatsCard({ title, value, icon, loading }: { 
  title: string; 
  value: number; 
  icon: React.ReactNode; 
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-8 w-16 bg-muted animate-pulse rounded" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}
