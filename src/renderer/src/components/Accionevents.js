import FormModal from './FormModal'
import DynamicTable from './datatable';
import { getfileId } from './Fileshtml'
import  { IndexedDBManager, databases, DBObserver } from '../utils/indexedDB'
import { getformdatabyid, postToFileHandler, getdatafromserver, getAllDataFromDB, getdataIndexdb, modifyPoints } from '../utils/getdata';
import { replaceVariables } from '../utils/replaceVariables';
import { ws, sendcommandmc } from '../minecraft';
import CounterActions from './timerupdate';
import { giftManager, getdatagiftparsed } from '../utils/Giftdata';
import datajson from '../../json/keyboard.json';
import { socketManager } from '../tiktoksocketdata';
import { handleleermensaje } from '../voice/tts';
import  showAlert  from '../assets/alerts'
const optionskeyboard = Object.entries(datajson).map(([value, label]) => ({
  value,
  label,
}));
const movementButtons = {
  'movimiento...': false,
  'mover atras': 'MoveBackward',
  'mover adelante': 'MoveForward',
  'mover izquierda': 'MoveLeft',
  'mover derecha': 'MoveRight',
  'saltar': 'Jump',
  'correr': 'Run',
  'mirar hacia arriba': 'LookVertical.up',
  'mirar hacia abajo': 'LookVertical.down',
  'mirar hacia la derecha': 'LookHorizontal.right',
  'mirar hacia la izquierda': 'LookHorizontal.left',
  };

