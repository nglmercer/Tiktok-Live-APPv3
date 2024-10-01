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
