# tiktokliveappv3

A minimal Electron application with JavaScript

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```
# expample find keys
al encontrar una clave en el config se ejecutara el callback correspondiente
 otra funcion que solo ejecutara los callbacks cuando todos las claves han sido encontradas
```
const config = {
  {keytype: boolean, keyfind: true,keyname: "datatest0",callback: testcallback},
  {keytype: string, keyfind: "hola",keyname: "datatest0",callback: testcallback},
  {keytype: number, keyfind: 3,keyname: "datatest3",callback: testcallback},
}
data = [
  {datatest: "hola", datatest0: true,datatest1: "hola", datatest2: true,datatest3: 3, datatest4: true },
  {datatest11: "hola", datatest22: true, number: 3, datatest33: true},
  {datatest32: 3, datatest42: true, datatest33: true, datatest44: true},
]
function testcallback(data) {
    console.log(data)
}
function evaldata(callback, dataeval, config) {
    config.forEach(item => {
        if (item.keytype === typeof dataeval[item.keyname]) {
            item.callback(dataeval[item.keyname])
        }
    })
}
```
#### modifica mis requerimiento tambien si no existe callback no ejecuta nada ademas de que tambien una config de ejemplo de que ejecute solo si existe no comprueba la clave
dame el codigo en funciones y tambien en una clase
```
class ConfigEvaluator {
    constructor(config) {
        this.config = config;
        this.foundKeys = new Set();
    }

    testcallback(data) {
        console.log(data);
    }

    evalData(callback, dataeval) {
        this.config.forEach(item => {
            if (item.callback && item.keyname in dataeval) {
                if (item.keytype === 'any' || item.keytype === typeof dataeval[item.keyname]) {
                    this.foundKeys.add(item.keyname);
                    item.callback(dataeval[item.keyname]);
                }
            }
        });

        if (this.foundKeys.size === this.config.length) {
            callback();
        }
    }
}

// Ejemplo de uso
const config = [
    { keytype: 'boolean', keyfind: true, keyname: "datatest0", callback: (data) => console.log(data) },
    { keytype: 'string', keyfind: "hola", keyname: "datatest1", callback: (data) => console.log(data) },
    { keytype: 'number', keyfind: 3, keyname: "datatest3", callback: (data) => console.log(data) },
    { keytype: 'any', keyfind: null, keyname: "datatest2", callback: (data) => console.log(data) }, // Ejecuta solo si la clave existe
];

const data = [
    { datatest: "hola", datatest0: true, datatest1: "hola", datatest2: true, datatest3: 3, datatest4: true },
    { datatest11: "hola", datatest22: true, number: 3, datatest33: true },
    { datatest32: 3, datatest42: true, datatest33: true, datatest44: true },
];

const evaluator = new ConfigEvaluator(config);
evaluator.evalData(() => console.log("Todos los callbacks han sido ejecutados."), data[0]);

