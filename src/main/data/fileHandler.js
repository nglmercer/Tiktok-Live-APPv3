import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import NodedbJson from "nodedb-json";
const db = new NodedbJson('./db.json')

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

export const addOrReplaceFile = async (fileToAdd, fileName, destination) => {
  let fileData = db.get('fileData', []);

  // Verificación adicional
  if (!Array.isArray(fileData)) {
      console.error('fileData is not an array, initializing to an empty array');
      fileData = [];
  }

  let filePath = path.join(destination, fileName);
  filePath = generateUniqueFileName(filePath);

  const base64Data = fileToAdd.replace(/^data:.+;base64,/, '');

  try {
      await fs.promises.writeFile(filePath, base64Data, { encoding: 'base64' });

      const mimeType = mime.lookup(fileName) || 'application/octet-stream';

      let fileIndex = db.get('fileIndex', 0) || 0;
      fileIndex++;
      db.set('fileIndex', fileIndex);

      fileData.push({
          index: fileIndex,
          name: path.basename(filePath),
          path: filePath,
          type: mimeType
      });

      db.set('fileData', fileData);
      console.log(fileToAdd, fileName, destination, "addOrReplaceFile fileToAdd, fileName, destination");

      return { success: true, filePath };
  } catch (error) {
      console.error('Error writing file:', error);
      return { success: false, error: error.message };
  }
};

export const registerFile = (filePath, fileName) => {
    let fileData = db.get('fileData', []);
    if (!fileData || fileData.length === 0) {
        fileData = [];
    }
    const mimeType = mime.lookup(fileName) || 'application/octet-stream';

    let fileIndex = db.get('fileIndex', 0) || 0;
    fileIndex++;
    db.set('fileIndex', fileIndex);

    fileData.push({
        index: fileIndex,
        name: path.basename(filePath),
        path: filePath,
        type: mimeType
    });

    db.set('fileData', fileData);

    return filePath;
};

export const getFilesInfo = () => {
    const fileData = db.get('fileData', []);
    if (!fileData || fileData.length === 0) {
        return [];
    }
    return fileData.map(file => ({
        index: file.index !== undefined ? file.index : 'undefined',
        name: file.name,
        path: file.path,
        size: fs.existsSync(file.path) ? fs.statSync(file.path).size : 0,
        type: file.type,
        isDirectory: fs.existsSync(file.path) ? fs.statSync(file.path).isDirectory() : false,
    }));
};

export const deleteFile = (fileName) => {
    const fileData = db.get('fileData', []);
    const updatedFileData = fileData.filter(file => file.name !== fileName);
    db.set('fileData', updatedFileData);

    return updatedFileData;
};

export const getFileById = (fileId) => {
    const fileData = db.get('fileData', []);
    const fileIdNumber = Number(fileId);
    if (isNaN(fileIdNumber)) {
      console.warn(`Invalid fileId: ${fileId}`);
      return { index: null, name: null, path: null, size: 0, type: null, isDirectory: false };
  }
    const file = fileData.find(file => file.index === fileIdNumber);

    if (!file) {
      return { index: null, name: null, path: null, size: 0, type: null, isDirectory: false };
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

export const getFileByname = (fileIdname) => {
  const fileData = db.get('fileData', []);
  const file = fileData.find(file => file.name === fileIdname);

  if (!file) {
      // Retornar null si no se encuentra el archivo en lugar de lanzar una excepción
      console.warn(`File with name ${fileIdname} not found.`);
      return { index: null, name: null, path: null, size: 0, type: null, isDirectory: false };
  }

  // Retornar información del archivo si existe
  return {
      index: file.index,
      name: file.name,
      path: file.path,
      size: fs.existsSync(file.path) ? fs.statSync(file.path).size : 0,
      type: file.type,
      isDirectory: fs.existsSync(file.path) ? fs.statSync(file.path).isDirectory() : false,
  };
};


export const processWebFile = async (fileBase64, fileName, destination) => {
    let filePath = path.join(destination, fileName);
    filePath = generateUniqueFileName(filePath);

    try {
        const base64Data = fileBase64.replace(/^data:[^;]+;base64,/, "");
        const fileBuffer = Buffer.from(base64Data, 'base64');

        await fs.promises.writeFile(filePath, fileBuffer);

        const mimeType = mime.lookup(fileName) || 'application/octet-stream';

        let fileIndex = db.get('fileIndex', 0) || 0;
        fileIndex++;
        db.set('fileIndex', fileIndex);

        const fileData = db.get('fileData', []);
        fileData.push({
            index: fileIndex,
            name: path.basename(filePath),
            path: filePath,
            type: mimeType
        });

        db.set('fileData', fileData);

        return { success: true, filePath };
    } catch (error) {
        console.error('Error writing file:', error);
        return { success: false, error: error.message };
    }
};
// export const Filehandler = {
//   addOrReplaceFile, registerFile, getFilesInfo, deleteFile, getFileById, getFileByname, processWebFile
// }
// export { addOrReplaceFile, registerFile, getFilesInfo, deleteFile, getFileById, getFileByname, processWebFile };
