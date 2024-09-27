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
