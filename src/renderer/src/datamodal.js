import  { IndexedDBManager, databases, DBObserver } from "./utils/indexedDB";
import { postToFileHandler } from "./utils/getdata";
import { ButtonGrid } from "./components/gridelements";
import FormModal from "./components/FormModal";
import { socketManager } from "../tiktoksocketdata";
import datajson from '../json/keyboard.json';
const gridbuttonscontent = new ButtonGrid('buttonContainer', 100, 50, 5, 5, onDeleteButton, callbackonedit);
const observer = new DBObserver();
const streamcontrolsDBManager = new IndexedDBManager(databases.streamcontrols,observer);
const filescontent = await postToFileHandler("get-files-in-folder", {});

const openModalBtn = document.querySelector('#openModalBtn');
const options = Object.entries(datajson).map(([value, label]) => ({
  value,
  label,
}));
const appOptions = filescontent.map((app) => ({
  value: app.path,
  label: app.name,
}));
const formConfig = [
  { type: 'input', name: 'id', label: 'ID', inputType: 'Number', returnType: 'Number', hidden: true },  // Campo oculto
  { type: 'input', name: 'nombre', label: 'Nombre', inputType: 'text', returnType: 'string' },
  { type: 'colorPicker', name: 'color', label: 'Color', inputType: 'color', returnType: 'string' },
  { type: 'select', name: 'actionType', label: 'Tipo de Acción', options: [{ value: 'keyPress', label: 'Presionar Tecla' }, { value: 'openApp', label: 'Abrir Aplicación' }], returnType: 'string' },
  { type: 'multiSelect', name: 'keyvalue', label: 'Keyvalue', options: options, returnType: 'array', hidden: true },
  { type: 'select', name: 'application', label: 'Application', options: appOptions, returnType: 'string' },
  // { type: 'select', name: 'overlaytype', label: 'Overlay Type', options: [{ value: 'audio', label: 'Audio' }, { value: 'video', label: 'Video' }, { value: 'image', label: 'Image' }], returnType: 'string' },

];
const formModal = new FormModal('#modal', '#dynamicForm1', 'submitFormBtn','openModalBtn');
openModalBtn.addEventListener('click', () => {
  const existingData = {
    nombre: 'Accion',
    actionType: 'keyPress',
    application: 'app1',
    keyvalue: ["F1", "F2"]  // Valores a seleccionar en el multiSelect
  };

  formModal.open(formConfig, (formData) => {
    if (formData.id) {
      streamcontrolsDBManager.updateData(formData);
    } else {
      streamcontrolsDBManager.saveData(formData);
    }
  }, existingData, false);
});

class ButtonManager {
  constructor(dbManager, gridbuttonscontent) {
      this.dbManager = dbManager;
      this.gridbuttonscontent = gridbuttonscontent;
  }

  async deleteButton(id) {
      console.log('Custom delete callback', id);
      const splitid = id.split('-');
      const giftId = splitid[1];
      console.log('giftId', giftId);
      try {
          await this.dbManager.deleteData(giftId);
          await this.updateButtons();
      } catch (error) {
          console.error('Error al borrar el dato de la base de datos:', error);
      }
  }

  async updateButtons() {
      try {
          const allData = await this.dbManager.getAllData();
          const parsedData = this.createButtons(allData);
          this.gridbuttonscontent.updateButtons(parsedData);
          console.log("updateButtons", parsedData);
      } catch (error) {
          console.error('Error al obtener los datos de la base de datos:', error);
      }
  }

  async addButtons() {
      try {
          const allData = await this.dbManager.getAllData();
          const parsedData = this.createButtons(allData);
          this.gridbuttonscontent.addButtons(parsedData);
          return allData;
      } catch (error) {
          console.error('Error al obtener los datos de la base de datos:', error);
      }
  }

  createButtons(data) {
      console.log('data', data);
      return data.map(item => ({
          id: `${item.id}`,
          text: item.nombre,
          value: item.id,
          data: item,
          callback: () => {
              sendtestevent(item);
          }
      }));
  }
}
function callbackonedit(data) {
  console.log("callbackonedit", data);
}
const buttonManager = new ButtonManager(streamcontrolsDBManager, gridbuttonscontent);
buttonManager.addButtons();
function sendtestevent(item) {
  console.log("item", item);
  if (item.actionType === "keyPress") {
    const keycontrolpress = Object.keys(item.keyvalue).map(key => item.keyvalue[key]);
    console.log("keycontrolpress", keycontrolpress);
    socketManager.emitMessage("presskey", keycontrolpress);
  } else if (item.actionType === "openApp") {
      console.log("openApp", item.application);
  } else {
    console.log("actionType", item.actionType);
  }

}

async function onDeleteButton(id) {
  await buttonManager.deleteButton(id);
}
document.querySelector('#toogleEditModeBtn').addEventListener('click', () => {
  gridbuttonscontent.toggleEditMode();
});
observer.subscribe(async (action, data) => {
  if (action === "save") {
    await buttonManager.updateButtons();
    console.log("observer.subscribe", data, action);
  } else if (action === "delete") {
    console.log("observer.subscribe", data, action);
  } else if (action === "update") {
    await buttonManager.updateButtons();
    console.log("observer.subscribe", data, action);
  }
});

// async function onUpdateButtons() {
//   await buttonManager.updateButtons();
// }
