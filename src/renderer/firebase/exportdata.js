//
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore, setDoc, getDoc, doc,addDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import {
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import textReplacer, {imageManipulator, toggleClasses, toggleClassesMultiple} from "../src/utils/textReplacer";
const firebaseConfig = {
    apiKey: "AIzaSyDf_0M9KgJttAJogVDqHdv7E7y8psKgZyE",
    authDomain: "tiktokliveapp-bced3.firebaseapp.com",
    projectId: "tiktokliveapp-bced3",
    storageBucket: "tiktokliveapp-bced3.appspot.com",
    messagingSenderId: "860491897747",
    appId: "1:860491897747:web:928b1824fb8f936dade666",
    measurementId: "G-VE9VWQWWX1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);


async function importIndexedDBs(importData) {
  const results = [];

  for (const [dbName, stores] of Object.entries(importData)) {
      const db = await new Promise((resolve, reject) => {
          const request = indexedDB.open(dbName, 1);
          request.onerror = reject;
          request.onupgradeneeded = (event) => {
              const db = event.target.result;
              for (const storeName of Object.keys(stores)) {
                  if (!db.objectStoreNames.contains(storeName)) {
                      db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                  }
              }
          };
          request.onsuccess = () => resolve(request.result);
      });

      for (const [storeName, data] of Object.entries(stores)) {
          for (const item of data) {
              const transaction = db.transaction(storeName, 'readwrite');
              const objectStore = transaction.objectStore(storeName);

              try {
                  await new Promise((resolve, reject) => {
                      const request = objectStore.add(item);

                      request.onsuccess = () => {
                          results.push(`Elemento con ID ${request.result} importado correctamente en ${dbName}.${storeName}`);
                          resolve();
                      };

                      request.onerror = async () => {
                        if (request.error && request.error.name === 'ConstraintError') {
                            const { action, updatedItem } = await showReplaceDialog(dbName, storeName, item);

                            // Manejar la acción del usuario después de mostrar el diálogo
                            switch (action) {
                                case 'replace':
                                    await performReplace(db, storeName, updatedItem, results);
                                    break;
                                case 'delete':
                                    await performDeleteAndReplace(db, storeName, updatedItem, results);
                                    break;
                                default:
                                    results.push(`Elemento con ID ${item.id} no reemplazado`);
                                    break;
                            }
                            resolve(); // Completa la promesa independientemente de la acción
                        } else {
                            results.push(`Error al importar elemento: ${request.error}`);
                            reject(request.error); // Propaga el error para manejarlo fuera del bucle
                        }
                    };

                  });
              } catch (error) {
                  console.error(`Error al importar elemento :`, error);
              }
          }
      }

      db.close();
  }

  return results;
}

// Función para realizar el reemplazo de un elemento
async function performReplace(db, storeName, item, results) {
  // console.log("performReplace item, storeName, db, results", item, storeName, db, results);
  const transaction = db.transaction(storeName, 'readwrite');
  const objectStore = transaction.objectStore(storeName);
  const updateRequest = objectStore.put(item);

  updateRequest.onsuccess = () => {
      results.push(`Elemento con ID ${item.id} reemplazado correctamente `);
  };

  updateRequest.onerror = () => {
      results.push(`Error al reemplazar el elemento ${updateRequest.error}`);
  };

  await new Promise((resolve) => transaction.oncomplete = resolve);
}
async function showReplaceDialog(dbName, storeName, item) {
  return new Promise((resolve) => {
      const dialog = document.createElement('dialog');

      // Construye un formulario para mostrar las claves pero permitir la edición de los valores
      let formHtml = `<h3>Conflicto con el elemento</h3>
          <p>El elemento con ID ${item.id} ya existe en ${dbName}.${storeName}. ¿Qué deseas hacer?</p>
          <form id="editForm">`;

      for (const [key, value] of Object.entries(item)) {
        if (Array.isArray(value)) {
          // Para arrays, solo los mostramos sin crear inputs para editarlos
          formHtml += `
              <div>
                  <label><strong>${key}:</strong></label>
                  <pre>${JSON.stringify(value, null, 2)}</pre>
              </div>`;
        } else if (typeof value !== 'object') {
          // Añadir el input de acuerdo con el tipo de valor, ignorando arrays
          formHtml += `
              <div>
                  <label><strong>${key}:</strong></label>
                  <input type="${gettypeInputelement(value)}" name="${key}" value="${value}" ${getCheckedAttribute(value,key)}>
              </div>`;
        } else {
          // Si el valor es un objeto, mostrar sus subpropiedades como campos individuales
          formHtml += `<div><strong>${key}:</strong></div>`;
          for (const [subkey, subvalue] of Object.entries(value)) {
            if (Array.isArray(subvalue)) {
              formHtml += `
                  <div>
                      <label><strong>${subkey}:</strong></label>
                      <pre>${JSON.stringify(subvalue, null, 2)}</pre>
                  </div>`;
            } else {
              formHtml += `
                  <div>
                      <label><strong>${subkey}:</strong></label>
                      <input type="${gettypeInputelement(subvalue)}" name="${key}.${subkey}" value="${subvalue}" ${getCheckedAttribute(subvalue,key)}>
                  </div>`;
            }
          }
        }
      }

      formHtml += `</form>
          <button id="replace" class="btn btn-primary exportButton">Reemplazar</button>
          <button id="delete" class="btn btn-primary border-red bg-red">Forzar reemplazo</button>
          <button id="cancel" class="btn btn-primary border-red bg-red">Cancelar</button>`;

      dialog.innerHTML = formHtml;
      document.body.appendChild(dialog);

      // Manejar los botones
      dialog.querySelector('#replace').addEventListener('click', () => {
          const formData = new FormData(dialog.querySelector('#editForm'));
          const updatedItem = { ...item };

          // Actualiza los valores de los campos de entrada, ignorando arrays
          for (const [key, value] of formData.entries()) {
              // Manejo de subpropiedades
              if (key.includes('.')) {
                  const [parentKey, subKey] = key.split('.');
                  updatedItem[parentKey][subKey] = value;
              } else {
                  updatedItem[key] = value;
              }
          }

          dialog.close();
          resolve({ action: 'replace', updatedItem });
      });

      dialog.querySelector('#delete').addEventListener('click', () => {
          dialog.close();
          resolve({ action: 'delete' });
      });

      dialog.querySelector('#cancel').addEventListener('click', () => {
          dialog.close();
          resolve({ action: 'cancel' });
      });

      dialog.showModal();
  });
}

// Función para determinar el tipo de input según el valor
function gettypeInputelement(value) {
  if (typeof value === 'string') {
    return 'text';
  } else if (typeof value === 'number') {
    return 'number';
  } else if (typeof value === 'boolean') {
    return 'checkbox';
  } else {
    return 'text';
  }
}

// Función para manejar el atributo "checked" en los checkboxes
function getCheckedAttribute(value,data) {
  console.log("getCheckedAttribute", value,data);
  if (data.includes("media")) {
    return false
  }
  if (typeof value === 'boolean') {
    return value ? 'checked' : '';
  }
  return '';
}


// Función para eliminar y luego reemplazar un elemento
async function performDeleteAndReplace(db, storeName, item, results) {
  const deleteTransaction = db.transaction(storeName, 'readwrite');
  const deleteStore = deleteTransaction.objectStore(storeName);
  const deleteRequest = deleteStore.delete(item.id);

  deleteRequest.onsuccess = async () => {
      const addTransaction = db.transaction(storeName, 'readwrite');
      const addStore = addTransaction.objectStore(storeName);
      const addRequest = addStore.add(item);

      addRequest.onsuccess = () => {
          results.push(`Elemento con ID ${item.id} reemplazado correctamente en ${dbName}.${storeName} después de eliminar el existente`);
      };

      addRequest.onerror = () => {
          results.push(`Error al reemplazar el elemento en ${dbName}.${storeName}: ${addRequest.error}`);
      };

      await new Promise((resolve) => addTransaction.oncomplete = resolve);
  };

  deleteRequest.onerror = () => {
      results.push(`Error al eliminar el elemento en ${dbName}.${storeName}: ${deleteRequest.error}`);
  };

  await new Promise((resolve) => deleteTransaction.oncomplete = resolve);
}

const styles = `
.export-dialog h2 {
    fontSize: 1.5rem;
}

.export-dialog label {
    display: block;
    margin-bottom: 5px;
}

.export-dialog .select-all {
    color: #bcf900;
}

.export-dialog .save-to-cloud {
    color: gold;
}


.btn-primary {
    background-color: #007bff;
    color: white;
    border: none;
}

.btn-cancel {
    background-color: #dc3545;
    color: white;
    border: none;
}
`;

class ExportDialog {
  constructor(databases, onExport, config) {
      this.databases = databases;
      this.onExport = onExport;
      this.dialog = null;
      this.config = config || {};
  }

  createDialog() {
      const dialog = document.createElement('dialog');
      dialog.className = 'export-dialog';
      dialog.innerHTML = `
          <style>${styles}</style>
          <h4>Selecciona las bases de datos a exportar</h4>
          <form id="exportForm">
              <div id="dbCheckboxes">
                  ${this.databases.map(db => {
                      const dbConfig = this.config[db] || {};
                      const displayText = dbConfig.text || db;
                      const isHidden = dbConfig.hidden ? 'style="display: none;"' : '';
                      const dbvalue = db;
                      console.log("dbvalue", db);
                      return `
                          <label ${isHidden}>
                              <input type="checkbox" name="db" value="${dbvalue}" ${isHidden}>
                              <span>${displayText}</span>
                          </label>
                      `;
                  }).join('')}
              </div>
              <label>
                  <input type="checkbox" id="selectAll">
                  <span class="select-all">Seleccionar todas las bases de datos</span>
              </label><br>
              <label>
                  <input type="checkbox" id="saveToFirebase">
                  <span class="save-to-cloud">Guardar en la Nube</span>
              </label><br>
              <button type="submit" class="btn btn-primary">Exportar</button>
              <button type="button" id="cancelButton" class="btn btn-cancel">Cancelar</button>
          </form>
      `;
      return dialog;
  }

  setupEventListeners() {
      const selectAllCheckbox = this.dialog.querySelector('#selectAll');
      const dbCheckboxes = this.dialog.querySelectorAll('input[name="db"]:not([style*="display: none"])');
      const saveToFirebaseCheckbox = this.dialog.querySelector('#saveToFirebase');
      const cancelButton = this.dialog.querySelector('#cancelButton');
      const form = this.dialog.querySelector('#exportForm');

      selectAllCheckbox.addEventListener('change', () => {
          dbCheckboxes.forEach(cb => cb.checked = selectAllCheckbox.checked);
      });

      form.addEventListener('submit', (e) => {
          e.preventDefault();
          const selectedDBs = Array.from(dbCheckboxes)
              .filter(cb => cb.checked)
              .map(cb => cb.value);
          if (selectedDBs.length > 0) {
              this.onExport(selectedDBs, saveToFirebaseCheckbox.checked);
          }
          this.dialog.close();
      });

      cancelButton.addEventListener('click', () => {
          this.dialog.close();
      });
  }

  show() {
      this.dialog = this.createDialog();
      document.body.appendChild(this.dialog);
      this.setupEventListeners();
      this.dialog.showModal();
  }
}
const dbConfig = {
  'eventsDB': { text: 'Acciones Y Eventos' },
  'firebase-heartbeat-database': { hidden: true },
  'firebaseLocalStorageDb': { hidden: true },
  'firebaseLocalStoragedb': { hidden: true },
  'streamcontrols': { text: 'Controles Streamdeck' },
  'userPoints': { text: 'Puntos de Usuario' },
  'validate-browser-context-for-indexeddb-analytics-module': { hidden: true }
};
class DatabaseManager {
    static async getIndexedDBList() {
        const databases = await window.indexedDB.databases();
        const excludedDatabases = []; // Añade aquí las bases de datos que quieres excluir
        return databases
            .map(db => db.name)
            .filter(dbName => !excludedDatabases.includes(dbName));
    }

    static async exportSelectedIndexedDBs(dbNames, saveToFirebase = false) {
        for (const dbName of dbNames) {
            const exportData = await this.exportDatabase(dbName);
            const jsonString = JSON.stringify(exportData);

            if (saveToFirebase) {
                await this.saveToFirestore(jsonString, dbName);
            } else {
                this.downloadJSON(jsonString, dbName);
            }
        }
    }

    static async exportDatabase(dbName) {
        const db = await this.openDatabase(dbName);
        const exportData = { [dbName]: {} };
        const objectStoreNames = Array.from(db.objectStoreNames);

        for (const storeName of objectStoreNames) {
            exportData[dbName][storeName] = await this.getAllFromObjectStore(db, storeName);
        }

        db.close();
        return exportData;
    }

    static openDatabase(dbName) {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName);
            request.onerror = reject;
            request.onsuccess = () => resolve(request.result);
        });
    }

    static getAllFromObjectStore(db, storeName) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const objectStore = transaction.objectStore(storeName);
            const request = objectStore.getAll();
            request.onerror = reject;
            request.onsuccess = () => resolve(request.result);
        });
    }

    static downloadJSON(jsonString, dbName) {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.generateName(dbName)}_export.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    static async saveToFirestore(data, dbName) {
        const timestamp = new Date();
        const dateString = timestamp.toISOString().split('T')[0]
        const docName = `${this.generateName(dbName)}_${dateString}`;
        const docRef = doc(db, "backups", docName);

        try {
            await setDoc(docRef, { data, timestamp });
            console.log("Datos guardados en Firebase correctamente.");
            alert("Datos guardados en Firebase correctamente.", docName);
        } catch (e) {
            console.error("Error al guardar en Firebase: ", e);
            alert("Error al guardar en Firebase. Consulta la consola para más detalles.", docName);
        }
    }

    static generateName(customname) {
        const newname = localStorage.getItem("tiktok_name") || localStorage.getItem("UniqueId") || "Backup_";
        if (customname) {
            switch (customname) {
                case "eventsDB":
                    return `${newname}_AccionesEventos`;
                case "streamcontrols":
                    return `${newname}_Streamshortcuts`;
                case "userPoints":
                    return `${newname}_PuntosDeUsuario`;
                default:
                    return `${newname}_${customname}`;
            }
        } else {
            return `${newname}_`;
        }
    }
}

