class CustomSelector {
    constructor(options, modalElement) {
        this.options = options;
        this.modalElement = modalElement;
        this.selectedItems = []; // Cambiar a un array para selección múltiple
        this.items = [];
        this.selectorElement = null;
        this.referenceImage = null;
        this.isOpen = false;
        this.isInitialized = false;
        this.customClass = options.customClass || '';
        this.boundOutsideClickListener = this.handleOutsideClick.bind(this);
        this.acceptButton = null;
    }

    initialize() {
        if (this.isInitialized) return;
        this.createSelectorButton();
        this.createSelectorElement();
        this.createReferenceImage();
        this.addEventListeners();
        this.isInitialized = true;
    }

    createSelectorElement() {
        this.selectorElement = document.createElement('div');
        this.selectorElement.className = `custom-selector ${this.customClass}`.trim();
        this.selectorElement.style.display = 'none';
        this.selectorElement.innerHTML = `
            <h2>${this.options.title || 'Seleccionar'}</h2>
            <input type="text" class="custom-selector-search" placeholder="Buscar...">
            <div id="custom-options-${this.options.id}" class="custom-options"></div>
            <button id="accept-button-${this.options.id}" class="accept-button" style="display: none;">Aceptar</button>
        `;

        const button = this.modalElement.querySelector(`#${this.options.id}-button`);
        button.parentNode.insertBefore(this.selectorElement, button.nextSibling);

        this.acceptButton = this.selectorElement.querySelector(`#accept-button-${this.options.id}`);
        this.acceptButton.addEventListener('click', (e) => {
            e.preventDefault();
            this.acceptSelection();
        });

        const searchInput = this.selectorElement.querySelector('.custom-selector-search');
        searchInput.addEventListener('input', () => this.filterOptions(searchInput.value));
    }

    createSelectorButton() {
        const input = this.modalElement.querySelector(this.options.inputSelector);
        if (!input) {
            console.error(`Input with selector ${this.options.inputSelector} not found`);
            return;
        }
        const button = document.createElement('button');
        button.textContent = 'Seleccionar';
        button.type = 'button';
        button.id = `${this.options.id}-button`;
        button.className = this.options.buttonClass;
        input.parentNode.insertBefore(button, input.nextSibling);
    }

    addEventListeners() {
        const button = this.modalElement.querySelector(`#${this.options.id}-button`);
        button.addEventListener('click', () => this.toggleSelector());
    }

    toggleSelector() {
        if (this.isOpen) {
            this.selectorElement.style.display = 'none';
            document.removeEventListener('click', this.boundOutsideClickListener);
            this.acceptButton.style.display = 'none';
        } else {
            this.populateOptions();
            this.selectorElement.style.display = 'block';
            setTimeout(() => {
                document.addEventListener('click', this.boundOutsideClickListener);
            }, 0);
        }
        this.isOpen = !this.isOpen;
    }

    async populateOptions() {
        this.items = await this.options.getItemsFunction();
        const optionsContainer = this.selectorElement.querySelector(`#custom-options-${this.options.id}`);
        optionsContainer.innerHTML = '';

        this.items.forEach((item, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = 'custom-option';
            optionElement.innerHTML = `
                <input type="checkbox" id="checkbox-${this.options.id}-${index}" class="custom-option-checkbox">
                ${this.options.renderOptionFunction(item)}
            `;
            optionElement.dataset.index = index;
            optionElement.addEventListener('click', (e) => this.selectOption(optionElement, e));
            optionsContainer.appendChild(optionElement);
        });
    }

    selectOption(optionElement, event) {
        const index = parseInt(optionElement.dataset.index);
        const item = this.items[index];
        const checkbox = optionElement.querySelector(`.custom-option-checkbox`);

        if (checkbox.checked) {
            this.selectedItems.push(item);
        } else {
            this.selectedItems = this.selectedItems.filter(selected => selected !== item);
        }

        if (this.selectedItems.length > 0) {
            this.acceptButton.style.display = 'block';
        } else {
            this.acceptButton.style.display = 'none';
        }
    }

    acceptSelection() {
        const input = this.modalElement.querySelector(this.options.inputSelector);
        if (input) {
            const formattedValues = this.formatSelectedItems();
            this.options.onSelectFunction(input, formattedValues);
            this.updateReferenceImage(this.selectedItems);
        }
        this.toggleSelector();
    }

    formatSelectedItems() {
        const formattedItems = this.selectedItems.map(item => {
            switch (this.options.returnType) {
                case 'boolean':
                    return Boolean(item.value);
                case 'number':
                    return Number(item.value);
                case 'array':
                    return item.value;
                case 'string':
                default:
                    return String(item.value);
            }
        });

        return this.options.returnType === 'array' ? formattedItems : formattedItems.join(', ');
    }

    createReferenceImage() {
        this.referenceImage = document.createElement('img');
        this.referenceImage.className = 'custom-selector-reference-image';
        this.referenceImage.id = `${this.options.id}-reference-image`;
        this.referenceImage.style.display = 'none';

        const input = this.modalElement.querySelector(this.options.inputSelector);
        input.parentNode.insertBefore(this.referenceImage, this.selectorElement);
    }

    updateReferenceImage(items) {
        if (items && items.length && items[0].image) {
            this.referenceImage.src = items[0].image.url_list[0];
            this.referenceImage.style.display = 'inline';
        } else {
            this.referenceImage.style.display = 'none';
        }
    }

    handleOutsideClick(event) {
        if (this.selectorElement && !this.selectorElement.contains(event.target) && !event.target.matches(`#${this.options.id}-button`)) {
            this.toggleSelector();
        }
    }

    filterOptions(searchTerm) {
        const optionsContainer = this.selectorElement.querySelector(`#custom-options-${this.options.id}`);
        const options = optionsContainer.querySelectorAll('.custom-option');

        options.forEach(option => {
            const text = option.textContent.toLowerCase();
            if (text.includes(searchTerm.toLowerCase())) {
                option.style.display = 'block';
            } else {
                option.style.display = 'none';
            }
        });
    }
}
