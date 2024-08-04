
// Definir la función para obtener los datos de tipo de evento desde localStorage
function getEventTypeData(eventType, modifydata = {}) {
    let existdata = false;
    switch (eventType) {
        case 'gift':
            existdata = getlocalstoragedata('lastGiftItem');
            break;
        case 'chat':
            existdata = getlocalstoragedata('lastChatItem');
            break;
        case 'likes':
            existdata = getlocalstoragedata('lastLike');
            break;
        case 'share':
            existdata = getlocalstoragedata('lastShare');
            break;
        case 'welcome':
            existdata = getlocalstoragedata('lastWelcome');
            break;
        case 'envelope':
            existdata = getlocalstoragedata('lastEnvelope');
            break;
        case 'subscribe':
            existdata = getlocalstoragedata('lastSubscribe');
            break;
        default:
            return null;
    }

    if (existdata) {
        return existdata;
    } else {
        return newdataifnoexist(eventType, modifydata);
    }
}

function getlocalstoragedata(item) {
    return JSON.parse(localStorage.getItem(item));
}
function newdataifnoexist(eventType, modifydata = {}) {
    let data = {
        uniqueId: eventType,
        nickname: 'testuser',
        profilePictureUrl: 'https://avatars.githubusercontent.com/u/101882874?s=200&v=4',
        comment: 'test comment',
        ultraRapid: false,
        ultraFast: false,
        ultraSlow: false,
        fast: false,
        slow: false,
        normal: false,
        rapid: false,
        commentType: 'any-comment',
        readUserMessage: false,
        prefixUsermessage: 'testuser',
        command: 'test command',
        giftName: 'GG',
        giftId: Number(modifydata.select) ||6064,
        repeatCount: 1,
        gifterLevel: 1,
        likeCount: 123,
        totalLikeCount: 1230,
        diamondCount: 123,
        repeatEnd: false,
        giftPictureUrl: "https://p19-webcast.tiktokcdn.com/img/maliva/webcast-va/3f02fa9594bd1495ff4e8aa5ae265eef~tplv-obj.png",
        isModerator: false,
        isSubscriber: false,
        isNewGifter: false,
        teamMemberLevel: 27,
        displayType: 'pm_mt_guidance_share',
        followRole: 2, // 0 = no follow, 1 = follow, 2 = amigo
        emotes: [],
    };
    return data;
}

// Definir la clase SendataTestManager
class SendataTestManager {
    constructor(buttonId, inputId, statusId, sendFunction) {
        this.button = document.getElementById(buttonId);
        this.input = document.getElementById(inputId);
        this.status = document.getElementById(statusId);
        this.sendFunction = sendFunction;

        if (this.button) {
            this.button.addEventListener('click', this.handleClick.bind(this));
        }
    }

    async handleClick() {
        const eventType = this.input.value;
        const data = getEventTypeData(eventType);
        await this.sendEvent(eventType, data);
    }

    async sendEvent(eventType, data) {
        console.log('sendEvent', eventType, data);
        if (data) {
            await this.sendFunction(eventType, data);
            this.status.innerText = 'Evento enviado';
        } else {
            this.status.innerText = 'Datos no encontrados para el evento';
        }
    }

    // Método para configurar un nuevo botón e input
    setNewButton(buttonId, inputId, statusId) {
        this.button = document.getElementById(buttonId);
        this.input = document.getElementById(inputId);
        this.status = document.getElementById(statusId);

        if (this.button) {
            this.button.addEventListener('click', this.handleClick.bind(this));
        }
    }

    // Método para enviar eventos directamente sin interacción del DOM
    async sendEventDirectly(eventType, data) {
        await this.sendEvent(eventType, data);
    }
}



export { SendataTestManager, getEventTypeData, newdataifnoexist };


// class EventTypeDataManager {
//     constructor() {
//         this.localStorageKeys = {
//             gift: 'lastGiftItem',
//             chat: 'lastChatItem',
//             likes: 'lastLike',
//             share: 'lastShare',
//             welcome: 'lastWelcome',
//             envelope: 'lastEnvelope',
//             subscribe: 'lastSubscribe'
//         };
//     }

//     getEventTypeData(eventType) {
//         const localStorageKey = this.localStorageKeys[eventType];
//         if (!localStorageKey) return null;

//         const existdata = this.getLocalStorageData(localStorageKey);
//         return existdata ? JSON.parse(existdata) : this.newDataIfNoExist(eventType);
//     }

//     getLocalStorageData(item) {
//         return localStorage.getItem(item);
//     }

//     newDataIfNoExist(eventType) {
//         return {
//             uniqueId: eventType,
//             nickname: 'testuser',
//             profilePictureUrl: 'https://avatars.githubusercontent.com/u/101882874?s=200&v=4',
//             comment: 'test comment',
//             ultraRapid: false,
//             ultraFast: false,
//             ultraSlow: false,
//             fast: false,
//             slow: false,
//             normal: false,
//             rapid: false,
//             commentType: 'any-comment',
//             readUserMessage: false,
//             prefixUsermessage: 'testuser',
//             command: 'test command',
//             giftName: 'GG',
//             giftId: 6064,
//             repeatCount: 1,
//             gifterLevel: 1,
//             likeCount: 123,
//             totalLikeCount: 1230,
//             diamondCount: 123,
//             repeatEnd: false,
//             giftPictureUrl: "https://p19-webcast.tiktokcdn.com/img/maliva/webcast-va/3f02fa9594bd1495ff4e8aa5ae265eef~tplv-obj.png",
//             isModerator: false,
//             isSubscriber: false,
//             isNewGifter: false,
//             teamMemberLevel: 27,
//             displayType: 'pm_mt_guidance_share',
//             followRole: 2, // 0 = no follow, 1 = follow, 2 = amigo
//             emotes: [],
//         };
//     }
// }

// // Class definition for SendataTestManager
// class SendataTestManager {
//     constructor(buttonId, inputId, statusId, sendFunction) {
//         this.button = document.getElementById(buttonId);
//         this.input = document.getElementById(inputId);
//         this.status = document.getElementById(statusId);
//         this.sendFunction = sendFunction;
//         this.eventTypeDataManager = new EventTypeDataManager();

//         if (this.button) {
//             this.button.addEventListener('click', this.handleClick.bind(this));
//         }
//     }

//     async handleClick() {
//         const eventType = this.input.value;
//         const data = this.eventTypeDataManager.getEventTypeData(eventType);
//         await this.sendEvent(eventType, data);
//     }

//     async sendEvent(eventType, data) {
//         console.log('sendEvent', eventType, data);
//         if (data) {
//             await this.sendFunction(eventType, data);
//             this.status.innerText = 'Evento enviado';
//         } else {
//             this.status.innerText = 'Datos no encontrados para el evento';
//         }
//     }

//     // Method to set a new button and input
//     setNewButton(buttonId, inputId, statusId) {
//         this.button = document.getElementById(buttonId);
//         this.input = document.getElementById(inputId);
//         this.status = document.getElementById(statusId);

//         if (this.button) {
//             this.button.addEventListener('click', this.handleClick.bind(this));
//         }
//     }

//     // Method to send events directly without DOM interaction
//     async sendEventDirectly(eventType, data) {
//         await this.sendEvent(eventType, data);
//     }
// }

