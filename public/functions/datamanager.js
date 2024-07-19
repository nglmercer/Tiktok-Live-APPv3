// dataManager.js

// Objeto para almacenar los últimos datos de diferentes funciones
let lastData = {
    chatItem: null,
    giftItem: null,
    simplifiedState: null,
    // Agrega más propiedades según sea necesario
};

// Función para guardar el último dato de una función específica
function saveLastData(key, data) {
    lastData[key] = data;
    localStorage.setItem(`last${key.charAt(0).toUpperCase() + key.slice(1)}`, JSON.stringify(data));
}

// Función para obtener el último dato de una función específica
function getLastData(key) {
    if (!lastData[key]) {
        const storedData = localStorage.getItem(`last${key.charAt(0).toUpperCase() + key.slice(1)}`);
        if (storedData) {
            lastData[key] = JSON.parse(storedData);
        }
    }
    return lastData[key];
}

// Función para modificar el último dato de una función específica
function modifyLastData(key, modifierFunction) {
    let data = getLastData(key);
    if (data) {
        data = modifierFunction(data);
        saveLastData(key, data);
    }
    return data;
}

// Función para limpiar todos los datos o un dato específico
function clearLastData(key = null) {
    if (key) {
        delete lastData[key];
        localStorage.removeItem(`last${key.charAt(0).toUpperCase() + key.slice(1)}`);
    } else {
        lastData = {};
        localStorage.clear();
    }
}

// Función para obtener todos los últimos datos
function getAllLastData() {
    return lastData;
}

// Función para simular el uso de los últimos datos
function simulateWithLastData(key, simulationFunction) {
    const data = getLastData(key);
    if (data) {
        return simulationFunction(data);
    }
    return null;
}
export { saveLastData, getLastData, modifyLastData, clearLastData, getAllLastData, simulateWithLastData };
// simulateWithLastData('chatItem', (data) => {
//     addChatItem('blue', data, data.comment);
// });

// simulateWithLastData('giftItem', (data) => {
//     handlegift(data);
// });
// EJEMPLO DE USO