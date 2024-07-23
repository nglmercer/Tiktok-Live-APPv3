import { playytmusic } from '../functions/YoutubeApi.js';

class TemplateRenderer {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    clearContainer() {
        this.container.innerHTML = '';
    }

    renderList(songs, templateType) {
        console.log('songs', songs);
        this.clearContainer();
        const list = document.createElement('ul');
        list.classList = 'list-group grid grid-cols-auto-fit gap-4';

        songs.forEach((song, index) => {
            const listItem = document.createElement('li');
            listItem.classList.add('list-group-item');
            listItem.dataset.index = index; // Store the index of the song
            listItem.innerHTML = this.getTemplate(song, templateType, index);
            list.appendChild(listItem);
        });

        this.container.appendChild(list);
        this.addPlayButtonListeners();
    }

    getTemplate(song, templateType, index) {
        const artist = this.ytdatatotext('artist', song);
        const duration = this.ytdatatotext('duration', song);
        const name = this.ytdatatotext('name', song);
        const thumbnails = this.ytdatatotext('thumbnails', song);
        const type = this.ytdatatotext('type', song);
        const videoId = this.ytdatatotext('videoId', song);
        const playlistId = this.ytdatatotext('playlistId', song);
        const albumId = this.ytdatatotext('albumId', song);
        const artistId = this.ytdatatotext('artistId', song);

        let content = `
            <div class="card relative">
                <img src="${thumbnails}" alt="${name}" class="w-full h-auto">
                <div class="overlay absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-75">
        `;

        if (type === 'VIDEO' || type === 'SONG') {
            content += `
                <button class="btn-play" data-video-id="${videoId}">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                </button>
            `;
        } else if (type === 'ALBUM' && albumId) {
            content += `<p><a href="https://music.youtube.com/playlist?list=${albumId}" target="_blank" class="text-white underline">Album Link</a></p>`;
        } else if (type === 'PLAYLIST' && playlistId) {
            content += `<p><a href="https://music.youtube.com/playlist?list=${playlistId}" target="_blank" class="text-white underline">Playlist Link</a></p>`;
        } else if (type === 'ARTIST' && artistId) {
            content += `<p><a href="https://music.youtube.com/channel/${artistId}" target="_blank" class="text-white underline">Artist Link</a></p>`;
        }

        content += `
                </div>
                <div>
                    <h3>${name}</h3>
                    <p>Artist: ${artist}</p>
                    <p>Duration: ${duration}</p>
                    <p>Type: ${type}</p>
                    <p>Video ID: ${videoId}</p>
                    <p>Index: ${index + 1}</p>
                </div>
            </div>
        `;

        return content;
    }

    ytdatatotext(type, songdata) {
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
            case 'artistId':
                return songdata.artistId ? songdata.artistId : null;
            default:
                return 'error';
        }
    }

    addPlayButtonListeners() {
        const playButtons = document.querySelectorAll('.btn-play');
        playButtons.forEach(button => {
            button.addEventListener('click', () => {
                const videoId = button.getAttribute('data-video-id');
                if (videoId) {
                    playytmusic(videoId);
                    console.log('playytmusic', videoId);
                }
            });
        });
    }
}

export default TemplateRenderer;
