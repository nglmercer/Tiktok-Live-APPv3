import express from "express";
import cors from "cors";
import { join } from "path";

class BaseExpressServer {
  constructor() {
    this.app = express();
    this.server = null;
    this.isConnected = false;
    this.port = null;
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static(join(__dirname, "../renderer")));
  }

  listenOnPort(port) {
    return new Promise((resolve) => {
      if (this.isConnected) {
        console.log("Server is already running. Closing existing connection...");
        this.close(() => {
          this.startListening(port, resolve);
        });
      } else {
        this.startListening(port, resolve);
      }
    });
  }

  startListening(port, resolve) {
    this.server.listen(port, () => {
      this.port = this.server.address().port;
      console.log(`${this.constructor.name} is running on port ${this.port}`);
      this.isConnected = true;
      resolve(true);
    });

    this.server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.log(`Port ${port} is already in use`);
        resolve(false);
      } else {
        console.error(`Error starting server on port ${port}:`, err);
        resolve(false);
      }
    });
  }

  onEvent(eventName, callback) {
    this.app.on(eventName, callback);
  }

  addRoute(method, path, handler) {
    switch (method.toLowerCase()) {
      case 'get':
        this.app.get(path, handler);
        break;
      case 'post':
        this.app.post(path, handler);
        break;
      case 'put':
        this.app.put(path, handler);
        break;
      case 'delete':
        this.app.delete(path, handler);
        break;
      default:
        console.error(`Unsupported HTTP method: ${method}`);
    }
  }

  onDisconnect(callback) {
    this.server.on("close", callback);
  }

  close(callback) {
    if (this.server) {
      this.server.close(() => {
        console.log(`${this.constructor.name} closed`);
        this.isConnected = false;
        if (callback) callback();
      });
    } else if (callback) {
      callback();
    }
  }

  getListenPort() {
    return this.port;
  }
}

export default BaseExpressServer;
