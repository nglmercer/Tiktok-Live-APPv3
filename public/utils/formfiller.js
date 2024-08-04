// fillForm.js

export function fillForm(form, data, separator = '_') {
    if (!form || !data) return;

    Object.entries(data).forEach(([key, value]) => {
        const elements = form.elements;

        if (typeof value === 'object' && value !== null) {
            Object.entries(value).forEach(([subKey, subValue]) => {
                const elementName = `${key}${separator}${subKey}`;
                const element = elements.namedItem(elementName);

                if (element) {
                    setElementValue(element, subValue);
                }
            });
        } else {
            if (key === 'event_type') {
                const radioButton = form.querySelector(`input[name="event_type"][value="${value}"]`);
                if (radioButton) {
                    radioButton.checked = true;
                }
            } else {
                const element = elements.namedItem(key);
                if (element) {
                    setElementValue(element, value);
                }
            }
        }
    });

    // Manejar casos especiales
    if (data.accionevento_check) {
        const eventosCheck = form.querySelector('.Eventoscheck');
        if (eventosCheck) eventosCheck.style.display = 'block';
    }

    if (data.id) {
        const idElement = form.elements.namedItem('id');
        if (idElement) idElement.value = data.id;
    }
}

function setElementValue(element, value) {
    switch (element.type) {
        case 'checkbox':
            element.checked = value === true || value === 'true';
            break;
        case 'radio':
            element.checked = element.value === value;
            break;
        case 'select-one':
            setSelectValue(element, value);
            break;
        case 'range':
        case 'number':
            element.value = value;
            break;
        default:
            element.value = value;
    }
}

function setSelectValue(selectElement, value) {
    // console.log(`setSelectValue Setting select value to ${value}`, selectElement);
    // Si el select está vacío, guardamos el valor para establecerlo más tarde
    if (selectElement.options.length === 0) {
        selectElement.dataset.pendingValue = value;
        return;
    }

    const option = Array.from(selectElement.options).find(opt => opt.value == value);
    if (option) {
        selectElement.value = option.value;
    } else {
        console.warn(`Option with value "${value}" not found in select element ${selectElement.name}`);
    }
}

// Función para establecer valores pendientes en los selects
export function setPendingSelectValues(form) {
    const selects = form.querySelectorAll('select');
    selects.forEach(select => {
        if (select.dataset.pendingValue) {
            setSelectValue(select, select.dataset.pendingValue);
            delete select.dataset.pendingValue;
        }
    });
}
function inspectFormElements(form) {
    if (!form) {
        console.error('No se proporcionó un formulario válido');
        return [];
    }

    const elements = [];

    // Inspeccionar todos los elementos del formulario, incluyendo aquellos que podrían no estar en form.elements
    const allElements = form.querySelectorAll('input, select, textarea');
    allElements.forEach((element) => {
        elements.push({
            element: element,
            type: element.tagName.toLowerCase(),
            name: element.name || '',
            id: element.id || '',
            inputType: element.type || 'N/A',
            value: element.value,
            className: element.className,
            customAttributes: getCustomAttributes(element)
        });
        console.log('element', element);
    });

    return elements;
}

function getCustomAttributes(element) {
    return Array.from(element.attributes)
        .filter(attr => !['id', 'name', 'class', 'type', 'value'].includes(attr.name))
        .reduce((obj, attr) => {
            obj[attr.name] = attr.value;
            return obj;
        }, {});
}