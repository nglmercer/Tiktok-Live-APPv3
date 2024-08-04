// giftManager.js
const jsonFilePath = '../datosjson/simplifiedStates.json';
let globalSimplifiedStates = [];
let isDataLoaded = false;
let loadingPromise = null;
const propertyMap = {
    'diamondcost': ['diamondcost', 'diamond_count'],
    'imageUrl': ['imageUrl', 'image.url_list.1'],
    'name': ['name'],
    'giftId': ['giftId', 'id']
};

function getNormalizedProperty(gift, propertyName) {
    const possibleNames = propertyMap[propertyName];
    for (const name of possibleNames) {
        if (name.includes('.')) {
            // Handle nested properties
            const parts = name.split('.');
            let value = gift;
            for (const part of parts) {
                value = value && value[part];
                if (value === undefined) break;
            }
            if (value !== undefined) return value;
        } else if (gift[name] !== undefined) {
            return gift[name];
        }
    }
    return undefined;
}
async function loadData() {
    if (loadingPromise) return loadingPromise;

    loadingPromise = fetch(jsonFilePath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error fetching JSON file: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            if (Array.isArray(data) && data.length > 0 && data[0].availableGifts) {
                globalSimplifiedStates = data;
                isDataLoaded = true;
                console.log("SimplifiedState loaded", globalSimplifiedStates[0]);
                return globalSimplifiedStates[0];
            } else {
                throw new Error("Invalid data structure in JSON file");
            }
        })
        .catch(error => {
            console.error('Error in loadData:', error);
            throw error;
        });

    return loadingPromise;
}
loadData();
function getGlobalSimplifiedStates() {
    if (!isDataLoaded) {
        console.warn("Data not loaded yet. Call loadData() first.");
        return null;
    }
    return globalSimplifiedStates;
}

function getAvailableGifts() {
    return globalSimplifiedStates[0]?.availableGifts || [];
}

// Función para cargar los datos guardados
function loadSavedData() {
    const savedStateJson = localStorage.getItem('simplifiedState');
    if (savedStateJson) {
        const savedState = JSON.parse(savedStateJson);
        globalSimplifiedStates = [savedState];
        return savedState;
    }
    return null;
}

// Función para guardar los datos
function saveData(state) {
    const simplifiedStateJson = JSON.stringify(state);
    localStorage.setItem('simplifiedState', simplifiedStateJson);
}

export async function handleAvailableGifts(state) {
    if (!state || !state.availableGifts) {
        state = loadSavedData();
        if (!state) {
            try {
                await loadData();
                state = getGlobalSimplifiedStates()[0];
            } catch (error) {
                console.error('Error al cargar los datos predeterminados:', error);
                return;
            }
        }
    }

    if (!state || !state.availableGifts || state.availableGifts.length === 0) {
        console.error('No se encontraron datos de regalos');
        return;
    }

    const giftImages = {};
    const container = document.getElementById('giftContainer');
    container.innerHTML = '';
    
    state.availableGifts.sort((a, b) => getNormalizedProperty(a, 'diamondcost') - getNormalizedProperty(b, 'diamondcost'));

    state.availableGifts.forEach(gift => {
        const giftName = getNormalizedProperty(gift, 'name');
        const imageUrl = getNormalizedProperty(gift, 'imageUrl');
        giftImages[giftName] = imageUrl;

        const giftBox = createGiftBox(gift);
        container.appendChild(giftBox);
    });

    globalSimplifiedStates = [state];
    saveData(state);

    addDownloadButton();

    return giftImages;
}
function createGiftBox(gift) {
    const giftBox = document.createElement('div');
    giftBox.classList.add('gift-box');

    const giftImage = document.createElement('img');
    giftImage.src = getNormalizedProperty(gift, 'imageUrl');
    giftImage.alt = getNormalizedProperty(gift, 'name');
    giftBox.appendChild(giftImage);

    const giftNameText = document.createElement('p');
    giftNameText.textContent = `${getNormalizedProperty(gift, 'name')} ${getNormalizedProperty(gift, 'diamondcost')}🌟`;
    giftBox.appendChild(giftNameText);

    return giftBox;
}
function addDownloadButton() {
    const buttonContainer = document.getElementById('downloadButtonContainer');
    buttonContainer.innerHTML = '';

    const downloadButton = document.createElement('button');
    downloadButton.textContent = 'Descargar JSON';
    downloadButton.className = "custombutton";
    downloadButton.onclick = downloadJson;

    buttonContainer.appendChild(downloadButton);
}

function downloadJson() {
    const dataStr = JSON.stringify(globalSimplifiedStates, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = 'simplifiedStates.json';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}
async function getdatagiftnameforid(giftId) {
    if (!Number.isInteger(giftId)){
        return null;
    }
    try {
        const gift = await getAvailableGifts();
        const findgift = gift.find(gift => gift.giftId === giftId);
        return findgift;
    } catch (error) {
        console.error('Error getting gift name:', error);
        return null;
    }
}

// Exponer globalSimplifiedStates al objeto global window
window.globalSimplifiedStates = globalSimplifiedStates;


// Inicialización: cargar datos guardados al inicio
document.addEventListener('DOMContentLoaded', () => {
    handleAvailableGifts();
});
export {
    getAvailableGifts,
    getdatagiftnameforid
};