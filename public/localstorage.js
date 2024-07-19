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

document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('input', function(event) {
        if (event.target.matches('input[type="checkbox"], input[type="radio"], input[type="range"], input[type="text"],input[type="number"]')) {
            guardarEstado();
        }
    });
    aplicarEstado();
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