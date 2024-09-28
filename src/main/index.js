import { app, shell, BrowserWindow, globalShortcut, ipcMain, protocol } from "electron";
import path, { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import icon from "../../resources/icon.png?asset";
import iconico from "../../resources/icon.ico?asset";
import fs from "fs";
import fileIndexer from "./FindFiles";
import FileOpener from "./FileOpener";
import AudioController from "./features/audioController";
import keynut from "./features/keynut";
import { BotManager,MinecraftRcon } from "./features/Botmanager";
import { OSCManager,InputManager } from './features/oscmanager';
import { initAutoUpdates, checkForUpdatesManually } from "./features/autoupdate";
import SocketHandler from "./server/socketServer";
import injectQRCode from "./server/listenserver";
import { HttpExpressServer, HttpsExpressServer } from "./server/ExpressServe";
import * as fileHandler from "./data/fileHandler";
import TiktokLiveController from "./data/tiktoklive";
import dotenv from 'dotenv';
dotenv.config();

// import { type } from "os";
let Port;
let io
const fileOpener = new FileOpener();
const socketHandler = new SocketHandler();
const newsocketHandler = new SocketHandler();
const httpServer = new HttpExpressServer();
const httpsServer = new HttpsExpressServer();
const audioController = new AudioController();
const botManager = new BotManager();
const minecraftRcon = new MinecraftRcon();
const oscManager = new OSCManager();
const inputManager = new InputManager(oscManager);
process.on('uncaughtException', (error) => {
  console.error('Error no capturado en el proceso principal:', error);
});
const UPDATE_INTERVAL = 5000;
let tiktokController; // Variable para almacenar la instancia de TiktokLiveController
const servers = [httpServer, httpsServer];
const sockets = [socketHandler, newsocketHandler];
async function startServer() {
  const httpPort = 8088;
  const httpsPort = 0;
  const privateKey = process.env.PRIVATE_KEY || import.meta.env.VITE_PRIVATE_KEY;
  const certificate = process.env.CERTIFICATE || import.meta.env.VITE_CERTIFICATE;
  console.log("privateKey", privateKey,"certificate", certificate);
  // const privateKey = fs.readFileSync(path.join(__dirname, './credentials/key.pem'), 'utf8');
  // const certificate = fs.readFileSync(path.join(__dirname, './credentials/cert.pem'), 'utf8');
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
        const { event, id, ...params } = req.body;
        console.log(event,"event");
        try {
          let result = { success: false, error: "Unknown event" };

          switch (event) {
            case 'add-file-path':
              result = await handleAddFilePath(params);
              break;

            case 'get-files-in-folder':
              result = await fileHandler.getFilesInfo();
              break;

            case 'get-file-by-id':
              result = await fileHandler.getFileById(id ||params.fileId);
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
              result = { success: false, error: `Unknown event type: ${event}` };
              break;
          }

          res.json(result);
        } catch (err) {
          console.error(`Error handling event ${event}:`, err);
          res.json({ success: false });
          throw new Error(`Failed to handle event ${event}: ${err.message}`);
        }
      });
      server.addRoute("post", "/overlay", async (req, res) => {
        const { event, ...params } = req.body;
        console.log("req.body", req.body);
        res.json({ result: result, success: true });
      });
      server.addRoute("post", "/create-overlaywindow", async (req, res) => {
        const { event, ...params } = req.body;
        console.log("req.body", req.body);
        res.json({ result: "createoverlaywindow", success: true });
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
  socket.on("botmanager", (data) => handleBotManager(socket, data));
  socket.on("connect-rcon",(data) => handleRconConnect(socket, data));
  socket.on("sendcommandMinecraft", (data) => sendcommandMinecraft(socket, data));
  socket.on("oscmanager", (data) => handleOscManager(socket, data));
  socket.on("oscmessage", (data) => sendOscMessage(socket, data));
  socket.on("oscHandler", (data) => handleOscHandler(socket, data));
  socket.on("autoupdate", () => handleautoupdate(socket));
  socket.on("countdowtime", (data) => handlecountdowtime(socket, data, index));
}
function overlaydatahandler(socket, event, data, index = 1) {
  console.log("overlay-event", event, data);
  // if (!data || !event) return;
  sockets[index].emitToAllSockets("overlay-event",  event, data);
  console.log("sockets[index].emitToAllSockets", event, data);
}
function handlecountdowtime(socket, data, index = 1) {
  console.log("handlecountdowtime", data);
  sockets[index].emitToAllSockets("countdowtime", data);
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
function handleBotManager(socket, data) {
  console.log("handleBotManager", data);
  socket.emit("botmanagerresponse", data);
}
function handleRconConnect(socket, data) {
  console.log("handleRconConnect", data);
  minecraftRcon.connectRcon(data);
  socket.emit("rconconnectresponse", data);
}
async function sendcommandMinecraft(socket, data) {
  console.log("command minecraft",data)
  const response = await minecraftRcon.sendMessage(data);
  if (!response || typeof response !== 'object' || typeof response !== 'string') return;
  console.log("response minecraft",response)
  socket.emit("sendcommandMinecraftresponse", response);
}
function handleOscManager(socket, data) {
  console.log("handleOscManager", data);
  if (data.clientipport && data.serveripport) {
    const clientIP = data.clientipport.split(":")[0];
    const serverIP = data.serveripport.split(":")[0];
    const clientPort = data.clientipport.split(":")[1];
    const serverPort = data.serveripport.split(":")[1];
    oscManager.createServer(Number(serverPort), serverIP);
    oscManager.createClient(clientIP, Number(clientPort));
  }

  // oscManager.createServer(Number(port), host);
  // oscManager.createClient(host, Number(port));
}
function sendOscMessage(socket, data) {
  console.log("sendOscMessage", data);
  oscManager.sendMessage(data);
}
function handleOscHandler(socket, data) {
  console.log("handleOscHandler", data);
  inputManager.sendInput(data.action, data.value);
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
    ...(process.platform === "linux" ? { icon } : {iconico}),
    webPreferences: {
      // preload: join(__dirname, "../preload/index.mjs"),
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      enableRemoteModule: true,
      sandbox: true,
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
    // initinjectQRCode(mainWindow, Port); // Inyecta el QR cuando la ventana esté lista
    injectQRCode(mainWindow, Port); // Inyecta el QR cuando la ventana esté lista
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
    // mainWindow.loadURL(join(__dirname, "../renderer/index.html"));
    mainWindow.loadURL(`http://localhost:8088`);
  }
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Permite solo popups que coincidan con tu dominio o reglas específicas
    if (url.startsWith('https://')) {
      return { action: 'allow' }; // Permitir la ventana emergente
    }
    return { action: 'deny' }; // Denegar ventanas emergentes que no coincidan
  });
}
function handleautoupdate(socket) {
  const response = checkForUpdatesManually();
  const statusclient = initAutoUpdates();
  socket.emit("autoupdateResponse", statusclient);
  socket.emit("autoupdateResponse", response);
  const existUpdate = fs.existsSync(path.resolve(path.dirname(process.execPath), '..', 'update.exe'));
  console.log("existUpdate",existUpdate);
  socket.emit("autoupdateResponse", existUpdate);
}
app.whenReady().then(() => {

  initAutoUpdates();
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
