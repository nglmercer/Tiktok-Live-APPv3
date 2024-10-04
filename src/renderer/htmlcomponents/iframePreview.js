class IframePreview extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.shadowRoot.innerHTML = `
      <style>
        .hidden {
          display: none;
        }
        #toggleCheckbox:checked + label {
          color: red;
        }
        #iframeContainer {
          position: relative;
          overflow: hidden;
          resize: both;
          border: 1px solid #ccc;
        }
        iframe {
          width: 100%;
          height: 100%;
          border: 0;
        }
      </style>
      <div id="control-panel" style="padding: 10px; display: flex; gap: 10px; align-items: center; ">
        <input type="checkbox" id="toggleCheckbox">
        <label for="toggleCheckbox">Mostrar/Ocultar</label>
      </div>
      <div id="iframeContainer" class="hidden"></div>
    `;

    this.toggleCheckbox = this.shadowRoot.querySelector('#toggleCheckbox');
    this.iframeContainer = this.shadowRoot.querySelector('#iframeContainer');
    this.iframeElement = null;

    this.setupListeners();
  }

  setupListeners() {
    this.toggleCheckbox.addEventListener('change', () => {
      if (this.toggleCheckbox.checked) {
        this.iframeContainer.classList.remove('hidden');
        this.buildIframe();
      } else {
        this.iframeContainer.classList.add('hidden');
        this.destroyIframe();
      }
    });
  }

  buildIframe() {
    setTimeout(() => {
      if (!this.iframeElement) {
        this.iframeElement = document.createElement('iframe');
        this.iframeElement.src = this.getAttribute('src') || '';
        this.iframeElement.width = '100%';
        this.iframeElement.height = '100%';
        this.iframeElement.frameBorder = '0';
        this.iframeContainer.appendChild(this.iframeElement);

        // Intentar silenciar el contenido del iframe después de cargarlo
        this.iframeElement.addEventListener('load', () => {
          this.muteMediaElementsInIframe();
          this.observeMutationsInIframe();
        });
      }
    }, 100);
  }

  destroyIframe() {
    if (this.iframeElement) {
      this.iframeContainer.removeChild(this.iframeElement);
      this.iframeElement = null;
    }
  }

  muteMediaElementsInIframe() {
    try {
      const iframeDocument = this.iframeElement.contentDocument || this.iframeElement.contentWindow.document;
      const mediaElements = iframeDocument.querySelectorAll('video, audio');
      mediaElements.forEach(media => {
        media.muted = true;
      });
    } catch (error) {
      console.warn('No se pudo acceder al contenido del iframe para silenciarlo:', error);
    }
  }

  observeMutationsInIframe() {
    try {
      const iframeDocument = this.iframeElement.contentDocument || this.iframeElement.contentWindow.document;
      const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
              if (node.tagName === 'VIDEO' || node.tagName === 'AUDIO') {
                node.muted = true;
              } else if (node.querySelectorAll) {
                const mediaElements = node.querySelectorAll('video, audio');
                mediaElements.forEach(media => {
                  media.muted = true;
                });
              }
            });
          }
        });
      });

      observer.observe(iframeDocument.body, {
        childList: true,
        subtree: true
      });
    } catch (error) {
      console.warn('No se pudo observar los cambios en el iframe:', error);
    }
  }
}

// Define el nuevo elemento personalizado
customElements.define('iframe-preview', IframePreview);
