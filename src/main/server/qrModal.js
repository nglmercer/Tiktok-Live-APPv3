// qrModal.js

export function showQRModal(qrCode, urlToQR) {
  localStorage.setItem("qrCode", qrCode);
  localStorage.setItem("urlToQR", urlToQR);
  // Crear un contenedor modal
  const modalOverlay = document.createElement("div");
  modalOverlay.style.position = "fixed";
  modalOverlay.style.top = "0";
  modalOverlay.style.left = "0";
  modalOverlay.style.width = "100vw";
  modalOverlay.style.height = "100vh";
  modalOverlay.style.display = "flex";
  modalOverlay.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
  modalOverlay.style.justifyContent = "center";
  modalOverlay.style.alignItems = "center";
  modalOverlay.style.zIndex = "9999";

  // Crear el contenido del modal
  const modalContent = document.createElement("div");

  modalContent.innerHTML = `<h2>Scan QRcode, link <a href="${urlToQR}">${urlToQR}</a></h2><img src="${qrCode}" style="height: 90%; width: 90%;" alt="QR Code">`;
  modalContent.style.padding = "20px";
  modalContent.style.width = "50%";
  modalContent.style.height = "50%";
  modalContent.style.minHeight = "400px";
  modalContent.style.minWidth = "400px";
  // Crear el botón de cerrar
  const closeButton = document.createElement("button");
  closeButton.textContent = "Close";
  closeButton.style.marginTop = "20px";
  closeButton.style.padding = "10px 20px";
  closeButton.style.backgroundColor = "#ff0000";
  closeButton.style.color = "#fff";
  closeButton.style.border = "none";
  closeButton.style.borderRadius = "4px";
  closeButton.style.cursor = "pointer";

  // Añadir el evento de clic al botón para cerrar el modal
  closeButton.addEventListener("click", () => {
    document.body.removeChild(modalOverlay);
  });

  // Añadir el contenido y el botón al modal
  modalContent.appendChild(closeButton);
  modalOverlay.appendChild(modalContent);

  // Añadir el modal al cuerpo del documento
  document.body.appendChild(modalOverlay);

  // Añadir evento para cerrar el modal al hacer clic fuera del contenido
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) {
      document.body.removeChild(modalOverlay);
    }
  });
}
export function QRModalsave(qrCode, urlToQR) {
  localStorage.setItem("qrCode", qrCode);
  localStorage.setItem("urlToQR", urlToQR);
}
