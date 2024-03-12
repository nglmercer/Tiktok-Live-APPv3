const { ipcRenderer } = require('electron');

// Manejar el evento click del botón para abrir la nueva ventana
document.getElementById('openOverlayButton').addEventListener('click', () => {
  // Obtener el contenido del div
  const content = document.getElementById('overlayEventContainer').outerHTML;
  
  // Enviar el contenido al proceso principal para clonarlo en una nueva ventana
  ipcRenderer.send('cloneContent', content);
});
