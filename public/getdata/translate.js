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
export async function fetchTranslationData() {
    try {
        const response = await fetch('./datosjson/translations.json');
        if (!response.ok) {
            throw new Error(`Error fetching JSON file: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error loading translations:', error);
        return null;
    }
}

export function getTranslationValue(data, lang, key) {
    return data[lang] ? data[lang][key] : undefined;
}

export function translateElement(element, translation) {
    if (translation) {
        element.innerHTML = translation;
    }
}

export function translateElementsBySelector(selector, data, lang) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
        const key = element.getAttribute('data-translate') || element.id;
        // console.log("key", key);
        const translation = getTranslationValue(data, lang, key);
        translateElement(element, translation);
    });
}

export function changetextlanguage(lang) {
    fetchTranslationData().then(data => {
        if (data) {
            translateElementsBySelector('[data-translate]', data, lang);
            translateElementsBySelector('[id]', data, lang);
            translateElementsBySelector('[class]', data, lang);
        }
    });
}