const oscOptions = Object.entries(movementButtons).map(([label, value]) => ({
  value,
  label,
}));
// setTimeout(() => {
//   CounterActions.add('add', 60);
//   CounterActions.subtract('subtract', 10);
// }, 1000);
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
    case 'image/gif':
      return 'Imagen';
    case 'video/mp4':
    case 'video/webm':
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
// console.log("Archivos categorizados:", categorizedFiles.Audio);
const formConfig = [
  { type: 'input', name: 'nombre', label: 'Nombre', inputType: 'text', returnType: 'string' },
  { type: 'input', name: 'id', label: 'ID', inputType: 'Number', returnType: 'Number', hidden: true },
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
  {
    type: 'checkbox', name: 'minecraft_check', label: 'Minecraft comandos', inputType: 'checkbox', returnType: 'boolean',
    children: [
      { type: 'textarea', name: 'minecraft_command', label: 'Comando', inputType: 'text', returnType: 'string' },
    ],
  },
  {
    type: 'checkbox', name: 'vrchat_check', label: 'VRChat osc', inputType: 'checkbox', returnType: 'boolean',
    children: [
      {  type: 'input', name: 'vrchat_chatbox', label: 'oscmensaje', inputType: 'text', returnType: 'string' },
      { type: 'select', name: 'vrchat_input', label: 'control', options: oscOptions, returnType: 'object' },
    ],
  },
  {
    type: 'checkbox', name: 'Api_check', label: 'Api', inputType: 'checkbox', returnType: 'boolean',
    children: [
      { type: 'input', name: 'Api_url', label: 'url', inputType: 'text', returnType: 'string' },
      { type: 'input', name: 'Api_data', label: 'data', inputType: 'text', returnType: 'string' },
    ],
  },
  {
    type: 'checkbox', name: 'Keyboard_check', label: 'Keyboard control', inputType: 'checkbox', returnType: 'boolean',
    children: [
      { type: 'multiSelect', name: 'Keyboard_keys', label: 'Keyboard keys', options: optionskeyboard, returnType: 'array'},
    ]
  },
  {
  type: 'checkbox', name: 'systempoints_check', label: 'cambiar puntos', inputType: 'checkbox', returnType: 'boolean',
    children: [
      { type: 'input', name: 'systempoints_points', label: 'puntos', inputType: 'number', returnType: 'number' },
    ],
  },
  {
  type: 'checkbox', name: 'tts_check', label: 'TTS voice', inputType: 'checkbox', returnType: 'boolean',
  children: [
    { type: 'input', name: 'tts_text', label: 'texto a leer', inputType: 'text', returnType: 'string' },
    ],
  },
  { type: 'checkbox', name: 'timer_check', label: 'Temporizador', inputType: 'checkbox', returnType: 'boolean',
    children: [
      { type: 'input', name: 'timer_time', label: 'tiempo', inputType: 'number', returnType: 'number' },
      { type: 'select', name: 'timer_action', label: 'accion', options: [{ value: 'start', label: 'iniciar'}, { value: 'stop', label: 'detener'}, { value: 'add', label: 'sumar tiempo'}, { value: 'subtract', label: 'restar tiempo'}], returnType: 'string' },
    ],

  },
  { type: 'radio', name: 'Evento_eventType', label: 'Seleccione el Evento', options:
  [{ value: 'chat', label: 'Chat' }, { value: 'follow', label: 'Seguimiento' },
  { value: 'like', label: 'like'},{value: 'share', label: 'compartir'},
  { value: 'subscribe', label: 'suscripcion' }, { value: 'gift', label: 'Gift' },{ value: 'member', label: 'Ingreso al live' }],
  returnType: 'string', hidden: false
  },
  { type: 'input', name: 'Evento_chat', label: 'Chat', inputType: 'text', returnType: 'string', hidden:false,valuedata:'default', dataAssociated: 'chat'},////    //////
  { type: 'input', name: 'Evento_like', label: 'like', inputType: 'number', returnType: 'number', hidden:false,valuedata: 15, dataAssociated: 'like'}, //////
  { type: 'select', name: 'Evento_gift', label: 'gift', options: getmapselectgift(), returnType: 'number', hidden:false, dataAssociated: 'gift'},///   //////
  { type: 'input', name: 'Evento_share', label: 'share', inputType: 'text', returnType: 'number', hidden:false,valuedata:'default', dataAssociated: 'share'},// //////
  { type: 'input', name: 'Evento_follow', label: 'follow', inputType: 'text', returnType: 'number', hidden:false,valuedata:'default', dataAssociated: 'follow'},//////
  { type: 'input', name: 'Evento_suscripcion', label: 'suscripcion', inputType: 'text', returnType: 'number', hidden:true,valuedata:'default', dataAssociated: 'suscripcion'},//////

  // { type: 'checkbox', name: 'activetesteeeeeeeeeeeeeee', label: 'active', inputType: 'checkbox', returnType: 'boolean' },
  // { type: 'multiSelect', name: 'keyvalue', label: 'Keyvalue', options: options, returnType: 'array', hidden: true },
  // { type: 'select', name: 'application', label: 'Application', options: appOptions, returnType: 'string' },
];
  const openModaltest = document.getElementById('openModaltest');
  console.log("formModal", formModal);
  // formModal.appendTo('#modal');
  const alldata = await AccionEventsDBManager.getAllData();
  export async function getalldatafromAccionEventsDBManager() {
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
                if (typeof valueToCheck !== 'number') return false;
                return this.compareNumbers(valueToCheck, verifykey.value, verifykey.compare);
            case 'string':
                return this.compareStrings(valueToCheck, verifykey.value, verifykey.compare);
            case 'boolean':
                return valueToCheck === verifykey.value;
            default:
                return false;
        }
    }
    // actualvalue 100, expectedvalue 100, lowerBound 75, upperBound 125
    compareNumbers(actualValue, expectedValue, compare = '===', tolerancePercentage = 50) {
      const maxDifference = expectedValue * (tolerancePercentage / 100);

      // Define los límites inferior y superior permitidos
      const lowerBound = expectedValue - maxDifference;
      const upperBound = expectedValue + maxDifference;

      switch (compare) {
          case '===':
              // Verifica si el valor actual está dentro del rango permitido  actualValue >= lowerBound && actualValue <= upperBound; // not equals
              return actualValue === expectedValue;
          case '>=':
              // Verifica si el valor actual es mayor o igual al límite inferior permitido
              return actualValue >= expectedValue && actualValue <= upperBound;
          case '<=':
              // Verifica si el valor actual es menor o igual al límite superior permitido
              return actualValue <= expectedValue && actualValue >= lowerBound;
          default:
              return false;
      }
    }

    compareStrings(actualValue, expectedValue, compare = '===') {
      if (!actualValue) return false;
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
          // console.log("findAndEvaluate Eventtype", item.keyname, item.keytype, item.verifykey, dataeval);
          const matchedValue = this.matchedValues.get(item.keyname);
          if (Array.isArray(item.verifykey)) {
            const forceTrueKey = item.verifykey.find(key => key.forceTrue === true);
              if (forceTrueKey) {
                    if (dataeval,item.keyname){
                      const defaultvalue = this.finddefaultMatch(item.keyname, dataeval);
                      // console.log("defaultvalue",defaultvalue,"dataeval",dataeval,"matchedValue",matchedValue);
                      if (dataeval.Evento.chat && this.eventType === defaultvalue.eventType) {
                        // console.log("Eventype",defaultvalue[this.eventType], defaultvalue, this.eventType);
                        if(defaultvalue[this.eventType]=== "default"){
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
                // console.log("allKeysMatched", matchresult, verifykey,   );
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
        if (!file || file.path === null) return;
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
class LikeTracker {
  constructor(resetInterval = 30000) { // Intervalo de reinicio por defecto: 30 segundos
    this.likeCounters = {}; // Almacena los contadores de likes por uniqueId
    this.resetInterval = resetInterval; // Intervalo en milisegundos para reiniciar los contadores

    // Iniciar el temporizador para restablecer los contadores
    this.startResetTimer();
  }

  // Método para manejar likes entrantes y retornar el total acumulado
  addLike(data) {
    const { uniqueId, likeCount } = data;

    if (!this.likeCounters[uniqueId]) {
      // Inicializar el contador en 0 si no existe
      this.likeCounters[uniqueId] = 0;
    }

    // Sumar los nuevos likes al contador existente
    this.likeCounters[uniqueId] += likeCount;

    // Retornar el total acumulado de likes para este usuario
    return this.likeCounters[uniqueId];
  }

  // Método para restablecer los contadores de likes
  resetLikeCounters() {
    Object.keys(this.likeCounters).forEach(uniqueId => {
      this.likeCounters[uniqueId] = 0; // Reinicia el contador para cada usuario
    });
  }

  // Iniciar el temporizador que restablece los contadores periódicamente
  startResetTimer() {
    setInterval(() => {
      this.resetLikeCounters();
      // console.log("Los contadores de likes han sido restablecidos.");
    }, this.resetInterval);
  }
}
const EvaluerLikes = new LikeTracker(10000);
// Ejemplo de uso
export async function AccionEventoOverlayEval(eventType = "chat", indexdbdata, userdata = {}) {
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
      const likesvalue = EvaluerLikes.addLike(userdata);
      console.log("like",userdata.likeCount, likesvalue);
      customoptions = [{key: "eventType", value: eventType, type:"string"}, {key: "like", value: likesvalue, type:"number", compare: ">="}]
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
      { keytype: 'any', keyfind: "object", keyname: "minecraft", verifykey: [{ key: "check", value: true, type: "boolean" }], callback: (data) => handleMinecraft(data, userdata), isBlocking: false },
      { keytype: 'any', keyfind: "object", keyname: "vrchat", verifykey: [{ key: "check", value: true, type: "boolean" }], callback: (data) => handleOsc(data, userdata), isBlocking: false },
      { keytype: 'any', keyfind: "object", keyname: "Api", verifykey: [{ key: "check", value: true, type: "boolean" }], callback: (data) => handleApi(data, userdata), isBlocking: false },
      { keytype: 'any', keyfind: "object", keyname: "Keyboard", verifykey: [{ key: "check", value: true, type: "boolean" }], callback: (data) => handleKeyboard(data, userdata), isBlocking: false },
      { keytype: 'any', keyfind: "object", keyname: "systempoints", verifykey: [{ key: "check", value: true, type: "boolean" }], callback: (data) => handleSystempoints(data, userdata), isBlocking: false },
      { keytype: 'any', keyfind: "object", keyname: "tts", verifykey: [{ key: "check", value: true, type: "boolean" }], callback: (data) => handletts(data, userdata), isBlocking: false },
      { keytype: 'any', keyfind: "object", keyname: "timer", verifykey: [{ key: "check", value: true, type: "boolean" }], callback: (data) => handleTimer(data, userdata), isBlocking: false },
    ];

  for (const data of indexdbdata) {
      const evaluator = new DataEvaluator(configevaldata, eventType);
      evaluator.evaluate(data, (success) => {
          if (success) {
              console.log("Todos los callbacks han sido ejecutados");
          } else {
              // console.log("El proceso fue interrumpido debido a una condición bloqueante.");
          }
      });
  }
}
function handletts(data, userdata) {
  console.log("handletts", data, userdata);
  if (data.tts.check === false) return;
  handleleermensaje(data.tts.text);
}
function handleTimer(data, userdata) {
  console.log("handleTimer", data, userdata);
  if (data.timer.check === false) return;
  switch (data.timer.action) {
    case 'start':
      CounterActions.start();
      break;
    case 'stop':
      CounterActions.stop();
      break;
    case 'add':
      CounterActions.add('add', data.timer.time);
      break;
    case 'subtract':
      CounterActions.subtract('subtract', data.timer.time);
      break;
    default:
      console.log("timer default", data.timer);
      break;
  }
}
function handleSystempoints(data, userdata) {
  console.log("handleSystempoints", data, userdata);
  if (data.systempoints.check === false) return;
  modifyPoints(userdata.userId, data.systempoints.points, userdata);
}
function handleKeyboard(data, userdata) {
    console.log("handleKeyboard", data, userdata);
    if (data.Keyboard.check === false) return;
    // const keystosend = data.Keyboard.keys;
    const keycontrolpress = Object.keys(data.Keyboard.keys).map(key => data.Keyboard.keys[key]);
    console.log("keycontrolpress", keycontrolpress);
    socketManager.emitMessage("presskey", keycontrolpress);
}
function handleApi(data, userdata) {
  console.log("handleApi", data, userdata);
  const resultmessage = `${replaceVariables(data.Api.url, userdata, true)}`;
  const datajson = replaceVariables(data.Api.data, userdata);

  Apifetch(resultmessage, datajson).then(response => {
    console.log("response", response);
  }).catch(error => {
    console.error("Error al enviar la petición a la API:", error);
  });
}
async function Apifetch(url, data) {
  let fetchOptions = {
    method: 'POST',
  };
  if (data.length > 0 || typeof data === 'object') {
    fetchOptions.body = typeof data === 'string' ? data : JSON.stringify(data)
    fetchOptions.headers = {
      'Content-Type': 'application/json',
    };
  }

  try {
    let response;
    if (url && data.length < 1) {
      // Si se proporciona una URL, se usa fetch absoluto
      response = await fetch(url);
    } else if (url && data.length > 1) {
      // Si se proporciona una URL y datos, se usa fetch relativo
      response = await fetch(url, fetchOptions);
    } else {
      // Si no se proporciona URL, se usa fetch relativo
      response = await fetch('.', fetchOptions);
    }

    console.log("response", response);

    return await response.json();
  } catch (error) {
    console.error('Hubo un problema con la operación fetch:', error);
    throw error;
  }
}
function handleOsc(data, userdata) {
  const resultmessage = replaceVariables(data.vrchat.chatbox, userdata);
  socketManager.emitMessage('oscmessage', resultmessage);
  if (data.vrchat.input && data.vrchat.input !== false) {
    const inputname = data.vrchat.input;
    console.log("inputname",inputname);
    if (inputname.startsWith("LookHorizontal")) {
      const handleMovementsplitkeys = inputname.split('.');
      if (handleMovementsplitkeys[1] === "left") {
        socketManager.emitMessage('oscHandler', { action:handleMovementsplitkeys[0] , value: -0.6 });
        setTimeout(() => socketManager.emitMessage('oscHandler', { action:handleMovementsplitkeys[0] , value: 0.1 }), 200);
      } else {
        socketManager.emitMessage('oscHandler', { action:handleMovementsplitkeys[0] , value: 0.6 });
        setTimeout(() => socketManager.emitMessage('oscHandler', { action:handleMovementsplitkeys[0] , value: 0.1 }), 200);
      }
      console.log("handleMovementsplitkeys",handleMovementsplitkeys);
      return;
    }
    if (inputname.startsWith("LookVertical")) {
      const handleMovementsplitkeys = inputname.split('.');
      if (handleMovementsplitkeys[1] === "up") {
        socketManager.emitMessage('oscHandler', { action:handleMovementsplitkeys[0] , value: 0.4 });
        setTimeout(() => socketManager.emitMessage('oscHandler', { action:handleMovementsplitkeys[0] , value: 0.1 }), 500);
      } else {
        socketManager.emitMessage('oscHandler', { action:handleMovementsplitkeys[0] , value: -0.4 });
        setTimeout(() => socketManager.emitMessage('oscHandler', { action:handleMovementsplitkeys[0] , value: 0.1 }), 500);
      }
      console.log("handleMovementsplitkeys",handleMovementsplitkeys);

      return;
    }
    socketManager.emitMessage('oscHandler', { action: inputname, value: true });
    setTimeout(() => socketManager.emitMessage('oscHandler', { action: inputname, value: false }), 500);
    console.log("resultmessage",userdata, resultmessage);
  }
}
function handleMinecraft(data, userdata) {
  // console.log("handleMinecraft", data, userdata);
  // console.log("handleMinecraft", data.minecraft.command);
  const splitcommand = data.minecraft.command.split('\n');
  if (splitcommand.length >= 1) {
    splitcommand.forEach(command => {
      const resultcommand = replaceVariables(command, userdata);
      sendcommandmc(resultcommand);
      // console.log("resultcommand",userdata, resultcommand);
    });
  }
  // ws.sendCommand("/say mensaje de prueba")
}

setTimeout(async () => {
  const userdata = {
    uniqueId: "testUser",
    nickname: "testUser",
    name: "testUser",
    comment: "test123",
    points: 0,
    likeCount: 50,
    diamondCost: 50,
    giftId: 6064,
    ProfilepictureUrl: "https://m.media-amazon.com/images/I/51y8GUVKJoL._AC_SY450_.jpg",
    userId: 11111111
  };
  const alldatadb = await getalldatafromAccionEventsDBManager();
  AccionEventoOverlayEval("chat",alldatadb,userdata);
  // console.log("setInterval");
}, 1500);

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
    type: 'textarea',
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
      toggleoptions: true,
      options: [{ value: 'chat', label: 'Chat'},
      { value: 'share', label: 'Compartir'},
      { value: 'subscribe', label: 'Suscripción'},
       { value: 'gift', label: 'Gift'},
      { value: 'member', label: 'Ingreso al live'},
    { value: 'like', label: 'Like' },
    { value: 'follow', label: 'Seguimiento' },
  ],
    },
    chat: {
      label: '',
      class: 'input-default',
      type: 'textarea',
      returnType: 'string',
      dataAssociated: 'chat',
    },
    like: {
      label: '',
      class: 'input-default',
      type: 'number',
      returnType: 'number',
      dataAssociated: 'like',
    },
    gift: {
      class: 'input-default',
      label: '',
      type: 'select',
      returnType: 'number',
      options: getmapselectgift(),
      dataAssociated: 'gift',
    },
  },
  minecraft:{
    class: 'input-default',
    type: 'object',
    check: {
      class: 'filled-in',
      label: 'check',
      type: 'checkbox',
      returnType: 'boolean',
    },
    command: {
      class: 'input-default',
      label: '',
      type: 'textarea',
      returnType: 'string',
    },
  },
  tts: {
    class: 'input-default',
    label: 'TTS',
    type: 'object',
    check: {
      class: 'filled-in',
      label: 'check',
      type: 'checkbox',
      returnType: 'boolean',
    },
    text: {
      class: 'input-default',
      label: 'leer texto',
      type: 'text',
      returnType: 'string',
    },
  },
  timer: {
    class: 'input-default',
    label: 'Temporizador',
    type: 'object',
    check: {
      class: 'filled-in',
      label: 'check',
      type: 'checkbox',
      returnType: 'boolean',
    },
    time: {
      class: 'input-default',
      label: 'tiempo',
      type: 'number',
      returnType: 'number',
    },
    action: {
      class: 'input-default',
      label: 'accion',
      type: 'select',
      returnType: 'string',
      options: [{ value: 'start', label: 'iniciar'}, { value: 'stop', label: 'detener'}, { value: 'add', label: 'sumar tiempo'}, { value: 'subtract', label: 'restar tiempo'}],
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
      label: '',
      type: 'textarea',
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
      label: '',
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
      label: '',
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
      label: '',
      type: 'select',
      returnType: 'number',
      options: imageOptions
    },

  },
  vrchat: {
    class: 'input-default',
    label: 'vrchat',
    type: 'object',
    check: {
      class: 'filled-in',
      label: 'check',
      type: 'checkbox',
      returnType: 'boolean',
    },
    chatbox: {
      class: 'input-default',
      label: '',
      type: 'textarea',
      returnType: 'string',
    },
    input: {
      class: 'input-default',
      label: '',
      type: 'select',
      returnType: 'string',
      options: oscOptions,
    },
  },
  Api:{
    class: 'input-default',
    label: 'Api url',
    type: 'object',
    check: {
      class: 'filled-in',
      label: 'check',
      type: 'checkbox',
      returnType: 'boolean',
    },
    url: {
      class: 'input-default',
      label: '',
      type: 'text',
      returnType: 'string',
    },
    data: {
      class: 'input-default',
      label: '',
      type: 'text',
      returnType: 'string',
    },
  },
  Keyboard: {
    class: 'input-default',
    label: 'Keyboard',
    type: 'object',
    check: {
      class: 'filled-in',
      label: 'check',
      type: 'checkbox',
      returnType: 'boolean',
    },
    keys: {
      class: 'input-default',
      label: '',
      type: 'multiSelect',
      returnType: 'array',
      options: optionskeyboard,
    },
  },
  systempoints: {
    class: 'input-default',
    label: 'System points',
    type: 'object',
    check: {
      class: 'filled-in',
      label: 'check',
      type: 'checkbox',
      returnType: 'boolean',
    },
    points: {
      class: 'input-default',
      label: '',
      type: 'number',
      returnType: 'number',
    },
  },
  id: {
    type: 'number',
    returnType: 'number',
    hidden: true,
  }
};
const table = new DynamicTable('#table-container',editcallback, config,deletecallback);

  setTimeout(() => {
    alldata.forEach((data) => {
      // console.log("alldata", data);
      table.addRow(data);
    });
    // table.hideColumn('id');
  }, 1000);

ObserverEvents.subscribe(async (action, data) => {
  if (action === "save") {
    table.clearRows();
    const dataupdate = await AccionEventsDBManager.getAllData();
    dataupdate.forEach((data) => {
      table.addRow(data);
    });
  } else if (action === "delete") {
    table.clearRows();
    const dataupdate = await AccionEventsDBManager.getAllData();
    dataupdate.forEach((data) => {
      table.addRow(data);
    });
  }
  else if (action === "update") {
    // table.clearRows();
    // const dataupdate = await AccionEventsDBManager.getAllData();
    // dataupdate.forEach((data) => {
    //   table.addRow(data);
    // });
    showAlert ('info', "Actualizado", "1000");
  }
});

