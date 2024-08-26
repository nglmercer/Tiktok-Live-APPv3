// textReplacer.js

const textReplacer = (() => {
  /**
   * Reemplaza el texto de todos los elementos seleccionados por ID o className
   * @param {string} selector - El ID o className de los elementos (incluyendo # para ID y . para className)
   * @param {string} newText - El nuevo texto que reemplazará al texto existente
   */
  function replaceText(selector, newText) {
    // Selecciona todos los elementos que coinciden con el selector
    const elements = document.querySelectorAll(selector);

    // Si se encuentran elementos, reemplaza el texto de cada uno
    if (elements.length > 0) {
      elements.forEach(element => {
        // Verifica si el elemento tiene nodos de texto o un span interno
        if (element.tagName.toLowerCase() === 'button' || element.querySelector('span')) {
          const span = element.querySelector('span');
          if (span) {
            span.textContent = newText; // Reemplaza el texto dentro del span
          } else {
            element.textContent = newText; // Reemplaza el texto directamente
          }
        } else {
          element.textContent = newText; // Reemplaza el texto directamente
        }
      });
    } else {
      console.warn(`No se encontraron elementos con el selector: ${selector}`);
    }
  }

  return {
    replaceText
  };
})();

const imageManipulator = (() => {
  /**
   * Reemplaza la imagen de un elemento seleccionado por ID o className.
   * @param {string} selector - El ID o className de los elementos (incluyendo # para ID y . para className).
   * @param {string} imageUrl - La URL de la imagen que se usará como src o background.
   * @param {string} type - Tipo de manipulación: "src", "background", "insertDiv".
   */
  function manipulateImage(selector, imageUrl, type) {
    // Selecciona todos los elementos que coinciden con el selector
    const elements = document.querySelectorAll(selector);

    // Si se encuentran elementos, realiza la operación según el tipo especificado
    if (elements.length > 0) {
      elements.forEach(element => {
        switch (type) {
          case "src":
            if (element.tagName.toLowerCase() === "img") {
              element.src = imageUrl;
            } else {
              console.warn(`El elemento seleccionado no es una imagen: ${selector}`);
            }
            break;

          case "background":
            element.style.backgroundImage = `url('${imageUrl}')`;
            element.style.backgroundSize = 'cover'; // Ajusta el tamaño del fondo
            element.style.backgroundPosition = 'center'; // Centra la imagen de fondo
            break;

          case "insertDiv":
            const newDiv = document.createElement('div');
            newDiv.style.backgroundImage = `url('${imageUrl}')`;
            newDiv.style.backgroundSize = 'cover';
            newDiv.style.backgroundPosition = 'center';
            newDiv.style.width = '100%';
            newDiv.style.height = '100%';
            element.appendChild(newDiv);
            break;

          default:
            console.warn(`Tipo de manipulación desconocido: ${type}`);
        }
      });
    } else {
      console.warn(`No se encontraron elementos con el selector: ${selector}`);
    }
  }

  return {
    manipulateImage
  };
})();

// Exporta el módulo para su uso en otros archivos
export default textReplacer;
export {imageManipulator};
