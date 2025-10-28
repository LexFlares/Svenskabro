import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Bot } from "lucide-react";

export default function AIAssistant() {
  return (
    <DashboardLayout>
      <div className="p-6">
        <Card>
          <CardContent className="text-center py-12">
            <Bot className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">AI Assistent</h2>
            <p className="text-muted-foreground mb-4">
              AI-driven teknisk support kommer snart
            </p>
            <p className="text-sm text-muted-foreground">
              Funktionen kommer att ge teknisk vägledning och support
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
