// ModalModule.js

export default class ModalModule {
    constructor(buttonId, htmlPath, cssPath, setupCallback) {
      this.buttonId = buttonId;
      this.htmlPath = htmlPath;
      this.cssPath = cssPath;
      this.setupCallback = setupCallback;
      this.modal = null;
      this.init();
    }
  
    async init() {
      await this.loadCSS();
      await this.createModal();
      this.addEventListeners();
    }
  
    async loadCSS() {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = this.cssPath;
      document.head.appendChild(link);
      
      // Wait for the CSS to load
      await new Promise((resolve, reject) => {
        link.onload = resolve;
        link.onerror = reject;
      });
    }
  
    async createModal() {
      const response = await fetch(this.htmlPath);
      const htmlContent = await response.text();
  
      this.modal = document.createElement('div');
      this.modal.id = `ventanaModal${Math.floor(Math.random() * 1000)}`;
      this.modal.className = 'modal';
      this.modal.innerHTML = `
        <div class="contenido-modal">
          <span class="cerrar">&times;</span>
          ${htmlContent}
        </div>
      `;
  
      document.body.appendChild(this.modal);
      this.span = this.modal.querySelector('.cerrar');
    }
  
    addEventListeners() {
      const button = document.getElementById(this.buttonId);
      if (!button) {
        console.error(`Button with id "${this.buttonId}" not found`);
        return;
      }
  
      button.addEventListener('click', () => {
        this.open();
      });
  
      this.span.addEventListener('click', () => {
        this.close();
      });
  
      window.addEventListener('click', (event) => {
        if (event.target === this.modal) {
          this.close();
        }
      });
    }
  
    open() {
      this.modal.style.display = 'block';
      if (this.setupCallback) {
        this.setupCallback(this.modal);
      }
    }
  
    close() {
      this.modal.style.display = 'none';
    }
  }