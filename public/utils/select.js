// select.js
const jsonVoicelist = './datosjson/voicelist.json';

async function fetchvoicelist() {
    try {
        const response = await fetch(jsonVoicelist);
        if (!response.ok) {
            throw new Error(`Error fetching JSON file: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Fetched JSON voicelist:', data);
        return data;
    }
         catch (error) {
        console.error('Error fetching JSON:', error);
        return null;
    }
}
export { fetchvoicelist };