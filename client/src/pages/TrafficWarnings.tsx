import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function TrafficWarnings() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <Card>
          <CardContent className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Trafikvarningar</h2>
            <p className="text-muted-foreground mb-4">
              Integration med Trafikverket API kommer snart
            </p>
            <p className="text-sm text-muted-foreground">
              Funktionen kommer att visa real-time trafikvarningar och vägarbeten
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
