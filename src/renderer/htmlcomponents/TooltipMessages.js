class TooltipMessages extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Estilos y estructura inicial del tooltip
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: relative;
          display: inline-block;
        }
        .tooltip {
          visibility: hidden;
          background-color: black;
          color: #fff;
          text-align: center;
          border-radius: 5px;
          padding: 2px;
          position: absolute;
          z-index: 1;
          opacity: 0;
          max-width: 200px;
        }
        .tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          border-color: black transparent transparent transparent;
        }
        :host(:hover) .tooltip {
          visibility: visible;
          opacity: 1;
        }
      </style>
      <slot></slot>
      <div class="tooltip"></div>
    `;

    this.tooltipElement = this.shadowRoot.querySelector('.tooltip');
  }

  static get observedAttributes() {
    return ['messages', 'class'];
  }

  attributeChangedCallback(attrName, oldValue, newValue) {
    if (attrName === 'messages') {
      this.renderMessages(newValue);
    } else if (attrName === 'class') {
      this.updateClass(newValue);
    }
  }

  connectedCallback() {
    const messages = this.getAttribute('messages');
    if (messages) {
      this.renderMessages(messages);
    }
    const className = this.getAttribute('class');
    if (className) {
      this.updateClass(className);
    }
  }

  // Método para renderizar mensajes/sugerencias
  renderMessages(messages) {
    try {
      const parsedMessages = JSON.parse(messages); // Parsear si viene en formato JSON
      this.tooltipElement.innerHTML = parsedMessages.map(msg => `<p>${msg}</p>`).join('');
    } catch (error) {
      console.warn('Formato de mensajes no válido. Se esperaba un array en formato JSON.');
      this.tooltipElement.innerHTML = `<p>${messages}</p>`;
    }
  }

  // Método para actualizar la clase personalizada
  updateClass(className) {
    this.tooltipElement.className = `tooltip ${className}`;
  }
}

// Definir el nuevo componente personalizado
customElements.define('tooltip-messages', TooltipMessages);
class ToggleContent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const title = this.getAttribute('title') || 'Título';
    const customClass = this.getAttribute('class') || '';

    this.render(title, customClass);
  }

  toggleVisibility() {
    const content = this.shadowRoot.querySelector('.content');
    const isVisible = content.style.display !== 'none';
    content.style.display = isVisible ? 'none' : 'block';
    this.shadowRoot.querySelector('.toggle-button').textContent = isVisible ? 'Mostrar' : 'Ocultar';
  }

  render(title, customClass) {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          box-sizing: border-box;
          font-family: Arial, sans-serif;
        }

        .container {
          width: 100%;
          box-sizing: border-box;
          border-radius: 4px;
          overflow: hidden;
        }

        .header {
          background-color: #444;
          color: #f1f1f1;
          padding: 10px;
          cursor: pointer;
          font-size: 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .toggle-button {
          background-color: transparent;
          color: #f1f1f1;
          border: none;
          cursor: pointer;
          font-size: 16px;
          margin-left: 10px;
        }

        .content {
          display: block;
        }
      </style>
      <div class="container ${customClass}">
        <div class="header">
          <span class="title">${title}</span>
          <button class="toggle-button">Ocultar</button>
        </div>
        <div class="content">
          <slot></slot>
        </div>
      </div>
    `;

    this.shadowRoot.querySelector('.header').addEventListener('click', () => this.toggleVisibility());
  }
}

