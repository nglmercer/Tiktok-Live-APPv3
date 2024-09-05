class ChatMessage {
  constructor(id, profileImgUrl, messageContent, callback = null) {
    this.id = id;
    this.profileImgUrl = profileImgUrl;
    this.messageContent = messageContent;
    this.callback = callback;
  }

  handleType() {
    const types = new Set(Object.values(this.messageContent.content).map(item => item[0]));
    return Array.from(types).map(type => {
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
    }).join(', ');
  }

  getContentByType(type) {
    return Object.values(this.messageContent.content)
      .filter(item => item[0] === type)
      .map(item => item[1])
      .join(' ');
  }

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
    const textElement = document.createElement('p');
    textElement.classList.add('message-text');

    Object.keys(this.messageContent.content).forEach((key, index) => {
      const [type, content, color, tooltip] = this.messageContent.content[key];
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
        if (tooltip){
          span.title = tooltip;
        }
      }

      if (index > 0) {
        textElement.appendChild(document.createTextNode(' ')); // Añadir un espacio entre los textos
      }

      textElement.appendChild(span);

      // Si hay un callback, adjuntar el evento
      if (this.callback) {
        span.addEventListener('click', () => {
          console.log('Callback ejecutado con:', type);
          this.callback(type);
        });
      }
    });

    messageDiv.appendChild(textElement);

    return messageDiv;
  }
}

class ChatContainer {
  constructor(containerId, maxHeight = 400) {
    this.container = document.querySelector(containerId);
    this.container.style.overflowY = 'auto';
    this.container.style.maxHeight = `${maxHeight}px`
    this.messages = [];
  }

  addMessage(chatMessage, limit = false) {
    // Si el límite está activado, eliminar mensajes antiguos para mantener solo los últimos 10
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


export { ChatContainer, ChatMessage };
