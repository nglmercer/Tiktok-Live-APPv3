import  createErrorComponent  from '../htmlcomponents/errorComponent.js';
import { fillForm, setPendingSelectValues } from '../utils/formfiller.js';
export function validateForm(form, modal) {
    const nombre = form.elements.namedItem('accionevento_nombre');
    if (!nombre || !nombre.value.trim()) {
        const errorMessage = createErrorComponent('El nombre es obligatorio.');
        errorMessage.style.display = 'block';
        errorMessage.style.position = 'fixed';
        errorMessage.style.top = '1%';
        errorMessage.style.right = '1%';
        modal.appendChild(errorMessage);
        return false;
    }
    return true;
}
// export function obtenerDatos(form, separator = '_') {
//     const nameFilter = {};

//     for (const elemento of form.elements) {
//         if (elemento.name) {
//             const [prefix, suffix] = elemento.name.split(separator);

//             if (!nameFilter[prefix]) {
//                 nameFilter[prefix] = {};
//             }

//             if (elemento.type === 'checkbox') {
//                 nameFilter[prefix][suffix || 'check'] = elemento.checked;
//             } else if (elemento.type === 'radio') {
//                 if (prefix === 'event') {
//                     const eventType = `event-${elemento.value}`;
//                     if (!nameFilter[eventType]) {
//                         nameFilter[eventType] = {};
//                     }
//                     nameFilter[eventType].check = elemento.checked;
                    
//                     if (elemento.checked) {
//                         nameFilter.event_type = elemento.value;
//                     }
//                 }
//             } else if (elemento.type === 'select-one') {
//                 nameFilter[prefix][suffix || 'select'] = elemento.value;
//             } else if (elemento.type === 'number') {
//                 nameFilter[prefix][suffix || 'number'] = elemento.value;
//             } else {
//                 nameFilter[prefix][suffix || 'value'] = elemento.value;
//             }
//         }
//     }
//     const idValue = form.elements.namedItem('id').value;
//     nameFilter.id = !isNaN(idValue) ? idValue : null;

//     return nameFilter;
// }
export function obtenerDatos(form, separator = '_') {
    const nameFilter = {};

    for (const elemento of form.elements) {
        if (elemento.name) {
            const [prefix, suffix] = elemento.name.split(separator);

            if (!nameFilter[prefix]) {
                nameFilter[prefix] = {};
            }

            if (elemento.type === 'checkbox') {
                nameFilter[prefix][suffix || 'check'] = elemento.checked;
            } else if (elemento.type === 'radio') {
                if (prefix === 'event') {
                    const eventType = `event-${elemento.value}`;
                    if (!nameFilter[eventType]) {
                        nameFilter[eventType] = {};
                    }
                    nameFilter[eventType].check = elemento.checked;

                    if (elemento.checked) {
                        nameFilter.event_type = elemento.value;
                    }
                }
            } else if (elemento.type === 'select-one') {
                nameFilter[prefix][suffix || 'select'] = elemento.value;
            } else if (elemento.type === 'number') {
                nameFilter[prefix][suffix || 'number'] = elemento.value;
            } else {
                nameFilter[prefix][suffix || 'value'] = elemento.value;
            }
        }
    }
    const idValue = form.elements.namedItem('id').value;
    nameFilter.id = !isNaN(idValue) ? idValue : null;

    return nameFilter;
}

export function resetForm(form, excludeTypes = []) {
    // Convertir excludeTypes a un conjunto para una búsqueda más eficiente
    const excludeSet = new Set(excludeTypes);

    for (const elemento of form.elements) {
        if (elemento.name && !excludeSet.has(elemento.type)) {
            if (elemento.type === 'checkbox') {
                elemento.checked = false;
                const numberElement = form.querySelector(`#${elemento.name}_number`);
                if (numberElement) {
                    numberElement.value = 5;
                }
            } else if (elemento.type === 'radio') {
                elemento.checked = false;
            } else if (elemento.type === 'select-one') {
                elemento.selectedIndex = 0;
            } else if (elemento.type === 'range') {
                elemento.value = elemento.defaultValue;
            } else if (elemento.type === 'number') {
                elemento.value = 5;
            } else {
                elemento.value = '';
            }
        }
    }
}

export async function getFiles123() {
    try {
        const files = await window.api.getFilesInFolder();
        return [...files];
    } catch (error) {
        console.error('Error fetching files:', error);
        return [];
    }
}

export async function filesform(form, cacheAssign) {
    const files = await getFiles123();
    console.log('Files retrieved:', files);

    const selects = form.querySelectorAll('select[data-file-type]');

    selects.forEach(select => {
        const fileType = select.dataset.fileType;
        console.log(`Populating select for ${fileType}`);

        // Clear existing options
        select.innerHTML = '';

        // Filter files by type
        const relevantFiles = files.filter(file => file.type.startsWith(fileType));
        console.log(`Relevant files for ${fileType}:`, relevantFiles);

        if (relevantFiles.length > 0) {
            relevantFiles.forEach(file => {
                const option = document.createElement('option');
                option.value = file.index;
                option.textContent = file.name;
                select.appendChild(option);
                cacheAssign[file.path] = file;
            });
        } else {
            const option = document.createElement('option');
            option.value = 'false';
            option.textContent = 'Sin elementos';
            select.appendChild(option);
        }

        console.log(`Select for ${fileType} populated with ${select.options.length} options`);
    });

    setPendingSelectValues(form);
}
