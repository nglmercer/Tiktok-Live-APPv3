function createCell(value, type) {
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
          'imageUrl': 'imageUrl',
          'Last Activity': 'lastActivity'
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
      const currentTime = new Date().toISOString();

      if (existingUser) {
          existingUser.points += userData.points;
          existingUser.lastActivity = currentTime;
          this.updateUserRow(existingUser);
      } else {
          const newUser = {
              ...userData,
              lastActivity: currentTime
          };
          this.users.push(newUser);
          this.copyOfUsers.push(newUser);
          this.renderTable();
      }
  }

  updateUserRow(user) {
      const row = this.table.querySelector(`tr[data-nickname="${user[this.columnMap['nickname']]}"]`);
      if (row) {
          row.innerHTML = '';
          this.th.forEach(thText => {
              const cellType = this.getCellType(thText);
              row.appendChild(createCell(user[this.columnMap[thText]], cellType));
          });
      }
  }

  getCellType(thText) {
      switch (thText.toLowerCase()) {
          case 'points':
              return 'number';
          case 'imageurl':
              return 'image';
          case 'last activity':
              return 'date';
          default:
              return 'string';
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
          const row = document.createElement('tr');
          row.dataset.nickname = user[this.columnMap['nickname']];

          this.th.forEach(thText => {
              const cellType = this.getCellType(thText);
              row.appendChild(createCell(user[this.columnMap[thText]], cellType));
          });

          this.table.appendChild(row);
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
