class ChatMessage {
  constructor(id, profileImgUrl, messageContent, callbackList = [], optionTexts = []) {
    this.id = id;
    this.profileImgUrl = profileImgUrl;
    this.messageContent = messageContent;
    this.callbacks = callbackList; // Lista de callbacks
    this.optionTexts = optionTexts;
  }

  // Método para manejar los diferentes tipos de contenido
  handleType() {
    const types = new Set(Object.values(this.messageContent.content).map(item => item[0]));
    return Array.from(types)
      .map(type => {
        switch (type) {
          case 'text':
            return `Texto: ${this.getContentByType('text')}`;
          case 'number':
            return `Número: ${this.getContentByType('number')}`;
          case 'image':
            return `Imagen: ${this.getContentByType('image')}`;
          case 'url':
            return `URL: ${this.getContentByType('url')}`;
          default:
            return `Tipo desconocido: ${this.getContentByType(type)}`;
        }
      })
      .join(', ');
  }

  // Obtener el contenido según el tipo
  getContentByType(type) {
    return Object.values(this.messageContent.content)
      .filter(item => item[0] === type)
      .map(item => item[1])
      .join(' ');
  }

  // Crear el elemento del mensaje con callbacks
  createMessageElement() {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message-grid');
    messageDiv.id = this.id;

    // Imagen de perfil
    if (this.profileImgUrl) {
      const profileImg = document.createElement('img');
      profileImg.src = this.profileImgUrl;
      profileImg.alt = 'Profile Image';
      profileImg.classList.add('profile-img');
      messageDiv.appendChild(profileImg);
    }

    // Contenido del mensaje
    const contentContainer = document.createElement('div');
    contentContainer.classList.add('content-container');

    Object.keys(this.messageContent.content).forEach((key, index) => {
      const [type, content, color, tooltip] = this.messageContent.content[key];

      if (type === 'image') {
        const imgElement = document.createElement('img');
        imgElement.src = content;
        imgElement.alt = tooltip || 'Image';
        imgElement.classList.add('message-image');
        contentContainer.appendChild(imgElement);
      } else {
        const span = document.createElement('span');

        if (type === 'url') {
          const link = document.createElement('a');
          link.href = content;
          link.textContent = tooltip;
          link.style.color = color;
          if (tooltip) {
            link.title = content;
          }
          span.appendChild(link);
        } else {
          span.textContent = content;
          span.style.color = color;
          if (tooltip) {
            span.title = tooltip;
          }
        }

        if (index > 0) {
          contentContainer.appendChild(document.createTextNode(' ')); // Añadir un espacio entre los textos
        }

        contentContainer.appendChild(span);

        // Si hay callbacks, adjuntar eventos para cada uno
        if (this.callbacks.length > 0) {
          this.callbacks.forEach((callback, callbackIndex) => {
            span.addEventListener('click', () => {
              console.log(`Callback ${callbackIndex + 1} ejecutado con:`, type);
              callback(this.messageContent.data); // Ejecuta el callback pasando los datos del mensaje
            });
          });
        }
      }
    });

    messageDiv.appendChild(contentContainer);

    // Añadir menú de opciones si hay más de un callback
    if (this.callbacks.length > 1) {
      const optionsMenu = this.createOptionsMenu();
      messageDiv.appendChild(optionsMenu);
    }

    return messageDiv;
  }


  createOptionsMenu() {
    const menuContainer = document.createElement('div');
    menuContainer.classList.add('menu-container');

    const menuButton = document.createElement('button');
    menuButton.textContent = '⋮'; // Tres puntos
    menuButton.classList.add('menu-button');
    menuButton.addEventListener('click', () => {
      menuOptions.classList.toggle('visible');
    });

    const menuOptions = document.createElement('div');
    menuOptions.classList.add('menu-options');

    // Añadir cada callback como opción en el menú
    this.callbacks.forEach((callback, index) => {
      const optionText = this.optionTexts[index] || `Opción ${index + 1}`; // Usar texto personalizado
      const option = document.createElement('button');
      option.textContent = optionText;
      option.addEventListener('click', () => {
        callback(this.messageContent); // Ejecutar callback correspondiente con el texto
        menuOptions.classList.remove('visible'); // Ocultar menú después de seleccionar
      });
      menuOptions.appendChild(option);
    });

    menuContainer.appendChild(menuButton);
    menuContainer.appendChild(menuOptions);

    return menuContainer;
  }
}

// Clase para manejar el contenedor de mensajes
class ChatContainer {
  constructor(containerId, maxHeight = 400) {
    this.container = document.querySelector(containerId);
    this.container.style.overflowY = 'auto';
    this.container.style.maxHeight = `${maxHeight}px`;
    this.container.style.position = 'relative';
    this.messages = [];
  }

  // Añadir mensaje al contenedor con límite de mensajes
  addMessage(chatMessage, limit = false) {
    if (limit && this.messages.length >= 10) {
      const oldMessages = this.messages.splice(0, this.messages.length - 9);
      oldMessages.forEach(message => {
        const messageElement = document.getElementById(message.id);
        if (messageElement && this.container.contains(messageElement)) {
          this.container.removeChild(messageElement);
        }
      });
    }

    const messageElement = chatMessage.createMessageElement();
    this.messages.push(chatMessage);
    this.container.appendChild(messageElement);
    this.container.scrollTop = this.container.scrollHeight; // Scroll automático hacia el último mensaje
  }

  // Buscar mensajes que contengan una palabra clave
  searchMessages(keyword) {
    const lowerKeyword = keyword.toLowerCase();
    this.messages.forEach(message => {
      const messageElement = document.getElementById(message.id);
      const content = Object.values(message.messageContent.content)
        .map(item => item[1].toString().toLowerCase())
        .join(' ');
      if (content.includes(lowerKeyword)) {
        messageElement.style.display = 'block';
      } else {
        messageElement.style.display = 'none';
      }
    });
  }
}

// Exportar las clases
export { ChatContainer, ChatMessage };
