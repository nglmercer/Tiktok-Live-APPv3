class DynamicTable {
  constructor(containerSelector, callback, config = {},deletecallback) {
    this.container = document.querySelector(containerSelector);
    this.config = config;
    this.columns = this.getOrderedColumns(config); // Establece las columnas en el orden deseado
    this.callback = callback;
    this.deletecallback = deletecallback;
    this.table = document.createElement('table');
    this.table.classList.add('dynamic-table');
    this.container.appendChild(this.table);
    this.canClear = true; // Bandera para controlar la limpieza

    this.createHeader();
  }


  getOrderedColumns(config) {
    return Object.keys(config);
  }

  getMaxColumns() {
    return this.columns.filter(key => !(this.config[key] && this.config[key].hidden)).length + 1;
  }

  createHeader() {
    const header = this.table.createTHead();
    const headerRow = header.insertRow();

    this.columns.forEach((key) => {
      if (this.config[key] && this.config[key].hidden) {
        return; // No añadimos encabezado para columnas ocultas
      }
      const th = document.createElement('th');
      th.textContent = key;
      th.dataset.key = key;
      headerRow.appendChild(th);
    });

    const th = document.createElement('th');
    th.textContent = 'Acciones';
    headerRow.appendChild(th);
  }

  addRow(data) {
    const row = new DynamicRow(this.table, data, this.columns, this.config, this.callback,this.deletecallback);
    row.render();
  }

  hideColumn(columnKey) {
    const headerCells = this.table.tHead.rows[0].cells;
    for (let i = 0; i < headerCells.length; i++) {
      if (headerCells[i].dataset.key === columnKey) {
        headerCells[i].style.display = 'none';
      }
    }

    for (let row of this.table.rows) {
      const cells = row.cells;
      for (let i = 0; i < cells.length; i++) {
        if (this.columns[i] === columnKey) {
          cells[i].style.display = 'none';
        }
      }
    }
  }

  updateRows(data, clearInterval = 2000) {
    if (this.canClear) {
      this.clearRows(); // Limpiar antes de añadir nuevas filas
      this.canClear = false; // Desactivar la limpieza por 10 segundos
      setTimeout(() => {
        this.canClear = true; // Reactivar la limpieza después de 10 segundos
      }, clearInterval);
    }
      this.addRow(data); // Añadir las filas después de limpiar
  }

  clearRows() {
    while (this.table.rows.length > 1) {
      this.table.deleteRow(1);
    }
  }
}
class DynamicRow {
  constructor(table, data, columns, config, callback,deletecallback) {
    this.table = table;
    this.data = data;
    this.columns = columns;
    this.config = config;
    this.callback = callback;
    this.originalData = { ...data }; // Guardamos los datos originales
    this.modifiedData = JSON.parse(JSON.stringify(data)); // Inicializamos modifiedData con una copia profunda de originalData
    this.deletecallback = deletecallback;
  }

  render() {
    const row = this.table.insertRow();
    let cellIndex = 0;

    this.columns.forEach((key) => {
      const typeConfig = this.config[key];

      if (typeConfig && typeConfig.hidden) {
        return;
      }

      const cell = row.insertCell(cellIndex++);
      const value = this.data[key];

      if (typeConfig && typeConfig.type === 'object') {
        const objectContainer = document.createElement('details');
        const summary = document.createElement('summary');
        summary.textContent = 'Mostrar detalles';

        objectContainer.appendChild(summary);

        Object.keys(typeConfig).forEach(subKey => {
          if (subKey === 'type') return;

          const subConfig = typeConfig[subKey];
          const subValue = value ? value[subKey] : undefined;
          const inputElement = this.createInputElement(key, subKey, subValue, subConfig);

          if (inputElement) {
            const wrapper = document.createElement('div');
            if (subConfig.label) {
              const label = document.createElement('label');
              label.classList.add('grid-1fr-1fr-align-center');
              const span = document.createElement('span');
              span.textContent = subConfig.label;
              label.appendChild(inputElement);
              label.appendChild(span);
              wrapper.appendChild(label);
            } else {
              wrapper.appendChild(inputElement);
            }
            objectContainer.appendChild(wrapper);
          }
        });

        cell.appendChild(objectContainer);
      } else {
        const inputElement = this.createInputElement(key, null, value, typeConfig);
        if (inputElement) {
          cell.appendChild(inputElement);
        } else {
          cell.textContent = value !== undefined ? value : '';
        }
      }
    });

    const actionCell = row.insertCell(cellIndex);
    const actionButton = document.createElement('button');
    actionButton.textContent = 'Guardar cambios';
    actionButton.addEventListener('click', () => {
      this.callback(row.rowIndex, this.originalData, this.modifiedData);
    });
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Eliminar';
    deleteButton.addEventListener('click', () => {
      this.deletecallback(row.rowIndex, this.originalData, this.modifiedData);
    });
    actionCell.appendChild(deleteButton);
    actionCell.appendChild(actionButton);
  }

