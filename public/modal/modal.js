// ModalModule.js
import { DataParser, DataParserStructured } from './dataparser.js';
import {createImageSelector}  from './imageSelector.js';

export class ModalModule {
    constructor(buttonClass, htmlPath, cssPath, setupCallback, dataCallback, onOpenCallback) {
        this.buttonClass = buttonClass;
        this.htmlPath = htmlPath;
        this.cssPath = cssPath;
        this.setupCallback = setupCallback;
        this.dataCallback = dataCallback;
        this.onOpenCallback = onOpenCallback; // Nueva función de callback
        this.modal = null;
        this.isSetupDone = false;
        this.customSelectors = {};
        this.modalId = `modal_${Math.random().toString(36).substr(2, 9)}`;
        this.init();
        this.initPromise = this.init();
    }
    async init() {
        try {
            await this.loadCSS();
            await this.createModal();
            this.addEventListeners();
            if (this.setupCallback) {
                await this.setupCallback(this);
                this.isSetupDone = true;
            }
        } catch (error) {
            console.error('Error initializing modal:', error);
        }
    }

    async loadCSS() {
        try {
            const response = await fetch(this.cssPath);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const cssContent = await response.text();
            const style = document.createElement('style');
            style.textContent = cssContent;
            document.head.appendChild(style);
        } catch (error) {
            console.error('Error loading CSS:', error);
        }
    }
    async setupImageSelector(containerId, options, onChange, initialSelectedValue = null) {
        console.log('setupImageSelector called'); // Añade esta línea

        if (this.modal) {
            const container = this.modal.querySelector(`#${containerId}`);
            if (container) {
                this.imageSelector = createImageSelector(containerId, options, onChange, initialSelectedValue);
            } else {
                console.error(`Container with ID ${containerId} not found in modal`);
            }
        } else {
            console.error('Modal not initialized');
        }
    }
    async createModal() {
        try {
            const response = await fetch(this.htmlPath);
            const htmlContent = await response.text();
            this.modal = document.createElement('div');
            this.modal.id = this.modalId;
            this.modal.className = 'modalwindow';
            this.modal.innerHTML = `
                <div class="contenido-modal">
                    <span class="cerrarmodal">❌</span>
                    ${htmlContent}
                </div>
            `;
            document.body.appendChild(this.modal);
            this.closeButtons = this.modal.querySelectorAll('.cerrarmodal');
            this.extraclose = this.modal.querySelectorAll('.closeModal');
        } catch (error) {
            console.error('Error creating modal:', error);
        }
    }
    async openWithCustomAction(customAction) {
        await this.open();
        if (typeof customAction === 'function') {
            await customAction(this);
        }
    }
    async executeAndClose(action) {
        try {
            if (typeof action === 'function') {
                await action(this);
            }
        } finally {
            this.close();
        }
    }
    addEventListeners() {
        document.querySelectorAll(`.${this.buttonClass}`).forEach(button => {
            button.addEventListener('click', () => this.open());
        });

        [...this.closeButtons, ...this.extraclose].forEach(button => {
            button.addEventListener('click', () => this.close());
        });

        window.addEventListener('click', (event) => {
            if (event.target === this.modal) this.close();
        });
    }

    createCustomSelector(options) {
        const selector = new CustomSelector(options, this.modal);
        this.customSelectors[options.id] = selector;
        return selector;
    }
    async waitForInitialization() {
        await this.initPromise;
        return this;
    }
    async open(customAction) {
        if (this.modal) {
            this.modal.style.display = 'flex';
            if (this.onOpenCallback) {
                await this.onOpenCallback(this);
            }
            // Inicializar los selectores personalizados
            Object.values(this.customSelectors).forEach(selector => selector.initialize());
            
            // Ejecutar la acción personalizada si se proporciona
            if (typeof customAction === 'function') {
                await customAction(this);
            }
        }
    }

    close() {
        if (this.modal) {
            this.modal.style.display = 'none';
        }
    }

    addCustomEventListener(selector, eventType, callback) {
        this.modal.querySelectorAll(selector).forEach(element => {
            element.addEventListener(eventType, callback);
        });
    }

    captureData(options = {}) {
        const parser = new DataParserStructured(this.modal, options);
        return parser.parseStructured();
    }
}
class CustomSelector {
    constructor(options, modalElement) {
        this.options = options;
        this.modalElement = modalElement;
        this.selectedItem = null;
        this.items = [];
        this.selectorElement = null;
        this.isOpen = false;
        this.isInitialized = false;
    }

    initialize() {
        if (this.isInitialized) return;
        this.createSelectorButton();
        this.createSelectorElement();
        this.addEventListeners();
        this.isInitialized = true;
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
        input.parentNode.insertBefore(button, input.nextSibling);
    }

    createSelectorElement() {
        this.selectorElement = document.createElement('div');
        this.selectorElement.className = 'custom-selector';
        this.selectorElement.style.display = 'none';
        this.selectorElement.innerHTML = `
            <h2>${this.options.title || 'Seleccionar'}</h2>
            <div id="custom-options-${this.options.id}"></div>
        `;
        this.modalElement.querySelector('.contenido-modal').appendChild(this.selectorElement);
    }

    addEventListeners() {
        const button = this.modalElement.querySelector(`#${this.options.id}-button`);
        button.addEventListener('click', () => this.toggleSelector());
    }

    async toggleSelector() {
        if (this.isOpen) {
            this.selectorElement.style.display = 'none';
        } else {
            await this.populateOptions();
            this.selectorElement.style.display = 'block';
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
            optionElement.innerHTML = this.options.renderOptionFunction(item);
            optionElement.dataset.index = index;
            optionElement.addEventListener('click', () => this.selectOption(optionElement));
            optionsContainer.appendChild(optionElement);
        });
    }

    selectOption(optionElement) {
        const prevSelected = this.selectorElement.querySelector('.custom-option.selected');
        if (prevSelected) prevSelected.classList.remove('selected');
        optionElement.classList.add('selected');
        const index = parseInt(optionElement.dataset.index);
        this.selectedItem = this.items[index];
        const input = this.modalElement.querySelector(this.options.inputSelector);
        if (input) {
            this.options.onSelectFunction(input, this.selectedItem);
        }
        this.toggleSelector();
    }
}
// export {ModalModule};
