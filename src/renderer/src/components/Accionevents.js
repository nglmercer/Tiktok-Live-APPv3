import FormModal from './FormModal'
import { getformdatabyid, postToFileHandler, getdatafromserver, getAllDataFromDB, getdataIndexdb } from '../utils/getdata';
// const filescontent = await postToFileHandler("get-files-in-folder", {});
const formModal = new FormModal('#modal1', '#dynamicForm2', 'submitFormBtn2','openModalBtn');
const files = await postToFileHandler("get-files-in-folder", {});
console.log("files", files);

function filemapType(fileType) {
  switch (fileType) {
    case 'image/jpeg':
    case 'image/png':
    case 'image/webp':
      return 'Imagen';
    case 'video/mp4':
      return 'Video';
    case 'audio/mpeg':
    case 'audio/mp3':
      return 'Audio';
    default:
      return 'unsuported';
  }
}

// Función para filtrar y retornar archivos según su tipo
function filterFilesByType(files) {
  const filteredFiles = {
    Imagen: [],
    Video: [],
    Audio: [],
    unsuported: []
  };

  files.forEach(file => {
    const fileTypeCategory = filemapType(file.type);
    if (filteredFiles[fileTypeCategory]) {
      filteredFiles[fileTypeCategory].push(file);
    } else {
      filteredFiles['unsuported'].push(file);
    }
  });

  return filteredFiles;
}

// Función para transformar archivos en opciones de select
function mapFilesToSelectOptions(filesCategory) {
  return filesCategory.map(file => ({
    label: file.name,
    value: file.path
  }));
}
const categorizedFiles = filterFilesByType(files);

const audioOptions = mapFilesToSelectOptions(categorizedFiles.Audio);
const imageOptions = mapFilesToSelectOptions(categorizedFiles.Imagen);
const videoOptions = mapFilesToSelectOptions(categorizedFiles.Video);
console.log("Archivos categorizados:", categorizedFiles.Audio);
const formConfig = [
  { type: 'input', name: 'id', label: 'ID', inputType: 'Number', returnType: 'Number', hidden: true },
  { type: 'input', name: 'nombre', label: 'Nombre', inputType: 'text', returnType: 'string' },
  {
    type: 'checkbox',
    name: 'profile_check',
    label: 'Mostrar Usuario',
    inputType: 'checkbox',
    children: [
      { type: 'input', name: 'profile_duration', label: 'Duracion', inputType: 'number', returnType: 'number' },
      { type: 'input', name: 'profile_text', label: 'Texto', inputType: 'text', returnType: 'string' },
    ],
    returnType: 'boolean',
  },
  {
    type: 'checkbox',
    name: 'audio_check',
    label: 'Mostrar Audio',
    inputType: 'checkbox',
    children: [
      { type: 'input', name: 'audio_duration', label: 'Duracion', inputType: 'number', returnType: 'number' },
      { type: 'slider', name: 'audio_volume', label: 'Volumen', inputType: 'range', returnType: 'number' },
      { type: 'select', name: 'audio_file', label: 'audio', options: audioOptions, returnType: 'string' },
    ],
    returnType: 'boolean',
  },
  {
    type: 'checkbox',
    name: 'imagen_check',
    label: 'Mostrar Imagen',
    inputType: 'checkbox',
    children: [
      { type: 'input', name: 'image_duration', label: 'Duracion', inputType: 'number', returnType: 'number' },
      { type: 'slider', name: 'image_volume', label: 'Volumen', inputType: 'range', returnType: 'number' },
      { type: 'select', name: 'image_file', label: 'imagen', options: imageOptions, returnType: 'string' },
    ],
    returnType: 'boolean',
  },
  {
    type: 'checkbox',
    name: 'video_check',
    label: 'Mostrar Video',
    inputType: 'checkbox',
    children: [
      { type: 'input', name: 'video_duration', label: 'Duracion', inputType: 'number', returnType: 'number' },
      { type: 'slider', name: 'video_volume', label: 'Volumen', inputType: 'range', returnType: 'number' },
      { type: 'select', name: 'video_file', label: 'video', options: videoOptions, returnType: 'string' },
    ],
    returnType: 'boolean',
  },
  // { type: 'checkbox', name: 'activetesteeeeeeeeeeeeeee', label: 'active', inputType: 'checkbox', returnType: 'boolean' },
  // { type: 'select', name: 'actionType', label: 'Tipo de Acción', options: [{ value: 'keyPress', label: 'Presionar Tecla' }, { value: 'openApp', label: 'Abrir Aplicación' }], returnType: 'string' },
  // { type: 'multiSelect', name: 'keyvalue', label: 'Keyvalue', options: options, returnType: 'array', hidden: true },
  // { type: 'select', name: 'application', label: 'Application', options: appOptions, returnType: 'string' },
];
const existingData = {
  nombre: 'Accion',
  actionType: 'keyPress',
  application: 'app1',
  keyvalue: ["F1", "F2"]  // Valores a seleccionar en el multiSelect
};

  const openModaltest = document.getElementById('openModaltest');
  console.log("formModal", formModal);
  // formModal.appendTo('#modal');
  openModaltest.addEventListener('click', () => {
    formModal.open(formConfig, (formData) => {
      console.log("formData", formData);
    }, existingData, false);
  });

