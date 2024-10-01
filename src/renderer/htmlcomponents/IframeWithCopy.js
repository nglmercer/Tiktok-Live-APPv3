class UrlIframe extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const url = this.getAttribute('url') || 'https://www.example.com';
    this.render(url);
  }

  render(url) {
    // Crear estilos
    const style = document.createElement('style');
    style.textContent = `
      :host {
        display: block;
        font-family: Arial, sans-serif;
        padding: 10px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
      }

      .container {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 10px;
        border: solid 2px, #115
      }
      .container:hover {
        border: solid 2px, #118
      }
      .url {
        font-size: 14px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        max-width: 80%;
      }

      .copy-button {
        background-color: #444;
        border: none;
        color: #f1f1f1;
        padding: 5px 10px;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.3s ease;
      }

      .copy-button:hover {
        background-color: #666;
      }

      iframe {
        width: 100%;
        border: none;
        border-radius: 8px;
      }
    `;

    // Crear contenedor principal
    const container = document.createElement('div');
    container.classList = 'container';

    // Crear elemento de URL
    const urlSpan = document.createElement('span');
    urlSpan.classList.add('url');
    urlSpan.textContent = url;

    // Crear botón de copiar
    const copyButton = document.createElement('button');
    copyButton.classList.add('copy-button');
    copyButton.textContent = 'Copy';

    // Añadir funcionalidad de copia
    copyButton.addEventListener('click', () => {
      navigator.clipboard.writeText(url);
      alert('URL copiada al portapapeles');
    });

    // Crear iframe
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.allowTransparency = 'true';
    iframe.style.backgroundColor = 'black';

    // Construir estructura del DOM
    container.appendChild(urlSpan);
    container.appendChild(copyButton);

    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(container);
    this.shadowRoot.appendChild(iframe);
    this.applyDarkMode();
  }
  applyDarkMode() {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

    darkModeQuery.addEventListener('change', (event) => {
      const iframe = this.shadowRoot.querySelector('iframe');
      if (iframe.contentWindow) {
        const doc = iframe.contentWindow.document;
        if (event.matches) {
          // Aplicar estilos dark mode al contenido del iframe
          doc.body.style.backgroundColor = '#000';
          doc.body.style.color = '#fff';
        } else {
          // Revertir estilos para light mode
          doc.body.style.backgroundColor = '#fff';
          doc.body.style.color = '#000';
        }
      }
    });
  }
}

customElements.define('url-iframe', UrlIframe);
class CopyMessage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  copyToClipboard() {
    const message = this.shadowRoot.querySelector('.message').textContent;
    navigator.clipboard.writeText(message)
      .then(() => alert('Mensaje copiado al portapapeles'))
      .catch(err => console.error('Error al copiar el mensaje', err));
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: auto;
          box-sizing: border-box;
          font-family: Arial, sans-serif;
        }

        .container {
          display: flex;
          align-items: center;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          width: fit-content;
        }

        .message {
          flex: 1;
          font-size: 16px;
          word-break: break-word;
        }

        .copy-button {
          margin-left: 10px;
          padding: 6px 12px;
          font-size: 14px;
          cursor: pointer;
          background-color: #444;
          color: #f1f1f1;
          border: none;
          border-radius: 4px;
          transition: background-color 0.3s ease;
        }

        .copy-button:hover {
          background-color: #666;
        }
      </style>
      <div class="container">
        <div class="message"><slot></slot></div>
        <button class="copy-button">Copiar</button>
      </div>
    `;

    this.shadowRoot.querySelector('.copy-button').addEventListener('click', () => this.copyToClipboard());
  }
}

customElements.define('copy-message', CopyMessage);