async function showExportDialog() {
    const databases = await DatabaseManager.getIndexedDBList();
    console.log(databases);
    const dialog = new ExportDialog(databases, DatabaseManager.exportSelectedIndexedDBs.bind(DatabaseManager), dbConfig);
    dialog.show();
}

async function handleImport() {
    const importInput = document.getElementById('importInput');
    const importButton = document.getElementById('importButton');
    const file = importInput.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const importData = JSON.parse(e.target.result);
            const results = await importIndexedDBs(importData);
            displayResults(results);
            importInput.value = '';
            importButton.classList.remove('file-selected');
            importButton.textContent = 'Importar archivo seleccionado';
        };
        reader.readAsText(file);
    } else {
        alert('Por favor, selecciona un archivo para importar.');
    }
}

function displayResults(results) {
    const resultDiv = document.getElementById('importResults');
    resultDiv.innerHTML = results.map(result => `<p>${result}</p>`).join('');
}



// async function loadFromFirebase() {
//   try {
//       const backupsRef = collection(db, "backups");
//       const querySnapshot = await getDocs(backupsRef);
//       let backups = querySnapshot.docs.map(doc => ({
//           id: doc.id,
//           timestamp: doc.data().timestamp.toDate()
//       }));

//       if (backups.length === 0) {
//           alert("No se encontraron copias de seguridad en Firebase.");
//           return;
//       }

