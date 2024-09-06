class UserRow {
  constructor(user, columnMap, th) {
    this.user = user;
    this.columnMap = columnMap;
    this.th = th;
    this.row = document.createElement('tr');
    this.row.dataset.nickname = user[columnMap['nickname']];
    this.render();
  }

  getCellType(thText) {
    switch (thText.toLowerCase()) {
      case 'points':
        return 'number';
      case 'imageurl':
        return 'image';
      default:
        return 'string';
    }
  }

  createCell(value, type) {
    const cell = document.createElement('td');

    switch (type) {
      case 'number':
        cell.textContent = value;
        break;
      case 'image':
        if (value) {
          const img = document.createElement('img');
          img.src = value;
          img.alt = 'Image';
          img.style.width = '50px';
          img.style.height = '50px';
          img.style.borderRadius = '50%';
          cell.appendChild(img);
        }
        break;
      case 'date':
        cell.textContent = new Date(value).toLocaleString();
        break;
      default:
        cell.textContent = value;
        break;
    }

    return cell;
  }

  render() {
    this.row.innerHTML = '';
    this.th.forEach(thText => {
      const cellType = this.getCellType(thText);
      this.row.appendChild(this.createCell(this.user[this.columnMap[thText]], cellType));
    });
  }

  update(user) {
    this.user = user;
    this.render();
  }
}

export class UserPointsTable {
  constructor(tableId, options, initialData = []) {
    this.tableId = tableId;
    this.table = document.getElementById(tableId).querySelector('tbody');
    this.users = [];
    this.filteredUsers = [];
    this.copyOfUsers = [];
    this.currentSort = { column: options.th[2], direction: 'desc' };
    this.initialVisibleUsers = options.initialVisibleUsers || 10;
    this.maxVisibleUsers = options.maxVisibleUsers || 10;
    this.th = options.th;

    // Mapeo de columnas a propiedades de datos
    this.columnMap = {
      nickname: 'nickname',
      username: 'nickname', // Si decides usar 'username' en la tabla, seguirá refiriéndose a 'nickname' en los datos
      points: 'points',
      imageUrl: 'imageUrl',
      userId: 'userId',
    };

    this.renderHeader();

    // Carga de datos iniciales
    if (initialData.length > 0) {
      initialData.forEach(userData => this.addUser(userData, false));
    }

    this.loadMoreUsers();
  }

  renderHeader() {
    const thead = this.table.closest('table').querySelector('thead');
    thead.innerHTML = '';
    const row = document.createElement('tr');

    this.th.forEach(thText => {
      const th = document.createElement('th');
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'search-input';
      input.placeholder = `Buscar ${thText}`;
      input.oninput = () => this.filterUsers(input.value, thText);

      th.appendChild(input);
      row.appendChild(th);
    });

    thead.appendChild(row);
  }

  addUser(userData) {
    const existingUser = this.users.find(u => u[this.columnMap['nickname']] === userData[this.columnMap['nickname']]);

    if (existingUser) {
      existingUser.points += userData.points;
      this.updateUserRow(existingUser);
    } else {
      const newUser = {
        ...userData,
      };
      this.users.push(newUser);
      this.copyOfUsers.push(newUser);
      this.renderTable();
    }
  }

  updateUserRow(user) {
    const rowElement = this.table.querySelector(`tr[data-nickname="${user[this.columnMap['nickname']]}"]`);
    if (rowElement) {
      const userRow = new UserRow(user, this.columnMap, this.th);
      rowElement.innerHTML = userRow.row.innerHTML;
    }
  }

  sortUsers(column) {
    if (this.currentSort.column === column) {
      this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
      this.currentSort.column = column;
      this.currentSort.direction = 'asc';
    }

    const columnKey = this.columnMap[column];
    this.users.sort((a, b) => {
      let comparison = 0;
      if (a[columnKey] > b[columnKey]) {
        comparison = 1;
      } else if (a[columnKey] < b[columnKey]) {
        comparison = -1;
      }
      return this.currentSort.direction === 'asc' ? comparison : -comparison;
    });

    this.renderTable();
  }

