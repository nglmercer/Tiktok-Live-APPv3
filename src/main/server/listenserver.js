import os from "os";
import QRCode from "qrcode";
import { showQRModal, QRModalsave } from "./qrModal";
export const getLocalIPAddress = () => {
  const interfaces = os.networkInterfaces();
  for (const interfaceName in interfaces) {
    const addresses = interfaces[interfaceName];
    for (const address of addresses) {
      if (address.family === "IPv4" && !address.internal) {
        return address.address;
      }
    }
  }
  return "IP address not found";
};

const injectQRCode = (mainWindow, port) => {
  const localIP = getLocalIPAddress();
  const urlToQR = `https://${localIP}:${port}`;

  QRCode.toDataURL(urlToQR, (err, qrCode) => {
    if (err) {
      console.error("Error generating QR code:", err);
      return;
    }

    mainWindow.webContents.executeJavaScript(`
      (${QRModalsave.toString()})("${qrCode}", "${urlToQR}");
    `);
  });
};

export default injectQRCode;
