class Queue {
    constructor() {
        this.queue = [];
        this.currentIndex = -1;
    }

    add(song) {
        this.queue.push(song);
    }

    next() {
        if (this.currentIndex < this.queue.length - 1) {
            this.currentIndex++;
            return this.queue[this.currentIndex];
        } else {
            return null; // End of queue
        }
    }

    current() {
        if (this.currentIndex >= 0 && this.currentIndex < this.queue.length) {
            return this.queue[this.currentIndex];
        } else {
            return null;
        }
    }

    skip() {
        return this.next();
    }

    reset() {
        this.currentIndex = -1;
    }

    hasMore() {
        return this.currentIndex < this.queue.length - 1;
    }

    isEmpty() {
        return this.queue.length === 0;
    }
}

const searchButton = document.getElementById('searchButtonYT');
const queue = new Queue();
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
            setTimeout(() => {
                playfirtssong(songs, query);
            }, 1000);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}
let indexsong = 0;
function playfirtssong(songs, query) {
    // if (query.startsWith(songs[0].name)) {
    //     playytmusic(songs[0].videoId, songs[0].duration);
    //     return;
    // }
    if (songs[0].type === 'VIDEO') {
        const firstSong = songs[0];
        queue.add({ videoId: firstSong.videoId, duration: firstSong.duration });
        indexsong += 1;
        if (indexsong <= 0) {
            playNextInQueue();
    }
}
}
function appendPlaylist(){
// hacemos el append de los elementos de Queue current
    const playlistContainer = document.getElementById('playlist-container');
    playlistContainer.innerHTML = ''; // Clear previous content
    const list = document.createElement('ul');
    list.classList.add('list-group grid grid-cols-4 gap-4 max-w-xl mx-4');

//     queue.current().forEach((song, index) => {
//         const listItem = document.createElement('li');
//         listItem.classList.add('list-group-item');
//         listItem.dataset.index = index; // Store the index of the song

//         const artist = ytdatatotext('artist', song);
//         const duration = ytdatatotext('duration', song);
//         const name = ytdatatotext('name', song);
//         const thumbnails = ytdatatotext('thumbnails', song);
//         const type = ytdatatotext('type', song);
//         const videoId = ytdatatotext('videoId', song);

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
//         listItem.innerHTML = content;
//         list.appendChild(listItem);
//     playlistContainer.appendChild(listItem);
// })
}

function appendlistSong(songs) {
    const ytmusicContainer = document.getElementById('ytmusic-container');
    ytmusicContainer.innerHTML = ''; // Clear previous content
    const list = document.createElement('ul');
    list.classList = 'list-group grid grid-cols-4 gap-4 max-w-xl mx-4';

    songs.forEach((song, index) => {
        const listItem = document.createElement('li');
        listItem.classList.add('list-group-item');
        listItem.dataset.index = index; // Store the index of the song

        const artist = ytdatatotext('artist', song);
        const duration = ytdatatotext('duration', song);
        const name = ytdatatotext('name', song);
        const thumbnails = ytdatatotext('thumbnails', song);
        const type = ytdatatotext('type', song);
        const videoId = ytdatatotext('videoId', song);
        const playlistId = ytdatatotext('playlistId', song);
        const albumId = ytdatatotext('albumId', song);
        const artistId = ytdatatotext('artistId', song);

        let content = `
            <div class="card">
                <img src="${thumbnails}" alt="${name}" style="width: 50px; height: 50px;">
                <div>
                    <h3>${name}</h3>
                    <p>Artist: ${artist}</p>
                    <p>Duration: ${duration}</p>
                    <p>Type: ${type}</p>
                    <p>Video ID: ${videoId}</p>
                    <p>Index: ${index + 1}</p>
        `;

        if (type === 'ALBUM' && albumId) {
            content += `<p>Album Link: <a href="https://music.youtube.com/playlist?list=${albumId}" target="_blank">https://music.youtube.com/playlist?list=${albumId}</a></p>`;
        } else if (type === 'PLAYLIST' && playlistId) {
            content += `<p>Playlist Link: <a href="https://music.youtube.com/playlist?list=${playlistId}" target="_blank">https://music.youtube.com/playlist?list=${playlistId}</a></p>`;
        } else if (type === 'ARTIST' && artistId) {
            content += `<p>Artist Link: <a href="https://music.youtube.com/channel/${artistId}" target="_blank">https://music.youtube.com/channel/${artistId}</a></p>`;
        } else {
            content += `<button id="playytmusic-${videoId}___${duration}" class="btn btn-primary">Play</button>`;
        }

        content += `
                </div>
            </div>
        `;

        listItem.innerHTML = content;
        list.appendChild(listItem);
    });

    ytmusicContainer.appendChild(list);

    const playButtons = document.querySelectorAll('.btn-primary');
    playButtons.forEach(button => {
        button.addEventListener('click', () => {
            const videoId = button.id.replace('playytmusic-', '').split('___')[0];
            const duration = button.id.replace('playytmusic-', '').split('___')[1];
            queue.add({ videoId, duration });
            playNextInQueue();
        });
    });
}


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

function playytmusic(videoId, duration) {
    if (duration !== Number) {
        Number(duration)
    }
    if (duration < 10) {
        duration = 10;
    }
    const src = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1&enablejsapi=1';
    const iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.width = '560';
    iframe.height = '315';
    iframe.title = 'YouTube video player';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.id = 'ytplayer';

    const playerContainer = document.getElementById('player-container');
    playerContainer.innerHTML = ''; // Clear previous content
    playerContainer.appendChild(iframe);

    setTimeout(() => {
        playNextInQueue();
    }, duration * 1000);

    highlightCurrentSong(videoId);
}

function highlightCurrentSong(videoId) {
    const listItems = document.querySelectorAll('.list-group-item');
    listItems.forEach(item => {
        item.classList.remove('playing');
        const button = item.querySelector('.btn-primary');
        if (button && button.id.includes(videoId)) {
            item.classList.add('playing');
        }
    });
}

function playNextInQueue() {
    if (queue.hasMore()) {
        const nextSong = queue.next();
        if (nextSong) {
            playytmusic(nextSong.videoId, nextSong.duration);
        }
    }
}

// Add skip button functionality
const skipButton = document.getElementById('skipButton');
skipButton.addEventListener('click', () => {
    playNextInQueue();
});

export { searchSong, playNextInQueue };
