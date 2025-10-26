import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useTranslation, Language } from "@/lib/translations";
import { useTheme } from "next-themes";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Palette, Languages } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { t, language, setLanguage } = useTranslation();
  const { toast } = useToast();

  const handleClearData = () => {
    if (confirm(t("confirmClear"))) {
      localStorage.clear();
      toast({
        title: t("dataCleared"),
      });
      // Optionally, force a reload to reset the app state
      window.location.href = "/";
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">{t("settingsTitle")}</h1>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette /> {t("theme")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="theme-switch">
                {theme === "dark" ? t("darkMode") : t("lightMode")}
              </Label>
              <Switch
                id="theme-switch"
                checked={theme === "dark"}
                onCheckedChange={() => setTheme(theme === "dark" ? "light" : "dark")}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages /> {t("language")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LanguageSwitcher />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 /> {t("clearData")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleClearData}>
              {t("clearData")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
