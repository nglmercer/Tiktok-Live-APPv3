// simplifiedState.js

const jsonFilePath = '../datosjson/simplifiedStates.json';

export async function fetchSimplifiedState() {
    try {
        const response = await fetch(jsonFilePath);
        if (!response.ok) {
            throw new Error(`Error fetching JSON file: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Fetched JSON data:', data);

        // Verifica si data[0] es un array y crea una copia si es necesario
        const availableGifts = Array.isArray(data[0]?.availableGifts) ? [...data[0].availableGifts] : [];

        const simplifiedState = {
            availableGifts: availableGifts,
            // Puedes agregar más campos si es necesario
        };

        return simplifiedState;
    } catch (error) {
        console.error('Error in fetchSimplifiedState:', error);
        throw error;
    }
}