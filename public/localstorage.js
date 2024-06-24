function guardarEstadoCheckboxes() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        console.log(checkbox)
        localStorage.setItem(checkbox.id, checkbox.checked);
    });
}

// Función para aplicar el estado guardado de los checkboxes al cargar la página
function aplicarEstadoCheckboxes() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        // console.log(checkbox)
        const estadoGuardado = localStorage.getItem(checkbox.id);
        if (estadoGuardado !== null) {
            checkbox.checked = estadoGuardado === 'true';
        } else {
            checkbox.checked = estadoGuardado === 'false';
        }
    });
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
document.addEventListener('DOMContentLoaded', function() {
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
    const uniqueIdInput = document.getElementById('uniqueIdInput');
    const connectButton = document.getElementById('connectButton');

    // Load the last entered value from localStorage
    const uniqueId = localStorage.getItem('uniqueId');
    if (uniqueId) {
        uniqueIdInput.value = uniqueId;
    }

    if (connectButton) {
        connectButton.addEventListener('click', () => {
            const currentValue = uniqueIdInput.value;
            if (currentValue) {
                // Store the current value in localStorage
                localStorage.setItem('uniqueId', currentValue);
            }
        });
    }
    let disconnectButtonPressCount = 0;
    let disconnectButtonTimeout;
    const disconnectButton = document.getElementById('disconnectButton');
    document.getElementById('createBotForm').addEventListener('submit', function(event) {
        event.preventDefault();

        const keyBOT = document.getElementById('keyBOT').value.trim();
        const keySERVER = document.getElementById('keySERVER').value.trim();
        const Initcommand = InitcommandInput.value.trim();
        const data = {
            eventType: 'createBot',
            data: {
                keyBot: keyBOT,
                keyServer: keySERVER,
                Initcommand: Initcommand
            }
        };

        fetch(`${backendUrl}/api/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(response => response.json())
            .then(result => {
              console.log(result);
              const resultMessage = document.getElementById('resultMessage');
              resultMessage.textContent = result.message;
          
              if (result.message) {
                console.log('%cEl bot está conectado', 'color: green');
                resultMessage.style.color = 'green';
              } else {
                console.log('%cEl bot está desconectado', 'color: red');
                resultMessage.style.color = 'red';
              }
              disconnectButton.disabled = false;
            })
            .catch(error => {
                console.error(error);
                console.log(error);
                resultMessage.style.color = 'red';
            });
    });

    disconnectButton.addEventListener('click', function() {
        if (disconnectButtonPressCount === 0) {
            disconnectButtonPressCount++;
            clearTimeout(disconnectButtonTimeout);
            disconnectButtonTimeout = setTimeout(() => {
                disconnectBot();
                disconnectButtonPressCount = 0;
            }, 500);
        } else if (disconnectButtonPressCount === 1) {
            clearTimeout(disconnectButtonTimeout);
            reconnectBot();
            disconnectButtonPressCount = 0;
        }
    });

    function disconnectBot() {
        fetch(`${backendUrl}/api/disconnect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    eventType: 'disconnectBot'
                })
            })
            .then(response => response.json())
            .then(result => {
                console.log(result);
                document.getElementById('resultMessage').textContent = result.message;
                resultMessage.style.color = 'red';
                disconnectButton.disabled = true;
            })
            .catch(error => {
                console.error(error);
            });
    }
    const filterWordsInput = document.getElementById('filter-words');
    setupLocalStorage(filterWordsInput, 'lastFilterWords');
    
    const filterUsersInput = document.getElementById('filter-users');
    setupLocalStorage(filterUsersInput, 'lastfilterUsers');
    const userpointsInput = document.getElementById('users-points');
    setupLocalStorage(userpointsInput, 'userpoints');
    // Cargar el comando inicial guardado
    const initCommandInput = document.getElementById('InitcommandInput');
    setupLocalStorage(document.getElementById('InitcommandInput'), 'Initcommand');
    setupLocalStorage(document.getElementById('playerNameInput'), 'playerName');
    
    // Cargar el nombre del jugador guardado
    const playerNameInput = document.getElementById('playerNameInput');
    
    // Llamar a la función para guardar el estado de los checkboxes antes de salir de la página y luego aplicarlo al cargar la página
    window.addEventListener('beforeunload', guardarEstadoCheckboxes);
    window.addEventListener('load', aplicarEstadoCheckboxes);

});