  filterUsers(searchTerm, column) {
    const columnKey = this.columnMap[column];
    this.filteredUsers = this.copyOfUsers.filter(user =>
      user[columnKey].toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
    this.renderTable(true);
  }

  renderTable(isFiltered = false) {
    this.table.innerHTML = '';

    const usersToRender = isFiltered ? this.filteredUsers : this.users.slice(0, this.initialVisibleUsers);

    usersToRender.forEach(user => {
      const userRow = new UserRow(user, this.columnMap, this.th);
      this.table.appendChild(userRow.row);
    });

    // Crear botón para cargar más usuarios si no se ha alcanzado el máximo
    if (!isFiltered && this.users.length > this.initialVisibleUsers) {
      const loadMoreRow = document.createElement('tr');
      const loadMoreCell = document.createElement('td');
      loadMoreCell.colSpan = this.th.length;

      const loadMoreButton = document.createElement('button');
      loadMoreButton.textContent = 'Cargar más usuarios';
      loadMoreButton.onclick = () => this.loadMoreUsers();

      loadMoreCell.appendChild(loadMoreButton);
      loadMoreRow.appendChild(loadMoreCell);
      this.table.appendChild(loadMoreRow);
    }
  }

  loadMoreUsers() {
    this.initialVisibleUsers += this.maxVisibleUsers;
    this.renderTable();
  }
}
export class StaticTable {
  constructor(containerSelector, config = {}) {
    this.container = document.querySelector(containerSelector);
    this.config = config;
    this.columns = this.getOrderedColumns(config); // Establece las columnas en el orden deseado
    this.table = document.createElement('table');
    this.table.classList.add('static-table');
    this.container.appendChild(this.table);
    this.canClear = true; // Bandera para controlar la limpieza
    this.createHeader();

  }

  getOrderedColumns(config) {
    return Object.keys(config);
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
  }

  addRow(data) {
    const row = this.table.insertRow();
    let cellIndex = 0;

    this.columns.forEach((key) => {
      const typeConfig = this.config[key];

      if (typeConfig && typeConfig.hidden) {
        return;
      }

      const cell = row.insertCell(cellIndex++);
      const value = data[key];

      if (typeConfig && typeConfig.type === 'object') {
        const objectContainer = document.createElement('div');
        Object.keys(typeConfig).forEach(subKey => {
          if (subKey === 'type') return;

          const subValue = value ? value[subKey] : undefined;
          const contentElement = this.createContentElement(subValue, typeConfig[subKey]);
          if (contentElement) {
            const wrapper = document.createElement('div');
            wrapper.appendChild(contentElement);
            objectContainer.appendChild(wrapper);
          }
        });
        cell.appendChild(objectContainer);
      } else {
        const contentElement = this.createContentElement(value, typeConfig);
        if (contentElement) {
          cell.appendChild(contentElement);
        } else {
          cell.textContent = value !== undefined ? value : '';
        }
      }
    });
  }

  createContentElement(value, typeConfig) {
    if (value === undefined) return null;

    let element;

    switch (typeConfig?.type) {
      case 'image':
        element = document.createElement('img');
        element.src = value;
        element.alt = 'Image';
        element.style.width = '50px';
        element.style.height = '50px';
        element.style.borderRadius = '50%';
        break;
      case 'number':
        element = document.createTextNode(value);
        break;
      case 'date':
        element = document.createTextNode(new Date(value).toLocaleString());
        break;
      default:
        element = document.createTextNode(value);
    }

    return element || document.createTextNode('');
  }

  clearRows() {
    while (this.table.rows.length > 1) { // Mantiene el encabezado de la tabla
      this.table.deleteRow(1);
    }
  }

  clearAndAddRows(data,clearInterval = 1000) {
    if (this.canClear) {
      this.clearRows(); // Limpiar antes de añadir nuevas filas
      this.canClear = false; // Desactivar la limpieza por 10 segundos
      setTimeout(() => {
        this.canClear = true; // Reactivar la limpieza después de 10 segundos
      }, clearInterval);
    }
    this.addRow(data)
  }
}
