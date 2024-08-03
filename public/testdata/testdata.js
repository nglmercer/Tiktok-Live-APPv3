import { eventmanager } from '../renderer.js';

// Definir la función para obtener los datos de tipo de evento desde localStorage
function getEventTypeData(eventType) {
    switch (eventType) {
        case 'gift':
            return JSON.parse(localStorage.getItem('lastGiftItem'));
        case 'chat':
            return JSON.parse(localStorage.getItem('lastChatItem'));
        case 'likes':
            return JSON.parse(localStorage.getItem('lastLike'));
        case 'share':
            return JSON.parse(localStorage.getItem('lastShare'));
        case 'welcome':
            return JSON.parse(localStorage.getItem('lastWelcome'));
        case 'envelope':
            return JSON.parse(localStorage.getItem('lastEnvelope'));
        case 'subscribe':
            return JSON.parse(localStorage.getItem('lastSubscribe'));
        default:
            return null;
    }
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

// Crear una instancia de SendataTestManager
const testManager = new SendataTestManager(
    'testEventmanager',
    'testFunctions-input',
    'testFunctions-status',
    eventmanager
);

// Ejemplo de cómo usar la clase con diferentes métodos
// const testFunctionsInput = document.getElementById('testFunctions-input');
// const testFunctionsStatus = document.getElementById('testFunctions-status');
// const testEventManagerButton = document.getElementById('testEventmanager');

// if (testEventManagerButton) {
//     testEventManagerButton.addEventListener('click', async () => {
//         testManager.sendEvent(testFunctionsInput.value, getEventTypeData(testFunctionsInput.value));
//     });
// }

// // Ejemplo de cómo cambiar el botón y el input
// const newButtonId = 'newTestEventmanager';
// const newInputId = 'newTestFunctions-input';
// const newStatusId = 'newTestFunctions-status';
// testManager.setNewButton(newButtonId, newInputId, newStatusId);

// // Ejemplo de cómo enviar eventos directamente
// const eventType = 'gift';
// const eventData = getEventTypeData(eventType);
// testManager.sendEventDirectly(eventType, eventData);
export { testManager,SendataTestManager };