// errorComponent.js
export default function createErrorComponent(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-error'; // Clases de CSS del alert
    errorDiv.setAttribute('role', 'alert');

    // Contenido HTML de alerts.html
    errorDiv.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>${message}</span>
    `;

    // Configurar el temporizador para eliminar el mensaje después de 5 segundos
    setTimeout(() => {
        if (errorDiv && errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000); // 5000 milisegundos = 5 segundos

    return errorDiv;
}
