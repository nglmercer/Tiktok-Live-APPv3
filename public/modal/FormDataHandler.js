// FormDataHandler.js

export class FormDataHandler {
    constructor(form, separator = '_') {
        this.form = form;
        this.separator = separator;
    }

    obtenerDatos() {
        if (!this.form) return null;

        const nameFilter = {};

        for (const elemento of this.form.elements) {
            if (elemento.name) {
                const [prefix, suffix] = elemento.name.split(this.separator);

                if (!nameFilter[prefix]) {
                    nameFilter[prefix] = {};
                }

                this.procesarElemento(elemento, prefix, suffix, nameFilter);
            }
        }

        this.procesarId(nameFilter);

        return nameFilter;
    }

    procesarElemento(elemento, prefix, suffix, nameFilter) {
        switch (elemento.type) {
            case 'checkbox':
                nameFilter[prefix][suffix || 'check'] = elemento.checked;
                break;
            case 'radio':
                this.procesarRadio(elemento, prefix, nameFilter);
                break;
            case 'select-one':
                nameFilter[prefix][suffix || 'select'] = elemento.value;
                break;
            case 'number':
                nameFilter[prefix][suffix || 'number'] = elemento.value;
                break;
            default:
                nameFilter[prefix][suffix || 'value'] = elemento.value;
        }
    }

    procesarRadio(elemento, prefix, nameFilter) {
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
    }

    procesarId(nameFilter) {
        const idElement = this.form.elements.namedItem('id');
        if (idElement) {
            const idValue = idElement.value;
            nameFilter.id = !isNaN(idValue) ? idValue : null;
        }
    }
}