import fs from "fs/promises";
import path from "path";
import { execSync } from "child_process";

class FileIndexer {
  constructor(directories = []) {
    this.directories = directories;
    this.index = [];
  }

  // Método para verificar acceso a directorios de forma asíncrona
  async canAccess(dirPath) {
    try {
      await fs.access(dirPath, fs.constants.R_OK | fs.constants.W_OK);
      return true;
    } catch (err) {
      return false;
    }
  }

  // Método para obtener el icono de un archivo
  async getFileIcon(filePath) {
    try {
      // Verificar si el archivo existe y se puede acceder a él
      if (!(await this.canAccess(filePath))) {
        console.error(`No se puede acceder a ${filePath}`);
        return { hasIcon: false };
      }

      // Intentar extraer el icono del archivo utilizando la API de Windows
      const iconData = this.getWindowsIcon(filePath);
      if (iconData) {
        return { hasIcon: true, icon: iconData };
      } else {
        return { hasIcon: false };
      }
    } catch (err) {
      console.error(`Error al obtener el icono de ${filePath}: ${err.message}`);
      return { hasIcon: false };
    }
  }

  // Método para obtener el icono de un archivo en Windows
  getWindowsIcon(filePath) {
    try {
      // Utilizar la herramienta 'GetIcon' de Windows para extraer el icono
      const iconData = execSync(`GetIcon.exe "${filePath}"`, { encoding: 'base64' });
      return iconData;
    } catch (err) {
      console.error(`Error al obtener el icono de ${filePath}: ${err.message}`);
      return null;
    }
  }

  // Método para indexar un solo directorio de forma asíncrona
  async indexDirectory(dirPath) {
    if (!(await this.canAccess(dirPath))) {
      console.error(`No se puede acceder a ${dirPath}`);
      return;
    }

    try {
      const files = await fs.readdir(dirPath);
      const tasks = files.map(async (file) => {
        const filePath = path.join(dirPath, file);
        try {
          const stat = await fs.stat(filePath);
          if (stat.isDirectory()) {
            await this.indexDirectory(filePath); // Recursivamente indexa subdirectorios
          } else {
            const ext = path.extname(file).toLowerCase();
            this.index.push({ name: file, path: filePath, ext });
          }
        } catch (err) {
          console.error(`No se puede acceder a ${filePath}: ${err.message}`);
        }
      });

      await Promise.all(tasks); // Espera a que todas las promesas se resuelvan
    } catch (err) {
      console.error(`No se puede acceder a ${dirPath}: ${err.message}`);
    }
  }

  // Método para indexar múltiples directorios de forma asíncrona en paralelo
  async indexMultipleDirectories() {
    this.index = []; // Reiniciar el índice
    const tasks = this.directories.map((dir) => {
      console.log(`Indexando ${dir}...`);
      return this.indexDirectory(dir);
    });

    await Promise.all(tasks); // Ejecuta todas las promesas de indexación en paralelo
  }

  // Método para buscar archivos por nombre
  searchFiles(query) {
    return this.index.filter((file) =>
      file.name.toLowerCase().includes(query.toLowerCase())
    );
  }

  // Método para buscar archivos por extensión
  searchByExtension(extension) {
    return this.index.filter((file) => file.ext === extension.toLowerCase());
  }

  // Método para buscar archivos que terminen con una cadena específica
  searchByEndsWith(suffix) {
    return this.index.filter((file) =>
      file.name.toLowerCase().endsWith(suffix.toLowerCase())
    );
  }

  // Método para agregar un nuevo directorio y reindexar
  async addDirectoryAndReindex(directory) {
    this.directories.push(directory);
    await this.indexDirectory(directory);
  }

  // Método para buscar archivos y obtener sus iconos
  async searchFilesWithIcons(query) {
    const filteredFiles = this.searchFiles(query);
    const filesWithIcons = await Promise.all(
      filteredFiles.map(async (file) => {
        const iconInfo = await this.getFileIcon(file.path);
        return { ...file, ...iconInfo };
      })
    );
    return filesWithIcons;
  }
}

const directoriesToIndex = [
  path.join(process.env.USERPROFILE, "Desktop"), // Escritorio
  "C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs", // Program Files
];

let fileIndexer;
(async () => {
  fileIndexer = new FileIndexer(directoriesToIndex);
  await fileIndexer.indexMultipleDirectories(); // Indexa las carpetas especificadas
})();

export default fileIndexer;
