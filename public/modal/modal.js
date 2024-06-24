// Configuración del modal
const config = {
    classContainer: "modalhtml",
    styles: "./modal.css",
    html: "./modalhtml.html",
    separador: "_",
};
///ejemplo de const 
// const main = async function() {
//     await modal.LoadModal();
//     const modalInstance = modal.Modales[0];
//     const contenedor = modalInstance.contenedor;

//     modalInstance.properties.fillForm({
//         nombre: 'juan',
//         event1: false,
//         event2: true,
//         event3: false,
//         event4: false,
//         selection: { options: copyFiles, selected: 0 },
//         aceptar: () => {
//             console.log('aceptar');
//             const datosFormulario = modalInstance.properties.obtenerDatos();
//             saveDataToIndexedDB(databases.MyDatabaseActionevent, datosFormulario);

//             console.log('Datos del formulario:', datosFormulario);
//         },
//         cancelar: () => {
//             console.log("cancelar botón");
//         },
//         borrar: () => {
//             console.log('borrar');
//             const datosFormulario = modalInstance.properties.obtenerDatos();
//             deleteDataFromIndexedDB(databases.MyDatabaseActionevent, datosFormulario);
//         },
//     });

//     return modal.Modales;
// }

// main();
const urlBase = (url) => import.meta.url.split('/').slice(0, -1).join('/') + "/" + url.replace('//', '');
const getArchive = async (url) => await fetch(urlBase(url)).then((response) => response.text());

export default new function() {
    this.Modales = [];
    this.ultimoModal = null;

    this.LoadModal = () => new Promise(async (resolve, _) => {
        const elements = document.querySelectorAll(`.${config.classContainer}`);
        for (const item of elements) {
            this.class = `${config.classContainer}_${Math.random().toString(36).substring(7)}`;
            const HTMLmodal = await getArchive(config.html);
            const TEXTstyles = await getArchive(config.styles);
            const contenedor = document.createElement('div');
            const estilos = document.createElement('style');
            estilos.innerHTML = `.${this.class}{\n ${TEXTstyles}\n}`;
            contenedor.innerHTML = HTMLmodal;
            contenedor.classList.add(this.class);
            item.appendChild(contenedor);
            item.appendChild(estilos);
            this.Modales.push({
                element: item,
                contenedor,
                estilos,
                properties: new Modal({ element: item, ElementModal: contenedor, elementStyle: estilos }),
            });
        }
        this.ultimoModal = this.Modales[this.Modales.length - 1];
        resolve(this);
    });

    function Modal({ element, ElementModal, elementStyle }) {
        this.fillForm = (formObject) => {
            Object.entries(formObject).forEach(([key, value]) => {
                const input = ElementModal.querySelector(`*[name="${key}"]`);
                if (input) {
                    if (input.type === 'file') {
                        // File inputs cannot be set programmatically for security reasons
                    } else if (input.type === 'checkbox') {
                        input.checked = value;
                        // console.log('value', value,"key", key, "input", input);
                        // input.checked = value;
                    } else if (input.type === 'select-one') {
                        input.innerHTML = '';
                        value.options.forEach((optionValue, index) => {
                            const option = document.createElement('option');
                            option.value = [
                                optionValue.name,
                                optionValue.index,
                                optionValue.type,
                                optionValue.selected,
                            ];
                            option.text = optionValue.name;
                            if (optionValue === value.selected || index === value.selected) {
                                option.selected = true;
                            }
                            // console.log('option', optionValue);
                            input.appendChild(option);
                        });
                    } else if (input.type === 'text' || input.type === 'number' || input.type === 'range') {
                        input.value = value;
                    } else if (input.type === 'button') {
                        input.addEventListener('click', value);
                    } else {
                        input.innerHTML = value;
                    }
                }
            });
        }

        this.obtenerDatos = () => {
            const data = {};
            const inputs = ElementModal.querySelectorAll('[name]');
            inputs.forEach(input => {
                if (input.type === 'checkbox') {
                    data[input.name] = input.checked;
                } else if (input.type === 'select-one') {
                    data[input.name] = {
                        selected: input.value,
                        options: Array.from(input.options).map(option => option.value)
                    };
                } else {
                    data[input.name] = input.value;
                }
            });
            return data;
        }
    }
}
const openmodal = document.getElementById('open');
openmodal.addEventListener('click', () => {
    console.log('openmodal');
    /// abrimos modal
});
const closemodal = document.getElementById('close');
closemodal.addEventListener('click', () => {
    console.log('closemodal');
    // cerramos modal
});