//       // Ordenar las copias de seguridad por fecha, de la más reciente a la más antigua
//       backups.sort((a, b) => b.timestamp - a.timestamp);

//       const dialog = document.createElement('dialog');
//       dialog.innerHTML = `
//           <h4>Selecciona una copia de seguridad para cargar</h4>
//           <form id="loadForm">
//               <div id="backupRadios">
//                   ${backups.map((backup, index) => `
//                       <div>
//                           <input type="radio" id="backup_${backup.id}" name="backup" value="${backup.id}" ${index === 0 ? 'checked' : ''}>
//                           <label for="backup_${backup.id}">${backup.id} (${backup.timestamp.toLocaleString()})</label>
//                       </div>
//                   `).join('')}
//               </div>
//               <button type="submit" class="btn btn-primary exportButton">Cargar</button>
//               <button type="button" id="cancelLoadButton" class="btn btn-primary border-red bg-red">Cancelar</button>
//           </form>
//       `;

//       document.body.appendChild(dialog);

//       const form = dialog.querySelector('#loadForm');
//       form.addEventListener('submit', async (e) => {
//           e.preventDefault();
//           const selectedBackupId = form.querySelector('input[name="backup"]:checked').value;
//           const docRef = doc(db, "backups", selectedBackupId);
//           const docSnap = await getDoc(docRef);

