let instance = null;

export function createCustomCommandComponent(containerId, storageKey, customFunctions = {}) {
    if (instance) return instance;
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`No se encontró el contenedor con id: ${containerId}`);
        return null;
    }
    const commandInput = document.createElement('input');
    const categorySelect = document.createElement('select');
    const functionSelect = document.createElement('select');
    const addButton = document.createElement('button');
    const commandList = document.createElement('ul');

    commandInput.type = 'text';
    commandInput.placeholder = 'Ingrese el comando';

    // Agregar opciones predeterminadas al select de categorías
    categorySelect.innerHTML = `
        <option value="">Seleccione una categoría</option>
    `;
    Object.keys(customFunctions).forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });

    // Función para actualizar el select de funciones
    function updateFunctionSelect(category) {
        functionSelect.innerHTML = '';
         if (customFunctions[category]) {
            Object.keys(customFunctions[category]).forEach(funcName => {
                const option = document.createElement('option');
                option.value = funcName;
                option.textContent = funcName;
                functionSelect.appendChild(option);
            });
        }
    }

    categorySelect.onchange = () => updateFunctionSelect(categorySelect.value);

    addButton.textContent = 'Agregar Comando';
    addButton.classList.add('custombutton');

    container.appendChild(commandInput);
    container.appendChild(categorySelect);
    container.appendChild(functionSelect);
    container.appendChild(addButton);
    container.appendChild(commandList);

    let commands = JSON.parse(localStorage.getItem(storageKey)) || [];

    function saveCommands() {
        localStorage.setItem(storageKey, JSON.stringify(commands));
    }

    function renderCommands() {
        commandList.innerHTML = '';
        commands.forEach((cmd, index) => {
            const li = document.createElement('li');
            li.textContent = `${cmd.command} - ${cmd.category} - ${cmd.function}`;
            li.className = 'border-b p-1 border-gray-500';
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Eliminar';
            deleteButton.classList.add('deleteButton');
            deleteButton.setAttribute('data-translate', 'DeleteButton');

            deleteButton.onclick = () => {
                commands.splice(index, 1);
                saveCommands();
                renderCommands();
            };
            li.appendChild(deleteButton);
            commandList.appendChild(li);
        });
    }

    addButton.onclick = () => {
        const command = commandInput.value.trim();
        const category = categorySelect.value;
        const func = functionSelect.value;
        if (command && category && func) {
            commands.push({ command, category, function: func });
            saveCommands();
            renderCommands();
            commandInput.value = '';
        }
    };

    renderCommands();

    // Función para procesar comandos
    async function processCommand(type, text) {
        for (const cmd of commands) {
            if (type === 'chat' && text.toLowerCase().includes(cmd.command.toLowerCase())) {
                if (text.toLowerCase().startsWith(cmd.command.toLowerCase())) {
                    text = text.slice(cmd.command.length).trim();
                }
                if (customFunctions[cmd.category] && customFunctions[cmd.category][cmd.function]) {
                    await customFunctions[cmd.category][cmd.function](text);
                }
            }
        }
    }

    // Función para verificar si un comando existe
    function existCommand(message) {
        return commands.some(cmd => message.toLowerCase().includes(cmd.command.toLowerCase()));
    }

    // Función para enviar el comando del chat
    function commandChatSend(message) {
        processCommand('chat', message);
    }

    instance = { processCommand, existCommand, commandChatSend };
    return instance;
}

export function getCustomCommandComponent() {
    return instance;
}