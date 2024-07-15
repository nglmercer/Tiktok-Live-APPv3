// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { ipcRenderer, contextBridge } = require("electron");
const mineflayer = require('mineflayer');
const { Client, Server: ServerOsc } = require('node-osc');
const client = new Client('127.0.0.1', 9000);

const api = {
    addFilePath: (fileParams) => ipcRenderer.invoke('add-file-path', fileParams),
    getFilesInFolder: () => ipcRenderer.invoke('get-files-in-folder'),
    startDrag: (fileName) => ipcRenderer.invoke('on-drag-start', fileName),
    deleteFile: (fileName) => ipcRenderer.invoke('delete-file', fileName),  
    getFileById: (fileId) => ipcRenderer.invoke('get-file-by-id', fileId),
    getFileByname: (fileIdname) => ipcRenderer.invoke('get-file-by-name', fileIdname),
    createOverlayWindow: async () => {
        return await ipcRenderer.invoke('create-overlay-window');
    },
    sendOverlayData: async (eventType, data, options) => {
        return await ipcRenderer.invoke('send-overlay-data', { eventType, data, options });
    },
    onOverlayEvent: (callback) => ipcRenderer.on('overlay-event', callback),
    onShowMessage: (callback) => ipcRenderer.on('show-message', callback),
    sendlibraryData: (callback) => ipcRenderer.invoke('send-library-data', { eventType, data }),

    createBot: (options, keyLOGIN) => ipcRenderer.invoke('create-bot', options, keyLOGIN), // Asegúrate de pasar keyLOGIN aquí
    sendChatMessage: (message) => ipcRenderer.invoke('send-chat-message', message),
    onBotEvent: (callback) => ipcRenderer.on('bot-event', callback),
    createClientOsc: () => ipcRenderer.invoke('create-client-osc'),
    sendOscMessage: (message) => ipcRenderer.invoke('send-osc-message', message),
    botStatus: () => ipcRenderer.invoke('bot-status'),
    update: (message) => ipcRenderer.invoke('update', message),
    searchSong: (query) => ipcRenderer.invoke('search-song', query)
    // onOscEvent: (callback) => ipcRenderer.on('osc-event', callback),
}

window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector)
        if (element) element.innerText = text
    }

    for (const dependency of ['chrome', 'node', 'electron']) {
        replaceText(`${dependency}-version`, process.versions[dependency])
    }
})

window.addOverlayEvent = (eventType, data) => {
    ipcRenderer.invoke('create-overlay-window', { eventType, data });
};
contextBridge.exposeInMainWorld("api", api);

