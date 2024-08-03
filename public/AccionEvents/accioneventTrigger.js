// import { replaceVariables } from "../functions/replaceVariables.js";
// import { createDBManager, databases } from '../functions/indexedDB.js';


class EventManager {
    constructor(config) {
        this.functionslist = config.functionslist || {};
        this.EVENT_TYPES = config.EVENT_TYPES || {};
        this.mediaTypes = config.mediaTypes || [];
        this.customProcessors = config.customProcessors || {};
        this.actions = config.actions || {};
        this.actionEventDBManager = config.actionEventDBManager; // Add this line
        // this.sendOverlayData = config.sendOverlayData || null;
    }

    eventmanager = async (eventType, data) => {
        const eventsfind = await this.actionEventDBManager.getAllData();
        let matched = false;
        
        for (const eventname of eventsfind) {
            matched = await this.processEvent(eventname, eventType, data);
            console.log("eventname", eventname, matched);
            if (matched) break;
        }

        if (!matched && this.EVENT_TYPES.GIFT === eventType) {
            await this.processDefaultGift(eventsfind, data);
        }
    }

    async processEvent(eventname, eventType, data) {
        for (const [key, value] of Object.entries(eventname)) {
            const splitkey = key.split('-');
            if (splitkey[1] !== eventType || !value.check) continue;

            const processor = this.customProcessors[eventType] || this.defaultProcessor;
            const matched = processor(value, data);

            if (matched) {
                console.log("matched", matched, eventname);
                await this.processActions(eventname, data);
                return true;
            }
        }
        return false;
    }

    defaultProcessor(value, data) {
        return true;
    }

    async processDefaultGift(eventsfind, data) {
        for (const eventname of eventsfind) {
            for (const [key, value] of Object.entries(eventname)) {
                const splitkey = key.split('-');
                if (splitkey[1] !== this.EVENT_TYPES.GIFT) continue;
                if (value.select === 'default') {
                    await this.processActions(eventname, data);
                    return;
                }
            }
        }
    }

    async processActions(eventname, data) {
        for (const [actionType, actionConfig] of Object.entries(eventname)) {
            if (!actionConfig.check) {
                // console.log("Action not checked", actionConfig);
                continue;
            };
            const action = this.actions[actionType];
            if (action) {
                try {
                    await action(actionConfig, data, this);
                } catch (error) {
                    console.error(`Error executing action ${actionType}:`, error);
                }
            } else {
                console.log(`Action ${actionType} not found`);
            }
        }
    }

    async sendOverlayData(srcoverlay, options, isProfile = false) {
    await window.api.createOverlayWindow();
    await window.api.sendOverlayData('play', { 
        src: srcoverlay.path, 
        fileType: srcoverlay.type, 
        options 
    }, isProfile);
    }

    async getfileId(id) {
        if (id === undefined || id === null) {
            return null;
        } 
        let converidtonumber = Number(id);
        let findelement = await window.api.getFileById(converidtonumber);
        return findelement || null;
    }
}
// async function sendOverlayData(srcoverlay, options, isProfile = false) {
//     await window.api.createOverlayWindow();
//     await window.api.sendOverlayData('play', { 
//         src: srcoverlay.path, 
//         fileType: srcoverlay.type, 
//         options 
//     }, isProfile);
// }
export { EventManager}
// agregar option default to gift