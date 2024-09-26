class LikeTracker {
  constructor(resetInterval = 30000) { // Intervalo de reinicio por defecto: 30 segundos
    this.likeCounters = {}; // Almacena los contadores de likes por uniqueId
    this.resetInterval = resetInterval; // Intervalo en milisegundos para reiniciar los contadores

    // Iniciar el temporizador para restablecer los contadores
    this.startResetTimer();
  }

  // Método para manejar likes entrantes y retornar el total acumulado
  addLike(data) {
    const { uniqueId, likeCount } = data;

    if (!this.likeCounters[uniqueId]) {
      // Inicializar el contador en 0 si no existe
      this.likeCounters[uniqueId] = 0;
    }

    // Sumar los nuevos likes al contador existente
    this.likeCounters[uniqueId] += likeCount;

    // Retornar el total acumulado de likes para este usuario
    return this.likeCounters[uniqueId];
  }

  // Método para restablecer los contadores de likes
  resetLikeCounters() {
    Object.keys(this.likeCounters).forEach(uniqueId => {
      this.likeCounters[uniqueId] = 0; // Reinicia el contador para cada usuario
    });
  }

  // Iniciar el temporizador que restablece los contadores periódicamente
  startResetTimer() {
    setInterval(() => {
      this.resetLikeCounters();
      console.log("Los contadores de likes han sido restablecidos.");
    }, this.resetInterval);
  }
}
const EvaluerLikes = new LikeTracker(10000);
const replaceVariables = (command, data, iscommand = false ) => {
  let playerName = localStorage.getItem('playerNameInput') || localStorage.getItem('playerName');

  if (typeof command !== 'string') {
    console.warn("Error: 'command' debe ser una cadena de texto.", typeof command);
    return command; // O lanzar un error si prefieres: throw new Error("'command' debe ser una cadena de texto.");
  }
  if (!command) {
    return command;
  }
  if (iscommand && command.includes(" ")) {
    // Dividimos el string en máximo 2 partes usando el espacio como separador
    command = command.split(" ", 2)[1];
  }
  // Reemplazar variables en el comando
  let replacedCommand = command
    .replace(/uniqueId/g, data.uniqueId || 'testUser')
    .replace(/uniqueid/g, data.uniqueId || 'testUser')
    .replace(/nickname/g, data.nickname || 'testUser')
    .replace(/comment/g, data.comment || 'testComment')
    .replace(/{milestoneLikes}/g, EvaluerLikes.addLike(data) || '50testLikes')
    .replace(/{likes}/g, EvaluerLikes.addLike(data) || '50testLikes')
    .replace(/message/g, data.comment || 'testcomment')
    .replace(/giftName/g, data.giftName || 'testgiftName')
    .replace(/giftname/g, data.giftName || 'testgiftName')
    .replace(/repeatCount/g, data.repeatCount || '123')
    .replace(/repeatcount/g, data.repeatCount || '123')
    .replace(/playername/g, playerName || '@a') // Reemplazar el nombre del jugador
    .replace(/diamonds/g, data.diamondCount || '50testDiamonds')
    .replace(/likecount/g, EvaluerLikes.addLike(data) || '50testLikes')
    .replace(/followRole/g, data.followRole || 'followRole 0')
    .replace(/userId/g, data.userId || '1235646')
    .replace(/teamMemberLevel/g, data.teamMemberLevel || 'teamMemberLevel 0')
    .replace(/subMonth/g, data.subMonth || 'subMonth 0');

  // Eliminar todos los backslashes
  replacedCommand = replacedCommand.replace(/\\/g, '');

  return replacedCommand;
};

const escapeMinecraftCommand = (command) => {
// Escape only double quotes, not backslashes (unchanged)
return command.replace(/"/g, '\\"');
};
export { replaceVariables };
