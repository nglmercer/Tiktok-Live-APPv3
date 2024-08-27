function showAlert(type, message, duration = 3000) {
  // Buscar el contenedor de alertas o crearlo si no existe
  let alertContainer = document.querySelector('.alert-container');
  if (!alertContainer) {
      alertContainer = document.createElement('div');
      alertContainer.className = 'alert-container';
      document.body.appendChild(alertContainer);
  }

  const alert = document.createElement('div');
  alert.classList.add('alert');

  switch (type) {
      case 'success':
          alert.classList.add('alert-success');
          break;
      case 'info':
          alert.classList.add('alert-info');
          break;
      case 'warning':
          alert.classList.add('alert-warning');
          break;
      case 'error':
          alert.classList.add('alert-error');
          break;
      default:
          alert.classList.add('alert-info');
  }

  alert.textContent = message;
  alertContainer.appendChild(alert);

  // Remover la alerta después de la duración especificada
  setTimeout(() => {
      alert.classList.add('fade-out');
      alert.addEventListener('transitionend', () => alert.remove());
      //borramos el elemento del DOM
      alert.remove();
  }, duration);
}
{/* <button onclick="showAlert('success', 'This is a success message!')">Show Success</button>
<button onclick="showAlert('info', 'This is an info message!')">Show Info</button>
<button onclick="showAlert('warning', 'This is a warning message!')">Show Warning</button>
<button onclick="showAlert('error', 'This is an error message!')">Show Error</button> */}
export default showAlert;