```
Aquí tienes una explicación detallada del código en formato Markdown, incluyendo ejemplos y posibles resultados.

# Explicación del Código

Este código implementa una función `evaldata` que se utiliza para evaluar y verificar datos en un objeto dado (`dataeval`) basándose en una configuración específica (`config`). El propósito principal de la función es recorrer una serie de reglas de configuración, buscar valores en el objeto `dataeval`, verificar esos valores según ciertos criterios, y luego ejecutar callbacks asociados si las verificaciones son exitosas.

## Estructura del Código

### 1. Función `evaldata(finalCallback, dataeval, config)`

#### Parámetros:
- **`finalCallback`**: Una función que se ejecuta al final de todas las evaluaciones.
- **`dataeval`**: El objeto que contiene los datos que serán evaluados.
- **`config`**: Un array de objetos de configuración que define las reglas para evaluar los datos.

#### Estructura de `config`:
Cada objeto en `config` puede contener las siguientes propiedades:
- **`keyname`**: La ruta del valor dentro de `dataeval` que se quiere evaluar.
- **`keytype`**: El tipo de dato esperado (`'any'`, `'number'`, `'string'`, etc.).
- **`verifykey`**: Un objeto opcional que contiene criterios adicionales para verificar el valor encontrado. Puede incluir:
  - `key`: La subclave que debe verificarse.
  - `value`: El valor esperado de la subclave.
  - `type`: El tipo de verificación, por ejemplo, `'number'` para verificar si el valor es un número y cumple con una condición.
- **`callback`**: Una función que se ejecuta si la verificación es exitosa.
- **`isBlocking`**: Si es `true`, interrumpe el proceso si la verificación falla.

#### Funcionamiento:
1. **Buscar y Evaluar**: Se busca un valor en `dataeval` según la ruta especificada en `keyname`. Si se encuentra, se verifica que coincida con el tipo de dato esperado (`keytype`).

2. **Verificación Adicional**: Si se proporciona `verifykey`, se realiza una verificación adicional sobre el valor encontrado. Por ejemplo, si `verifykey.type` es `'number'`, se verifica que el valor sea mayor o igual a `verifykey.value`.

3. **Callback**: Si todas las verificaciones son exitosas, se ejecuta el callback asociado.

4. **Bloqueo**: Si una verificación falla y `isBlocking` es `true`, se detiene el proceso.

5. **Callback Final**: Al final del proceso, se ejecuta `finalCallback`.

### 2. Función `findAndEvaluate(keyPath, keytype, verifykey, obj)`

Esta función busca un valor en `obj` siguiendo la ruta especificada en `keyPath` y realiza la verificación según `keytype` y `verifykey`.

## Ejemplo de Uso

```javascript
const config = [
    { keytype: 'any', keyfind: null, keyname: "accionevento", verifykey: { key: "check", value: true }, callback: (data) => console.log("Check:", data), isBlocking: false },
    { keytype: 'number', keyfind: 5, keyname: "id", verifykey: null, callback: (data) => console.log("Number:", data) },
    { keytype: 'any', keyfind: null, keyname: "accionevento.event-likes", verifykey: { key: "number", value: 5, type: 'number' }, callback: (data) => console.log("Likes:", data) },
    { keytype: 'any', keyfind: null, keyname: "type-video", verifykey: { key: "check", value: true }, callback: (data) => console.log("type-video:", data) },
];

const data = [
    {
        accionevento: {
            check: true,
            nombre: "",
            event: {},
            "event-chat": { check: false },
            "event-follow": { check: false },
            "event-gift": { select: 'rosa', check: false },
            "event-likes": { check: false, number: 5 },
            "event-share": { check: false },
            "event-subscribe": { check: false },
        },
        "type-audio": { check: false, select: 'false', rango: '50', duracion: '5' },
        "type-imagen": { check: false, select: '11', rango: '50', duracion: '5' },
        "type-profile": { check: false, duracion: '5', texto: '123' },
        "type-video": { check: true, select: '13', rango: '50', duracion: '5' },
        id: 5
    }
];

