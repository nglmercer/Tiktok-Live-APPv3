const lookHorizontal = document.getElementById('lookHorizontal');
const stopAllButton = document.getElementById('stopAll');
const clientDisconnectButton = document.getElementById('clientdisconnect');
const clientBotStatus = document.getElementById('clientbotstatus');
const connectionStatus = document.getElementById('connection-status');
const testoscbutton = document.getElementById('testoscbutton');
testoscbutton.addEventListener('click', () => {
    const testosctext = document.getElementById('testosctext');
    window.api.sendOscMessage(testosctext.value);
    console.log('Enviado OSC:', testosctext.value);
});
function handleMovement(action, isKeyDown) {
    window.api.inputAction(action, isKeyDown);
}

    // Función para manejar el control deslizante de mirada horizontal
function handleLookHorizontal(event) {
window.api.inputAction('LookHorizontal', parseFloat(event.target.value));
}

// Configurar eventos
lookHorizontal.addEventListener('input', handleLookHorizontal);
stopAllButton.addEventListener('click', () => window.api.inputAction('keyUpAll'));

// Configurar botones de movimiento
const movementButtons = {
'moveForward': 'MoveForward',
'moveBackward': 'MoveBackward',
'moveLeft': 'MoveLeft',
'moveRight': 'MoveRight',
'jump': 'Jump',
'run': 'Run'
};

Object.entries(movementButtons).forEach(([buttonId, action]) => {
const button = document.getElementById(buttonId);
button.addEventListener('mousedown', () => handleMovement(action, true));
button.addEventListener('mouseup', () => handleMovement(action, false));
button.addEventListener('mouseleave', () => handleMovement(action, false));
});

// Limpiar al cerrar la ventana
window.addEventListener('beforeunload', () => {
window.api.inputAction('keyUpAll');
});