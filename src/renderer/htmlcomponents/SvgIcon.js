class SvgIcon extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Crear contenedor con estilos básicos y espacio para el tooltip
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          position: relative;
        }
        #svgContainer {
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 0;
          padding: 0;
        }
        .tooltip {
          visibility: hidden;
          background-color: black;
          color: white;
          text-align: center;
          border-radius: 5px;
          padding: 5px;
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          opacity: 0;
          transition: opacity 0.3s;
          white-space: nowrap;
        }
        .tooltip::after {
          content: '';
          position: absolute;
          left: 50%;
          margin-left: -5px;
          border-width: 5px;
          border-style: solid;
        }
        :host(:hover) .tooltip {
          visibility: visible;
          opacity: 1;
        }

        /* Tooltip en la parte superior */
        .top {
          bottom: 100%;
          margin-bottom: 5px;
        }
        .top::after {
          top: 100%;
          border-color: black transparent transparent transparent;
        }

        /* Tooltip en la parte inferior */
        .bottom {
          top: 100%;
          margin-top: 1px;
        }
        .bottom::after {
          bottom: 100%;
          border-color: transparent transparent black transparent;
        }
      </style>
      <div id="svgContainer"></div>
      <div class="tooltip"></div>
    `;

    this.svgContainer = this.shadowRoot.querySelector('#svgContainer');
    this.tooltipElement = this.shadowRoot.querySelector('.tooltip');
  }

  static get observedAttributes() {
    return ['name', 'width', 'height', 'class', 'tooltip', 'tooltip-position'];
  }

  attributeChangedCallback(attrName, oldValue, newValue) {
    if (attrName === 'name') {
      this.renderSVG(newValue);
    } else if (attrName === 'width' || attrName === 'height' || attrName === 'class') {
      this.updateContainerAttributes();
    } else if (attrName === 'tooltip') {
      this.updateTooltip(newValue);
    } else if (attrName === 'tooltip-position') {
      this.updateTooltipPosition(newValue);
    }
  }

  connectedCallback() {
    const name = this.getAttribute('name');
    if (name) {
      this.renderSVG(name);
    }
    this.updateContainerAttributes();

    const tooltip = this.getAttribute('tooltip');
    if (tooltip) {
      this.updateTooltip(tooltip);
    }

    const position = this.getAttribute('tooltip-position') || 'top';
    this.updateTooltipPosition(position);
  }

  // Método para renderizar el SVG basado en el nombre
  renderSVG(name) {
    const svg = this.getSVGByName(name);
    if (svg) {
      this.svgContainer.innerHTML = svg;
    } else {
      this.svgContainer.innerHTML = `<p>SVG "${name}" no encontrado</p>`;
    }
  }

  // Método para actualizar width, height y class en el contenedor
  updateContainerAttributes() {
    const width = this.getAttribute('width');
    const height = this.getAttribute('height');
    const className = this.getAttribute('class');

    if (width) this.svgContainer.style.width = width;
    if (height) this.svgContainer.style.height = height;
    if (className) this.svgContainer.className = className;
  }

  // Método para actualizar el contenido del tooltip
  updateTooltip(tooltipText) {
    this.tooltipElement.textContent = tooltipText;
  }

  // Método para actualizar la posición del tooltip (arriba/abajo)
  updateTooltipPosition(position) {
    if (position === 'top') {
      this.tooltipElement.classList.remove('bottom');
      this.tooltipElement.classList.add('top');
    } else {
      this.tooltipElement.classList.remove('top');
      this.tooltipElement.classList.add('bottom');
    }
  }

  // Colección de SVGs por nombre
  getSVGByName(name) {
    const svgs = {
      'circle': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="blue" /></svg>`,
      'square': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="10" width="80" height="80" fill="red" /></svg>`,
      'triangle': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,15 90,85 10,85" fill="green" /></svg>`,
      'menu': `<svg xmlns="http://www.w3.org/2000/svg" width="50px" viewBox="0 0 24 24" stroke-width="2" stroke-linejoin="round">
        <rect x="5" y="6" width="14" height="2" fill="black"/>
        <rect x="5" y="11" width="14" height="2" fill="black"/>
        <rect x="5" y="16" width="14" height="2" fill="black"/></svg>`,
      'refresh': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="50px" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="23 4 23 10 17 10"></polyline>
        <polyline points="1 20 1 14 7 14"></polyline>
        <path d="M3.51 9a9 9 0 0114.77-3.36L23 10"></path>
        <path d="M20.49 15a9 9 0 01-14.77 3.36L1 14"></path>
      </svg>`,
      'home': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="40px" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9.5l9-7 9 7"></path>
        <path d="M9 22V12h6v10"></path>
        <path d="M4 10v11h16V10"></path>
      </svg>`
    };

    return svgs[name] || null;
  }
}

// Definir el nuevo elemento personalizado
customElements.define('svg-icon', SvgIcon);
