import open, { openApp, apps } from "open";

class FileOpener {
  // Método para abrir un archivo o URL en el programa predeterminado
  async openDefault(path, options = {}) {
    try {
      await open(path, options);
      console.log(`Abierto con éxito: ${path}`);
    } catch (error) {
      console.error(`Error al abrir ${path}:`, error);
    }
  }

  // Método para abrir una URL en un navegador específico
  async openInBrowser(url, browserName, options = {}) {
    try {
      await open(url, { app: { name: browserName, ...options } });
      console.log(`URL abierta en ${browserName}: ${url}`);
    } catch (error) {
      console.error(`Error al abrir URL en ${browserName}:`, error);
    }
  }

  // Método para abrir una URL en modo incógnito
  async openInPrivateMode(url) {
    try {
      await open(url, { app: { name: apps.browserPrivate } });
      console.log(`URL abierta en modo incógnito: ${url}`);
    } catch (error) {
      console.error("Error al abrir en modo incógnito:", error);
    }
  }

  // Método para abrir una aplicación
  async openApplication(appName, options = {}) {
    try {
      await openApp(appName, options);
      console.log(`Aplicación abierta: ${appName}`);
    } catch (error) {
      console.error(`Error al abrir la aplicación ${appName}:`, error);
    }
  }

  // // Método específico para Electron (si es necesario)
  // openWithElectron(path) {
  //   if (typeof window !== "undefined" && window.require) {
  //     const { shell } = window.require("electron");
  //     shell.openPath(path);
  //     console.log(`Archivo abierto con Electron: ${path}`);
  //   } else {
  //     console.error("Este método solo funciona en un entorno Electron");
  //   }
  // }
  getAvailableAppIdentifiers() {
    return apps;
  }
}
// export default FileOpener;
export default FileOpener;
