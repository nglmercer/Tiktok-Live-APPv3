const { app, autoUpdater, dialog } = require('electron');
const fs = require('fs');
const server = 'https://update.electronjs.org'
const feed = `${server}/nglmercer/Tiktok-Live-TTS-APPv2/${process.platform}-${process.arch}/${app.getVersion()}`
const isSquirrelInstalled = fs.existsSync('squirrel-installed.txt');

function initAutoUpdates() {
  autoUpdater.setFeedURL(feed);

  if (isSquirrelInstalled) {
    setInterval(() => {
      autoUpdater.checkForUpdates();
    }, 600 * 1000); // 600 segundos
    } else {
    // Lógica para cuando no se está ejecutando mediante Squirrel
    console.log('La aplicación no se está ejecutando mediante Squirrel.');
  }
  

  autoUpdater.on('update-available', () => {
    dialog.showMessageBox({
      type: 'info',
      buttons: ['OK'],
      title: 'Actualización disponible',
      message: 'Hay una nueva versión disponible. Se descargará e instalará automáticamente.'
    });
  });

  if (isSquirrelInstalled) {
    autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName) => {
      const dialogOpts = {
        type: 'info',
        buttons: ['Restart', 'Later'],
        title: 'Application Update',
        message: process.platform === 'win32' ? releaseNotes : releaseName,
        detail: 'Una nueva versión ha sido descargada. Reinicie la aplicación para aplicar las actualizaciones.'
      };
    
      dialog.showMessageBox(null, dialogOpts).then((returnValue) => {
        if (returnValue.response === 0) {
          autoUpdater.quitAndInstall();
    
          // Abrir la carpeta de instalación
          const appDirectory = path.dirname(app.getPath('exe'));
          shell.openPath(appDirectory);
    
          // Preguntar 
          const createShortcutOpts = {
            type: 'question',
            buttons: ['Sí', 'No'],
            title: 'Crear acceso directo en el escritorio',
            message: '¿Desea crear un acceso directo en el escritorio para esta aplicación?',
            detail: 'Un acceso directo en el escritorio le permitirá iniciar fácilmente la aplicación en el futuro.'
          };
    
          dialog.showMessageBox(null, createShortcutOpts).then((shortcutResponse) => {
            if (shortcutResponse.response === 0) {
              const shortcutPath = path.join(app.getPath('desktop'), 'MiAplicacion.lnk');
              shell.writeShortcutLink(shortcutPath, 'desktop', {
                target: app.getPath('exe'),
                description: 'Mi Aplicación',
                icon: app.getIcon()
              });
            }
          });
        }
      });
    });
    } else {
      console.log('La aplicación no se está ejecutando mediante Squirrel.');
    }
}

module.exports = { initAutoUpdates };