// connection.js
import { connection } from '../app.js';
let backendUrl = "http://localhost:8081";
let websocket = null;
let timeouttime = 3000;
let maxAttempts = 5;
let Attemptsconnection = 0;
let isconnected = false;
export function connectWebsocket(onMessage) {
    if (websocket) return; // Already connected
    if (Attemptsconnection >= maxAttempts) {
        return;
    }
    websocket = new WebSocket("ws://localhost:21213/");
    Attemptsconnection++;

    websocket.onopen = function () {
        document.getElementById("stateText").innerHTML = "Connected tikfinity";
        Attemptsconnection = 0;
    }

    websocket.onclose = function () {
        websocket = null;
        setTimeout(() => connectWebsocket(onMessage), 4000);
    }

    websocket.onerror = function () {
        websocket = null;
        setTimeout(() => connectWebsocket(onMessage), 4000);
    }

    websocket.onmessage = onMessage;
}
export function connectTikTok(uniqueId, onConnect, onError) {
    connection.connect(uniqueId, getoptionsconnection(isconnected)).then(
        onConnect, isconnected = true
    ).catch(
        onError);
}
function getoptionsconnection(isconnected) {
    if (!isconnected) {
    return {
        processInitialData: true,
        enableExtendedGiftInfo: true,
        enableWebsocketUpgrade: true,
        requestPollingIntervalMs: 2000,
    }
} else {
    return {
        processInitialData: false,
        enableExtendedGiftInfo: true,
        enableWebsocketUpgrade: true,
        requestPollingIntervalMs: 2000,
    }
}
}