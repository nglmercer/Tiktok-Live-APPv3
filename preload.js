const { contextBridge, ipcRenderer } = require('electron')
const path = require('node:path')

contextBridge.exposeInMainWorld('electron', {
  startDrag: (fileName) => {
    ipcRenderer.send('ondragstart', path.join(process.cwd(), fileName))
  }
})

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