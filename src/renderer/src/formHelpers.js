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
  if (field.valuedata) {
    input.value = field.valuedata;
  }
  div.appendChild(input);
  div.appendChild(label);
  return div;
}
export function createTextareaField(field) {
  const div = document.createElement('div');
  div.className = 'input-field';

  if (field.hidden) {
    div.style.display = 'none'; // Oculta el campo si `hidden` es true
  }

  const textarea = document.createElement('textarea');
  textarea.name = field.name;
  textarea.id = field.name;

  if (field.valuedata) {
    textarea.value = field.valuedata;
  }

  const label = document.createElement('label');
  label.htmlFor = field.name;
  label.innerText = field.label;

  div.appendChild(label);
  div.appendChild(textarea);

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
  if (!field.option ||field.options.length <= 0) {
    field.options.forEach(option => {
      const opt = document.createElement('option');
      opt.value = option.value.index || TypeofData.ObjectStringify(option.value);
      opt.innerText = option.label || option.value;
      select.appendChild(opt);
    });
  };

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
  searchInput.classList.add('search-input', 'center-text');

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
      input.value = typeof option.value === 'object' ? JSON.stringify(option.value) : option.value;
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
    const options = gridSelect.querySelectorAll('.grid-select__option');

    options.forEach(option => {
      const labelText = option.querySelector('span').textContent.toLowerCase();
      // Añadir o quitar la clase 'hidden' según el término de búsqueda
      if (labelText.includes(searchTerm)) {
        option.classList.remove('hidden');
      } else {
        option.classList.add('hidden');
      }
    });
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
  checkbox.setAttribute('data-ignore-save', '');

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

export function createRadioField(field) {
  const radioWrapper = document.createElement('div');
  radioWrapper.className = 'radio-field';

  const label = document.createElement('label');
  label.textContent = field.label;

  radioWrapper.appendChild(label);

  field.options.forEach(option => {
    const optionWrapper = document.createElement('div');
    optionWrapper.className = 'radio-option';

    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = field.name;
    radio.id = `${field.name}_${option.value}`;
    radio.value = option.value;
    radio.className = 'with-gap';

    const optionLabel = document.createElement('label');
    optionLabel.setAttribute('for', `${field.name}_${option.value}`);
    optionLabel.textContent = option.label;

    // Asigna un valor por defecto si coincide con la opción
    if (field.value && field.value === option.value) {
      radio.checked = true;
    }

    optionWrapper.appendChild(radio);
    optionWrapper.appendChild(optionLabel);
    radioWrapper.appendChild(optionWrapper);
  });

  // Si el campo está oculto, se establece display: none
  if (field.hidden) {
    radioWrapper.style.display = 'none';
  }

  return radioWrapper;
}

export function getFormData(config) {
  const formData = {};

  config.forEach(field => {
    let value;
    switch (field.type) {
      case 'checkbox':
        value = getCheckboxValue(field);
        if (field.children) {
          processChildren(field, formData);
        }
        break;
      case 'multiSelect':
        value = getMultiSelectValue(field);
        break;
      case 'radio':
        value = getRadioValue(field);
        break;
      default:
        value = getFieldValue(field);
    }

    // Group properties with underscores
    const parts = field.name.split('_');
    if (parts.length > 1) {
      const group = parts[0];
      const key = parts.slice(1).join('_');
      if (!formData[group]) {
        formData[group] = {};
      }
      formData[group][key] = processReturnType(field.returnType, value);

      // Remove the individual property
      delete formData[field.name];
    } else {
      formData[field.name] = processReturnType(field.returnType, value);
    }
  });

  // Second pass to ensure all properties are grouped correctly
  Object.keys(formData).forEach(key => {
    const parts = key.split('_');
    if (parts.length > 1) {
      const group = parts[0];
      const subKey = parts.slice(1).join('_');
      if (!formData[group] || typeof formData[group] !== 'object') {
        formData[group] = {};
      }
      formData[group][subKey] = formData[key];
      delete formData[key];
    }
  });

  return formData;
}

function getCheckboxValue(field) {
  const element = document.querySelector(`[name="${field.name}_check"]`);
  return element ? element.checked : false;
}

function getMultiSelectValue(field) {
  const checkboxes = document.querySelectorAll(`[name="${field.name}"]:checked`);
  return Array.from(checkboxes).map(checkbox => checkbox.value);
}

function getFieldValue(field) {
  const element = document.querySelector(`[name="${field.name}"]`);
  return element ? element.value : null;
}
function getRadioValue(field) {
  const selectedOption = document.querySelector(`[name="${field.name}"]:checked`);
  return selectedOption ? selectedOption.value : null;
}

function processChildren(field, formData) {
  field.children.forEach(child => {
    const childElement = document.querySelector(`[name="${child.name}"]`);
    let childValue;

    switch (child.returnType) {
      case 'number':
        childValue = TypeofData.toNumber(childElement ? childElement.value : null);
        break;
      case 'object':
        childValue = TypeofData.toStringParse(childElement ? childElement.value : null);
        break;
      case 'array':
        const childElements = document.querySelectorAll(`[name="${child.name}"]:checked`);
        childValue = Array.from(childElements).map(childElement => childElement.value);
        console.log("childValue",childValue);
        break;
      default:
        childValue = childElement ? childElement.value : null;
    }

    formData[child.name] = childValue;
  });
}

function processReturnType(returnType, value) {
  switch (returnType) {
    case 'boolean':
      return value === true || value === 'true';
    case 'number':
      return TypeofData.toNumber(value);
    case 'array':
      return Array.isArray(value) ? value : [value];
    case 'object':
      return value;
    case 'string':
    default:
      return value;
  }
}
export function fillFormData(formData, config) {
  config.forEach(field => {
    const parts = field.name.split('_');
    let value;

    if (parts.length > 1) {
      const group = parts[0];
      const key = parts.slice(1).join('_');
      value = formData[group] && formData[group][key];
    } else {
      value = formData[field.name];
    }

    if (value !== undefined) {
      switch (field.type) {
        case 'checkbox':
          setCheckboxValue(field, value);
          if (field.children) {
            fillChildren(field.children, formData);
          }
          break;
        case 'multiSelect':
          setMultiSelectValue(field, value);
          break;
        case 'radio':
          setRadioValue(field, value);
          break;
        default:
          setFieldValue(field, value);
      }
    }
  });
}

function setCheckboxValue(field, value) {
  const element = document.querySelector(`[name="${field.name}_check"]`);
  if (element) {
    element.checked = value === true || value === 'true';
  }
}

function setMultiSelectValue(field, value) {
  const checkboxes = document.querySelectorAll(`[name="${field.name}"]`);
  checkboxes.forEach(checkbox => {
    checkbox.checked = Array.isArray(value) ? value.includes(checkbox.value) : false;
  });
}

function setFieldValue(field, value) {
  const element = document.querySelector(`[name="${field.name}"]`);
  if (element) {
    element.value = value;
  }
}

function setRadioValue(field, value) {
  const radioButtons = document.querySelectorAll(`[name="${field.name}"]`);
  radioButtons.forEach(radio => {
    radio.checked = radio.value === value;
  });
}

function fillChildren(children, formData) {
  children.forEach(child => {
    const childElement = document.querySelector(`[name="${child.name}"]`);
    if (childElement && formData[child.name] !== undefined) {
      childElement.value = formData[child.name];
    }
  });
}
