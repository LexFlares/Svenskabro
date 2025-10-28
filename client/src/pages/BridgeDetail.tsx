import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction, MapPin, ArrowLeft, ExternalLink } from "lucide-react";
import { Link, useParams, useLocation } from "wouter";

export default function BridgeDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { data: bridge, isLoading } = trpc.bridges.getById.useQuery({ id: id || "" }, {
    enabled: !!id
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Laddar bro...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!bridge) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center">
          <Construction className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Bro hittades inte</h2>
          <p className="text-muted-foreground mb-4">Bron du söker finns inte i systemet</p>
          <Button onClick={() => setLocation("/bridges")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka till Broregister
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <Button variant="ghost" onClick={() => setLocation("/bridges")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">{bridge.name}</h1>
              <p className="text-muted-foreground mt-1">Bro ID: {bridge.id}</p>
            </div>
            <Construction className="w-12 h-12 text-blue-600" />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bro ID</p>
                <p className="text-lg">{bridge.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Namn</p>
                <p className="text-lg">{bridge.name}</p>
              </div>
              {bridge.description && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Beskrivning</p>
                  <p className="text-lg">{bridge.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Position</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Koordinater</p>
                  <p className="text-lg">Lat: {bridge.y}, Lng: {bridge.x}</p>
                </div>
              </div>
              {bridge.taPlanUrl && (
                <div className="pt-3">
                  <Button variant="outline" asChild className="w-full">
                    <a href={bridge.taPlanUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Öppna TA-Plan
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Snabbåtgärder</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              <Link href="/new-job">
                <Button variant="outline" className="w-full">
                  Starta Jobb på denna Bro
                </Button>
              </Link>
              <Link href="/deviations">
                <Button variant="outline" className="w-full">
                  Rapportera Avvikelse
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