evaldata(() => console.log("Todos los callbacks han sido ejecutados"), data[0], config);
```

### Ejemplos de Resultados

1. **Primera Configuración**:
   - `keyname`: `"accionevento"`
   - `verifykey`: `{ key: "check", value: true }`
   - **Resultado**: Como `accionevento.check` es `true`, se ejecuta el callback `console.log("Check:", data)`.

2. **Segunda Configuración**:
   - `keyname`: `"id"`
   - `keytype`: `'number'`
   - **Resultado**: Como `id` es `5` (y es un número), se ejecuta el callback `console.log("Number:", data)`.

3. **Tercera Configuración**:
   - `keyname`: `"accionevento.event-likes"`
   - `verifykey`: `{ key: "number", value: 5, type: 'number' }`
   - **Resultado**: Como `accionevento.event-likes.number` es `5` y cumple con la verificación, se ejecuta el callback `console.log("Likes:", data)`.

4. **Cuarta Configuración**:
   - `keyname`: `"type-video"`
   - `verifykey`: `{ key: "check", value: true }`
   - **Resultado**: Como `type-video.check` es `true`, se ejecuta el callback `console.log("type-video:", data)`.

### Posibles Casos de Interrupción

Si una configuración tiene `isBlocking` como `true` y la verificación falla, el proceso se interrumpe y no se ejecutan los siguientes callbacks. Por ejemplo, si `verifykey` no coincide, el código imprime `Interrumpido debido a {keyname}` y detiene la evaluación.

## Conclusión

Este código es útil para verificar y procesar datos complejos que se encuentran en estructuras anidadas. Permite una verificación flexible con múltiples condiciones, lo que lo hace adecuado para escenarios donde es necesario validar datos antes de proceder con acciones específicas.

## codigo
```javascript
function evaldata(finalCallback, dataeval, config) {
    const matchedValues = new Map();

    // Función para obtener el valor de una clave anidada siguiendo la ruta especificada
    function findAndEvaluate(keyPath, keytype, verifykey, obj) {
        const keys = keyPath.split('.');
        let currentValue = obj;

        for (const key of keys) {
            if (typeof currentValue === 'object' && currentValue !== null && key in currentValue) {
                currentValue = currentValue[key];
            } else {
                currentValue = undefined;
                break;
            }
        }

        // Evaluar si el valor encontrado cumple con el tipo y verificación requerida
        if (currentValue !== undefined && (keytype === 'any' || keytype === typeof currentValue)) {
            if (verifykey) {
                if (typeof currentValue === 'object' && currentValue[verifykey.key] !== undefined) {
                    // Verificación específica para el tipo number
                    if (verifykey.type === 'number' && typeof currentValue[verifykey.key] === 'number') {
                        if (currentValue[verifykey.key] >= verifykey.value) {
                            matchedValues.set(keyPath, currentValue);
                        } else {
                            matchedValues.set(keyPath, null);
                        }
                    } else if (currentValue[verifykey.key] === verifykey.value) {
                        matchedValues.set(keyPath, currentValue);
                    } else {
                        matchedValues.set(keyPath, null);
                    }
                } else {
                    matchedValues.set(keyPath, null);
                }
            } else {
                matchedValues.set(keyPath, currentValue);
            }
        }
    }

    for (const item of config) {
        findAndEvaluate(item.keyname, item.keytype, item.verifykey, dataeval);

        if (matchedValues.has(item.keyname)) {
            const value = matchedValues.get(item.keyname);
            if (item.callback && value !== null) {
                item.callback(value);
            }
        }

        // Si el ítem es bloqueante y no se encuentra o no pasa la verificación, hacer un break
        if (item.isBlocking && (!matchedValues.has(item.keyname) || matchedValues.get(item.keyname) === null)) {
            console.log(`Interrumpido debido a ${item.keyname}`);
            break;
        }
    }

    finalCallback(); // Llamar al callback final
}

// Ejemplo de uso
const config = [
    { keytype: 'any', keyfind: null, keyname: "accionevento", verifykey: { key: "check", value: true }, callback: (data) => console.log("Check:", data), isBlocking: false },
    { keytype: 'number', keyfind: 5, keyname: "id", verifykey: null, callback: (data) => console.log("Number:", data) },
    { keytype: 'any', keyfind: null, keyname: "accionevento.event-likes", verifykey: { key: "number", value: 5, type: 'number' }, callback: (data) => console.log("Likes:", data) },
    { keytype: 'any', keyfind: null, keyname: "type-video", verifykey: { key: "check", value: true }, callback: (data) => console.log("type-video:", data) },
];

const data = [
    {
        accionevento: {
            check: true,
            nombre: "",
            event: {},
            "event-chat": { check: false },
            "event-follow": { check: false },
            "event-gift": { select: 'rosa', check: false },
            "event-likes": { check: false, number: 5 },
            "event-share": { check: false },
            "event-subscribe": { check: false },
        },
        "type-audio": { check: false, select: 'false', rango: '50', duracion: '5' },
        "type-imagen": { check: false, select: '11', rango: '50', duracion: '5' },
        "type-profile": { check: false, duracion: '5', texto: '123' },
        "type-video": { check: true, select: '13', rango: '50', duracion: '5' },
        id: 5
    }
];

evaldata(() => console.log("Todos los callbacks han sido ejecutados"), data[0], config);
```