//           if (docSnap.exists()) {
//               const { data } = docSnap.data();
//               const importData = JSON.parse(data);
//               const results = await importIndexedDBs(importData);
//               displayResults(results);
//           } else {
//               alert("No se pudo cargar la copia de seguridad seleccionada.");
//           }

//           dialog.close();
//       });

//       dialog.querySelector('#cancelLoadButton').addEventListener('click', () => {
//           dialog.close();
//       });

//       // Agregar funcionalidad para marcar el elemento seleccionado
//       const radioButtons = dialog.querySelectorAll('input[type="radio"]');
//       radioButtons.forEach(radio => {
//           radio.addEventListener('change', () => {
//               radioButtons.forEach(rb => {
//                   rb.parentElement.classList.remove('selected');
//               });
//               radio.parentElement.classList.add('selected');
//           });
//       });

//       dialog.showModal();
//   } catch (e) {
//       console.error("Error al cargar desde Firebase: ", e);
//       alert("Error al cargar desde Firebase. Consulta la consola para más detalles.");
//   }
// }
function generateBackupHTML(backups) {
  return `
      <h4>Selecciona una copia de seguridad para cargar</h4>
      <form id="loadForm">
          <div id="backupRadios">
              ${backups.map((backup, index) => `
                  <div>
                      <input type="radio" id="backup_${backup.id}" name="backup" value="${backup.id}" ${index === 0 ? 'checked' : ''}>
                      <label for="backup_${backup.id}">${backup.id} (${backup.timestamp.toLocaleString()})</label>
                  </div>
              `).join('')}
          </div>
          <button type="submit" class="btn btn-primary exportButton">Cargar</button>
          <button type="button" id="cancelLoadButton" class="btn btn-primary border-red bg-red">Cancelar</button>
      </form>
  `;
}

