export const databases = {
  eventsDB: { name: 'eventsDB', version: 1, store: 'events' },
  MyDatabaseActionevent: { name: 'MyDatabaseActionevent', version: 1, store: 'files' },
  MinecraftDatabase: { name: 'MinecraftDatabase', version: 1, store: 'minecraft' },
  streamcontrols: { name: 'streamcontrols', version: 1, store: 'streamcontrols' },
  userPoints: { name: 'userPoints', version: 1, store: 'userPoints' },
};

export class IndexedDBManager {
  constructor(dbConfig, idbObserver) {
      this.dbConfig = dbConfig;
      this.debouncedSaveData = debounce(this.saveData.bind(this), 300); // 300 ms debounce
      this.debouncedDeleteData = debounce(this.deleteData.bind(this), 300); // 300 ms debounce
      this.debouncedUpdateData = debounce(this.updateData.bind(this), 300); // 300 ms debounce
      this.idbObserver = idbObserver;
      this.newusers = new Set();
  }

  async openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbConfig.name, this.dbConfig.version);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const objectStore = db.createObjectStore(this.dbConfig.store, { keyPath: 'id', autoIncrement: true });
        objectStore.createIndex('name', 'name', { unique: true });
        objectStore.createIndex('type', 'type', { unique: false });
        objectStore.createIndex('path', 'path', { unique: false });
      };
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async performTransaction(mode, callback) {
    const db = await this.openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.dbConfig.store], mode);
      const objectStore = transaction.objectStore(this.dbConfig.store);
      callback(objectStore, resolve, reject);
    });
  }

  async saveData(data) {
    return this.performTransaction('readwrite', (objectStore, resolve, reject) => {
      if (typeof data.id !== 'number' || data.id <= 0) {
        delete data.id;  // Asegura que no se intente guardar un id inválido
      }
      const request = objectStore.add(data);
      request.onsuccess = (event) => {
        data.id = event.target.result;
        this.idbobserver('save', data);
        resolve(data);
      };
      request.onerror = (event) => reject(event.target.error);
    });
  }
  async deleteData(id) {
    return this.performTransaction('readwrite', (objectStore, resolve, reject) => {
      const request = objectStore.delete(Number(id));
      request.onsuccess = () => {
        this.idbobserver('delete', id);
        resolve(id);
      };
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async updateData(data) {
    return this.performTransaction('readwrite', (objectStore, resolve, reject) => {
      const request = objectStore.put(data);
      request.onsuccess = () => {
        this.idbobserver('update', data);
        resolve(data);
      };
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async getDataByName(name) {
    return this.performTransaction('readonly', (objectStore, resolve, reject) => {
      const index = objectStore.index('name');
      const request = index.get(name);
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async saveOrUpdateDataByName(data) {
    try {
      const existingData = await this.getDataByName(data.name);
      if (existingData) {
        // Si existe un registro con el mismo nombre, actualiza el id y actualiza el registro
        data.id = existingData.id;
        console.log("Actualizando data existente", data);
        return this.updateData(data);
      } else {
        // Si no existe, guarda un nuevo registro
        console.log("Guardando nueva data", data);
        return this.saveData(data);
      }
    } catch (error) {
      console.error("Error al guardar o actualizar data", error);
      return this.saveData(data); // Intenta guardar si algo falla
    }
  }

  async getAllData() {
    return this.performTransaction('readonly', (objectStore, resolve, reject) => {
      const request = objectStore.getAll();
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  async exportDatabase() {
      const data = await this.getAllData();
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.dbConfig.name}_backup.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  }

  async importDatabase(file) {
      const data = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(JSON.parse(event.target.result));
          reader.readAsText(file);
      });

      return this.performTransaction('readwrite', (objectStore, resolve, reject) => {
          const addNextItem = (index) => {
              if (index >= data.length) {
                  resolve();
                  return;
              }
              const request = objectStore.put(data[index]);
              request.onsuccess = () => addNextItem(index + 1);
              request.onerror = (event) => reject(event.target.error);
          };
          addNextItem(0);
      });
  }
  async idbobserver (eventype, data) {
      if (this.idbObserver) {
          this.idbObserver.notify(eventype, data);
      }
  }
}

export class DBObserver {
  constructor() {
      this.listeners = [];
  }

  subscribe(callback) {
      this.listeners.push(callback);
  }

  unsubscribe(callback) {
      this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  notify(action, data) {
      this.listeners.forEach(listener => listener(action, data));
  }
}

function debounce(func, wait) {
  let timeout;
  return function(...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

// Usage example
// IndexedDBManager.updateData({ name: 'User 1', points: 100 }, 'name');
// IndexedDBManager.saveData({ name: 'User 1', points: 100 }, 'name');
