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
            <button onclick="deleteFile('${file.name}')" class="deleteButton">Delete</button>
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
async function deleteFile(fileName) {
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
async function processFileWithPath(file) {
    const fileParams = { fileName: file.name, filePath: file.path };
    const confirmation = confirm(`¿Desea agregar el archivo "${file.name}"?`);
    if (confirmation) {
        const result = await window.api.addFilePath(fileParams);
        if (result.success) {
            // addFileToLocalStorage(fileParams);
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
    if (id === undefined || id === null) {
        return null;
    } 
    let converidtonumber = Number(id);
    let findelement = window.api.getFileById(converidtonumber);
    if (findelement) {
        return findelement;
    } else {
        return null;
    }
}
export { getMediaElement, createFileItemHTML, setupDragAndDrop, handlePlayButton, getfileId };