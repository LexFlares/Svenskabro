import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Mail, QrCode, Copy, Download, Users, AlertCircle } from "lucide-react";
import { generateQRCodeDataUrl, downloadQRCode } from "@/lib/qrcode";
import { generateInviteUrl, sendEmailInvite } from "@/lib/workGroup";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/translations";

interface WorkGroupInviteProps {
  inviteCode: string;
  hostName: string;
  groupName: string;
}

export function WorkGroupInvite({ inviteCode, hostName, groupName }: WorkGroupInviteProps) {
  const { t, language } = useTranslation();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const inviteUrl = generateInviteUrl(inviteCode);

  useEffect(() => {
    const generateQR = async () => {
      try {
        const url = await generateQRCodeDataUrl(inviteUrl);
        setQrCodeUrl(url);
      } catch (error) {
        console.error("Failed to generate QR code:", error);
      }
    };
    generateQR();
  }, [inviteUrl]);

  const handleCopyInviteCode = () => {
    navigator.clipboard.writeText(inviteCode);
    toast({
      title: t("copied"),
      description: t("inviteCodeCopied"),
    });
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(inviteUrl);
    toast({
      title: t("copied"),
      description: t("inviteLinkCopied"),
    });
  };

  const handleDownloadQR = () => {
    if (qrCodeUrl) {
      downloadQRCode(qrCodeUrl, `invite-${inviteCode}.png`);
      toast({
        title: language === "sv" ? "Nerladdad!" : "Downloaded!",
        description: t("qrDownloaded"),
      });
    }
  };

  const handleSendEmail = async () => {
    if (!email) {
      toast({
        title: t("emailMissing"),
        description: t("enterEmailAddress"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendEmailInvite(inviteCode, email, hostName, groupName);
      
      if (result.success) {
        toast({
          title: t("emailSent"),
          description: `${t("inviteSentTo")} ${email}`,
        });
        setEmail("");
      } else {
        // Show specific error message from sendEmailInvite
        console.error("Email invite failed:", result.error);
        
        // Show fallback option to copy link
        toast({
          title: language === "sv" ? "E-post kunde inte skickas" : "Email could not be sent",
          description: result.error || (language === "sv" 
            ? "Kopiera inbjudningslänken istället och skicka den manuellt" 
            : "Copy the invitation link instead and send it manually"),
          variant: "destructive",
        });
        
        // Automatically copy the invite URL as fallback
        navigator.clipboard.writeText(inviteUrl);
        
        // Show secondary success message
        setTimeout(() => {
          toast({
            title: t("copied"),
            description: language === "sv" 
              ? "Inbjudningslänken har kopierats. Du kan skicka den via SMS eller annat meddelande." 
              : "Invitation link copied. You can send it via SMS or other messaging.",
          });
        }, 2000);
      }
    } catch (error: any) {
      console.error("Failed to send email:", error);
      toast({
        title: t("error"),
        description: error.message || (language === "sv" ? "Ett oväntat fel inträffade" : "An unexpected error occurred"),
        variant: "destructive",
      });
      
      // Copy link as fallback
      navigator.clipboard.writeText(inviteUrl);
      setTimeout(() => {
        toast({
          title: t("copied"),
          description: language === "sv" 
            ? "Inbjudningslänken har kopierats som alternativ" 
            : "Invitation link copied as alternative",
        });
      }, 2000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="premium-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {t("inviteParticipants")}
        </CardTitle>
        <CardDescription>
          {t("inviteDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>{t("inviteCode")}</Label>
          <div className="flex gap-2">
            <Input
              value={inviteCode}
              readOnly
              className="font-mono text-lg tracking-wider"
            />
            <Button
              onClick={handleCopyInviteCode}
              variant="outline"
              size="icon"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t("inviteLink")}</Label>
          <div className="flex gap-2">
            <Input
              value={inviteUrl}
              readOnly
              className="text-sm"
            />
            <Button
              onClick={handleCopyUrl}
              variant="outline"
              size="icon"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <QrCode className="mr-2 h-4 w-4" />
                {t("showQRCode")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("qrCodeTitle")}</DialogTitle>
                <DialogDescription>
                  {t("qrCodeDescription")}
                </DialogDescription>
              </DialogHeader>
              {qrCodeUrl && (
                <div className="flex flex-col items-center gap-4 py-4">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    className="rounded-lg border-4 border-primary"
                  />
                  <Button onClick={handleDownloadQR} className="w-full">
                    <Download className="mr-2 h-4 w-4" />
                    {t("downloadQRCode")}
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Mail className="mr-2 h-4 w-4" />
                {t("sendEmail")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("sendInviteEmail")}</DialogTitle>
                <DialogDescription>
                  {t("enterEmail")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t("emailAddress")}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={language === "sv" ? "gast@example.com" : "guest@example.com"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleSendEmail}
                  disabled={isLoading}
                  className="w-full premium-button"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  {isLoading ? t("sending") : t("sendInvite")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
