import FormModal from './FormModal'
import  { IndexedDBManager, databases, DBObserver } from '../utils/indexedDB'
import { getformdatabyid, postToFileHandler, getdatafromserver, getAllDataFromDB, getdataIndexdb } from '../utils/getdata';
import { socketManager } from '../../tiktoksocketdata';
import DynamicTable from './datatable';
// const filescontent = await postToFileHandler("get-files-in-folder", {});
const ObserverEvents = new DBObserver();
const AccionEventsDBManager = new IndexedDBManager(databases.eventsDB,ObserverEvents);
const formModal = new FormModal('#modal1', '#dynamicForm2', 'submitFormBtn2','openModalBtn');
const files = await postToFileHandler("get-files-in-folder", {});
async function getdatabyid(id) {
  return await postToFileHandler("get-file-by-id", {id});
}
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
    value: file
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
  { type: 'radio', name: 'Evento', label: 'Seleccione el Evento', options:
  [{ value: 'chat', label: 'Evento de Chat' }, { value: 'follow', label: 'Evento de Seguimiento' },{ value: 'likes', label: 'Evento de likes'},
   {value: 'share', label: 'compartir'}, { value: 'subscribe', label: 'Evento de suscripcion' }, { value: 'gift', label: 'Evento de Gift' }], returnType: 'string' },
  {
    type: 'checkbox',
    name: 'profile_check',
    label: 'Mostrar Usuario',
    inputType: 'checkbox',
    children: [
      { type: 'input', name: 'profile_duration', label: 'Duracion', inputType: 'number', returnType: 'number' },
      { type: 'input', name: 'profile_text', label: 'Texto', inputType: 'text', returnType: 'object' },
    ],
    returnType: 'boolean',
  },
  {
    type: 'checkbox',
    name: 'mediaAudio_check',
    label: 'Mostrar Audio',
    inputType: 'checkbox',
    children: [
      { type: 'input', name: 'mediaAudio_duration', label: 'Duracion', inputType: 'number', returnType: 'number' },
      { type: 'slider', name: 'mediaAudio_volume', label: 'Volumen', inputType: 'range', returnType: 'number' },
      { type: 'select', name: 'mediaAudio_file', label: 'audio', options: audioOptions, returnType: 'object' },
    ],
    returnType: 'boolean',
  },
  {
    type: 'checkbox',
    name: 'mediaImg_check',
    label: 'Mostrar Imagen',
    inputType: 'checkbox',
    children: [
      { type: 'input', name: 'mediaImg_duration', label: 'Duracion', inputType: 'number', returnType: 'number' },
      { type: 'slider', name: 'mediaImg_volume', label: 'Volumen', inputType: 'range', returnType: 'number' },
      { type: 'select', name: 'mediaImg_file', label: 'imagen', options: imageOptions, returnType: 'object' },
    ],
    returnType: 'boolean',
  },
  {
    type: 'checkbox',
    name: 'mediaVideo_check',
    label: 'Mostrar Video',
    inputType: 'checkbox',
    children: [
      { type: 'input', name: 'mediaVideo_duration', label: 'Duracion', inputType: 'number', returnType: 'number' },
      { type: 'slider', name: 'mediaVideo_volume', label: 'Volumen', inputType: 'range', returnType: 'number' },
      { type: 'select', name: 'mediaVideo_file', label: 'video', options: videoOptions, returnType: 'object' },
    ],
    returnType: 'boolean',
  },
  // { type: 'checkbox', name: 'activetesteeeeeeeeeeeeeee', label: 'active', inputType: 'checkbox', returnType: 'boolean' },
  // { type: 'select', name: 'actionType', label: 'Tipo de Acción', options: [{ value: 'keyPress', label: 'Presionar Tecla' }, { value: 'openApp', label: 'Abrir Aplicación' }], returnType: 'string' },
  // { type: 'multiSelect', name: 'keyvalue', label: 'Keyvalue', options: options, returnType: 'array', hidden: true },
  // { type: 'select', name: 'application', label: 'Application', options: appOptions, returnType: 'string' },
];
  const openModaltest = document.getElementById('openModaltest');
  console.log("formModal", formModal);
  // formModal.appendTo('#modal');
  const alldata = await AccionEventsDBManager.getAllData();
  console.log("alldata", alldata);
function evaldata(finalCallback, dataeval, configevaldata, eventType) {
  const matchedValues = new Map();

  function findAndEvaluate(keyPath, keytype, verifykey, obj) {
      const keys = keyPath.split('.');
      let currentValue = obj;

      for (const key of keys) {
          if (typeof currentValue === 'object' && currentValue !== null && key in currentValue) {
              currentValue = currentValue[key];
          } else {
              currentValue = undefined;
              break;
          }
      }

      if (currentValue !== undefined && (keytype === 'any' || keytype === typeof currentValue)) {
          if (verifykey) {
              if (typeof currentValue === 'object' && currentValue[verifykey.key] !== undefined) {
                  if (verifykey.type === 'number' && typeof currentValue[verifykey.key] === 'number') {
                      if (currentValue[verifykey.key] >= verifykey.value) {
                          matchedValues.set(keyPath, currentValue);
                      } else {
                          matchedValues.set(keyPath, null);
                      }
                  } else if (currentValue[verifykey.key] === verifykey.value) {
                      matchedValues.set(keyPath, currentValue);
                  } else {
                      matchedValues.set(keyPath, null);
                  }
              } else {
                  matchedValues.set(keyPath, null);
              }
          } else {
              matchedValues.set(keyPath, currentValue);
          }
      } else {
          matchedValues.set(keyPath, null);
      }
  }

  for (const [index, item] of configevaldata.entries()) {
      findAndEvaluate(item.keyname, item.keytype, item.verifykey, dataeval);

      const matchedValue = matchedValues.get(item.keyname);

      if (item.isBlocking && (matchedValue === null || matchedValue !== item.keyfind)) {
          // Si es el primer item y es bloqueante, verifica si coincide el valor con el esperado
          if (index === 0 && matchedValue !== eventType) {
              finalCallback(false);
              return;
          }
          if (matchedValue === null || matchedValue !== item.keyfind) {
              finalCallback(false);
              return;
          }
      }

      if (matchedValue !== null && item.callback) {
          item.callback(matchedValue);
      }
  }

  finalCallback(true);
}

