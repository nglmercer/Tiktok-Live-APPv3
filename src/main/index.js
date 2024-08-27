import { app, shell, BrowserWindow, globalShortcut, ipcMain } from "electron";
import path, { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import icon from "../../resources/icon.png?asset";
import fs from "fs";
import fileIndexer from "./FindFiles";
import FileOpener from "./FileOpener";
import AudioController from "./features/audioController";
import keynut from "./features/keynut";
import { createOverlayWindow, sendoverlaydata } from "./overlayhandler";
import SocketHandler from "./server/socketServer";
import injectQRCode from "./server/listenserver";
import { HttpExpressServer, HttpsExpressServer } from "./server/ExpressServe";
import * as fileHandler from "./data/fileHandler";
import TiktokLiveController from "./data/tiktoklive";
let Port;
let io
const fileOpener = new FileOpener();
const socketHandler = new SocketHandler();
const newsocketHandler = new SocketHandler();
const httpServer = new HttpExpressServer();
const httpsServer = new HttpsExpressServer();
const audioController = new AudioController();
const UPDATE_INTERVAL = 5000;
let tiktokController; // Variable para almacenar la instancia de TiktokLiveController
const servers = [httpServer, httpsServer];
const sockets = [socketHandler, newsocketHandler];
async function startServer() {
  const httpPort = 8088;
  const httpsPort = 0;

  const privateKey = fs.readFileSync(path.join(__dirname, '../../credentials/key.pem'), 'utf8');
  const certificate = fs.readFileSync(path.join(__dirname, '../../credentials/cert.pem'), 'utf8');
  const credentials = { key: privateKey, cert: certificate };

    await httpServer.initialize(httpPort);
    await httpsServer.initialize(httpsPort, credentials);

    servers.forEach((server, index) => {
      server.addRoute("get", "/port", (req, res) => {
        res.json({ port: server.getListenPort() });
      });

      server.addRoute("get", "/apps", async (req, res) => {
        const apps = await getInstalledApplications();
        res.json(apps);
      });
      server.addRoute('post', '/file-handler', async (req, res) => {
        console.log("req.body", req.body);
        const { event, ...params } = req.body;

        try {
          let result;

          switch (event) {
            case 'add-file-path':
              result = await handleAddFilePath(params);
              break;

            case 'get-files-in-folder':
              result = await fileHandler.getFilesInfo();
              break;

            case 'get-file-by-id':
              result = await fileHandler.getFileById(params.fileId);
              break;

            case 'get-file-by-name':
              result = await fileHandler.getFileByname(params.fileIdname);
              break;

            case 'delete-file':
              fileHandler.deleteFile(params.fileName);
              result = { success: true, message: `File "${params.fileName}" deleted successfully.` };
              break;

            case 'get-downloads-path':
              result = app.getPath('downloads');
              break;

            case 'process-web-file':
              result = await handleProcessWebFile(params);
              break;

            case 'on-drag-start':
              await handleDragStart(params);
              result = { success: true };
              break;

            default:
              throw new Error(`Unknown event type: ${event}`);
          }

          res.json(result);
        } catch (err) {
          console.error(`Error handling event ${event}:`, err);
          res.status(500).json({ success: false, error: err.message });
        }
      });
      server.addRoute("post", "/overlay", async (req, res) => {
        const { event, ...params } = req.body;
        console.log("req.body", req.body);
        const result = await sendoverlaydata({ eventType: event, data: params });
        res.json({ result: result, success: true });
      });
      server.addRoute("post", "/create-overlay-window", async (req, res) => {
        const { event, ...params } = req.body;
        console.log("req.body", req.body);
        const result = await createOverlayWindow();
        res.json({ result: result, success: true });
      });
      sockets[index].initialize(server.server);

      sockets[index].onEvent("connection", (socket) => handleSocketEvents(socket, index));
    });

    console.log(`HTTP server running on port ${httpServer.getListenPort()}`);
    console.log(`HTTPS server running on port ${httpsServer.getListenPort()}`);
    Port = httpsServer.getListenPort();
    return httpsServer.getListenPort();
}
startServer()
function handleSocketEvents(socket, index) {
  console.log(`New client connected on socket ${index + 1}:`, socket.id);

  if (tiktokController){
    tiktokController.subscribe(socket);
    console.log("Subscribed to tiktokController");
  }
  socket.emit("getapps", getInstalledApplications());
  sendAudioData(socket);
  const intervalId = setInterval(() => sendAudioData(socket), UPDATE_INTERVAL);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    const usersInRoom = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
    socket.emit("all-users", usersInRoom.filter((id) => id !== socket.id));
    socket.to(roomId).emit("user-connected", socket.id);
    console.log(`User ${socket.id} joined room ${roomId}`);
  });

  socket.on("webrtc", (payload) => {
    const { type, data, to, roomId } = payload;
    if (to) {
      io.to(to).emit("webrtc", { type, data, from: socket.id });
    } else if (type === "candidate" && (!to || to === "all")) {
      socket.to(roomId).emit("webrtc", { type, data, from: socket.id });
    }
  });
  socket.on("overlaydata", (event, data) => {
    overlaydatahandler(socket, event, data, index);
  });
  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    clearInterval(intervalId);
  });

  socket.on("setMasterVolume", (volume) => handleVolumeChange(socket, volume));
  socket.on("presskey", (key) => handleKeyPress(socket, key));
  socket.on("pressKey2", (key) => handleKeyPress2(socket, key));
  socket.on("releaseKey", (key) => handleKeyRelease(socket, key));
  socket.on("setVolume", ({ pid, volume }) => handleSessionVolumeChange(socket, pid, volume));
  socket.on("openapp", (data) => handleAppOpen(socket, data));
  socket.on("uniqueid", (data) => handleUniqueId(socket, data));
  socket.on("disconnect_tiktok", () => handleDisconnectTiktok(socket));
}
function overlaydatahandler(socket, event, data, index = 1) {
  console.log("overlay-event", event, data);
  sockets[index].emitToAllSockets("overlay-event",  event, data);
  console.log("sockets[index].emitToAllSockets", event, data);
}
async function handleAddFilePath({ fileToAdd, fileName, filePath, isWebFile, isClipboardFile }) {
  if (isWebFile || isClipboardFile) {
    const downloadsPath = app.getPath('downloads');
    const result = await fileHandler.processWebFile(fileToAdd, fileName, downloadsPath);
    if (result.success) {
      console.log(`El archivo "${fileName}" se ha guardado y registrado correctamente.`);
      return { success: true, filePath: result.filePath };
    } else {
      return { success: false, error: result.error };
    }
  } else if (filePath) {
    const savedFilePath = fileHandler.registerFile(filePath, fileName);
    console.log(`El archivo "${fileName}" se ha registrado correctamente.`);
    return { success: true, filePath: savedFilePath };
  } else {
    const { canceled, filePath: dialogFilePath } = await dialog.showSaveDialog({
      title: 'Guardar archivo',
      defaultPath: fileName
    });
    if (!canceled) {
      const savedFilePath = await fileHandler.addOrReplaceFile(fileToAdd, fileName, path.dirname(dialogFilePath));
      console.log(`El archivo "${fileName}" se ha agregado o reemplazado correctamente.`);
      return { success: true, filePath: savedFilePath };
    }
  }
}

