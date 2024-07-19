let instance = null;

export function createCustomCommandComponent(containerId, storageKey, customFunctions = {}) {
    if (instance) return instance;
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`No se encontró el contenedor con id: ${containerId}`);
        return null;
    }
    const commandInput = document.createElement('input');
    const functionSelect = document.createElement('select');
    const addButton = document.createElement('button');
    const commandList = document.createElement('ul');

    commandInput.type = 'text';
    commandInput.placeholder = 'Ingrese el comando';

    // Agregar opciones predeterminadas y personalizadas al select
    functionSelect.innerHTML = `
        <option value="log">Console.log</option>
        <option value="alert">Alert</option>
    `;
    Object.keys(customFunctions).forEach(funcName => {
        const option = document.createElement('option');
        option.value = funcName;
        option.textContent = funcName;
        functionSelect.appendChild(option);
    });

    addButton.textContent = 'Agregar Comando';

    container.appendChild(commandInput);
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
            li.textContent = `${cmd.command} - ${cmd.function}`;
            li.className = 'border-b p-1 border-gray-500';
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Eliminar';
            deleteButton.classList.add('deleteButton');
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
        const func = functionSelect.value;
        if (command) {
            commands.push({ command, function: func });
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
                if (cmd.function === 'log') {
                    console.log(`Comando ejecutado: ${cmd.command}`);
                } else if (cmd.function === 'alert') {
                    alert(`Comando ejecutado: ${cmd.command}`);
                } else if (customFunctions[cmd.function]) {
                    await customFunctions[cmd.function](text);
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

// Ejemplo de uso:
if (message) {
    const customCommandComponent = getCustomCommandComponent();
    if (customCommandComponent && customCommandComponent.existCommand(message)) {
        customCommandComponent.commandChatSend(message);
    }
}
