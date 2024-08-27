import {
  mouse,
  screen,
  sleep,
  useConsoleLogger,
  ConsoleLogLevel,
  Point,
  keyboard,
  Key,
  clipboard,
} from "@nut-tree-fork/nut-js";

class MouseController {
  constructor() {
    this.currentPosition = { x: 0, y: 0 };
  }

  async updatePosition() {
    this.currentPosition = await mouse.getPosition();
  }

  async moveUp(distance = 10) {
    await this.updatePosition();
    await mouse.setPosition({
      x: this.currentPosition.x,
      y: this.currentPosition.y - distance,
    });
  }

  async moveDown(distance = 10) {
    await this.updatePosition();
    await mouse.setPosition({
      x: this.currentPosition.x,
      y: this.currentPosition.y + distance,
    });
  }

  async moveLeft(distance = 10) {
    await this.updatePosition();
    await mouse.setPosition({
      x: this.currentPosition.x - distance,
      y: this.currentPosition.y,
    });
  }

  async moveRight(distance = 10) {
    await this.updatePosition();
    await mouse.setPosition({
      x: this.currentPosition.x + distance,
      y: this.currentPosition.y,
    });
  }
}

function getKeyboardControlsAsJSONKey(filterType = "string") {
  const keyboardControls = Key;
  const filteredControls = {};

  for (const [key, value] of Object.entries(keyboardControls)) {
    if (
      (filterType === "string" && typeof value === "string") ||
      (filterType === "number" && typeof value === "number")
    ) {
      filteredControls[key] = value;
    }
  }

  return JSON.stringify(filteredControls, null, 2);
}

const mouseController = new MouseController();

class KeyboardController {
  constructor() {
    this.keyboardmap = Key;
    this.pressedKeys = new Set();
    this.minimumHoldTime = 500; // Tiempo mínimo en milisegundos para considerar que una tecla está siendo mantenida presionada
    this.excludedKeys = new Set(['Ctrl', 'Alt', 'Shift', 'Meta']); // Teclas que no queremos que queden presionadas

    process.on('exit', this.releaseAllKeys.bind(this));
    process.on('SIGINT', this.releaseAllKeys.bind(this)); // Ctrl+C en la terminal
    process.on('SIGTERM', this.releaseAllKeys.bind(this)); // Señal de terminación
  }

  async releaseAllKeys() {
    const keysArray = Array.from(this.pressedKeys);
    await this.releaseKeys(keysArray);
    console.log('Todas las teclas han sido liberadas al cerrar el programa.');
  }

  async pressKeys(keys) {
    for (const key of keys) {
      if (!this.pressedKeys.has(key)) {
        await keyboard.pressKey(key);
        this.pressedKeys.add(key);
      }
    }
  }

  async releaseKeys(keys) {
    for (const key of keys) {
      if (this.pressedKeys.has(key)) {
        await keyboard.releaseKey(key);
        this.pressedKeys.delete(key);
      }
    }
  }

  async handleKeyPress(key) {
    const keyCodes = this.convertToKeyCodes([key]);
    if (keyCodes.length > 0) {
      await this.pressKeys(keyCodes);
      console.log(`Tecla ${key} presionada`);
    }
  }

  async handleKeyRelease(key) {
    const keyCodes = this.convertToKeyCodes([key]);
    if (keyCodes.length > 0) {
      await this.releaseKeys(keyCodes);
      console.log(`Tecla ${key} liberada`);
    }
  }

  async handleKeyHold(key) {
    if (this.isExcludedKey(key)) {
      console.log(`Tecla ${key} es excluida y no se mantendrá presionada.`);
      return;
    }

    const startTime = Date.now();
    await this.handleKeyPress(key);

    while (this.pressedKeys.has(this.convertToKeyCodes([key])[0])) {
      await sleep(100); // Esperar un breve período para simular el mantener presionado
      if (Date.now() - startTime >= this.minimumHoldTime) {
        console.log(`Tecla ${key} mantenida presionada por más de ${this.minimumHoldTime}ms`);
        break;
      }
    }

    await this.handleKeyRelease(key);
  }

  async parseAndExecuteKeyCommand(command) {
    let keys = [];
    console.log("parseAndExecuteKeyCommand", command);

    if (Array.isArray(command)) {
      keys = command;
    } else if (typeof command === "number") {
      keys = [command];
    } else {
      console.warn("Tipo de comando no válido");
      return;
    }

    try {
      const keyCodes = this.convertToKeyCodes(keys);

      if (keyCodes.length === 0) {
        console.warn("No se encontraron teclas válidas para ejecutar");
        return;
      }

      await this.pressKeys(keyCodes);
      await this.releaseKeys(keyCodes);

      console.log(`Executed key command: ${keyCodes.join("+")}`);
    } catch (error) {
      console.error("Error al ejecutar el comando de teclado:", error);
    }
  }

  findKeyboardControl(key) {
    const keyUpperCase = key.toUpperCase();
    for (const [k, v] of Object.entries(this.keyboardmap)) {
      if (v.toUpperCase() === keyUpperCase) {
        return Key[k];
      }
    }
    return null;
  }

  convertToKeyCodes(keys) {
    return keys
      .map((key) => {
        if (typeof key === "string") {
          return Key[key] || null;
        } else if (typeof key === "number") {
          return Object.values(Key).includes(key) ? key : null;
        } else {
          console.warn(`Tecla no reconocida: ${key}`);
          return null;
        }
      })
      .filter((code) => code !== null);
  }

  isExcludedKey(key) {
    return this.excludedKeys.has(key);
  }
}

const keyboardController = new KeyboardController();

export default {
  mouseController,
  getKeyboardControlsAsJSONKey,
  keyboardController,
};

// module.exports = { mouseController, getKeyboardControlsAsJSONKey, keyboardController };
