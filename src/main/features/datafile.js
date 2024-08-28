/**
 * Función para servir archivos grandes con soporte de transmisión (streaming)
 * @param {string} filePath - La ruta completa del archivo en el servidor.
 * @param {string} contentType - El tipo de contenido (MIME) del archivo.
 * @param {object} req - El objeto de solicitud HTTP.
 * @param {object} res - El objeto de respuesta HTTP.
 */
import fs from 'fs';
function serveFile(filePath, contentType, req, res) {
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        if (start >= fileSize) {
            res.status(416).send('Requested range not satisfiable\n' + start + ' >= ' + fileSize);
            return;
        }

        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(filePath, { start, end });
        const head = {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': contentType,
        };

        res.writeHead(206, head);
        file.pipe(res);
    } else {
        const head = {
            'Content-Length': fileSize,
            'Content-Type': contentType,
        };
        res.writeHead(200, head);
        fs.createReadStream(filePath).pipe(res);
    }
}

function appgetfile(app, basePath) {
    app.get('/serve-file', (req, res) => {
        const fileType = req.query.filetype;  // Obtener el tipo de archivo de los parámetros de consulta
        let filePath;
        let contentType;

        switch (fileType) {
            case 'video':
                filePath = `${basePath}/video.mp4`;
                contentType = 'video/mp4';
                break;
            case 'audio':
                filePath = `${basePath}/audio.mp3`;
                contentType = 'audio/mpeg';
                break;
            case 'image':
                filePath = `${basePath}/image.webp`;
                contentType = 'image/webp';
                break;
            default:
                res.status(400).send('Invalid file type');
                return;
        }

        serveFile(filePath, contentType, req, res);
    });
}
{/* <video controls>
  <source src="https://localhost/serve-file?filetype=video" type="video/mp4">
  Your browser does not support the video tag.
</video>

<img src="https://localhost/serve-file?filetype=image" alt="Image Example">

<audio controls>
  <source src="https://localhost/serve-file?filetype=audio" type="audio/mpeg">
  Your browser does not support the audio element.
</audio> */}
export { appgetfile };
