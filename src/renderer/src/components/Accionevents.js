import FormModal from './FormModal'
import DynamicTable from './datatable';
import { getfileId } from './Fileshtml'
import  { IndexedDBManager, databases, DBObserver } from '../utils/indexedDB'
import { getformdatabyid, postToFileHandler, getdatafromserver, getAllDataFromDB, getdataIndexdb } from '../utils/getdata';
import { replaceVariables } from '../utils/replaceVariables';
import { socketManager } from '../../tiktoksocketdata';
import { giftManager, getdatagiftparsed } from '../utils/Giftdata';
// const filescontent = await postToFileHandler("get-files-in-folder", {});
const ObserverEvents = new DBObserver();
const AccionEventsDBManager = new IndexedDBManager(databases.eventsDB,ObserverEvents);
const formModal = new FormModal('#modal1', '#dynamicForm2', 'submitFormBtn2','openModalBtn');
const files = await postToFileHandler("get-files-in-folder", {});
async function getdatabyid(id) {
  return await postToFileHandler("get-file-by-id", {id});
}
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
function mapFilesToSelectOptions(filesCategory) {
  return filesCategory.map(file => ({
    label: file.name,
    value: file
  }));
}
function getmapselectgift(state) {
  const gift = getdatagiftparsed(state);
  console.log("gift", gift);
  if (!gift || gift.length === 0) {
    return gift
  }
  const mapselectgift = gift.map(gift => ({
    label: gift.name,
    value: gift.giftId
  }));
  return mapselectgift;
}
console.log("getmapselectgift", getmapselectgift());
const categorizedFiles = filterFilesByType(files);
const audioOptions = mapFilesToSelectOptions(categorizedFiles.Audio);
const imageOptions = mapFilesToSelectOptions(categorizedFiles.Imagen);
const videoOptions = mapFilesToSelectOptions(categorizedFiles.Video);
console.log("Archivos categorizados: audioOptions , imageOptions, videoOptions", audioOptions , imageOptions, videoOptions);
console.log("Archivos categorizados:", categorizedFiles.Audio);
const formConfig = [
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
  },//profile_check
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
  },//mediaAudio_check
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
  },//mediaImg_check
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
    // hidden:false, dataAssociated: 'chat'
  },//mediaVideo_check
  { type: 'radio', name: 'Evento_eventType', label: 'Seleccione el Evento', options:
  [{ value: 'chat', label: 'Chat' }, { value: 'follow', label: 'Seguimiento' },
  { value: 'likes', label: 'likes'},{value: 'share', label: 'compartir'},
  { value: 'subscribe', label: 'suscripcion' }, { value: 'gift', label: 'Gift' }],
  returnType: 'string', hidden: false
},
{ type: 'input', name: 'Evento_chat', label: 'Chat', inputType: 'text', returnType: 'string', hidden:false,valuedata:'default', dataAssociated: 'chat'},////    //////
{ type: 'input', name: 'Evento_likes', label: 'likes', inputType: 'number', returnType: 'number', hidden:false,valuedata: 15, dataAssociated: 'likes'},   //////
{ type: 'select', name: 'Evento_gift', label: 'gift', options: getmapselectgift(), returnType: 'number', hidden:false, dataAssociated: 'gift'},///   //////
{ type: 'input', name: 'Evento_share', label: 'share', inputType: 'text', returnType: 'number', hidden:false,valuedata:'default', dataAssociated: 'share'},// //////
{ type: 'input', name: 'Evento_follow', label: 'follow', inputType: 'text', returnType: 'number', hidden:false,valuedata:'default', dataAssociated: 'follow'},//////
{ type: 'input', name: 'Evento_suscripcion', label: 'suscripcion', inputType: 'text', returnType: 'number', hidden:true,valuedata:'default', dataAssociated: 'suscripcion'},//////
{ type: 'input', name: 'id', label: 'ID', inputType: 'Number', returnType: 'Number', hidden: true },
{ type: 'input', name: 'nombre', label: 'Nombre', inputType: 'text', returnType: 'string' },
  // { type: 'checkbox', name: 'activetesteeeeeeeeeeeeeee', label: 'active', inputType: 'checkbox', returnType: 'boolean' },
  // { type: 'multiSelect', name: 'keyvalue', label: 'Keyvalue', options: options, returnType: 'array', hidden: true },
  // { type: 'select', name: 'application', label: 'Application', options: appOptions, returnType: 'string' },
];
  const openModaltest = document.getElementById('openModaltest');
  console.log("formModal", formModal);
  // formModal.appendTo('#modal');
  const alldata = await AccionEventsDBManager.getAllData();
  async function getalldatafromAccionEventsDBManager() {
    return await AccionEventsDBManager.getAllData();
  }
  console.log("alldata", alldata);
  class DataEvaluator {
    constructor(configevaldata, eventType) {
        this.configevaldata = configevaldata;
        this.eventType = eventType;
        this.matchedValues = new Map();
    }

    findAndEvaluate(keyPath, keytype, verifykeys, obj) {
        const keys = keyPath.split('.');
        let currentValue = obj;

        // Navegar por el objeto usando keyPath
        for (const key of keys) {
            if (typeof currentValue === 'object' && currentValue !== null && key in currentValue) {
                currentValue = currentValue[key];
            } else {
                currentValue = undefined;
                break;
            }
        }

        // Evaluar según el keytype
        if (keytype === 'any' || (keytype === 'object' && typeof currentValue === 'object')) {
            this.verifyAndSetValue(keyPath, currentValue, verifykeys);
        } else if (currentValue !== undefined && keytype === typeof currentValue) {
            this.verifyAndSetValue(keyPath, currentValue, verifykeys);
        } else {
            this.matchedValues.set(keyPath, null);
        }
    }

    verifyAndSetValue(keyPath, currentValue, verifykeys) {
        if (!Array.isArray(verifykeys)) {
            verifykeys = [verifykeys];
        }

        // Verificar todas las claves en el array verifykeys
        const allMatched = verifykeys.every(verifykey => {
            if (typeof currentValue === 'object' && currentValue[verifykey.key] !== undefined) {
                const valueToCheck = currentValue[verifykey.key];
                return this.isValid(valueToCheck, verifykey);
            } else {
                return false;
            }
        });

        if (allMatched) {
            this.matchedValues.set(keyPath, currentValue);
        } else {
            this.matchedValues.set(keyPath, null);
        }
    }

    isValid(valueToCheck, verifykey) {
        switch (verifykey.type) {
            case 'number':
                return this.compareNumbers(valueToCheck, verifykey.value, verifykey.compare);
            case 'string':
                return this.compareStrings(valueToCheck, verifykey.value, verifykey.compare);
            case 'boolean':
                return valueToCheck === verifykey.value;
            default:
                return false;
        }
    }

    compareNumbers(actualValue, expectedValue, compare = '===') {
        switch (compare) {
            case '===':
                return expectedValue === actualValue;
            case '>=':
                return expectedValue >= actualValue;
            case '<=':
                return expectedValue <= actualValue;
            default:
                return false;
        }
    }

    compareStrings(actualValue, expectedValue, compare = '===') {
        switch (compare) {
            case '===':
                return expectedValue === actualValue;
            case 'contains':
                return expectedValue.includes(actualValue);
            case 'startsWith':
                return expectedValue.startsWith(actualValue);
            case 'endsWith':
                return expectedValue.endsWith(actualValue);
            default:
                return false;
        }
    }

    evaluate(dataeval, finalCallback) {
      let isValid = true;

      for (let index = 0; index < this.configevaldata.length; index++) {
          const item = this.configevaldata[index];

          this.findAndEvaluate(item.keyname, item.keytype, item.verifykey, dataeval);
          const matchedValue = this.matchedValues.get(item.keyname);
          if (Array.isArray(item.verifykey)) {
            const forceTrueKey = item.verifykey.find(key => key.forceTrue === true);
              if (forceTrueKey) {
                    if (dataeval,item.keyname){
                      const defaultvalue = this.finddefaultMatch(item.keyname, dataeval);
                      console.log("defaultvalue",defaultvalue,"dataeval",dataeval,"matchedValue",matchedValue);
                      if (dataeval.Evento.chat) {
                        console.log("Eventype",defaultvalue[this.eventType]);
                        if(defaultvalue[this.eventType]==="default"){
                          if (item.callback) {
                              item.callback(dataeval);
                          continue;
                        }

                        }
                      }
                    }
              }
          }

          if (item.isBlocking && (matchedValue === null || !this.allKeysMatched(matchedValue, item.verifykey))) {
              isValid = false;
              finalCallback(false, index);
              break;
          }

          if (matchedValue !== null && item.callback) {
              item.callback(dataeval);
          }
      }

      if (isValid) {
          finalCallback(true);
      }
  }

    allKeysMatched(currentValue, verifykeys) {
        if (!Array.isArray(verifykeys)) {
            verifykeys = [verifykeys];
        }

        return verifykeys.every(verifykey => {
            if (typeof currentValue === 'object' && currentValue !== null && verifykey.key in currentValue) {
                const valueToCheck = currentValue[verifykey.key];
                const matchresult = this.isValid(valueToCheck, verifykey);
                console.log("allKeysMatched", matchresult, verifykey,   );
                return matchresult;
            }
            return false;
        });
    }
    finddefaultMatch(currentValue, verifykeys) {
      if (!Array.isArray(verifykeys)) {
          verifykeys = [verifykeys];
      }
      let finddata = false;

      for (const verifykey of verifykeys) {
          if (currentValue && verifykey) {
              // Comprobar si el currentValue tiene la clave de evento deseada
              if (verifykey[currentValue]) {
                  finddata = verifykey[currentValue];
                  break;  // Si encuentras la coincidencia, puedes salir del loop
              }
          }
      }

      return finddata;
  }

}


