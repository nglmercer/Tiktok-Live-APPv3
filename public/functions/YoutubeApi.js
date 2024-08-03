import {Queue, Controlmedia } from './Queueaudio.js';
import AudioPlayer from '../htmlcomponents/AudioPlayer.js';
import TemplateRenderer from '../mediaplay/TemplateRenderer.js';

const renderer = new TemplateRenderer('ytmusic-container');
function appendlistSong(songs, templateType = 'simple') {
    renderer.renderList(songs, templateType);
}
const queue = new Queue();
const audioPlayer = new AudioPlayer('audiotrack', 
  () => controlmedia.playPreviousAudio(), 
  () => controlmedia.nextaudio()
);
const controlmedia = new Controlmedia(audioPlayer);
audioPlayer.setAudioInfo('Youtube Music');

const searchButton = document.getElementById('searchButtonYT');
console.log('searchButton', searchButton);
searchButton.addEventListener('click', async () => {
    const query = document.getElementById('searchInput').value;
    console.log('Searching for songs...', query);
    await searchSong(query);
});
async function searchSong(query) {
    try {
        const songs = await window.api.searchSong(query);
        console.log('Songs:', songs);
        if (songs.length > 0) {
            appendlistSong(songs);
                playfirtssong(songs, query);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}
async function playfirtssong(songs, query) {
    try {
    if (songs[0].type === 'VIDEO' || songs[0].type === 'SONG') {
        const firstSong = songs[0];
        console.log({ videoId: firstSong.videoId, duration: firstSong.duration }); 
        console.log('firstSong playfirtssong', firstSong, `https://www.youtube.com/watch?v=${firstSong.videoId}`);
        const audioUrl = await window.api.downloadurl(`https://www.youtube.com/watch?v=${firstSong.videoId}`);
        console.log('audioUrl playfirtssong', audioUrl);
        if (audioUrl.data.audio) {
        controlmedia.addSong(audioUrl.data.audio);}
}
    } catch (error) {
        console.error('Error:', error);
    }
}

// function appendlistSong(songs) {
//     const ytmusicContainer = document.getElementById('ytmusic-container');
//     ytmusicContainer.innerHTML = ''; // Clear previous content
//     const list = document.createElement('ul');
//     list.classList = 'list-group grid grid-cols-4 gap-4';

//     songs.forEach((song, index) => {
//         const listItem = document.createElement('li');
//         listItem.classList.add('list-group-item');
//         listItem.dataset.index = index; // Store the index of the song

//         const artist = ytdatatotext('artist', song);
//         const duration = ytdatatotext('duration', song);
//         const name = ytdatatotext('name', song);
//         const thumbnails = ytdatatotext('thumbnails', song);
//         const type = ytdatatotext('type', song);
//         const videoId = ytdatatotext('videoId', song);
//         const playlistId = ytdatatotext('playlistId', song);
//         const albumId = ytdatatotext('albumId', song);
//         const artistId = ytdatatotext('artistId', song);

//         let content = `
//             <div class="card">
//                 <img src="${thumbnails}" alt="${name}" style="width: 50px; height: 50px;">
//                 <div>
//                     <h3>${name}</h3>
//                     <p>Artist: ${artist}</p>
//                     <p>Duration: ${duration}</p>
//                     <p>Type: ${type}</p>
//                     <p>Video ID: ${videoId}</p>
//                     <p>Index: ${index + 1}</p>
//         `;

//         if (type === 'ALBUM' && albumId) {
//             content += `<p>Album Link: <a href="https://music.youtube.com/playlist?list=${albumId}" target="_blank">https://music.youtube.com/playlist?list=${albumId}</a></p>`;
//         } else if (type === 'PLAYLIST' && playlistId) {
//             content += `<p>Playlist Link: <a href="https://music.youtube.com/playlist?list=${playlistId}" target="_blank">https://music.youtube.com/playlist?list=${playlistId}</a></p>`;
//         } else if (type === 'ARTIST' && artistId) {
//             content += `<p>Artist Link: <a href="https://music.youtube.com/channel/${artistId}" target="_blank">https://music.youtube.com/channel/${artistId}</a></p>`;
//         } else {
//             content += `<a href="https://www.youtube.com/watch?v=${videoId}" target="_blank">https://www.youtube.com/watch?v=${videoId}</a><button class="btn btn-primary" data-video-id="${videoId}">Play</button>`;
//         }

//         content += `
//                 </div>
//             </div>
//         `;

//         listItem.innerHTML = content;
//         list.appendChild(listItem);
//     });

//     ytmusicContainer.appendChild(list);

//     const playButtons = document.querySelectorAll('.btn-primary');
//     playButtons.forEach(button => {
//         button.addEventListener('click', () => {
//             const videoId = button.getAttribute('data-video-id');
//             playytmusic(videoId);
//             console.log('playytmusic', videoId);
//         });
//     });
// }



function ytdatatotext(type, songdata) {
    switch (type) {
        case 'artist':
            return songdata.artist ? songdata.artist.name : 'no artist';
        case 'duration':
            return songdata.duration ? songdata.duration : 'no duration';
        case 'name':
            return songdata.name ? songdata.name : 'no name';
        case 'thumbnails':
            return songdata.thumbnails && songdata.thumbnails.length > 0 ? songdata.thumbnails[0].url : 'no thumbnails';
        case 'type':
            return songdata.type ? songdata.type : 'no type';
        case 'videoId':
            return songdata.videoId ? songdata.videoId : 'no videoId';
        case 'playlistId':
            return songdata.playlistId ? songdata.playlistId : null;
        case 'albumId':
            return songdata.albumId ? songdata.albumId : null;
        default:
            return 'error';
    }
}

async function playytmusic(videoId) {
    try {
        const audioUrl = await window.api.downloadurl(`https://www.youtube.com/watch?v=${videoId}`);
        controlmedia.addSong(audioUrl.data.audio);
    } catch (error) {
        console.error('Error:', error);
    }
}


function playNextInQueue() {
    if (queue.hasMore()) {
        const nextSong = queue.next();
        if (nextSong) {
            playytmusic(nextSong.videoId, nextSong.duration);
        }
    }
}

function appendPlaylist(){
    // hacemos el append de los elementos de Queue current
        const playlistContainer = document.getElementById('playlist-container');
        playlistContainer.innerHTML = ''; // Clear previous content
        const list = document.createElement('ul');
        list.classList.add('list-group grid grid-cols-4 gap-4 max-w-xl mx-4');
    
    }
    
export { searchSong, playNextInQueue, playytmusic };
