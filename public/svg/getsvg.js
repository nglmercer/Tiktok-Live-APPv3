async function getSvgInfo(name) {
    const svgName = name.endsWith('.svg') ? name : `${name}.svg`;
    const svgPath = `./svg/${svgName}`;
    
    let result = {
        name: svgName,
        path: svgPath,
        content: null,
        isAvailable: false
    };

    try {
        // Primero, verificamos si el archivo existe
        const checkResponse = await fetch(svgPath, { method: 'HEAD' });
        result.isAvailable = checkResponse.ok;

        if (result.isAvailable) {
            // Si el archivo está disponible, obtenemos su contenido
            const contentResponse = await fetch(svgPath);
            result.content = await contentResponse.text();
        }
    } catch (error) {
        console.error('Error fetching SVG:', error);
        result.isAvailable = false;
    }

    return result;
}
(async () => {
    const svgInfo = await getSvgInfo('chat');
    console.log(svgInfo);
    
    if (svgInfo.isAvailable) {
        console.log("SVG está disponible:");
        console.log("Nombre:", svgInfo.name);
        console.log("Ruta:", svgInfo.path);
        console.log("Contenido:", svgInfo.content.substring(0, 100) + "..."); // Mostramos solo los primeros 100 caracteres
    } else {
        console.log("SVG no está disponible");
    }
})();

class svgmanager {
    constructor() {
        this.svglist = [];
        this.element = null;
        this.loadelement();
    }
    async loadelement() {
        const svgcontentstatus = document.createElement('img');
        svgcontentstatus.style.display = 'none';
        this.element = svgcontentstatus;
    }
    async loadSVG(svgname) {
        if (svgname) {
            if (this.element.src = `./svg/${svgname}.svg`) {
                console.log("ifsrcfromsvg", this.element.src);
                return this.element.src;
            } else {
                console.log("ifsrcfromsvg not found", this.element.src);
                return null;
            }
        }
    }
}
const svgmanagerinstance = new svgmanager();
svgmanagerinstance.loadSVG('chat').then(svg => {
console.log("svgmanagerinstance", svg);
});