customElements.define('toggle-content', ToggleContent);
class SuggestionsComponent extends HTMLElement {
  constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.render();
  }

  render() {
      const position = this.getAttribute('position') || 'fixed';
      const buttonText = this.getAttribute('button-text') || 'Mostrar Sugerencias';
      const checkboxText = this.getAttribute('checkbox-text') || 'Mostrar Sugerencias';
      const includeCheckbox = this.getAttribute('include-checkbox') === 'true';

      this.shadowRoot.innerHTML = `
          <style>
              .suggestions-container {
                  width: 300px;
                  height: 100%;
                  max-height: 90dvh;
                  padding: 18px;
                  background-color: #252525;
                  border: 1px solid #ccc;
                  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                  display: none;
              }
              .suggestions-container.visible {
                  display: block;
              }
              .suggestions-container.fixed {
                  position: fixed;
                  top: 0px;
                  right: 0px;
              }
              .suggestions-container.relative {
                  position: absolute;
              }
              input[type="checkbox"] {
                width: 20px;
                height: 20px;
              }
              .text-opacity0-5 {
                opacity: 0.5;
              }
              .text-opacity0-8 {
                opacity: 0.8;
              }
              .text-opacity0-5:hover {
                opacity: 1;
              }
              .text-opacity0-8:hover {
                opacity: 1;
              }
          </style>
          <div class="suggestions-container ${position}" id="suggestions">
              <span style="font-size: auto; font-weight: bold; color: #689ff7;">Reemplazar valores(Parametros)</span>
              <table style="width: 100%; border-collapse: collapse; max-height: 100%; overflow-y: auto; display: block;  margin: auto;  ">
              <thead>
              <tr><th>Variable</th><th>Reemplazado por</th></tr>
              </thead>
              <tbody>
              <tr><td>uniqueId</td><td>Nombre unico de cada usuario</td></tr>
              <tr><td>nickname</td><td>sobrenombre de cada usuario</td></tr>
              <tr><td>comment</td><td>comentario del chat</td></tr>
              <tr><td>{milestoneLikes}</td><td>likes de cada usuario</td></tr>
              <tr><td>{likes}</td><td>likes de cada usuario</td></tr>
              <tr><td>message</td><td>comentario del chat</td></tr>
              <tr><td>giftName</td><td>nombre del regalo</td></tr>
              <tr><td>giftname</td><td>nombre del regalo</td></tr>
              <tr><td>repeatCount</td><td>numero de repeticion de regalos</td></tr>
              <tr><td>repeatcount</td><td>numero de repeticion de regalos</td></tr>
              <tr><td>playername</td><td>Minecraft nombre de player o '@a'</td></tr>
              <tr><td>diamonds</td><td>valor de diamantes de cada regalo</td></tr>
              <tr><td>likecount</td><td>likes totales de cada usuario</td></tr>
              <tr><td>followRole</td><td>numero de rol de seguidor 0 , 1 y 2</td></tr>
              <tr><td>userId</td><td>Id unico de cada usuario</td></tr>
              <tr><td>teamMemberLevel</td><td>nivel de miembro del usuario</td></tr>
              <tr><td>subMonth</td><td>meses de suscripcion</td></tr>
              </tbody>
</table>
          </div><label>
          <div id="show-suggestions-hover" class="text-opacity0-5">${buttonText}</div>
          ${includeCheckbox ? `
          <input type="checkbox" id="show-suggestions-checkbox">
          <span id="show-suggestions-hover" class="text-opacity0-8"> ${checkboxText}</span>
          </label>` : '</label>'}
      `;

      this.setupEvents();
  }

  setupEvents() {
      const suggestionsContainer = this.shadowRoot.getElementById('suggestions');
      const showSuggestionsButton = this.shadowRoot.getElementById('show-suggestions-hover');
      const showSuggestionsCheckbox = this.shadowRoot.getElementById('show-suggestions-checkbox');

      showSuggestionsButton.addEventListener('mouseover', () => {
          if (this.getAttribute('position') === 'relative') {
              suggestionsContainer.style.top = `${showSuggestionsButton.getBoundingClientRect().bottom + 10}px`;
              suggestionsContainer.style.left = `${showSuggestionsButton.getBoundingClientRect().left}px`;
          }
          suggestionsContainer.classList.add('visible');
      });

      showSuggestionsButton.addEventListener('mouseout', () => {
          if (!showSuggestionsCheckbox || !showSuggestionsCheckbox.checked) {
              suggestionsContainer.classList.remove('visible');
          }
      });

      if (showSuggestionsCheckbox) {
          if (localStorage.getItem('show-suggestions-checkbox') === 'true' || localStorage.getItem('show-suggestions-checkbox') === true) {
              showSuggestionsCheckbox.checked = true;
              suggestionsContainer.classList.add('visible');
          }
          showSuggestionsCheckbox.addEventListener('change', () => {
              localStorage.setItem('show-suggestions-checkbox', showSuggestionsCheckbox.checked);
              if (showSuggestionsCheckbox.checked) {
                  if (this.getAttribute('position') === 'relative') {
                      suggestionsContainer.style.top = `${showSuggestionsButton.getBoundingClientRect().bottom + 10}px`;
                      suggestionsContainer.style.left = `${showSuggestionsButton.getBoundingClientRect().left}px`;
                  }
                  suggestionsContainer.classList.add('visible');
              } else {
                  suggestionsContainer.classList.remove('visible');
              }
          });
      }
  }
}

customElements.define('suggestions-component', SuggestionsComponent);
