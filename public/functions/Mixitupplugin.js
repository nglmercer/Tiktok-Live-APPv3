async function obtenerPaginaDeComandos() {
    if (comandosConNombres) {
        // Si ya tenemos la lista de comandos, simplemente la devolvemos
        return comandosConNombres;
    }

    const listaComandos = [];
    const pageSize = 100;
    let skip = 0;

    try {
        const response = await fetch(`http://localhost:8911/api/commands?skip=${skip}&pageSize=${pageSize}`);
        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error('La respuesta no contiene un array de comandos');
        }

        const comandos = data;
        listaComandos.push(...comandos);

        if (comandos.length === pageSize) {
            skip += pageSize;
            // Recursivamente obtenemos más comandos si es necesario
            return obtenerPaginaDeComandos();
        } else {
            listaComandos.forEach(cmd => {
                if (!cmd || cmd < 1) {
                    console.error('Comando ignorado:', cmd);
                    return;
                }
            });

            const MAX_COMMANDS = 100;
            const comandosLimitados = listaComandos.slice(0, MAX_COMMANDS);
        // Crear una lista de objetos con el ID y el nombre de cada comando
            comandosConNombres = comandosLimitados.map(cmd => ({
                commandId: cmd.ID,
                commandName: cmd.Name,
                Type: cmd.Type,
                IsEnabled: cmd.IsEnabled,
                Unlocked: cmd.Unlocked,
                GroupName: cmd.GroupName
            }));

            // Almacenar la lista de comandos obtenida
            return comandosConNombres;
        }
    } catch (error) {
        console.error('Error al obtener la página de comandos:', error);
        throw error;
    }
}
function enviarMensaje(message) {

    // Enviar el mensaje
    fetch("http://localhost:8911/api/v2/chat/message", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ "Message": message, "Platform": "Twitch", "SendAsStreamer": true })
        })
        .then(function(response) {
            if (response.ok) {}
        })
        .catch(function(error) {
            console.error('Error al enviar el mensaje:', error);
        });

    lastComment = message;
    lastCommentTime = Date.now();
}
async function enviarCommandID(eventType, data) {
    let Command;
    if (eventType === "gift") {
        Command = data.giftName;
    } else if (eventType === "likes" ) {
        Command = "likes";
    } else if (eventType === "follow") {
        Command = "follow";
    } else if (eventType === "share") {
        Command = "share";
    }
    comandosConNombres = comandosConNombres || await obtenerPaginaDeComandos();

    console.log('Lista de comandos recibida:', comandosConNombres);

    // Buscar el comando correspondiente al commandName
    const comandoEncontrado = comandosConNombres.find(comando => {
        const commandNameParts = comando.commandName.toLowerCase().split(' ');
        return commandNameParts.includes(Command.toLowerCase());
    });

    // Verificar si se encontró el comando
    if (comandoEncontrado) {
        const tiempoActual = Date.now();
        const tiempoDiferencia = tiempoActual - ultimoEnvio;
        const tiempoRestante = Math.max(0, 5000 - tiempoDiferencia); // 5000 ms = 5 segundos

        setTimeout(() => {
            fetch(`http://localhost:8911/api/commands/${comandoEncontrado.commandId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    id: comandoEncontrado.commandId,
                    name: comandoEncontrado.commandName,
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                console.log('Comando enviado:', comandoEncontrado.commandName);
                ultimoEnvio = Date.now();
            })
            .catch(error => {
                console.error('Error al enviar el comando:', error, comandoEncontrado.commandId);
            });
        }, tiempoRestante);
    } else {
        console.error('No se encontró un comando con el nombre:', Command);
    }
}