document.addEventListener('DOMContentLoaded', function () {
const updatebutton = document.getElementById('Actualizar');
updatebutton.addEventListener('click', function () {
    updateapp();
});
async function updateapp() {
    try {
        let response = await window.api.update();
        console.log('Actualizando...', response);
        if (response.success) {
            console.log('Actualización completada correctamente');
            document.getElementById('Actualizar-status').textContent = '✅Disponible';
        } else {
            console.warn('Error actualizando:', response);
            document.getElementById('Actualizar-status').textContent = '❌Inexistente';
        }
    } catch (error) {
        console.error('no existe actualizacion', error);
        document.getElementById('Actualizar-status').textContent = '❌Inexistente';
    }
}

});