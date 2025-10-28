import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Construction, MapPin, Search } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

export default function Bridges() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: bridges, isLoading } = trpc.bridges.getAll.useQuery();

  const filteredBridges = bridges?.filter(bridge => 
    bridge.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bridge.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bridge.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Broregister</h1>
            <p className="text-muted-foreground mt-1">
              Alla broar i systemet
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Sök efter bro (namn, ID, beskrivning)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Laddar broar...</p>
          </div>
        ) : filteredBridges && filteredBridges.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredBridges.map((bridge) => (
              <Link key={bridge.id} href={`/bridges/${bridge.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <Construction className="w-8 h-8 text-blue-600" />
                      <span className="text-xs text-muted-foreground">{bridge.id}</span>
                    </div>
                    <CardTitle className="mt-2">{bridge.name}</CardTitle>
                    {bridge.description && (
                      <CardDescription className="line-clamp-2">
                        {bridge.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>Lat: {bridge.y}, Lng: {bridge.x}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Construction className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Inga broar hittades</p>
              <p className="text-muted-foreground">
                {searchQuery ? "Prova att ändra din sökning" : "Inga broar finns i systemet än"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