async function sendMediaManager(data,userdata = {}) {
  // console.log("sendMediaManager options", data,userdata);

  const mediaTypes = ['mediaAudio', 'mediaImg', 'mediaVideo'];

  for (const mediaType of mediaTypes) {
    if (data[mediaType]) {
      const options = {
        check: data[mediaType].check ?? true, // Valor predeterminado si no existe
        select: data[mediaType].file,
        rango: data[mediaType].volume ?? 50, // Solo si 'volume' existe
        duracion: (data[mediaType]?.duration ?? 0) < 1 ? 1 : data[mediaType].duration,
      };
      // console.log("datafile options",mediaType,mediaTypes, options.check);
      if (options.check) {
        const file = await getfileId(options.select);
        const datafile = {
          eventType: 'play',
          data: { src: file.path, fileType: file.type, options },
        };
        socketManager.emitMessage("overlaydata", datafile);
      }
    }
  }
  if (data.profile && data.profile.check) {
      const textprofile = replaceVariables(data.profile.text, userdata);
      // console.log("textprofile",textprofile);
      const profileoptions = {
        check: data.profile.check ?? true, // Valor predeterminado si no existe
        select: data.profile.file,
        rango: data.profile.volume ?? 50, // Solo si 'volume' existe
        duracion: (data.profile?.duration ?? 0) < 1 ? 1 : data.profile.duration,
        texto: textprofile,
      };
      const datafileprofile = {
        eventType: 'play',
        data: { src: userdata.profilePictureUrl, fileType: "image/jpeg", options: profileoptions },
        options: profileoptions,
      }
      socketManager.emitMessage("overlaydata", datafileprofile);
  }
}