// Ejemplo de uso
async function datatestevaldata(eventType = "chat") {
  const configevaldata = [
      { keytype: 'string', keyfind: eventType, keyname: "Evento", verifykey: null, callback: (data) => console.log("String:", data), isBlocking: true },
      { keytype: 'any', keyfind: null, keyname: "accionevento", verifykey: { key: "check", value: true }, callback: (data) => console.log("Check:", data), isBlocking: false },
      { keytype: 'number', keyfind: 5, keyname: "id", verifykey: null, callback: (data) => console.log("Number:", data) },
      { keytype: 'any', keyfind: null, keyname: "accionevento", verifykey: { key: "number", value: 5, type: 'number' }, callback: (data) => console.log("Likes:", data) },
      { keytype: 'any', keyfind: null, keyname: "type-video", verifykey: { key: "check", value: true }, callback: (data) => console.log("type-video:", data) },
  ];
  alldata.forEach((data) => {
    evaldata((success) => {
      if (success) {
          console.log("Todos los callbacks han sido ejecutados");
      } else {
          console.log("El proceso fue interrumpido debido a una condición bloqueante.");
      }
  }, data, configevaldata, eventType);
});
}

datatestevaldata();



setInterval(async () => {
  datatestevaldata("follow");
}, 1000);

openModaltest.addEventListener('click', () => {
  formModal.open(formConfig, (formData) => {
    console.log("formData", formData);
    if (formData.id) {
      AccionEventsDBManager.updateData(formData);
    } else {
      AccionEventsDBManager.saveData(formData);
    }

  }, {}, false);
});

// Ejemplo de uso
const exampleItem  = {
  mediaImg_volume: 50,
  mediaVideo_check: true,
  mediaVideo_duration: 5,
  mediaVideo_file: 'ejemplo',
  mediaVideo_volume: 50,
  nombre: 'test',
  profile_check: true,
  profile_duration: 222222,
  profile_text: '{uniqueid} para usuario',
};

const processFile = async (fileId, customOptions) => {
  const file = await getdatabyid(fileId);
  if (file) {
    console.log("file", file);
    const options = { check: true, select: '11', rango: '50', duracion: '15' };
    const datafile = {
      eventType: 'play',
      data: { src: file.path, fileType: file.type, options },
    };
    // getdatafromserver(`${socketurl.getport()}/overlay`, datafile);
    socketManager.emitMessage("overlaydata", datafile);
  }
};

const callback = async (index, data) => {
  console.log("callback", index, data);

  // await processFile(data.mediaVideo.file);
  // await processFile(data.mediaImg.file);
};


const config = {
  order: ['nombre','Evento','mediaAudio','mediaImg', 'mediaVideo','profile'],
  nombre: {
    type: 'string',
    returnType: 'string',
  }, // Especifica el orden de las columnas
  Evento: {
    type: 'string',
    returnType: 'string',
  },
  mediaAudio: {
    type: 'object',
    volume: {
      type: 'slider',
      min: 0,
      max: 100,
      returnType: 'number',
    },
    duration: {
      type: 'number',
      returnType: 'number',
    },
    file: {
      type: 'number',
      returnType: 'number',
    },
    check: {
      type: 'checkbox',
      returnType: 'boolean',
    }
  },
  mediaVideo: {
    type: 'object',
    volume: {
      type: 'slider',
      min: 0,
      max: 100,
      returnType: 'number',
    },
    duration: {
      type: 'number',
      returnType: 'number',
    },
    file: {
      type: 'number',
      returnType: 'number',
    },
    check: {
      type: 'checkbox',
      returnType: 'boolean',
    }
  },
  mediaImg: {
    type: 'object',
    volume: {
      type: 'slider',
      min: 0,
      max: 100,
      returnType: 'number',
    },
    duration: {
      type: 'number',
      returnType: 'number',
    },
    file: {
      type: 'number',
      returnType: 'number',
    },
    check: {
      type: 'checkbox',
      returnType: 'boolean',
    }
  },
  id: {
    type: 'number',
    returnType: 'number',
    hidden: true,
  }
};
const table = new DynamicTable('#table-container', callback, config);
alldata.forEach((data) => {
    console.log("alldata", data);
  table.addRow(data);
});
console.log("table", table);
document.addEventListener('DOMContentLoaded', () => {
  // Ocultar la columna 'mediaVideo_file'
  table.hideColumn('id');
});
