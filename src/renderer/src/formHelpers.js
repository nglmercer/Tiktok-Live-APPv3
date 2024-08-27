import TypeofData from './utils/typeof';
export function createInputField(field) {
  const div = document.createElement('div');
  div.className = 'input-field';
  if (field.hidden) {
    div.style.display = 'none'; // Oculta el campo si `hidden` es true
  }

  const input = document.createElement('input');
  input.type = field.inputType || 'text';
  input.name = field.name;
  input.id = field.name;

  const label = document.createElement('label');
  label.htmlFor = field.name;
  label.innerText = field.label;

  div.appendChild(input);
  div.appendChild(label);
  return div;
}
export function createSelectField(field) {
  const div = document.createElement('div');
  div.className = 'input-field';
  if (field.hidden) {
    div.style.display = 'none';
  }

  const select = document.createElement('select');
  select.name = field.name;
  select.id = field.name;

  field.options.forEach(option => {
    const opt = document.createElement('option');
    opt.value = option.value;
    opt.innerText = option.label || option.value;
    select.appendChild(opt);
  });

  const label = document.createElement('label');
  label.htmlFor = field.name;
  label.innerText = field.label;

  div.appendChild(select);
  div.appendChild(label);
  return div;
}

export function createMultiSelectField(field) {
  const container = document.createElement('div');
  container.classList.add('input-field', 'col', 's12', 'gap-padding-margin-10');

  const label = document.createElement('label');
  label.textContent = field.label;

  // Campo de búsqueda
  const searchInput = document.createElement('input');
  searchInput.type = 'text';
  searchInput.placeholder = 'Buscar...';
  searchInput.classList.add('search-input');
  searchInput.className = 'center-text';

  // Contenedor de las opciones
  const gridSelect = document.createElement('div');
  gridSelect.classList.add('grid-select');

  // Función para renderizar las opciones
  function renderOptions(options) {
    gridSelect.innerHTML = '';  // Limpiar las opciones actuales
    options.forEach(option => {
      const checkbox = document.createElement('label');
      checkbox.classList.add('grid-select__option');

      const input = document.createElement('input');
      input.type = 'checkbox';
      input.name = field.name;
      input.value = option.value;
      input.dataset.id = option.id;
      input.classList.add('filled-in');

      const labelText = document.createElement('span');
      labelText.textContent = option.label;

      checkbox.appendChild(input);
      checkbox.appendChild(labelText);
      gridSelect.appendChild(checkbox);
    });
  }

  // Inicializar las opciones
  renderOptions(field.options);

  // Filtrar opciones en base al texto ingresado en el buscador
  searchInput.addEventListener('input', function () {
    const searchTerm = this.value.toLowerCase();
    const filteredOptions = field.options.filter(option =>
      option.label.toLowerCase().includes(searchTerm)
    );
    renderOptions(filteredOptions);  // Renderizar las opciones filtradas
  });

  container.appendChild(label);
  container.appendChild(searchInput);  // Agregar el campo de búsqueda
  container.appendChild(gridSelect);

  return container;
}
export function createColorPickerField(field) {
  const wrapper = document.createElement('div');
  wrapper.classList.add('input-field', 'color-picker-field');

  // Crear un contenedor para el input y la vista previa del color
  const colorWrapper = document.createElement('div');
  colorWrapper.style.display = 'flex';
  colorWrapper.style.alignItems = 'center';

  // Input para seleccionar el color
  const input = document.createElement('input');
  input.type = 'color';
  input.name = field.name;
  input.id = field.name;
  input.classList.add('color-picker-input');
  input.style.width = '100%';
  input.style.height = '60px';
  input.style.border = 'none';
  input.style.padding = '0';
  input.style.margin = '0';

  // Añadir el input y la vista previa al contenedor
  colorWrapper.appendChild(input);

  // Etiqueta (label) para el campo de color
  const label = document.createElement('label');
  label.htmlFor = field.name;
  label.textContent = field.label;
  label.classList.add('active');  // Asegúrate de que el label esté activo (arriba)

  // Añadir la etiqueta y el contenedor de color al wrapper
  wrapper.appendChild(label);
  wrapper.appendChild(colorWrapper);

  return wrapper;
}
// Método para crear un campo de tipo checkbox
export function createCheckboxField(field) {
  const checkboxWrapper = document.createElement('div');
  checkboxWrapper.className = 'indeterminate-checkbox';

  const label = document.createElement('label');
  label.setAttribute('for', `${field.name}_check`);
  label.textContent = field.label;

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.name = `${field.name}_check`;
  checkbox.id = `${field.name}_check`;
  checkbox.className = 'filled-in';

  // Asigna un valor por defecto si está presente en los datos iniciales del formulario
  if (field.value) {
    checkbox.checked = field.value;
  }

  // Si el campo está oculto, se establece display: none
  if (field.hidden) {
    checkboxWrapper.style.display = 'none';
  }

  checkboxWrapper.appendChild(checkbox);
  checkboxWrapper.appendChild(label);

  return checkboxWrapper;
}


// Método para crear un campo de tipo slider
export function createSliderField(field) {
  const sliderWrapper = document.createElement('div');
  sliderWrapper.className = 'box-sizing-content-box';

  const label = document.createElement('label');
  label.setAttribute('for', field.name);
  label.textContent = field.label;

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.name = field.name;
  slider.id = field.name;
  slider.className = 'slider';
  slider.min = field.min || 0; // Puedes definir un valor mínimo
  slider.max = field.max || 100; // Puedes definir un valor máximo
  slider.value = field.defaultValue || 50; // Puedes definir un valor por defecto

  // Si el campo está oculto, se establece display: none
  if (field.hidden) {
    sliderWrapper.style.display = 'none';
  }

  sliderWrapper.appendChild(slider);
  sliderWrapper.appendChild(label);

  return sliderWrapper;
}

export function getFormData(config) {
  const formData = {};

  config.forEach(field => {
    let value;

    if (field.type === 'checkbox') {
      const element = document.querySelector(`[name="${field.name}_check"]`);
      value = element ? element.checked : false;  // Asegura obtener el valor del checkbox con sufijo '_check'
      if (field.children) {
        field.children.forEach(child => {
          console.log("getFormDatachild", child);
          const childElement = document.querySelector(`[name="${child.name}"]`);
          if (child.returnType === 'number') {
            formData[child.name] = TypeofData.toNumber(childElement ? childElement.value : null);
          } else {
            formData[child.name] = childElement ? childElement.value : null;
          }
        });
      }
    } else if (field.type === 'multiSelect') {
      const checkboxes = document.querySelectorAll(`[name="${field.name}"]:checked`);
      value = Array.from(checkboxes).map(checkbox => checkbox.value);
    } else
    {
      const element = document.querySelector(`[name="${field.name}"]`);
      value = element ? element.value : null;
    }
    console.log("getFormData", field, field.returnType);
    switch (field.returnType) {
      case 'boolean':
        formData[field.name] = value === true || value === 'true';
        break;
      case 'number':
        console.log("getFormDatanumber", field, value);
        formData[field.name] = TypeofData.toNumber(value);
        break;
      case 'array':
        formData[field.name] = Array.isArray(value) ? value : [value];
        break;
      case 'object':
        formData[field.name] = { value };
        break;
      default:
        formData[field.name] = value;
    }
  });

  return formData;
}
