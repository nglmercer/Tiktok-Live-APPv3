class UserRow {
  constructor(columns, rowData, onRowAction) {
    this.columns = columns;
    this.rowData = rowData;
    this.onRowAction = null; // Callback   this.onRowAction = onRowAction;
    this.element = null; // Referencia al elemento <tr> de la fila
  }

  // Método para renderizar la fila y devolver el elemento <tr>
  render() {
    const tr = document.createElement('tr');
    this.columns.forEach(column => {
      const td = document.createElement('td');
      const value = this.rowData[column.key];

      switch (column.type) {
        case 'image':
          const img = document.createElement('img');
          img.src = value;
          img.style.width = '50px';
          img.style.height = '50px';
          td.appendChild(img);
          break;
        case 'date':
          td.textContent = new Date(value).toLocaleString();
          break;
        default:
          td.textContent = value;
      }

      tr.appendChild(td);
    });
    if (this.onRowAction){
          // Botón para ejecutar la acción de fila (eliminar, modificar, etc.)
          const actionButton = document.createElement('button');
          actionButton.textContent = 'Acción';
          actionButton.addEventListener('click', () => this.onRowAction(this.rowData)); // Ejecuta el callback con los datos de la fila
          const td = document.createElement('td');
          td.appendChild(actionButton);
          tr.appendChild(td);
    }


    this.element = tr; // Almacena la referencia al elemento <tr>
    return tr;
  }
}

export class newTable {
  constructor(containerId, columns, data = [], rowActionCallback = () => {}) {
    this.container = document.getElementById(containerId);
    this.columns = columns;
    this.data = data;
    this.rows = []; // Almacena las instancias de UserRow
    this.sortedColumn = null;
    this.sortDirection = 'asc';
    this.rowActionCallback = rowActionCallback; // Callback que se ejecutará cuando se interactúe con una fila

    this.render();
  }

  render() {
    // Limpiar contenedor
    this.container.innerHTML = '';

    // Crear tabla
    const table = document.createElement('table');
    table.classList.add('sortable-table');

    // Crear encabezado
    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    this.columns.forEach(column => {
      const th = document.createElement('th');
      th.textContent = column.label;
      th.dataset.column = column.key;
      th.addEventListener('click', () => this.sortByColumn(column.key));
      headerRow.appendChild(th);
    });

    // Crear cuerpo de tabla
    this.tbody = document.createElement('tbody');
    table.appendChild(this.tbody);
    this.container.appendChild(table);

    // Renderizar filas
    this.renderRows();
  }

  renderRows() {
    // Limpiar el cuerpo de la tabla
    this.tbody.innerHTML = '';
    this.rows = []; // Vaciar la lista de filas (UserRow)

    // Delegar la creación de filas a UserRow
    this.data.forEach(rowData => {
      const userRow = new UserRow(this.columns, rowData, this.rowActionCallback);
      const renderedRow = userRow.render();
      this.rows.push(userRow); // Almacenar la instancia de UserRow
      this.tbody.appendChild(renderedRow); // Agregar la fila a tbody
    });
  }

  addRow(rowData) {
    const userRow = new UserRow(this.columns, rowData, this.rowActionCallback);
    const renderedRow = userRow.render();
    this.rows.push(userRow); // Agregar la nueva instancia a la lista
    this.tbody.appendChild(renderedRow); // Agregar la nueva fila al cuerpo de la tabla
    this.data.push(rowData); // Agregar los datos al array de datos
  }

  // Método que busca y modifica/elimina fila por data usando el callback
  modifyRowByData(dataToModify, callback) {
    // Encontrar la fila que coincide con los datos
    const rowIndex = this.data.findIndex(row => row.id === dataToModify.id); // Asumiendo que la clave 'id' es única
    if (rowIndex !== -1) {
      callback(this.rows[rowIndex], rowIndex); // Ejecutar el callback con la fila encontrada y su índice
    }
  }

  clearTable() {
    // Limpiar el cuerpo de la tabla
    this.tbody.innerHTML = '';
    this.data = []; // Vaciar los datos almacenados
    this.rows = []; // Vaciar las instancias de filas
  }

  sortByColumn(columnKey) {
    if (this.sortedColumn === columnKey) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortedColumn = columnKey;
      this.sortDirection = 'asc';
    }

    const columnConfig = this.columns.find(col => col.key === columnKey);
    this.data.sort((a, b) => {
      if (columnConfig.type === 'number') {
        return this.sortDirection === 'asc' ? a[columnKey] - b[columnKey] : b[columnKey] - a[columnKey];
      }
      const valueA = a[columnKey].toString().toLowerCase();
      const valueB = b[columnKey].toString().toLowerCase();
      return this.sortDirection === 'asc'
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    });

    this.renderRows();
  }

  clearAndAddRows(newData) {
    this.clearTable(); // Limpiar la tabla actual
    this.data = newData; // Añadir nuevos datos
    this.renderRows(); // Renderizar las nuevas filas
  }
}
