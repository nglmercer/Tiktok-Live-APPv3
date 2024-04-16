
                              
// Cargar eventos guardados del localStorage al cargar la página
window.addEventListener('load', loadEventsFromLocalStorage);

// Función para cargar eventos del localStorage
function loadEventsFromLocalStorage() {
  const savedCommands = JSON.parse(localStorage.getItem('commandjsonlist'));

  if (savedCommands) {
      const types = ['chat', 'follow', 'likes', 'share', 'welcome', 'envelope', 'subscribe'];

      types.forEach(type => {
          const commands = savedCommands[type] && savedCommands[type]["default"].join('\n');

          if (commands) {
              document.getElementById(`${type}commands`).value = commands;
          }
      });
  }
  
}