// Función para cargar los backups desde Firebase
async function loadFromFirebase() {
  const backupsRef = collection(db, "backups");
  const querySnapshot = await getDocs(backupsRef);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    timestamp: doc.data().timestamp.toDate()
  }));
}

// Función para manejar el diálogo
async function handleDialogImport() {
  const dialog = document.createElement('dialog');

  try {
    const backups = await loadFromFirebase();

    if (backups.length === 0) {
      alert("No se encontraron copias de seguridad en Firebase.");
      return;
    }
    backups.sort((a, b) => b.timestamp - a.timestamp);
    // Genera y agrega el HTML al diálogo
    dialog.innerHTML = generateBackupHTML(backups);
    document.body.appendChild(dialog);

    // Manejadores de eventos del formulario y botones
    const form = dialog.querySelector('#loadForm');
    formEventlisteners(form,dialog);

    dialog.querySelector('#cancelLoadButton').addEventListener('click', () => {
      dialog.close();
    });

    // Mostrar el diálogo
    dialog.showModal();
  } catch (e) {
    console.error("Error al cargar desde Firebase: ", e);
    alert("Error al cargar desde Firebase.");
  }
}
function formEventlisteners(form,dialog) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const selectedBackupId = form.querySelector('input[name="backup"]:checked').value;
    const docRef = doc(db, "backups", selectedBackupId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const { data } = docSnap.data();
        const importData = JSON.parse(data);
        const results = await importIndexedDBs(importData);
        displayResults(results);
    } else {
        alert("No se pudo cargar la copia de seguridad seleccionada.");
    }
    if (dialog) {
      dialog.close();
    }
});
}
// Función para renderizar en múltiples contenedores
async function renderImportDivs() {
  try {
    const backups = await loadFromFirebase();
    if (backups.length === 0) {
      alert("No se encontraron copias de seguridad en Firebase.");
      return;
    }

    // Selecciona todos los contenedores
    const allBackupContainers = document.querySelectorAll('#importResults');

    allBackupContainers.forEach(container => {
      // Genera el HTML y lo añade a cada contenedor
      container.innerHTML = generateBackupHTML(backups);

      // Manejador del formulario para cada contenedor
      const form = container.querySelector('#loadForm');
      formEventlisteners(form);
    });
  } catch (e) {
    console.error("Error al cargar desde Firebase: ", e);
    alert("Error al cargar desde Firebase.");
  }
}
renderImportDivs();
document.getElementById('exportButton').addEventListener('click', showExportDialog);
document.getElementById('importButton').addEventListener('click', handleImport);
document.getElementById('loadFromFirebaseButton').addEventListener('click', handleDialogImport);

