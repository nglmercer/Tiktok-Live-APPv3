const fs = require('fs');
const path = require('path');
const Store = require('electron-store');
const mime = require('mime-types');

const store = new Store();

const generateUniqueFileName = (filePath) => {
    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const baseName = path.basename(filePath, ext);

    let newFilePath = filePath;
    let counter = 1;

    while (fs.existsSync(newFilePath)) {
        newFilePath = path.join(dir, `${baseName} (${counter})${ext}`);
        counter++;
    }

    return newFilePath;
};

const addOrReplaceFile = async (fileToAdd, fileName, destination) => {
    const fileData = store.get('fileData', []);
    let filePath = path.join(destination, fileName);

    filePath = generateUniqueFileName(filePath);

    const base64Data = fileToAdd.replace(/^data:.+;base64,/, '');

    try {
        await fs.promises.writeFile(filePath, base64Data, { encoding: 'base64' });

        const mimeType = mime.lookup(fileName) || 'application/octet-stream';

        let fileIndex = store.get('fileIndex', 0) || 0;
        fileIndex++;
        store.set('fileIndex', fileIndex);

        fileData.push({ 
            index: fileIndex,
            name: path.basename(filePath), 
            path: filePath, 
            type: mimeType 
        });

        store.set('fileData', fileData);
        console.log(fileToAdd, fileName, destination, "addOrReplaceFile fileToAdd, fileName, destination");

        return { success: true, filePath };
    } catch (error) {
        console.error('Error writing file:', error);
        return { success: false, error: error.message };
    }
};

const registerFile = (filePath, fileName) => {
    const fileData = store.get('fileData', []);
    const mimeType = mime.lookup(fileName) || 'application/octet-stream';

    // Retrieve and increment the file index counter
    let fileIndex = store.get('fileIndex', 0) || 0;
    fileIndex++;
    store.set('fileIndex', fileIndex);

    fileData.push({ 
        index: fileIndex,
        name: path.basename(filePath), 
        path: filePath, 
        type: mimeType 
    });

    store.set('fileData', fileData);

    return filePath;
};

const getFilesInfo = () => {
    const fileData = store.get('fileData', []);
    return fileData.map(file => ({
        index: file.index !== undefined ? file.index : 'undefined', // Handle undefined indices
        name: file.name,
        path: file.path,
        size: fs.existsSync(file.path) ? fs.statSync(file.path).size : 0,
        type: file.type,
        isDirectory: fs.existsSync(file.path) ? fs.statSync(file.path).isDirectory() : false,
    }));
};

const deleteFile = (fileName) => {
    const fileData = store.get('fileData', []);
    const updatedFileData = fileData.filter(file => file.name !== fileName);
    store.set('fileData', updatedFileData);

    return updatedFileData;
};

// Function to get file data by index
const getFileById = (fileId) => {
    const fileData = store.get('fileData', []);
    // Asegúrate de que fileId es un número
    const fileIdNumber = Number(fileId);
    if (isNaN(fileIdNumber)) {
        // throw new Error(`Invalid file id: ${fileId}`);
        return null;
    }
    const file = fileData.find(file => file.index === fileIdNumber);
    
    // console.log('file', file, "fileid", fileIdNumber);
    // console.log('fileData', fileData);

    if (!file) {
        throw new Error(`File with id ${fileId} not found`);
    }

    return {
        index: file.index,
        name: file.name,
        path: file.path,
        size: fs.existsSync(file.path) ? fs.statSync(file.path).size : 0,
        type: file.type,
        isDirectory: fs.existsSync(file.path) ? fs.statSync(file.path).isDirectory() : false,
    };
};
const getFileByname = (fileIdname) => {
    const fileData = store.get('fileData', []);
    // Asegúrate de que fileId es un número
    const file = fileData.find(file => file.name === fileIdname);
    
    // console.log('file', file, "fileid", fileIdname);
    // console.log('fileData', fileData);

    if (!file) {
        throw new Error(`File with id ${fileIdname} not found`);
    }

    return {
        index: file.index,
        name: file.name,
        path: file.path,
        size: fs.existsSync(file.path) ? fs.statSync(file.path).size : 0,
        type: file.type,
        isDirectory: fs.existsSync(file.path) ? fs.statSync(file.path).isDirectory() : false,
    };
};
const processWebFile = async (fileBase64, fileName, destination) => {
    let filePath = path.join(destination, fileName);
    filePath = generateUniqueFileName(filePath);

    try {
        // Eliminar el prefijo de data URL si está presente
        const base64Data = fileBase64.replace(/^data:[^;]+;base64,/, "");
        
        // Convertir base64 a buffer
        const fileBuffer = Buffer.from(base64Data, 'base64');

        await fs.promises.writeFile(filePath, fileBuffer);
        
        const mimeType = mime.lookup(fileName) || 'application/octet-stream';
        
        let fileIndex = store.get('fileIndex', 0) || 0;
        fileIndex++;
        store.set('fileIndex', fileIndex);

        const fileData = store.get('fileData', []);
        fileData.push({ 
            index: fileIndex,
            name: path.basename(filePath), 
            path: filePath, 
            type: mimeType 
        });

        store.set('fileData', fileData);
        
        return { success: true, filePath };
    } catch (error) {
        console.error('Error writing file:', error);
        return { success: false, error: error.message };
    }
};
module.exports = {
    addOrReplaceFile,
    registerFile,
    getFilesInfo,
    deleteFile,
    getFileById,
    getFileByname,
    processWebFile,  // Añade esta línea
};