// Ejemplo de uso
async function AccionEventoOverlayEval(eventType = "chat", indexdbdata, userdata = {}) {
  let customoptions = [];
  switch (eventType) {
    case "chat":
      customoptions = [{key: "eventType", value: eventType, type:"string"}, {key: "chat", value: userdata.comment, type:"string", compare: "startsWith", forceTrue: true}]
      break;
    case "gift":
      customoptions = [{key: "eventType", value: eventType, type:"string"}, {key: "gift", value: userdata.giftId, type:"number", compare: "==="}]
      break;
    case "follow":
      customoptions = [{key: "eventType", value: eventType, type:"string"}]
      break;
    case "share":
      customoptions = [{key: "eventType", value: eventType, type:"string"}]
      break;
    case "like":
      customoptions = [{key: "eventType", value: eventType, type:"string"}, {key: "likeCount", value: userdata.likeCount, type:"number", compare: ">="}]
      break;
    default:
      customoptions = [{key: "eventType", value: eventType, type:"string"}]
      break;
  }
  const configevaldata = [
      { keytype: 'any', keyfind: "object", keyname: "Evento", verifykey: customoptions, callback: (data) => console.log("Evento:", data), isBlocking: true },
      { keytype: 'any', keyfind: "object", keyname: "mediaAudio", verifykey: [{ key: "check", value: true, type: "boolean" }], callback: (data) => sendMediaManager(data, userdata), isBlocking: false },
      { keytype: 'any', keyfind: "object", keyname: "mediaImg", verifykey: [{ key: "check", value: true, type: "boolean" }], callback: (data) => sendMediaManager(data, userdata), isBlocking: false },
      { keytype: 'any', keyfind: "object", keyname: "mediaVideo", verifykey: [{ key: "check", value: true, type: "boolean" }], callback: (data) => sendMediaManager(data, userdata), isBlocking: false },
      { keytype: 'any', keyfind: "object", keyname: "profile", verifykey: [{ key: "check", value: true, type: "boolean" }], callback: (data) => sendMediaManager(data, userdata), isBlocking: false },
  ];

  for (const data of indexdbdata) {
      const evaluator = new DataEvaluator(configevaldata, eventType);
      evaluator.evaluate(data, (success) => {
          if (success) {
              console.log("Todos los callbacks han sido ejecutados");
          } else {
              console.log("El proceso fue interrumpido debido a una condición bloqueante.");
          }
      });
  }
}


