import {
  createInputField,
  createSelectField,
  createMultiSelectField,
  createColorPickerField,
  createCheckboxField,
  createSliderField,
  getFormData
} from '../formHelpers.js';

export default class FormModal {
  constructor(modalSelector, formSelector, submitButtonId, triggerButtonId) {
    this.modalSelector = modalSelector;
    this.formSelector = formSelector;
    this.submitButtonId = submitButtonId;
    this.triggerButtonElement = document.getElementById(triggerButtonId);
    this.modalElement = document.querySelector(this.modalSelector);
    this.formElement = document.querySelector(this.formSelector);

    // Verificar que los elementos se encuentren en el DOM
    if (!this.triggerButtonElement || !this.modalElement || !this.formElement) {
      console.error('Error al inicializar: No se pudieron encontrar algunos elementos del DOM.');
      return;
    }

    this.overlayElement = document.createElement('div');
    this.overlayElement.classList.add('modal-overlay');
    document.body.appendChild(this.overlayElement);

    this.setupEventListeners();
  }

  setupEventListeners() {
    const triggerButton = this.triggerButtonElement;

    triggerButton.addEventListener('click', () => this.open());

    // Ocultar la modal al hacer clic en el overlay
    this.overlayElement.addEventListener('click', () => this.close());

    // Ocultar la modal al presionar el botón de cerrar (dentro de la modal)
    const closeModalButton = this.modalElement.querySelector('.modal-close');
    if (closeModalButton) {
      closeModalButton.addEventListener('click', () => this.close());
    }
  }

  open(formConfig = [], callback = () => {}, formData = {}, shouldClear = true) {
    if (shouldClear) {
      this.renderForm(formConfig);
    } else {
      this.renderForm(formConfig, formData);
    }

    this.modalElement.classList.add('show');
    this.overlayElement.classList.add('show');

    const submitButton = document.querySelector(`#${this.submitButtonId}`);
    if (submitButton) {
      submitButton.onclick = () => {
        const data = getFormData(formConfig, this.formElement);
        callback(data);
        this.close();
      };
    }

    const actionTypeElement = this.formElement.querySelector('[name="actionType"]');
    if (actionTypeElement) {
      actionTypeElement.addEventListener('change', () => this.toggleFieldsVisibility(actionTypeElement.value));
      this.toggleFieldsVisibility(actionTypeElement.value);
    }
  }

  close() {
    this.modalElement.classList.remove('show');
    this.overlayElement.classList.remove('show');
  }

  renderForm(config, formData = {}) {
    this.formElement.innerHTML = '';

    config.forEach(field => {
      let formField;

      if (field.type === 'checkbox' && field.children) {
        formField = this.createCheckboxGroup(field);
      } else {
        switch (field.type) {
          case 'input':
            formField = createInputField(field);
            break;
          case 'select':
            formField = createSelectField(field);
            break;
          case 'multiSelect':
            formField = createMultiSelectField(field);
            break;
          case 'colorPicker':
            formField = createColorPickerField(field);
            break;
          case 'checkbox':
            formField = createCheckboxField(field);
            break;
          case 'slider':
            formField = createSliderField(field);
            break;
          default:
            console.warn(`Unsupported field type: ${field.type}`);
        }
      }

      if (formField) this.formElement.appendChild(formField);
    });

    M.FormSelect.init(this.formElement.querySelectorAll('select'));
    this.initializeFormData(config, formData); // Inicializa el formulario si hay datos
  }

  createCheckboxGroup(field) {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'input-group';

    const checkboxField = createCheckboxField({
      ...field,
      name: field.name,
      label: field.label
    });

    const childrenContainer = document.createElement('div');
    childrenContainer.className = 'children-container';
    childrenContainer.style.display = 'none';

    field.children.forEach(childField => {
      let childElement;

      switch (childField.type) {
        case 'input':
          childElement = createInputField(childField);
          break;
        case 'select':
          childElement = createSelectField(childField);
          break;
        case 'multiSelect':
          childElement = createMultiSelectField(childField);
          break;
        case 'colorPicker':
          childElement = createColorPickerField(childField);
          break;
        case 'checkbox':
          childElement = createCheckboxField(childField);
          break;
        case 'slider':
          childElement = createSliderField(childField);
          break;
        default:
          console.warn(`Unsupported field type: ${childField.type}`);
      }

      if (childElement) childrenContainer.appendChild(childElement);
    });

    checkboxField.querySelector('input').addEventListener('change', (event) => {
      childrenContainer.style.display = event.target.checked ? '' : 'none';
    });

    groupDiv.appendChild(checkboxField);
    groupDiv.appendChild(childrenContainer);

    return groupDiv;
  }

  initializeFormData(config, data = {}) {
    config.forEach(field => {
      const element = this.formElement.querySelector(`[name="${field.name}"]`);
      if (element && data[field.name] !== undefined) {
        if (field.type === 'multiSelect') {
          const checkboxes = this.formElement.querySelectorAll(`[name="${field.name}"]`);
          const selectedValues = data[field.name];

          selectedValues.forEach(selectedValue => {
            checkboxes.forEach(checkbox => {
              if (checkbox.value.toLowerCase().includes(selectedValue.toLowerCase())) {
                checkbox.checked = true;
              }
            });
          });
        } else {
          element.value = Array.isArray(data[field.name]) ? data[field.name][0] : data[field.name];

          const label = this.formElement.querySelector(`label[for="${field.name}"]`);
          if (label && element.value) {
            label.classList.add('active');
          }
        }
      }
    });
  }

  toggleFieldsVisibility(actionType) {
    const keyvalueField = this.formElement.querySelector('[name="keyvalue"]')?.closest('.input-field');
    const applicationField = this.formElement.querySelector('[name="application"]')?.closest('.input-field');

    if (actionType === 'keyPress') {
      if (keyvalueField) keyvalueField.style.display = '';
      if (applicationField) applicationField.style.display = 'none';
    } else if (actionType === 'openApp') {
      if (keyvalueField) keyvalueField.style.display = 'none';
      if (applicationField) applicationField.style.display = '';
    }
  }
}