async function handleProcessWebFile({ buffer, fileName }) {
  const downloadsPath = app.getPath('downloads');
  const result = await fileHandler.processWebFile(buffer, fileName, downloadsPath);
  if (result.success) {
    console.log(`El archivo "${fileName}" se ha guardado y registrado correctamente.`);
    return { success: true, filePath: result.filePath };
  } else {
    return { success: false, error: result.error };
  }
}

async function handleDragStart({ fileName }) {
  const filesInfo = fileHandler.getFilesInfo();
  const fileInfo = filesInfo.find(file => file.name === fileName);
  console.log('on-drag-start', fileInfo);
  if (fileInfo) {
    const filePath = fileInfo.path;
    if (!fs.existsSync(filePath)) {
      throw new Error(`File "${filePath}" does not exist.`);
    }
  } else {
    throw new Error(`File "${fileName}" not found in filesInfo.`);
  }
}

function handleUniqueId(socket, uniqueId) {
  if (tiktokController){
    tiktokController.connect(socket);
    return;
  }
  const options = {
    processInitialData: false,
    enableExtendedGiftInfo: true,
    enableWebsocketUpgrade: true,
  };

  tiktokController = new TiktokLiveController(uniqueId, options);
  tiktokController.connect(socket);
}
function handleDisconnectTiktok(socket) {
  console.log("handleDisconnectTiktok",socket.id);
  if (tiktokController){
    console.log("Disconnecting tiktokController");
    tiktokController.disconnect();
    tiktokController = null;
  }
}
function handleVolumeChange(socket, volume) {
  try {
    audioController.setMasterVolume(volume);
    socket.emit("masterVolumeChanged", volume);
  } catch (error) {
    socket.emit("error", error.message);
  }
}
function handleKeyRelease(socket, key) {
  try{
  console.log("keyreleased", key);
  keynut.keyboardController.handleKeyRelease(key)
  } catch (error) {
    console.error("Error al liberar el teclado:", error);
  }
}
function handleKeyPress2(socket, key) {
  try{
  console.log("keypressed2", key);
  keynut.keyboardController.handleKeyPress(key)
  } catch (error) {
    console.error("Error al presionar el teclado:", error);
  }
}
function handleKeyPress(socket, key) {
  console.log("keypressed", key);

  try {
    keynut.keyboardController.parseAndExecuteKeyCommand(key);
    socket.emit("keypressed", key);
  } catch (error) {
    socket.emit("error", error.message);
  }
}