  createInputElement(key, subKey, value, typeConfig) {
    // Si el valor es undefined, no generamos ningún elemento
    if (value === undefined) return null;

    let inputElement;

    // Manejar el tipo de elemento según el typeConfig.type
    switch (typeConfig?.type) {
      case 'slider':
        inputElement = this.createSliderElement(key, subKey, value, typeConfig);
        break;
      case 'checkbox':
        inputElement = this.createCheckboxElement(key, subKey, value);
        break;
      case 'number':
        inputElement = this.createNumberElement(key, subKey, value);
        break;
      case 'text':
      case 'string':
        inputElement = this.createTextElement(key, subKey, value);
        break;
      case 'select':
        inputElement = this.createSelectElement(key, subKey, value, typeConfig);
        break;
      default:
        // Por defecto, crear un input type="text"
        inputElement = this.createTextElement(key, subKey, value);
    }

    // Agregar clase si existe
    if (typeConfig?.class) {
      inputElement.classList.add(typeConfig.class);
    }

    return inputElement || document.createTextNode('');
  }
  createSelectElement(key, subKey, value, typeConfig) {
    const divElement = document.createElement('div');
    divElement.classList.add('div-select');
    const selectElement = document.createElement('select');
    selectElement.id = key;
    selectElement.classList.add('select');
    // console.log("select",typeConfig);
    if (typeConfig.options) {
      typeConfig.options.forEach(option => {
        const optionElement = document.createElement('option');
        if (typeof option.value === 'object') {
          optionElement.value = option.value.index;
          optionElement.textContent = option.label;
          optionElement.selected = option.value.index === value; // Marca como seleccionado si coincide con el valor actual
          selectElement.appendChild(optionElement);
        } else {

          optionElement.value = option.value;
          optionElement.textContent = option.label;
          optionElement.selected = option.value === value; // Marca como seleccionado si coincide con el valor actual
          selectElement.appendChild(optionElement);
        }
      });
    }

    selectElement.value = value;

    selectElement.addEventListener('change', () => {
      this.updateModifiedData(key, subKey, selectElement.value);
    });
    const labelElement = document.createElement('label');
    divElement.appendChild(selectElement);
    if (typeConfig.label) {
      labelElement.textContent = typeConfig.label;
      labelElement.classList.add('label');
      labelElement.setAttribute('for', key);
      divElement.appendChild(labelElement);
    }
    return divElement;
  }

  createSliderElement(key, subKey, value, typeConfig) {
    const inputElement = document.createElement('input');
    inputElement.type = 'range';
    inputElement.min = typeConfig.min || 0;
    inputElement.max = typeConfig.max || 100;
    inputElement.value = value;

    inputElement.addEventListener('input', () => {
      const returnValue = typeConfig.returnType === 'number' ? Number(inputElement.value) : inputElement.value;
      this.updateModifiedData(key, subKey, returnValue);
    });

    return inputElement;
  }

  createCheckboxElement(key, subKey, value) {
    const inputElement = document.createElement('input');
    inputElement.type = 'checkbox';
    inputElement.checked = value;

    inputElement.addEventListener('change', () => {
      const returnValue = inputElement.checked;
      this.updateModifiedData(key, subKey, returnValue);
    });

    return inputElement;
  }

  createNumberElement(key, subKey, value) {
    const inputElement = document.createElement('input');
    inputElement.type = 'number';
    inputElement.value = value;

    inputElement.addEventListener('input', () => {
      const returnValue = Number(inputElement.value);
      this.updateModifiedData(key, subKey, returnValue);
    });

    return inputElement;
  }

  createTextElement(key, subKey, value) {
    const inputElement = document.createElement('input');
    inputElement.type = 'text';
    inputElement.value = value;

    inputElement.addEventListener('input', () => {
      const returnValue = inputElement.value;
      this.updateModifiedData(key, subKey, returnValue);
    });

    return inputElement;
  }

  // createSelectElement(key, subKey, value, typeConfig) {
  //   const selectElement = document.createElement('select');

  //   typeConfig.options.forEach(option => {
  //     const optionElement = document.createElement('option');
  //     optionElement.value = option.value;
  //     optionElement.textContent = option.label;
  //     optionElement.selected = option.value === value;
  //     selectElement.appendChild(optionElement);
  //   });

  //   selectElement.addEventListener('change', () => {
  //     this.updateModifiedData(key, subKey, selectElement.value);
  //   });

  //   return selectElement;
  // }

  updateModifiedData(key, subKey, value) {
    if (subKey) {
      if (!this.modifiedData[key]) {
        this.modifiedData[key] = {};
      }
      this.modifiedData[key][subKey] = value;
    } else {
      this.modifiedData[key] = value;
    }
  }
}

export default DynamicTable;
