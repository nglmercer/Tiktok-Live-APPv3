class ButtonGrid {
  constructor(containerId, gridWidth, gridHeight, rows, cols, callbackondelete, callbackonedit) {
      this.containerId = containerId;
      this.gridWidth = gridWidth;
      this.gridHeight = gridHeight;
      this.rows = rows;
      this.cols = cols;
      this.buttons = [];
      this.editMode = false;
      this.grid = [];
      this.callbackondelete = callbackondelete;
      this.callbackonedit = callbackonedit; // Añadir callback para edición
      this.init();
  }

  init() {
      const container = document.getElementById(this.containerId);
      container.style.display = 'grid';
      container.style.width = '100%';
      container.style.height = '90vh';
      container.style.gridTemplateColumns = `repeat(${this.cols}, minmax(${this.gridWidth}px, 1fr))`;
      container.style.gridTemplateRows = `repeat(${this.rows}, minmax(${this.gridHeight}px, 1fr))`;
      container.style.gap = '1px';
      container.style.padding = '1px';

      for (let i = 0; i < this.rows * this.cols; i++) {
          const cell = document.createElement('div');
          cell.className = 'grid-cell';
          cell.style.width = '100%';
          cell.style.height = '100%';
          cell.dataset.index = i;

          cell.addEventListener('dragover', (e) => e.preventDefault());
          cell.addEventListener('drop', (e) => this.handleDrop(e, cell));

          container.appendChild(cell);
          this.grid.push(cell);
      }

      this.createTrashZone();
  }

  addButtons(options) {
      const savedLayout = this.loadFromLocalStorage();

      options.forEach(option => {
          const savedButton = savedLayout.find(b => b.id === option.id);
          if (savedButton) {
              this.createButton(option, savedButton.position);
          } else {
              this.createButton(option);
          }
      });
  }

  editButton(id, newText, newColor) {
      const button = this.buttons.find(b => b.element.id === id);
      if (button) {
          button.element.textContent = newText;
          button.element.style.backgroundColor = newColor;
          if (this.callbackonedit) {
              this.callbackonedit({ id, newText, newColor });
          }
          this.saveToLocalStorage();
      } else {
          console.error('No se encontró el botón con id:', id);
      }
  }

  findNextAvailablePosition() {
      for (let i = 0; i < this.grid.length; i++) {
          if (!this.grid[i].hasChildNodes()) {
              return i;
          }
      }
      return -1; // No positions available
  }

  createButton(option, position = null) {
      const Buttondiv = document.createElement('div');
      const button = document.createElement('button');
      Buttondiv.id = `button-${option.id}`;
      button.id = `button-${option.id}`;
      button.className = 'grid-button';
      Buttondiv.className = 'grid-button';
      button.textContent = option.text;
      button.value = option.value;
      button.draggable = this.editMode;

      button.addEventListener('click', () => option.callback(option.value, option.data));
      button.addEventListener('dragstart', this.handleDragStart.bind(this));
      button.addEventListener('dragend', this.handleDragEnd.bind(this));

      const buttondelete = document.createElement('button');
      buttondelete.className = 'delete-button';
      buttondelete.textContent = 'x';
      buttondelete.style.display = this.editMode ? 'block' : 'none';
      buttondelete.addEventListener('click', (e) => {
          e.stopPropagation();
          this.deleteButton(button.id);
      });

      const buttonedit = document.createElement('button');
      buttonedit.className = 'edit-button';
      buttonedit.textContent = '✎';
      buttonedit.style.display = this.editMode ? 'block' : 'none';
      buttonedit.addEventListener('click', (e) => {
          e.stopPropagation();
          this.callbackonedit(option);
      });

      if (position === null) {
          position = this.findNextAvailablePosition();
      }

      Buttondiv.appendChild(button);
      Buttondiv.appendChild(buttondelete);
      Buttondiv.appendChild(buttonedit);

      if (position !== -1 && this.grid[position]) {
          this.grid[position].appendChild(Buttondiv);
          this.buttons.push({ element: Buttondiv, position: position, id: option.id });
      } else {
          console.warn('No space available for button:', option.text);
      }

      this.saveToLocalStorage();
  }

  handleDragStart(event) {
      event.dataTransfer.setData('text/plain', event.target.parentNode.id);
      document.getElementById('trash-zone').style.display = 'block';
  }

  handleDragEnd(event) {
      document.getElementById('trash-zone').style.display = 'none';
      this.saveToLocalStorage();
  }

  handleDrop(event, cell) {
      event.preventDefault();
      const buttonDivId = event.dataTransfer.getData('text/plain');
      const buttonDiv = document.getElementById(buttonDivId);
      if (buttonDiv && !cell.hasChildNodes()) {
          cell.appendChild(buttonDiv);
          const buttonIndex = this.buttons.findIndex(b => b.element.id === buttonDivId);
          if (buttonIndex !== -1) {
              this.buttons[buttonIndex].position = parseInt(cell.dataset.index);
          }
          this.saveToLocalStorage();
      }
  }

  createTrashZone() {
      const trashZone = document.createElement('div');
      trashZone.id = 'trash-zone';
      trashZone.className = 'trash-zone';
      trashZone.textContent = '🗑️ Drop here to delete';
      trashZone.style.display = 'none';
      trashZone.addEventListener('dragover', event => event.preventDefault());
      trashZone.addEventListener('drop', this.handleTrashDrop.bind(this));
      document.body.appendChild(trashZone);
  }

  handleTrashDrop(event) {
      event.preventDefault();
      const id = event.dataTransfer.getData('text/plain');
      this.deleteButton(id);
  }

  deleteButton(id) {
      const buttonIndex = this.buttons.findIndex(b => b.element.id === id);
      if (buttonIndex !== -1) {
          const button = this.buttons[buttonIndex].element;
          this.callbackondelete(id);
          if (button.parentNode) {
              button.parentNode.removeChild(button);
          }
          this.buttons.splice(buttonIndex, 1);
          this.saveToLocalStorage();
      }
  }

  toggleEditMode() {
      this.editMode = !this.editMode;
      const editButtons = document.querySelectorAll('.edit-button');
      const deleteButtons = document.querySelectorAll('.delete-button');

      this.buttons.forEach(button => {
          button.element.querySelector('button').draggable = this.editMode;
      });

      if (this.editMode) {
          editButtons.forEach(button => button.style.display = 'block');
          deleteButtons.forEach(button => button.style.display = 'block');
      } else {
          editButtons.forEach(button => button.style.display = 'none');
          deleteButtons.forEach(button => button.style.display = 'none');
      }
  }

  saveToLocalStorage() {
      const layout = this.buttons.map(button => ({
          id: button.id,
          position: button.position,
          text: button.element.textContent,
          value: button.element.value
      }));
      localStorage.setItem('buttonGridLayout', JSON.stringify(layout));
  }

  loadFromLocalStorage() {
      const layout = JSON.parse(localStorage.getItem('buttonGridLayout')) || [];
      return layout;
  }

  updateButtons(options) {
      const newButtonMap = new Map(options.map(option => [option.id, option]));

      this.buttons = this.buttons.filter(button => {
          if (newButtonMap.has(button.id)) {
              const newOption = newButtonMap.get(button.id);
              button.element.textContent = newOption.text;
              button.element.value = newOption.value;

              button.element.onclick = () => newOption.callback(newOption.value);

              newButtonMap.delete(button.id);
              return true;
          } else {
              if (button.element.parentNode) {
                  button.element.parentNode.removeChild(button.element);
              }
              return false;
          }
      });

      newButtonMap.forEach(option => {
          this.createButton(option);
      });

      this.saveToLocalStorage();
      this.parseGridPositions();
  }

  parseGridPositions() {
      this.grid.forEach((cell, index) => {
          if (cell.hasChildNodes()) {
              const buttonId = cell.firstChild.id;
              const buttonIndex = this.buttons.findIndex(b => b.element.id === buttonId);
              if (buttonIndex !== -1) {
                  this.buttons[buttonIndex].position = index;
              }
          }
      });
      this.saveToLocalStorage();
  }
}

export { ButtonGrid };
