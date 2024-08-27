import { contextBridge } from 'electron'
async function sendoverlaydata({ eventType, data, options }) {
  if (eventType) {
    console.log('Overlay event sent', eventType, data, options);
    return { success: true };
  } else {
      return { success: false, error: 'Overlay window not created yet' };
  }
}
// Custom APIs for renderer
const api = {
  sendOverlayData: async (eventType, data, options) => {
    return await ipcRenderer.invoke('send-overlay-data', { eventType, data, options });
  },
  onShowMessage: (callback) => ipcRenderer.on('show-message', callback),
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.api = api
}
console.log("electron-react-reestreamapp")