document.getElementById('importInput').addEventListener('change', function() {
    const importButton = document.getElementById('importButton');
    if (this.files.length > 0) {
        importButton.textContent = `Importar ${this.files[0].name}`;
        importButton.classList.add('file-selected');
    } else {
        importButton.textContent = 'Importar archivo seleccionado';
        importButton.classList.remove('file-selected');
    }
});

if (localStorage.getItem("urlToQR")) {
  document.getElementById("urlToQR").innerHTML = `<a href="${localStorage.getItem("urlToQR")}" target="_blank">${localStorage.getItem("urlToQR")}</a>alternative
  <a href="${window.location}" target="_blank" >${window.location}</a>`;
}
if (localStorage.getItem("qrCode")) {
  document.getElementById("qrCode").innerHTML = `<img src="${localStorage.getItem("qrCode")}" alt="QR Code">`;
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("Usuario autenticado:", user);

    // Obtener los datos del usuario de Firestore
    const userData = await getUserData(user.uid);
    console.log("Datos del usuario obtenidos:", userData);
    updateStatelogin(userData, user);
    // Aquí puedes realizar cualquier acción adicional, como mostrar los datos en la UI
  } else {
    console.log("Usuario no autenticado");
    // Redirigir a la página de inicio de sesión u otra acción
  }
});
async function getUserData(uid) {
  try {
    const userRef = doc(db, "users", uid); // Referencia al documento del usuario
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      // console.log("Datos del usuario obtenidos:", userDoc.data());
      return userDoc.data(); // Retorna los datos del usuario
    } else {
      console.log("No se encontró ningún documento para este usuario");
      return null;
    }
  } catch (error) {
    console.error("Error al obtener los datos del usuario:", error);
    return null;
  }
}

async function logoutUser() {
  try {
      await signOut(auth);
      console.log("Usuario desconectado");
  } catch (error) {
      console.error("Error al desconectar usuario:", error.message);
      throw error;
  }
}


