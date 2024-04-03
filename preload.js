const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  addDivToOverlay: () => {
    const div = document.createElement('div');
    // Customize the div's appearance and behavior
    div.style.width = '100px';
    div.style.height = '50px';
    div.style.backgroundColor = 'red';
    div.textContent = 'This is a div in the overlay';
    document.body.appendChild(div);
  },
});