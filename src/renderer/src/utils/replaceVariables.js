const replaceVariables = (command, data) => {
  let playerName = localStorage.getItem('playerName');

  if (typeof command !== 'string') {
    console.warn("Error: 'command' debe ser una cadena de texto.", typeof command);
    return command; // O lanzar un error si prefieres: throw new Error("'command' debe ser una cadena de texto.");
  }

  if (!command) {
    return command;
  }

  // Reemplazar variables en el comando
  let replacedCommand = command
    .replace(/uniqueId/g, data.uniqueId || 'testUser')
    .replace(/uniqueid/g, data.uniqueId || 'testUser')
    .replace(/nickname/g, data.nickname || 'testUser')
    .replace(/comment/g, data.comment || 'testComment')
    .replace(/{milestoneLikes}/g, data.likeCount || '50testLikes')
    .replace(/{likes}/g, data.likeCount || '50testLikes')
    .replace(/message/g, data.comment || 'testcomment')
    .replace(/giftName/g, data.giftName || 'testgiftName')
    .replace(/giftname/g, data.giftName || 'testgiftName')
    .replace(/repeatCount/g, data.repeatCount || '123')
    .replace(/repeatcount/g, data.repeatCount || '123')
    .replace(/playername/g, playerName || '@a')
    .replace(/diamonds/g, data.diamondCount || '50testDiamonds')
    .replace(/likecount/g, data.likeCount || '50testLikes')
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
