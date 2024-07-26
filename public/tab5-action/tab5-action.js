import {
    validateForm,
    obtenerDatos,
    resetForm,
    getFiles123,
    filesform,
} from '../functions/dataHandler.js';

import {
    createModalElement,
    setupFormActions,
} from '../functions/htmlGenerator.js';

import { fillForm, setPendingSelectValues } from '../utils/formfiller.js';
import Modal from '../htmlcomponents/Modal.js'
export default async function tab5Action({
    elementContainer,
    files = [],
    optionsgift = [],
    onSave = () => {},
    onCancel = () => {},
    separator = "_"
}) {
    // let ModalElement = await createModalElement();
    // const idModal = ModalElement.id;
    // const cacheAssign = {};

    // elementContainer.parentNode.insertBefore(ModalElement, elementContainer.nextSibling);
    // elementContainer.remove();

    // const elementModal = document.getElementById(idModal);
    // elementModal.style.display = 'none';

    // const form = elementModal.querySelector('.tab5-action');
    // form.addEventListener('submit', event => event.preventDefault());

    // setupFormActions(elementModal, form, databases, onSave, onCancel);
    // filesform(form, cacheAssign);
    // populateGiftSelect(optionsgift);
    // fillForm(form, files[0], separator);

    // const openModal = () => {
    //     resetForm(form);
    //     filesform(form, cacheAssign);
    //     elementModal.style.display = 'flex';
    //     elementModal.querySelector('.Actionscheck').style.display = 'block';
    //     elementModal.querySelector('.Eventoscheck').style.display = 'none';
    //     elementModal.querySelector('.modalActionAdd').style.display = 'inline-block';
    //     elementModal.querySelector('.modalActionSave').style.display = 'none';
    // };

    // const closeModal = () => {
    //     elementModal.style.display = 'none';
    //     console.log("closeModal");
    // };

    // const updateModal = (datos) => {
    //     filesform(form, cacheAssign);
    //     elementModal.style.display = 'flex';
    //     setTimeout(() => {
    //         fillForm(form, datos, separator);
    //         setPendingSelectValues(form);
    //     }, 1000);
    //     elementModal.querySelector('.Actionscheck').style.display = 'block';
    //     elementModal.querySelector('.Eventoscheck').style.display = 'none';
    //     elementModal.querySelector('.modalActionAdd').style.display = 'none';
    //     elementModal.querySelector('.modalActionSave').style.display = 'inline-block';
    // };

    // const handleEvent = (datos) => {
    //     fillForm(form, datos, separator);
    //     setPendingSelectValues(form);
    //     elementModal.style.display = 'flex';
    //     elementModal.querySelector('.Actionscheck').style.display = 'none';
    //     elementModal.querySelector('.Eventoscheck').style.display = 'block';
    //     elementModal.querySelector('.modalActionAdd').style.display = 'none';
    //     elementModal.querySelector('.modalActionSave').style.display = 'inline-block';
    // };

    // const botonAbrirModal = document.getElementById('openModalAdd');
    // if (botonAbrirModal) {
    //     botonAbrirModal.addEventListener('click', openModal);
    // }

    // const elementosEditables = document.querySelectorAll('.botonAbrirModalEdit');
    // elementosEditables.forEach(elemento => {
    //     elemento.addEventListener('click', async (event) => {
    //         const datos = JSON.parse(event.currentTarget.getAttribute('data-json'));
    //         updateModal(datos);
    //     });
    // });

    // return {
    //     element: ModalElement,
    //     form: form,
    //     close: closeModal,
    //     open: openModal,
    //     onUpdate: updateModal,
    //     onEvent: handleEvent,
    // };
}
function populateGiftSelect(optionsgift) {
    const giftselect = document.getElementById('event-gift_select');
    if (optionsgift) {
        const availableGifts = optionsgift || [];
        console.log("availableGifts", availableGifts);
        const defaultoption = document.createElement('option');
        defaultoption.textContent = 'default';
        defaultoption.value = 'default';
        giftselect.appendChild(defaultoption);
        availableGifts.forEach(gift => {
            // console.log(gift);
            const optionElement = document.createElement('option');
            optionElement.textContent = gift.name;
            optionElement.value = gift.id;
            giftselect.appendChild(optionElement);
        });
    }
}