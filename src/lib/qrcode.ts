import QRCode from "qrcode";

export const generateQRCodeDataUrl = async (text: string): Promise<string> => {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: 300,
      margin: 2,
      color: {
        dark: "#1D3557",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "H",
    });
    return dataUrl;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw error;
  }
};

export const downloadQRCode = (dataUrl: string, filename: string = "invite-qr.png"): void => {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
