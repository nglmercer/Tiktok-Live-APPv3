class DataParser {
    constructor(element, options = {}) {
        this.element = element;
        this.options = {
            idPrefix: options.idPrefix || '',
            dataAttr: options.dataAttr || 'data-field',
            classPrefix: options.classPrefix || 'field-',
            separator: options.separator || '-',
            parseMethod: options.parseMethod || 'id',
            groupAttr: options.groupAttr || 'data-group-name'
        };
    }

    parse() {
        const data = {};
        const elements = this.getElements();
        elements.forEach(element => {
            const groupName = this.getGroupName(element);
            if (groupName) {
                this.parseGroup(element, data, groupName);
            } else {
                this.parseElement(element, data);
            }
        });
        return data;
    }

    getElements() {
        let elements = this.element.querySelectorAll('input, select, textarea');
        return Array.from(elements).filter(element => this.isValidElement(element));
    }

    isValidElement(element) {
        switch(this.options.parseMethod) {
            case 'id':
                return element.id && element.id.startsWith(this.options.idPrefix);
            case 'data':
                return element.hasAttribute(this.options.dataAttr);
            case 'class':
                return Array.from(element.classList).some(cls => cls.startsWith(this.options.classPrefix));
            default:
                return false;
        }
    }
    getGroupName(element) {
        return element.closest(`[${this.options.groupAttr}]`);
    }

    parseElement(element, data) {
        const key = this.getKey(element);
        if (key !== null) {
            data[key] = this.getElementValue(element);
        } else {
            console.warn(`No se pudo obtener una clave válida para el elemento:`, element);
        }
    }
    getKey(element) {
        let key;
        switch(this.options.parseMethod) {
            case 'id':
                key = element.id.replace(this.options.idPrefix, '');
                break;
            case 'data':
                key = element.getAttribute(this.options.dataAttr);
                break;
            case 'class':
                key = Array.from(element.classList)
                    .find(cls => cls.startsWith(this.options.classPrefix))
                    .replace(this.options.classPrefix, '');
                break;
        }
        return key ? this.formatKey(key) : null;
    }

    formatKey(key) {
        if (!key) return null;
        return key.split(this.options.separator).map((part, index) =>
            index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
        ).join('');
    }

    getElementValue(element) {
        switch(element.type) {
            case 'checkbox':
                return element.checked;
            case 'radio':
                return element.checked ? element.value : undefined;
            case 'select-multiple':
                return Array.from(element.selectedOptions).map(option => option.value);
            default:
                return element.value;
        }
    }

    parseGroup(element, data, groupName) {
        const groupData = {};
        const groupElements = groupName.querySelectorAll(`[name="${element.name}"]`);
        groupElements.forEach(groupElement => {
            this.parseElement(groupElement, groupData);
        });
        const groupKey = groupName.getAttribute(this.options.groupAttr);
        data[groupKey] = groupData;
    }
}

class DataParserStructured extends DataParser {
    parseStructured() {
        const data = this.parse();
        return this.structureData(data);
    }

    structureData(data) {
        const structuredData = {};
        Object.keys(data).forEach(key => {
            const parts = key.split(this.options.separator);
            this.assignToObject(structuredData, parts, data[key]);
        });
        return structuredData;
    }

    assignToObject(obj, parts, value) {
        const key = parts.shift();
        if (parts.length === 0) {
            if (Array.isArray(value)) {
                obj[key] = (obj[key] || []).concat(value);
            } else {
                obj[key] = value;
            }
        } else {
            if (!obj[key]) {
                obj[key] = {};
            }
            this.assignToObject(obj[key], parts, value);
        }
    }

    getElementValue(element) {
        switch(element.type) {
            case 'checkbox':
                return element.checked ? (element.value || true) : false;
            case 'radio':
                return element.checked ? element.value : undefined;
            case 'select-multiple':
                return Array.from(element.selectedOptions).map(option => option.value);
            default:
                return element.value;
        }
    }
}

export { DataParser, DataParserStructured };
