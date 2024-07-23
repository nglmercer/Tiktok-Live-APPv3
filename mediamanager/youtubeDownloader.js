const ytstream = require('yt-stream');
ytstream.userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:94.0) Gecko/20100101 Firefox/94.0";

async function downloadYouTubeBuffer(url, options) {
    if (!ytstream.validateURL(url)) {
        throw new Error('URL de YouTube inválida');
    }

    const format = options.format.toLowerCase();
    const quality = options.quality.toLowerCase();

    if (format !== 'mp3' && format !== 'mp4') {
        throw new Error('Formato no soportado. Use "mp3" o "mp4"');
    }

    if (quality !== 'medium' && quality !== 'high') {
        throw new Error('Calidad no soportada. Use "medium" o "high"');
    }

    const streamOptions = {
        quality: 'high',
        type: format === 'mp3' ? 'audio' : 'video',
        download: true
    };

    const stream = await ytstream.stream(url, streamOptions);
    const info = await ytstream.getInfo(url);
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.stream.on('data', (chunk) => chunks.push(chunk));
        stream.stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.stream.on('error', reject);
        // console.log(info);
    });
    
}
// async function ytstreamsearch(input) {
//     const results = await ytstream.search(input);
//     console.log(results);
// }

module.exports = { downloadYouTubeBuffer };