function handleSessionVolumeChange(socket, pid, volume) {
  try {
    audioController.setSessionVolume(pid, volume);
    socket.emit("volumeChanged", { pid, volume });
  } catch (error) {
    socket.emit("error", error.message);
  }
}

function handleAppOpen(socket, data) {
  fileOpener.openDefault(data.path);
  socket.emit("openapp", data);
}

function getInstalledApplications() {
  return fileIndexer.searchFiles(".lnk");
}

function sendAudioData(socket) {
  const sessions = audioController.getAllSessions();
  const masterVolume = audioController.getMasterVolume();
  const isMasterMuted = audioController.isMasterMuted();
  socket.emit("audioData", { sessions, masterVolume, isMasterMuted });
}

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === "linux" ? { icon } : {}),
    webPreferences: {
      // preload: join(__dirname, "../preload/index.mjs"),
      contextIsolation: true,
      webSecurity: false,
      // sandbox: true,
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
    // initinjectQRCode(mainWindow, Port); // Inyecta el QR cuando la ventana esté lista
    // injectQRCode(mainWindow, Port); // Inyecta el QR cuando la ventana esté lista
    globalShortcut.register("Alt+F1", ToolDev);
    globalShortcut.register("Alt+F2", cdevTool);
    globalShortcut.register("Alt+F5", refreshPage);
    function ToolDev() {
      mainWindow.webContents.openDevTools();
    }

    function cdevTool() {
      mainWindow.webContents.closeDevTools();
    }

    function refreshPage() {
      mainWindow.webContents.reload(); // Reload the page on F5
    }
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
    // console.log(process.env["ELECTRON_RENDERER_URL"]);
    // console.log(join(__dirname, "../renderer/index.html"));
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.electron");
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });
  createWindow();
  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  keynut.keyboardController.releaseAllKeys();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.handle('create-overlay-window', () => {
  console.log("create-overlay-window");
  return createOverlayWindow();
});
