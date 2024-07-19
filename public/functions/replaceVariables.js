
const replaceVariables = (command, data, likes) => {
  let playerName = localStorage.getItem('playerName');
  if (!command){
    return command;
  }
    // console.log(command);
    // Reemplazar variables en el comando (unchanged)
    let replacedCommand = command
        .replace(/uniqueId/g, data.uniqueId || 'testUser')
        .replace(/uniqueid/g, data.uniqueId || 'testUser')
        .replace(/nickname/g, data.nickname || 'testUser')
        .replace(/comment/g, data.comment || 'testComment')
        .replace(/{milestoneLikes}/g, likes || '50testLikes')
        .replace(/{likes}/g, likes || '50testLikes')
        .replace(/message/g, data.comment || 'testcomment')
        .replace(/giftName/g, data.giftName || 'testgiftName')
        .replace(/giftname/g, data.giftName || 'testgiftName')
        .replace(/repeatCount/g, data.repeatCount || '123')
        .replace(/repeatcount/g, data.repeatCount || '123')
        .replace(/playername/g, playerName || '@a');
  
    // Remove all backslashes (proceed with caution!)
    replacedCommand = replacedCommand.replace(/\\/g, '');
    // console.log(playerName);
    //console.log(replacedCommand);
    return replacedCommand;
  };
const escapeMinecraftCommand = (command) => {
// Escape only double quotes, not backslashes (unchanged)
return command.replace(/"/g, '\\"');
};
export { replaceVariables };