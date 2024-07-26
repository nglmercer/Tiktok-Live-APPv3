import { obtenerDatos, resetForm, filesform } from '../functions/dataHandler.js';
import createErrorComponent from '../htmlcomponents/errorComponent.js';
// import { saveDataToIndexedDB, updateDataInIndexedDB, databases } from '../functions/indexedDB.js';
import Modal from '../htmlcomponents/Modal.js';

async function createModalElement() {
//   const modal = document.createElement('div');
//   modal.className = 'modalElement';
//   modal.id = `ModalElement${Math.floor(Math.random() * 1000)}`;
//   modal.innerHTML = await (await fetch('./tab5-action/tab5-action.html')).text();
//   return modal;
}

function validateForm(form, modal) {
  const nombre = form.elements.namedItem('accionevento_nombre');
  if (!nombre || !nombre.value.trim()) {
    const errorMessage = createErrorComponent('El nombre es obligatorio.');
    errorMessage.style.display = 'block';
    errorMessage.style.position = 'fixed';
    errorMessage.style.top = '1%';
    errorMessage.style.right = '1%';
    modal.appendChild(errorMessage);

    setTimeout(() => {
      errorMessage.remove();
    }, 3000);

    return false;
  }
  return true;
}

function setupFormActions(elementModal, form, databases, onCancel) {
//   const saveData = async (nameFilter) => {
//     try {
//       if (nameFilter.id) {
//         await updateDataInIndexedDB(databases.MyDatabaseActionevent, nameFilter);
//       } else {
//         await saveDataToIndexedDB(databases.MyDatabaseActionevent, nameFilter);
//       }
//     } catch (error) {
//       console.error('Error saving data to IndexedDB:', error);
//     }
//   };

//   elementModal.querySelector('.modalActionAdd').addEventListener('click', async () => {
//     if (!validateForm(form, elementModal)) return;
//     const nameFilter = obtenerDatos(form, '_', {});
//     await saveData(nameFilter);
//     elementModal.style.display = 'none';
//   });

//   elementModal.querySelector('.modalActionClose').addEventListener('click', () => {
//     elementModal.style.display = 'none';
//     onCancel();
//   });

//   elementModal.querySelector('.modalActionSave').addEventListener('click', async () => {
//     if (!validateForm(form, elementModal)) return;
//     const nameFilter = obtenerDatos(form, '_', {});
//     await saveData(nameFilter);
//     elementModal.style.display = 'none';
//   });
}

// document.addEventListener('DOMContentLoaded', async () => {
//   const modalElement = await createModalElement();

//   const setupCallback = (modal) => {
//     const form = modal.querySelector('.tab5-action');
//     form.addEventListener('submit', (event) => event.preventDefault());
//     setupFormActions(modal, form, databases, () => {
//       console.log('Modal closed');
//     });
//   };

//   new Modal('abrirModal', modalElement.innerHTML, setupCallback);
// });
export {createModalElement, setupFormActions};