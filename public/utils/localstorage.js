function guardarEstadoCheckboxes() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        localStorage.setItem(checkbox.id, checkbox.checked);
    });
}

function guardarEstadoRadio() {
    const radios = document.querySelectorAll('input[type="radio"]');
    radios.forEach(radio => {
        localStorage.setItem(radio.id, radio.checked);
    });
}

function guardarEstadoRange() {
    const ranges = document.querySelectorAll('input[type="range"]');
    ranges.forEach(range => {
        localStorage.setItem(range.id, range.value);
    });
}

function guardarEstadoTexto() {
    const textos = document.querySelectorAll('input[type="text"]');
    textos.forEach(texto => {
        localStorage.setItem(texto.id, texto.value);
    });
}

function aplicarEstadoCheckboxes() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        const estadoGuardado = localStorage.getItem(checkbox.id);
        if (estadoGuardado !== null) {
            checkbox.checked = estadoGuardado === 'true';
        }
    });
}

function aplicarEstadoRadio() {
    const radios = document.querySelectorAll('input[type="radio"]');
    radios.forEach(radio => {
        const estadoGuardado = localStorage.getItem(radio.id);
        if (estadoGuardado !== null) {
            radio.checked = estadoGuardado === 'true';
        }
    });
}

function aplicarEstadoRange() {
    const ranges = document.querySelectorAll('input[type="range"]');
    ranges.forEach(range => {
        const estadoGuardado = localStorage.getItem(range.id);
        if (estadoGuardado !== null) {
            range.value = estadoGuardado;
        }
    });
}

function aplicarEstadoTexto() {
    const textos = document.querySelectorAll('input[type="text"]');
    textos.forEach(texto => {
        const estadoGuardado = localStorage.getItem(texto.id);
        if (estadoGuardado !== null) {
            texto.value = estadoGuardado;
        }
    });
}
function aplicarEstadoNumber() {
    const numeros = document.querySelectorAll('input[type="number"]');
    numeros.forEach(numero => {
        const estadoGuardado = localStorage.getItem(numero.id);
        if (estadoGuardado !== null) {
            numero.value = estadoGuardado;
        }
    });
}
function guardarEstadoNumber() {
    const numeros = document.querySelectorAll('input[type="number"]');
    numeros.forEach(numero => {
        localStorage.setItem(numero.id, numero.value);
    });
}
function guardarEstado() {
    guardarEstadoCheckboxes();
    guardarEstadoRadio();
    guardarEstadoRange();
    guardarEstadoTexto();
    guardarEstadoNumber();
}

// Aplicar estado de todos los tipos de inputs
function aplicarEstado() {
    aplicarEstadoCheckboxes();
    aplicarEstadoRadio();
    aplicarEstadoRange();
    aplicarEstadoTexto();
    aplicarEstadoNumber();
}
function setupLocalStorage(inputElement, storageKey, callback) {
    const storedValue = localStorage.getItem(storageKey);
    if (storedValue) {
        inputElement.value = storedValue;
    }

    inputElement.addEventListener('change', () => {
        const currentValue = inputElement.value;
        if (currentValue) {
            localStorage.setItem(storageKey, currentValue);
            if (typeof callback === 'function') {
                callback(currentValue);
            }
        }
        console.log('Valor actualizado:', currentValue);

    });
}
const jsonFilterWords = './datosjson/filterwords.json';
let customfilterWords = [];

