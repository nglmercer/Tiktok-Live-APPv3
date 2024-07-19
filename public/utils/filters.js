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

function createItemElement(item, onRemove) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'border p-1 flex justify-between items-center';

    const itemText = document.createElement('span');
    itemText.textContent = item;

    const closeButton = document.createElement('button');
    closeButton.textContent = 'X';
    closeButton.className = 'bg-red-500 text-white px-2 py-1 ml-2';
    closeButton.onclick = () => onRemove(itemDiv, item);

    itemDiv.appendChild(itemText);
    itemDiv.appendChild(closeButton);

    return itemDiv;
}

function createFilterManager(storageKey) {
    let items = JSON.parse(localStorage.getItem(storageKey)) || [];

    function saveItems() {
        localStorage.setItem(storageKey, JSON.stringify(items));
    }

    function addItem(item) {
        if (item && !items.includes(item)) {
            items.push(item);
            saveItems();
            return true;
        }
        return false;
    }

    function removeItem(item) {
        items = items.filter(i => i !== item);
        saveItems();
    }

    function getItems() {
        return [...items];
    }

    return { addItem, removeItem, getItems, saveItems };
}

function renderItems(container, items, onRemove) {
    container.innerHTML = '';
    items.forEach(item => {
        const itemElement = createItemElement(item, onRemove);
        container.appendChild(itemElement);
    });
}

function addFilterItem(input, addButton, filterManager, container, onRemove) {
    const newItem = input.value.trim();
    if (newItem && filterManager.addItem(newItem)) {
        const itemElement = createItemElement(newItem, onRemove);
        container.appendChild(itemElement);
        input.value = '';
    }
}

function setupAddButton(inputId, buttonId, filterManager, containerId) {
    const input = document.getElementById(inputId);
    const addButton = document.getElementById(buttonId);
    const container = document.getElementById(containerId);

    function onRemove(itemDiv, item) {
        container.removeChild(itemDiv);
        filterManager.removeItem(item);
    }

    addButton.onclick = () => addFilterItem(input, addButton, filterManager, container, onRemove);
}

function setupLoadButton(loadButtonId, filterManager, containerId) {
    const loadButton = document.getElementById(loadButtonId);
    const container = document.getElementById(containerId);

    function onRemove(itemDiv, item) {
        container.removeChild(itemDiv);
        filterManager.removeItem(item);
    }

    if (loadButton) {
        loadButton.onclick = async () => {
            const knownFilters = await fetchFilterWords();
            knownFilters.forEach(item => {
                if (filterManager.addItem(item)) {
                    const itemElement = createItemElement(item, onRemove);
                    container.appendChild(itemElement);
                }
            });
        };
    }
}

function initializeFilterComponent(inputId, buttonId, containerId, storageKey, loadButtonId = null) {
    const filterManager = createFilterManager(storageKey);
    const container = document.getElementById(containerId);

    function onRemove(itemDiv, item) {
        container.removeChild(itemDiv);
        filterManager.removeItem(item);
    }

    renderItems(container, filterManager.getItems(), onRemove);
    setupAddButton(inputId, buttonId, filterManager, containerId);
    if (loadButtonId) {
        setupLoadButton(loadButtonId, filterManager, containerId);
    }
}

function addFilterItemToGroup(inputId, containerId, storageKey, item) {
    const input = document.getElementById(inputId);
    input.value = item;

    const filterManager = createFilterManager(storageKey);
    const container = document.getElementById(containerId);

    function onRemove(itemDiv, item) {
        container.removeChild(itemDiv);
        filterManager.removeItem(item);
    }

    addFilterItem(input, null, filterManager, container, onRemove);
}

// Export the necessary functions
export { initializeFilterComponent, addFilterItemToGroup };