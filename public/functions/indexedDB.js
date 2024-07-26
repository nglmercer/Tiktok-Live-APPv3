export const databases = {
    eventsDB: { name: 'eventsDB', version: 1, store: 'events' },
    MyDatabaseActionevent: { name: 'MyDatabaseActionevent', version: 1, store: 'files' }
  };
  
  class IndexedDBManager {
    constructor(dbConfig) {
      this.dbConfig = dbConfig;
    }
  
    async openDatabase() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(this.dbConfig.name, this.dbConfig.version);
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          const objectStore = db.createObjectStore(this.dbConfig.store, { keyPath: 'id', autoIncrement: true });
          objectStore.createIndex('name', 'name', { unique: false });
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
          delete data.id;
        }
        const request = objectStore.add(data);
        request.onsuccess = (event) => {
          data.id = event.target.result;
          observer.notify('save', data);
          resolve(data);
        };
        request.onerror = (event) => reject(event.target.error);
      });
    }
  
    async deleteData(id) {
      return this.performTransaction('readwrite', (objectStore, resolve, reject) => {
        const request = objectStore.delete(Number(id));
        request.onsuccess = () => {
          observer.notify('delete', id);
          resolve(id);
        };
        request.onerror = (event) => reject(event.target.error);
      });
    }
  
    async updateData(data) {
      return this.performTransaction('readwrite', (objectStore, resolve, reject) => {
        data.id = Number(data.id);
        const request = objectStore.put(data);
        request.onsuccess = () => {
          observer.notify('update', data);
          resolve(data);
        };
        request.onerror = (event) => reject(event.target.error);
      });
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
  }
  
  class DBObserver {
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
  
  export const observer = new DBObserver();
  
  // Usage example
  export function createDBManager(dbConfig) {
    return new IndexedDBManager(dbConfig);
  }