async function fetchFilterWords() {
    try {
        const response = await fetch(jsonFilterWords);
        if (!response.ok) {
            throw new Error(`Error fetching JSON file: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Fetched JSON voicelist:', data);
        customfilterWords = data.palabras;
        return customfilterWords;
    } catch (error) {
        console.error('Error fetching JSON:', error);
        return [];
    }
}
function initializeFilterComponent(inputId, buttonId, containerId, storageKey, loadButtonId = null) {
    const input = document.getElementById(inputId);
    const addButton = document.getElementById(buttonId);
    const container = document.getElementById(containerId);
    const loadButton = loadButtonId ? document.getElementById(loadButtonId) : null;

    let items = JSON.parse(localStorage.getItem(storageKey)) || [];

    function saveItems() {
        localStorage.setItem(storageKey, JSON.stringify(items));
    }

    function createItemElement(item) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'border p-1 flex justify-between items-center';

        const itemText = document.createElement('span');
        itemText.textContent = item;

        const closeButton = document.createElement('button');
        closeButton.textContent = 'X';
        closeButton.className = 'bg-red-500 text-white px-2 py-1 ml-2';
        closeButton.onclick = () => {
            container.removeChild(itemDiv);
            items = items.filter(i => i !== item);
            saveItems();
        };

        itemDiv.appendChild(itemText);
        itemDiv.appendChild(closeButton);

        return itemDiv;
    }

    function renderItems() {
        container.innerHTML = '';
        items.forEach(item => {
            const itemElement = createItemElement(item);
            container.appendChild(itemElement);
        });
    }

    addButton.onclick = () => {
        const newItem = input.value.trim();
        if (newItem && !items.includes(newItem)) {
            items.push(newItem);
            saveItems();
            const itemElement = createItemElement(newItem);
            container.appendChild(itemElement);
            input.value = '';
        }
    };

    if (loadButton) {
        loadButton.onclick = async () => {
            const knownFilters = await fetchFilterWords();
            knownFilters.forEach(item => {
                if (!items.includes(item)) {
                    items.push(item);
                    const itemElement = createItemElement(item);
                    container.appendChild(itemElement);
                }
            });
            saveItems();
        };
    }

    renderItems();
}

document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('input', function(event) {
        if (event.target.matches('input[type="checkbox"], input[type="radio"], input[type="range"], input[type="text"],input[type="number"]')) {
            guardarEstado();
        }
    });
    aplicarEstado();
    initializeFilterComponent('filter-words', 'addfilter-words', 'containerfilter-words', 'filterWords', 'load-known-filters');
    initializeFilterComponent('filter-users', 'addfilter-users', 'containerfilter-users', 'filterUsers');
    // Minecraft formlive data minecraftlive
    const form = document.getElementById('createBotForm');
    const keyBOTInput = document.getElementById('keyBOT');
    const keySERVERInput = document.getElementById('keySERVER');
    
    // Cargar datos guardados del formulario si existen
    if (localStorage.getItem('botFormData')) {
        const formData = JSON.parse(localStorage.getItem('botFormData'));
        keyBOTInput.value = formData.keyBOT;
        keySERVERInput.value = formData.keySERVER;
    }
    
    // Escuchar el evento de envío del formulario
    form.addEventListener('submit', function(event) {
        event.preventDefault(); // Evitar que se envíe el formulario
    
        // Obtener el valor del campo "keySERVER"
        const keySERVER = keySERVERInput.value;
    
        // Extraer el número de puerto utilizando split(':')
        const serverParts = keySERVER.split(':');
        const serverAddress = serverParts[0];
        const serverPort = serverParts[1] || ''; // Si no hay puerto, asignar una cadena vacía
    
        // Guardar los datos en el localStorage
        const formData = {
            keyBOT: keyBOTInput.value,
            keySERVER: keySERVER,
            serverPort: serverPort
        };
        localStorage.setItem('botFormData', JSON.stringify(formData));
    
        // Enviar el número de puerto como parámetro adicional
        console.log('Dirección del servidor:', serverAddress);
        console.log('Puerto del servidor:', serverPort);
    });

    const userpointsInput = document.getElementById('users-points');
    setupLocalStorage(userpointsInput, 'userpoints');

    document.getElementById('saveAllChanges').addEventListener('click', saveAllChanges1);

});
function saveAllChanges1() {
                    
    const commandjsonlist = {};
    
    const types = ['chat', 'follow', 'likes', 'share', 'welcome', 'envelope', 'subscribe', 'gift'];
    
    types.forEach(type => {
      const commands = document.getElementById(`${type}commands`).value.trim();
    
      if (commands !== "") {
          commandjsonlist[type] = {
              "default": commands.split('\n')
          };
      } else {
          commandjsonlist[type] = {
              "default": []
          };
      }
    });
    
    localStorage.setItem('commandjsonlist', JSON.stringify(commandjsonlist));

    // Muestra los datos guardados en la consola
    console.log('Datos almacenados en el localStorage:');
    console.log(commandjsonlist);
    }