const provider = new GoogleAuthProvider();
async function signInWithGoogle() {
  try {
      const result = await signInWithPopup(auth, provider);
      // This gives you a Google Access Token. You can use it to access the Google API.
      const credential = GoogleAuthProvider.credentialFromResult(result);
      console.log("Usuario autenticado con Google:", credential, result);
      updateStatelogin(result.user, result.user);
      await saveOrUpdateUserData(result.user);

      // IdP data available using getAdditionalUserInfo(result)
  } catch (error) {
      // const credential = GoogleAuthProvider.credentialFromError(error);
      console.error("Error al iniciar sesión con Google:", error);
  }
}
async function saveOrUpdateUserData(user, data, subcollectionName = null, subcollectionData = null) {
  try {
    const userRef = doc(db, "users", user.uid); // Referencia al documento del usuario
    const userDoc = await getDoc(userRef); // Obtener el documento del usuario

    if (userDoc.exists()) {
      // Si el usuario ya está registrado, simplemente obtener los datos
      console.log("Usuario ya registrado, obteniendo sus datos:", userDoc.data());

      // Actualizar datos del usuario si es necesario
      await setDoc(userRef, {
        lastLogin: new Date(),
        ...data
      }, { merge: true }); // Con merge: true, actualizas solo los campos que especifiques sin sobrescribir todo

      // Si se proporciona una subcolección y datos, se guarda
      if (subcollectionName && subcollectionData) {
        const subcollectionRef = collection(userRef, subcollectionName); // Referencia a la subcolección
        await addDoc(subcollectionRef, subcollectionData); // Agregar los datos a la subcolección
        console.log(`Datos añadidos a la subcolección '${subcollectionName}':`, subcollectionData);
      }

    } else {
      // Si el usuario no está registrado, guardar sus datos básicos
      await setDoc(userRef, {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        createdAt: new Date(),
        lastLogin: new Date(),
        ...data // Datos adicionales
      });
      console.log("Datos del usuario guardados en Firestore");
    }
    if (subcollectionName && subcollectionData) {
      const subcollectionRef = collection(userRef, subcollectionName); // Referencia a la subcolección
      await addDoc(subcollectionRef, subcollectionData); // Agregar los datos a la subcolección
      console.log(`Datos añadidos a la subcolección '${subcollectionName}':`, subcollectionData);
    }
  } catch (error) {
    console.error("Error al guardar o actualizar los datos del usuario:", error);
  }
}

document.getElementById('googleSignInButton').addEventListener('click', async () => {
  try {
      await signInWithGoogle();
      alert('Inicio de sesión con Google exitoso');
  } catch (error) {
      alert('Error al iniciar sesión con Google: ' + error.message);
  }
});
document.getElementById('logoutButton').addEventListener('click', async () => {
  try {
      await signOut(auth);
      updateStatelogin();
      alert('Sesión cerrada exitosamente');
  } catch (error) {
      alert('Error al cerrar sesión: ' + error.message);
  }
});
// Función para obtener todos los nombres de las bases de datos IndexedDB
async function getAllDatabaseNames() {
  try {
      // Verificar si el navegador soporta indexedDB.databases()
      if (indexedDB.databases) {
          const databases = await indexedDB.databases();
          console.log('Nombres de las bases de datos IndexedDB:', databases);
          return databases;
      } else {
          return [];
      }
  } catch (error) {
      console.error('Error al obtener los nombres de las bases de datos:', error);
      return [];
  }
}

// Función para verificar si un nombre de base de datos existe
async function existDatabase(databaseName) {
  const arrayDatabaseNames = await getAllDatabaseNames();
  console.log("arrayDatabaseNames", arrayDatabaseNames);

  // Verificar si el nombre de la base de datos existe
  const exists = arrayDatabaseNames.some(db => db.name.includes(databaseName));
  console.log(`La base de datos "${databaseName}" ${exists ? 'existe' : 'no existe'}.`);
  return exists;
}

// Función para abrir una base de datos específica y obtener los datos de un object store
async function getDataFromDatabase(databaseName, objectStoreName) {
  return new Promise((resolve, reject) => {
    // Abrir una conexión a la base de datos
    const request = indexedDB.open(databaseName);

    // Manejar errores al abrir la base de datos
    request.onerror = function(event) {
      console.error("Error al abrir la base de datos:", event.target.errorCode);
      reject(event.target.errorCode);
    };

    // Cuando la base de datos se abre exitosamente
    request.onsuccess = function(event) {
      const db = event.target.result; // Referencia a la base de datos

      // Crear una transacción de solo lectura en el object store
      const transaction = db.transaction(objectStoreName, "readonly");
      const objectStore = transaction.objectStore(objectStoreName); // Acceder al object store

      // Obtener todos los registros del object store
      const getAllRequest = objectStore.getAll();

      // Cuando los datos se obtienen exitosamente
      getAllRequest.onsuccess = function(event) {
        console.log(`Datos obtenidos del object store "${objectStoreName}":`, event.target.result);
        resolve(event.target.result); // Retornar los datos obtenidos
      };

      // Manejar errores al obtener los datos
      getAllRequest.onerror = function(event) {
        console.error("Error al obtener los datos del object store:", event.target.errorCode);
        reject(event.target.errorCode);
      };
    };
  });
}

