import { useState, useEffect } from "react";
import { PlusCircle, Filter, FileText, Download, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/translations";
import { supabase } from "@/integrations/supabase/client";
import type { Document } from "@/types";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("documents")
          .select("*, profile:created_by (full_name)")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setDocuments(data as any[]);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "archived":
        return "secondary";
      case "draft":
        return "outline";
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
        <h1 className="text-3xl font-bold">{t('documents')}</h1>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            {t('filter')}
          </Button>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('new_document')}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {documents.length === 0 ? (
          <p className="text-center text-gray-500 col-span-full">{t('no_documents_found')}</p>
        ) : (
          documents.map((doc) => (
            <Card key={doc.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {doc.title}
                    </CardTitle>
                    <CardDescription>
                      {t('version')} {doc.version} - {doc.category}
                    </CardDescription>
                  </div>
                  <Badge variant={getStatusBadgeVariant(doc.status)}>
                    {t(doc.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-400 line-clamp-3 h-[60px]">{doc.content}</p>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-700">
                  <div className="text-xs text-gray-500">
                    <p>{t('created_by')}: {(doc as any).profile?.full_name || t('unknown_user')}</p>
                    <p>{new Date(doc.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" asChild>
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-400">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
