import { useState, useEffect } from "react";
import { PlusCircle, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { deviationService } from "@/services/deviationService";
import type { Deviation } from "@/types";
import { useTranslation } from "@/lib/translations";

export default function DeviationsPage() {
  const [deviations, setDeviations] = useState<Deviation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchDeviations = async () => {
      try {
        setLoading(true);
        const data = await deviationService.getAllDeviations();
        setDeviations(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDeviations();
  }, []);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "open":
        return "destructive";
      case "in_progress":
        return "secondary";
      case "closed":
        return "default";
      default:
        return "outline";
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">{t('loading')}...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center mt-8">{t('error')}: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t('deviations')}</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            {t('filter')}
          </Button>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('new_deviation')}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {deviations.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500">{t('no_deviations_found')}</p>
            </CardContent>
          </Card>
        ) : (
          deviations.map((deviation) => (
            <Card key={deviation.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{deviation.type}</CardTitle>
                    <CardDescription>
                      {(deviation as any).bridge?.name} - {t('reported_by')} {(deviation as any).profile?.full_name || t('unknown_user')}
                    </CardDescription>
                  </div>
                  <Badge variant={getStatusBadgeVariant(deviation.status)}>
                    {t(deviation.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-400 mb-2">{t('description')}:</p>
                <p className="mb-4">{deviation.description}</p>
                <p className="text-sm text-gray-400 mb-2">{t('proposal')}:</p>
                <p>{deviation.proposal}</p>
                <div className="text-xs text-gray-500 mt-4">
                  {new Date(deviation.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
