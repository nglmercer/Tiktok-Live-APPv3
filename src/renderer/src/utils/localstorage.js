function guardarEstadoCheckboxes() {
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    // Ignorar los checkboxes que tienen el atributo 'data-ignore-save'
    if (!checkbox.hasAttribute('data-ignore-save')) {
      localStorage.setItem(checkbox.id, checkbox.checked);
    }
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
function guardarEstadoSelect() {
  const selects = document.querySelectorAll('select');
  selects.forEach(select => {
      localStorage.setItem(select.id, select.value);
  });
}
function aplicarEstadoCheckboxes() {
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(checkbox => {
    // Ignorar los checkboxes que tienen el atributo 'data-ignore-save'
    if (!checkbox.hasAttribute('data-ignore-save')) {
      const estadoGuardado = localStorage.getItem(checkbox.id);
      if (estadoGuardado !== null) {
        checkbox.checked = estadoGuardado === 'true';
      }
    }
  });
}
function aplicarEstadoSelect() {
  const selects = document.querySelectorAll('select');
  selects.forEach(select => {
      const estadoGuardado = localStorage.getItem(select.id);
      if (estadoGuardado !== null) {
          select.value = estadoGuardado;
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
  console.log("guardarEstado");
  guardarEstadoCheckboxes();
  guardarEstadoRadio();
  guardarEstadoRange();
  guardarEstadoTexto();
  guardarEstadoNumber();
  guardarEstadoSelect();
}

// Aplicar estado de todos los tipos de inputs
function aplicarEstado() {
  console.log("aplicarEstado");
  aplicarEstadoSelect();
  aplicarEstadoCheckboxes();
  aplicarEstadoRadio();
  aplicarEstadoRange();
  aplicarEstadoTexto();
  aplicarEstadoNumber();
}


document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('input', function(event) {
      if (event.target.matches('input[type="checkbox"], input[type="radio"], input[type="range"], input[type="text"],input[type="number"],select')) {
          guardarEstado();
      }
  });
  aplicarEstado();
});