async function getUserDatafromIndexdb() {
  const databaseName = "firebaseLocalStorageDb"; // Nombre de la base de datos
  const objectStoreName = "firebaseLocalStorage"; // Nombre del object store (debes cambiar esto al nombre correcto)

  try {
    const data = await getDataFromDatabase(databaseName, objectStoreName);
    if (data[0]) {
      return data[0].value;
    } else {
      toggleClassesMultiple("#userAvatar1", "hidden");
      toggleClassesMultiple("#userName1", "hidden");
      toggleClassesMultiple("#userEmail1", "hidden");
      return null;
    }
  } catch (error) {
    console.error("Error al obtener datos de la base de datos:", error);
  }
}
async function updateStatelogin(useriddata, useridvalue) {
  try {
    if (useriddata) {
      textReplacer.replaceText("#userName1", useriddata.name, "gold");
      textReplacer.replaceText("#userEmail1", useriddata.email, "cyan");
      setTimeout(() => {
        imageManipulator.manipulateImage("#userAvatar1", useriddata.photoURL, "src");
      }, 1000);
      console.log("useriddata", useriddata, useridvalue);
    }
    if (useridvalue) {
      document.getElementById("logoutButton").style.display = "block";
      document.getElementById("googleSignInButton").style.display = "none";
      document.getElementById("button-container").style.display = "block";
    } else {
      document.getElementById("logoutButton").style.display = "none";
      document.getElementById("googleSignInButton").style.display = "block";
      document.getElementById("button-container").style.display = "none";
    }
  } catch (error) {
    console.error("Error al obtener datos de la base de datos:", error);
  }
}

(async () => {
  const useridvalue = await getUserDatafromIndexdb();
  if (!useridvalue) {
    updateStatelogin(null, null);
    return;
  };
  const uid = useridvalue.uid;
  const useriddata = await getUserData(uid);
  updateStatelogin(useriddata, useridvalue);
  // saveOrUpdateUserData(useridvalue,{points: 1},'points',{points: 1});
  // saveOrUpdateUserData(useridvalue,{localStorage: getAllLocalStorageData()},'localStorageBackup',{localStorage: getAllLocalStorageData()});
})();
// Función para obtener todos los datos de localStorage y devolverlos como un objeto
function getAllLocalStorageData() {
  const localStorageData = {};

  // Iterar a través de todas las claves en localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    const value = localStorage.getItem(key);

    // Guardar la clave y valor en el objeto
    localStorageData[key] = value;
  }

  console.log('Datos de localStorage:', localStorageData);
  return localStorageData;
}
// Función para aplicar los datos de localStorage a los elementos del DOM
function applyLocalStorageData(localStorageData) {
  Object.keys(localStorageData).forEach((key) => {
    const element = document.querySelector(`[data-localstorage-key="${key}"]`);

    if (element) {
      element.textContent = localStorageData[key]; // Aplicar valor al contenido de texto del elemento
      console.log(`Se aplicó el valor "${localStorageData[key]}" al elemento con el key "${key}".`);
    }
  });
}
// const localStorageData = getAllLocalStorageData();
// applyLocalStorageData(localStorageData);
document.getElementById('ImportSettingsButton').addEventListener('click', async () => {
    const userData = await getUserDatafromIndexdb();
    if (userData) {
      console.log("userData", userData);
      const Settingsdata = await getUserData(userData.uid);
      if (Settingsdata) {
        applyLocalStorageData(Settingsdata.localStorage);
      }
    }
});
document.getElementById('SaveSettingsButton').addEventListener('click', async () => {
  const useridvalue = await getUserDatafromIndexdb();
  if (useridvalue) {
    console.log("useridvalue", useridvalue);
    if (useridvalue) {
      saveOrUpdateUserData(useridvalue,{localStorage: JSON.stringify(getAllLocalStorageData())});
    }
  }
});
