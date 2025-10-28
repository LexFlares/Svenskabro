import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export default function Chat() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">LexChat</h2>
            <p className="text-muted-foreground mb-4">
              End-to-end krypterad chat kommer snart
            </p>
            <p className="text-sm text-muted-foreground">
              Funktionen är under utveckling och kommer att inkludera säker 1-on-1 och gruppchatt
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
