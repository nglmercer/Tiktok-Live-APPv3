function setupLocalStorage(inputElement, storageKey, callback) {
    const storedValue = localStorage.getItem(storageKey);
    if (storedValue) {
        inputElement.value = storedValue;
    }

    inputElement.addEventListener('change', () => {
        const currentValue = inputElement.value;
        if (currentValue) {
            localStorage.setItem(storageKey, currentValue);
            if (typeof callback === 'function') {
                callback(currentValue);
            }
        }
        console.log('Valor actualizado:', currentValue);

    });
}
const jsonFilterWords = './datosjson/filterwords.json';
let customfilterWords = [];

async function fetchFilterWords() {
    try {
        const response = await fetch(jsonFilterWords);
        if (!response.ok) {
            throw new Error(`Error fetching JSON file: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Fetched JSON voicelist:', data);
        customfilterWords = data.palabras;
        return customfilterWords;
    } catch (error) {
        console.error('Error fetching JSON:', error);
        return [];
    }
}
