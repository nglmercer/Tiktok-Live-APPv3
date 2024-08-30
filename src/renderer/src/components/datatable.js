class DynamicTable {
  constructor(containerSelector, callback, config = {}) {
    this.container = document.querySelector(containerSelector);
    this.config = config;
    this.columns = this.getOrderedColumns(config); // Establece las columnas en el orden deseado
    this.callback = callback;
    this.table = document.createElement('table');
    this.table.classList.add('dynamic-table');
    this.container.appendChild(this.table);

    this.createHeader();
  }

  getOrderedColumns(config) {
    let columns = Object.keys(config);

    if (config.order) {
      columns = config.order.concat(columns.filter(col => !config.order.includes(col)));
    }
    return columns;
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
    const row = new DynamicRow(this.table, data, this.columns, this.config, this.callback);
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
}

class DynamicRow {
  constructor(table, data, columns, config, callback) {
    this.table = table;
    this.data = data;
    this.columns = columns;
    this.config = config;
    this.callback = callback;
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
      const inputElement = this.createInputElement(key, value, typeConfig);

      if (inputElement) { // Aseguramos que no sea undefined o null
        cell.appendChild(inputElement);
      } else {
        cell.textContent = value !== undefined ? value : ''; // Muestra el valor directamente si no se puede crear un input
      }
    });

    const actionCell = row.insertCell(cellIndex);
    const actionButton = document.createElement('button');
    actionButton.textContent = 'Acción';
    actionButton.addEventListener('click', () => {
      console.log(`Acción ejecutada en la fila ${row.rowIndex}`, this.data);
      this.callback(row.rowIndex, this.data);
    });
    actionCell.appendChild(actionButton);
  }

  createInputElement(key, value, typeConfig) {
    if (value === undefined) return null; // Maneja el caso donde el valor es undefined

    let inputElement;

    if (typeConfig) {
      switch (typeConfig.type) {
        case 'slider':
          inputElement = this.createSliderElement(value, typeConfig);
          break;
        case 'checkbox':
          inputElement = this.createCheckboxElement(value);
          break;
        case 'number':
          inputElement = this.createNumberElement(value);
          break;
        case 'string':
          inputElement = this.createTextElement(value);
          break;
        case 'object':
          inputElement = this.createSelectElement(value, typeConfig);
          break;
        default:
          inputElement = document.createTextNode(value !== undefined ? value : '');
      }
    }

    return inputElement || document.createTextNode(''); // Retorna un nodo de texto vacío si no se creó ningún input
  }

  createSliderElement(value, typeConfig) {
    const inputElement = document.createElement('input');
    inputElement.type = 'range';
    inputElement.min = typeConfig.min || 0;
    inputElement.max = typeConfig.max || 100;
    inputElement.value = value;

    inputElement.addEventListener('input', () => {
      const returnValue = typeConfig.returnType === 'number' ? Number(inputElement.value) : inputElement.value;
      this.callback(key, returnValue, this.data);
    });

    return inputElement;
  }

  createCheckboxElement(value) {
    const inputElement = document.createElement('input');
    inputElement.type = 'checkbox';
    inputElement.checked = value;

    inputElement.addEventListener('change', () => {
      this.callback(key, inputElement.checked, this.data);
    });

    return inputElement;
  }

  createNumberElement(value) {
    const inputElement = document.createElement('input');
    inputElement.type = 'number';
    inputElement.value = value;

    inputElement.addEventListener('input', () => {
      this.callback(key, Number(inputElement.value), this.data);
    });

    return inputElement;
  }

  createTextElement(value) {
    const inputElement = document.createElement('input');
    inputElement.type = 'text';
    inputElement.value = value;

    inputElement.addEventListener('input', () => {
      this.callback(value, inputElement.value, this.data);
    });

    return inputElement;
  }

  createSelectElement(value, typeConfig) {
    const inputElement = document.createElement('select');

    Object.keys(value).forEach((optionKey) => {
      const option = document.createElement('option');
      option.value = JSON.stringify(value[optionKey]);
      option.text = value[optionKey].name || optionKey;
      inputElement.appendChild(option);
    });

    inputElement.addEventListener('change', () => {
      this.callback(key, JSON.parse(inputElement.value), this.data);
    });

    return inputElement;
  }
}


export default DynamicTable;
