import { replaceVariables } from "../functions/replaceVariables.js";
import { createDBManager,databases } from '../functions/indexedDB.js';
const actionEventDBManager = createDBManager(databases.MyDatabaseActionevent);

const EVENT_TYPES = {
    GIFT: 'gift',
    LIKES: 'likes',
    IMAGE: 'image',
    VIDEO: 'video',
    AUDIO: 'audio',
    PROFILE: 'profile'
};
async function eventmanager(eventType, data) {
    const eventsfind = await actionEventDBManager.getAllData();
    let matched = false;
    
    for (const eventname of eventsfind) {
        matched = await processEvent(eventname, eventType, data);
        if (matched) break; // Si se encuentra una coincidencia, salir del bucle
    }
    console.log('matched', matched);
    // Si no se encontró ninguna coincidencia, ejecutar la lógica por defecto para 'gift'
    if (!matched) {
        for (const eventname of eventsfind) {
            for (const [key, value] of Object.entries(eventname)) {
                const splitkey = key.split('-');
                if (splitkey[1] !== eventType) continue;
                if (eventType === EVENT_TYPES.GIFT && value.select === 'default') {
                    console.log('Default logic for GIFT');
                    await processMediaTypes(eventname, data);
                    break;
                }
            }
        }
    }
}
async function processEvent(eventname, eventType, data) {
    let matched = false;
    for (const [key, value] of Object.entries(eventname)) {
        const splitkey = key.split('-');
        if (splitkey[1] !== eventType) continue;
        if (!value.check) return false;
        switch (eventType) {
            case EVENT_TYPES.GIFT:
                if (processGiftEvent(value, data)) {
                    matched = true;
                    console.log("Matched GIFT eventType",matched);
                }
                break;
            case EVENT_TYPES.LIKES:
                if (processLikesEvent(value, data)) {
                    matched = true;
                    console.log("Matched LIKES eventType",matched);
                }
                break;
            default:
                matched = true;
                await processMediaTypes(eventname, data);
                return false;
        }
    }
    if (matched) {
        await processMediaTypes(eventname, data);
    } 
    console.log('matched', matched);
    return matched;
}

function processGiftEvent(value, data) {
    const selectValue = Number(value.select);  // Crear una copia y convertirla a número
    return selectValue === data.giftId;
}

function processLikesEvent(value, data) {
    const numberValue = Number(value.number) || 2;  // Crear una copia y convertirla a número
    return numberValue <= data.likeCount;
}
function processCommandEvent(value, data) {
    const commandValue = value.command;
    return commandValue === data.comment;
}
async function processMediaTypes(eventname, data) {
    const PROCESSED_TYPES = new Set();
    const mediaTypes = [
        { type: EVENT_TYPES.IMAGE, key: "type-imagen" },
        { type: EVENT_TYPES.VIDEO, key: "type-video" },
        { type: EVENT_TYPES.AUDIO, key: "type-audio" },
        { type: EVENT_TYPES.PROFILE, key: "type-profile" }
    ];

    for (const { type, key } of mediaTypes) {
        if (eventname[key] && eventname[key].check && !PROCESSED_TYPES.has(type)) {
            PROCESSED_TYPES.add(type);
            await processMediaType(type, eventname[key], data);
        }
    }
}

async function processMediaType(type, typeData, data) {
    if (type === EVENT_TYPES.PROFILE) {
        await processProfileType(typeData, data);
    } else {
        const srcoverlay = await getfileId(typeData.select);
        if (srcoverlay) {
            await sendOverlayData(srcoverlay, typeData);
        }
    }
}

async function processProfileType(typeData, data) {
    typeData.texto = replaceVariables(typeData.texto, data);
    await sendOverlayData({ path: data.profilePictureUrl, type: "image/png" }, typeData, true);
}
async function sendOverlayData(srcoverlay, options, isProfile = false) {
    await window.api.createOverlayWindow();
    await window.api.sendOverlayData('play', { 
        src: srcoverlay.path, 
        fileType: srcoverlay.type, 
        options 
    }, isProfile);
}
async function getfileId(id) {
    if (id === undefined || id === null) {
        return null;
    } 
    let converidtonumber = Number(id);
    let findelement = window.api.getFileById(converidtonumber);
    if (findelement) {
        return findelement;
    } else {
        return null;
    }
}
export { eventmanager };