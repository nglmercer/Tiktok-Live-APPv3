async function loadFileList() {
    const files = await window.api.getFilesInFolder();
    const fileList = document.getElementById('file-list');
    fileList.innerHTML = files.map(file => createFileItemHTML(file)).join('');
}
function getMediaElement(filePath, fileType) {
    if (!fileType) return `<img src="file:///${filePath}" class="file-thumbnail" />`;

    if (fileType.startsWith('image/')) {
        return `<img src="file:///${filePath}" class="file-thumbnail" />`;
    } else if (fileType.startsWith('video/')) {
        return `<video controls class="file-thumbnail">
                    <source src="file:///${filePath}" type="${fileType}">
                    Your browser does not support the video tag.
                </video>`;
    } else if (fileType.startsWith('audio/')) {
        return `<audio controls class="file-thumbnail">
                    <source src="file:///${filePath}" type="${fileType}">
                    Your browser does not support the audio tag.
                </audio>`;
    } else {
        return `<span>Unsupported file type</span>`;
    }
}
function createFileItemHTML(file) {
    return `
        <div class="file-item">
            <input type="text" value="${file.name}" class="input input-ghost" disabled>
            <button onclick="deleteFile('${file.name}')" class="deleteButton" data-translate="DeleteButton">Delete</button>
            <button class="play-button" id="playbutton-${file.index}">Play</button>
            ${getMediaElement(file.path, file.type)}
        </div>
    `;
}
function setupDragAndDrop() {
    const dropArea = document.getElementById('drop-area');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        dropArea.classList.add('highlight');
    }

    function unhighlight() {
        dropArea.classList.remove('highlight');
    }

    dropArea.addEventListener('drop', handleDrop, false);
}
async function handledeletefile(fileName) {
    await window.api.deleteFile(fileName);
    loadFileList();
}
async function handleDrop(e) {
    const files = e.dataTransfer.files;
    for (const file of files) {
        await processDroppedFile(file);
    }
}

async function processDroppedFile(file) {
    if (file.path) {
        await processFileWithPath(file);
    } else {
        await processFileWithoutPath(file);
    }
}
async function processFileWithoutPath(file) {
    try {
        const fileName = `${Date.now()}-${file.name}`;
        
        // Verificar si el archivo es un duplicado
        // if (await isFileDuplicate({name: fileName, size: file.size, type: file.type})) {
        //     alert(`El archivo "${fileName}" ya existe o es similar a uno existente.`);
        //     return;
        // }

        const fileBlob = await file.arrayBuffer().then(arrayBuffer => new Blob([arrayBuffer]));
        const base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(fileBlob);
        });

        const downloadsPath = await window.api.getDownloadsPath();
        
        const result = await window.api.addFilePath({
            fileToAdd: base64,
            fileName: fileName,
            isWebFile: true
        });
        
        if (result.success) {
            const confirmation = confirm(`¿Desea agregar el archivo "${fileName}"?`);
            if (confirmation) {
                loadFileList();
            } else {
                await window.api.deleteFile(fileName);
            }
        } else {
            alert(`Error al guardar el archivo: ${result.error}`);
        }
    } catch (error) {
        console.error('Error processing file:', error);
        alert(`Error al procesar el archivo: ${error.message}`);
    }
}

async function processFileWithPath(file) {
    // Verificar si el archivo es un duplicado
    // if (await isFileDuplicate({name: file.name, size: file.size, type: file.type})) {
    //     alert(`El archivo "${file.name}" ya existe o es similar a uno existente.`);
    //     return;
    // }

    const fileParams = { fileName: file.name, filePath: file.path };
    const confirmation = confirm(`¿Desea agregar el archivo "${file.name}"?`);
    if (confirmation) {
        const result = await window.api.addFilePath(fileParams);
        if (result.success) {
            loadFileList();
        } else {
            alert(`Error al agregar el archivo: ${result.error}`);
        }
    }
}
async function handlePlayButton(button) {
    const options = { check: true, select: '11', rango: '50', duracion: '15' };
    const fileindex = button.id.split('-')[1];
    const file = await getfileId(fileindex);
    
    try {
        await window.api.createOverlayWindow();
        await window.api.sendOverlayData('play', { src: file.path, fileType: file.type, options });
    } catch (error) {
        console.error('Error sending overlay event:', error);
    }
}
async function getfileId(id) {
    if (id === undefined || id === null || id === false) {
        return null;
    }
    
    let converidtonumber = Number(id);
    let findelement = await window.api.getFileById(converidtonumber);
    // console.log("getfileId", findelement);
    if (findelement) {
        return findelement;
    } else {
        return null;
    }
}
async function handlePasteFromClipboard() {
    try {
        const clipboardItems = await navigator.clipboard.read();
        for (const clipboardItem of clipboardItems) {
            for (const type of clipboardItem.types) {
                if (type.startsWith('image/')) {
                    const blob = await clipboardItem.getType(type);
                    await processClipboardFile(blob, type);
                }
            }
        }
    } catch (err) {
        console.error('Error al pegar desde el portapapeles:', err);
        alert('Error al pegar desde el portapapeles. Asegúrate de que has copiado una imagen.');
    }
}

async function processClipboardFile(blob, type) {
    const fileName = `clipboard-${Date.now()}.${type.split('/')[1]}`;
    
    // Verificar si el archivo es un duplicado
    if (await isFileDuplicate({name: fileName, size: blob.size, type: type})) {
        alert(`Un archivo similar ya existe en la lista.`);
        return;
    }

    const base64 = await blobToBase64(blob);
    
    const result = await window.api.addFilePath({
        fileToAdd: base64,
        fileName: fileName,
        isWebFile: true,
        isClipboardFile: true
    });

    if (result.success) {
        loadFileList();
    } else {
        alert(`Error al guardar el archivo del portapapeles: ${result.error}`);
    }
}
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}
async function isFileDuplicate(newFile) {
    const existingFiles = await window.api.getFilesInFolder();
    return existingFiles.some(existingFile => 
        existingFile.name === newFile.name ||
        existingFile.size === newFile.size ||
        existingFile.type === newFile.type
    );
}
export { getMediaElement, createFileItemHTML, setupDragAndDrop, handlePlayButton, getfileId, handledeletefile, handlePasteFromClipboard };