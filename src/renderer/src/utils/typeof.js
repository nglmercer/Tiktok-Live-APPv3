class TypeofData {
  // Verificar si el valor es un objeto
  static isObject(value) {
    return value !== null && typeof value === 'object';
  }
  static ObjectStringify(value) {
    if (typeof value === 'string') {
      try {
        // Intenta analizar la cadena como JSON
        JSON.parse(value);
        // Si no hay error, asumimos que ya es una cadena JSON válida
      } catch (e) {
        // Si no es JSON válido, lo convertimos a JSON
        value = JSON.stringify(value);
      }
    } else if (typeof value === 'object') {
      // Si es un objeto, lo convertimos a JSON
      value = JSON.stringify(value);
    }
    return value;
  }
  static returnArray(value) {
    if (this.isArray(value)) {
      return value;
    } else if (this.isString(value)) {
      return value.split(',');
    } else if (this.isObject(value)) {
      return Object.values(value);
    }
    return [];
  }
  // Verificar si el valor es un array
  static isArray(value) {
    return Array.isArray(value);
  }

  // Verificar si el valor es una función
  static isFunction(value) {
    return typeof value === 'function';
  }

  // Verificar si el valor es una string
  static isString(value) {
    return typeof value === 'string';
  }

  // Verificar si el valor es un número
  static isNumber(value) {
    return typeof value === 'number' && !isNaN(value);
  }

  // Verificar si el valor es un booleano
  static isBoolean(value) {
    return typeof value === 'boolean';
  }

  // Verificar si el valor es null
  static isNull(value) {
    return value === null;
  }

  // Verificar si el valor es undefined
  static isUndefined(value) {
    return value === undefined;
  }

  // Convertir string a número
  static toNumber(value) {
    if (this.isString(value) && !isNaN(value)) {
      return Number(value);
    } else if (this.isNumber(value)) {
      return value;
    }
    return null; // Devolver NaN si la conversión falla
  }

  // Convertir número a string
  static toString(value) {
    if (this.isNumber(value)) {
      return String(value);
    }
    if (this.isBoolean(value)) {
      return String(value);
    }
    if (this.isObject(value)) {
      return JSON.stringify(value);
    }
    return '';
  }
  static toStringParse(value) {
    if (!value) return value; // Devuelve el valor original si no es una cadena
    if (this.isString(value)) {
      try {
        return JSON.parse(value);
      } catch (error) {
        console.warn("Failed to parse JSON string:", value);
        return value; // Devuelve el valor original si no se puede analizar
      }
    }
    return value; // Devuelve el valor original si no es una cadena
  }
  // Verificar si un string puede ser convertido a número
  static canBeNumber(value) {
    return this.isString(value) && !isNaN(value);
  }

  // Obtener el tipo del valor en forma de string
  static getType(value) {
    if (this.isObject(value)) return 'object';
    if (this.isArray(value)) return 'array';
    if (this.isFunction(value)) return 'function';
    if (this.isString(value)) return 'string';
    if (this.isNumber(value)) return 'number';
    if (this.isBoolean(value)) return 'boolean';
    if (this.isNull(value)) return 'null';
    if (this.isUndefined(value)) return 'undefined';
    return 'unknown';
  }
}

// Ejemplo de usoquerySnapshot.forEach
// console.log(TypeofData.isString("hello")); // true
// console.log(TypeofData.isNumber(123)); // true
// console.log(TypeofData.isArray([1, 2, 3])); // true
// console.log(TypeofData.toNumber("123")); // 123
// console.log(TypeofData.toString(123)); // "123"
// console.log(TypeofData.getType({})); // "object"
// console.log(TypeofData.canBeNumber("456")); // true
export default TypeofData;
