function exportSettings() {
    // Convertir las configuraciones y sonidos a una cadena JSON
    let settings = JSON.stringify(localStorage);

    // Crear un elemento 'a' invisible
    let element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(settings));
    element.setAttribute('download', 'settings.json');

    // Simular un click en el elemento 'a' para descargar el archivo
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}

function importSettings() {
    // Show the loading indicator
    document.getElementById('loadingIndicator').style.display = 'inline';

    // Read the file uploaded by the user
    let file = document.getElementById('importButton').files[0];
    if (file) {
        let reader = new FileReader();
        reader.onload = function(e) {
            // Parse the file content to a JavaScript object
            let settings = JSON.parse(e.target.result);

            // Store the settings and sounds in localStorage
            for (let key in settings) {
                localStorage.setItem(key, settings[key]);
            }

            // Hide the loading indicator
            document.getElementById('loadingIndicator').style.display = 'none';
        };
        reader.readAsText(file);
    } else {
        // Hide the loading indicator
        document.getElementById('loadingIndicator').style.display = 'none';
    }
}