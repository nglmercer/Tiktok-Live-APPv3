import { getfileId, objectModal } from '../renderer.js';
async function createElementWithButtons(dbConfig, data) {
    if (!data || !data.id) {
        console.error('Data is missing or invalid:', data);
        return;
    }

    const table = getOrCreateTableContainer();
    const row = getOrCreateRow(data);

    const nombreCell = createTextCell(data.accionevento?.nombre || 'N/A');
    const imagenCell = createTextCell(await getDataText(data["type-imagen"]));
    const videoCell = createTextCell(await getDataText(data["type-video"]));
    const sonidoCell = createTextCell(await getDataText(data["type-audio"]));
    
    row.appendChild(nombreCell);
    row.appendChild(imagenCell);
    row.appendChild(videoCell);
    row.appendChild(sonidoCell);

    // Crear celdas de eventos
    const eventosCell = document.createElement('td');
    Object.entries(data).forEach(([key, value]) => {
        if (key.startsWith('event-')) {
            const eventname = key.split('-')[1];
            const eventText = value && value.check ? eventname : 'false';
            if (eventText === 'false') {
                return;
            }
            const eventTextNode = document.createTextNode(eventText + ' ');
            eventosCell.appendChild(eventTextNode);
            console.log(eventname, key, value);
        }
    });
    row.appendChild(eventosCell);

    const buttonCell = createButtonCell(data, row);
    row.appendChild(buttonCell);

    table.appendChild(row);
}
async function getDataText(data) {
    if (data.check === false) {
        return false;
    }
    let datatextname = await getfileId(data.select);
    if (datatextname) {
        return datatextname.name;
    }
    return data && data.select ? data.select : 'N/A';
}
function getOrCreateTableContainer() {
    let table = document.querySelector('.data-table');
    if (!table) {
        table = document.createElement('table');
        table.className = 'data-table';
        document.getElementById('loadrowactionsevents').appendChild(table);

        // Crear y agregar el encabezado de la tabla
        const headerRow = document.createElement('tr');
        const headers = ['Nombre', 'Imagen', 'Video', 'Sonido', 'Eventos', 'Botones'];
        headers.forEach(headerText => {
            const headerCell = document.createElement('td');
            headerCell.textContent = headerText;
            headerRow.appendChild(headerCell);
        });
        table.appendChild(headerRow);
    }
    return table;
}
function getOrCreateRow(data) {
    let row = document.querySelector(`.data-row[data-id="${data.id}"]`);
    if (!row) {
        row = document.createElement('tr');
        row.className = 'data-row';
        row.dataset.id = data.id;
    } else {
        // Limpiar la fila existente
        row.innerHTML = '';
    }
    return row;
}
function createTextCell(text) {
    const textCell = document.createElement('td');
    textCell.textContent = text;
    return textCell;
}
function createButtonCell(data, row) {
    const buttonCell = document.createElement('td');
    buttonCell.className = 'button-cell';

    const editButton = document.createElement('button');
    editButton.textContent = 'Editar';
    editButton.className = "custombutton";
    editButton.addEventListener('click', async () => {
        objectModal.onUpdate(data);
    });

    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Borrar';
    deleteButton.className = "deleteButton";
    deleteButton.addEventListener('click', () => {
        row.remove();
        deleteDataFromIndexedDB(databases.MyDatabaseActionevent, data.id);
        setTimeout(() => {
            loadDataFromIndexedDB(databases.eventsDB, createElementWithButtons);
            loadDataFromIndexedDB(databases.MyDatabaseActionevent, createElementWithButtons);
        }, 1000);
        console.log('deleteDataFromIndexedDB', data);
    });

    const testButton = document.createElement('button');
    testButton.textContent = 'Probar';
    testButton.className = "custombutton";
    testButton.addEventListener('click', () => {
        console.log('testButton', data);
    });

    buttonCell.appendChild(editButton);
    buttonCell.appendChild(deleteButton);
    buttonCell.appendChild(testButton);

    return buttonCell;
}
export { createElementWithButtons };