setInterval(async () => {
  const userdata = {
    uniqueId: "testUser",
    nickname: "testUser",
    name: "testUser",
    comment: "nodefault 123124124",
    points: 0,
    likeCount: 50,
    diamondCost: 50,
    giftId: 6064,
    ProfilepictureUrl: "https://m.media-amazon.com/images/I/51y8GUVKJoL._AC_SY450_.jpg"
  };
  const alldatadb = await getalldatafromAccionEventsDBManager();
  AccionEventoOverlayEval("chat",alldatadb,userdata);
  // console.log("setInterval");
}, 6666);

openModaltest.addEventListener('click', () => {
  openModaltest.addEventListener('click', () => {
    formModal.open(formConfig, (formData) => {
      console.log("formData", formData);
      if (formData.id) {
        AccionEventsDBManager.updateData(formData);
      } else {
        AccionEventsDBManager.saveData(formData);
      }
    }, {}, false, true);  // El último parámetro decide si habilitar o no la lógica de manejo de radios
  });

});

const editcallback = async (index, data,modifiedData) => {
  console.log("editcallback", index, data,modifiedData);
  if (modifiedData.id) {
    AccionEventsDBManager.updateData(modifiedData);
  }
}
const deletecallback = async (index, data,modifiedData) => {
  console.log("deletecallback", index, data,modifiedData);
  if (modifiedData.id) {
    AccionEventsDBManager.deleteData(modifiedData.id);
  }
}
const config = {
  nombre: {
    class: 'input-default',
    type: 'string',
    returnType: 'string',
  }, // Especifica el orden de las columnas
  Evento: {
    class: 'input-default',
    // label: 'Evento',
    type: 'object',
    eventType: {
      class: 'select-default',
      type: 'select',
      returnType: 'string',
      options: [{ value: 'chat', label: 'Chat' }, { value: 'follow', label: 'Seguimiento' },{ value: 'likes', label: 'likes'},
     {value: 'share', label: 'compartir'}, { value: 'subscribe', label: 'suscripcion' }, { value: 'gift', label: 'Gift' }],
    },
    chat: {
      label: 'chat',
      class: 'input-default',
      type: 'string',
      returnType: 'string',
      hidden: true,
    },
    likes: {
      label: 'likes',
      class: 'input-default',
      type: 'number',
      returnType: 'number',
      hidden: true,
    },
    gift: {
      class: 'input-default',
      label: 'gift',
      type: 'select',
      returnType: 'number',
      options: getmapselectgift()
    },
  },
  profile: {
    type: 'object',
    check: {
      class: 'filled-in',
      label: 'check',
      type: 'checkbox',
      returnType: 'boolean',
    },
    duration: {
      class: 'input-50px',
      label: 'duration',
      type: 'number',
      returnType: 'number',
    },
    text: {
      class: 'input-default',
      label: 'text',
      type: 'string',
      returnType: 'string',
    },
  },
  mediaAudio: {
    type: 'object',
    check: {
      class: 'filled-in',
      label: 'check',
      type: 'checkbox',
      returnType: 'boolean',
    },
    volume: {
      class: 'max-width-90p',
      label: 'volume',
      type: 'slider',
      min: 0,
      max: 100,
      returnType: 'number',
    },
    duration: {
      class: 'input-50px',
      label: 'duration',
      type: 'number',
      returnType: 'number',
    },
    file: {
      class: 'input-default',
      label: 'file',
      type: 'select',
      returnType: 'number',
      options: audioOptions
    },
  },
  mediaVideo: {
    type: 'object',
    check: {
      class: 'filled-in',
      label: 'check',
      type: 'checkbox',
      returnType: 'boolean',
    },
    volume: {
      class: 'max-width-90p',
      label: 'volume',
      type: 'slider',
      min: 0,
      max: 100,
      returnType: 'number',
    },
    duration: {
      class: 'input-50px',
      label: 'duration',
      type: 'number',
      returnType: 'number',
    },
    file: {
      class: 'input-default',
      label: 'file',
      type: 'select',
      returnType: 'number',
      options: videoOptions
    },

  },
  mediaImg: {
    type: 'object',
    check: {
      class: 'filled-in',
      label: 'check',
      type: 'checkbox',
      returnType: 'boolean',
    },
    duration: {
      class: 'input-50px',
      label: 'duration',
      type: 'number',
      returnType: 'number',
    },
    file: {
      class: 'input-default',
      label: 'file',
      type: 'select',
      returnType: 'number',
      options: imageOptions
    },

  },
  id: {
    type: 'number',
    returnType: 'number',
    hidden: true,
  }
};
const table = new DynamicTable('#table-container',editcallback, config,deletecallback);
alldata.forEach((data) => {
  console.log("alldata", data);
  table.addRow(data);
});
console.log("table", table);
document.addEventListener('DOMContentLoaded', () => {
  // Ocultar la columna 'mediaVideo_file'
  table.hideColumn('id');
});
ObserverEvents.subscribe(async (action, data) => {
  if (action === "save") {
  const dataupdate = await AccionEventsDBManager.getAllData();
  table.updateRows(dataupdate);
  } else if (action === "delete") {
  const dataupdate = await AccionEventsDBManager.getAllData();
  table.updateRows(dataupdate);
  } else if (action === "update") {
  const dataupdate = await AccionEventsDBManager.getAllData();
  table.updateRows(dataupdate);
  }
});
export { AccionEventoOverlayEval, getalldatafromAccionEventsDBManager }

