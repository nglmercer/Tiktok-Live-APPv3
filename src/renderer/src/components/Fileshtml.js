import socketManager, { Websocket, socketurl } from '../utils/socket';
import { getformdatabyid, postToFileHandler, getdatafromserver }  from '../utils/getdata'
class FileItem {
  constructor(file) {
      this.file = file;
  }

  createFileElement() {
      const fileItemDiv = document.createElement('div');
      fileItemDiv.className = 'file-item';

      const fileNameInput = document.createElement('input');
      fileNameInput.type = 'text';
      fileNameInput.value = this.file.name;
      fileNameInput.className = 'input input-ghost';
      fileNameInput.disabled = true;

      const deleteButton = document.createElement('button');
      deleteButton.className = 'deleteButton';
      deleteButton.setAttribute('data-translate', 'DeleteButton');
      deleteButton.textContent = 'Delete';
      deleteButton.onclick = () => handledeletefile(this.file.name);

      const playButton = document.createElement('button');
      playButton.className = 'play-button';
      playButton.id = `playbutton-${this.file.index}`;
      playButton.textContent = 'Play';
      playButton.onclick = () => handlePlayButton(playButton);

      const mediaElement = this.createMediaElement();

      fileItemDiv.appendChild(fileNameInput);
      fileItemDiv.appendChild(deleteButton);
      fileItemDiv.appendChild(playButton);
      fileItemDiv.appendChild(mediaElement);

      return fileItemDiv;
  }

  createMediaElement() {
      const { path: filePath, type: fileType } = this.file;

      if (!fileType || fileType.startsWith('image/')) {
          const img = document.createElement('img');
          img.src = `file:///${filePath}`;
          img.className = 'file-thumbnail';
          return img;
      } else if (fileType.startsWith('video/')) {
          const video = document.createElement('video');
          video.controls = true;
          video.className = 'file-thumbnail';

          const source = document.createElement('source');
          source.src = `file:///${filePath}`;
          source.type = fileType;

          video.appendChild(source);
          return video;
      } else if (fileType.startsWith('audio/')) {
          const audio = document.createElement('audio');
          audio.controls = true;
          audio.className = 'file-thumbnail';

          const source = document.createElement('source');
          source.src = `file:///${filePath}`;
          source.type = fileType;

          audio.appendChild(source);
          return audio;
      } else {
          const span = document.createElement('span');
          span.textContent = 'Unsupported file type';
          return span;
      }
  }
}

async function loadFileList() {
  const files = await postToFileHandler("get-files-in-folder", {});
  console.log("files", files);
  if (!files || files.length === 0) {
      return;
  }
  const fileList = document.getElementById('file-list');
  fileList.innerHTML = '';  // Limpiar el contenedor antes de agregar los nuevos elementos

  files.forEach(file => {
      const fileItem = new FileItem(file);
      fileList.appendChild(fileItem.createFileElement());
  });
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
    await postToFileHandler("delete-file", {fileName: fileName});
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

        const fileBlob = await file.arrayBuffer().then(arrayBuffer => new Blob([arrayBuffer]));
        const base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(fileBlob);
        });

        // const downloadsPath = await window.api.getDownloadsPath();

        const result = await  postToFileHandler("add-file-path",{
            fileToAdd: base64,
            fileName: fileName,
            isWebFile: true
        });

        if (result.success) {
            const confirmation = confirm(`¿Desea agregar el archivo "${fileName}"?`);
            if (confirmation) {
                loadFileList();
            } else {
                await postToFileHandler("delete-file", {fileName: fileName});
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

    const fileParams = { fileName: file.name, filePath: file.path };
    const confirmation = confirm(`¿Desea agregar el archivo "${file.name}"?`);
    if (confirmation) {
        const result = await postToFileHandler("add-file-path", fileParams);
        if (result.success) {
            loadFileList();
        } else {
            alert(`Error al agregar el archivo: ${result.error}`);
        }
    }
}
async function handlePlayButton(button) {
    console.log("handlePlayButton", button);
    const options = { check: true, select: '11', rango: '50', duracion: '15' };
    const fileindex = button.id.split('-')[1];
    const file = await getfileId(fileindex);
    console.log("handlePlayButton", file,options);
    const datafile = {
      eventType: 'play',
      data: { src: file.path, fileType: file.type, options },
    };
    // getdatafromserver(`${socketurl.getport()}/overlay`, datafile);
    socketManager.emitMessage("overlaydata", datafile);
}
// setInterval(() => {
//   const datafile = {
//     eventType: 'play',
//     data: { src: "testdata", fileType: "image/jpeg", options: { check: true, select: '11', rango: '50', duracion: '15' } },
// };
// console.log("datafile", datafile);
//   socketManager.emitMessage("overlaydata", datafile);
// }, 5000);
// socketManager.onMessage("overlay-event", (data) => {
//   console.log("overlay-event", data);
// });
async function getfileId(id) {
    if (id === undefined || id === null || id === false) {
        return null;
    }

    let converidtonumber = Number(id);
    let findelement = await postToFileHandler("get-file-by-id", {fileId: converidtonumber});
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

    const result = await postToFileHandler("add-file-path", {
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
    const existingFiles = await postToFileHandler("get-files-in-folder", {});
    return existingFiles.some(existingFile =>
        existingFile.name === newFile.name ||
        existingFile.size === newFile.size ||
        existingFile.type === newFile.type
    );
}

export { setupDragAndDrop, handlePlayButton, getfileId, handledeletefile, handlePasteFromClipboard, loadFileList };
