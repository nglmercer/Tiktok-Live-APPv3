// const jsondatamine = './jsontest/message.json';
// async function fetchdatamine() {
//     try {
//         const response = await fetch(jsondatamine)
//         if(!response.ok) {
//             throw new Error ('error')
//         }
//         const data = await response.json()
//         console.log("minecraft",data)
//         const minecontainer = document.getElementById("mine_content")
//         // minecontainer.innerHTML = data.
//         data.forEach(datamain =>{
//             const datatext = datamain.name
//             console.log(datatext)
//         })
//     } catch {
//         console.error("error")
//     }
//     console.log("test")
// }
// setTimeout(()=>{
//     fetchdatamine();
//     console
// },1000)
const jsonMinecraft = '../datosjson/minecraft.json';

async function fetchJsonMinecraft() {
    try {
        const response = await fetch(jsonMinecraft);
        if (!response.ok) {
            throw new Error(`Error fetching JSON file: ${response.statusText}`);
        }
        const data = await response.json();
        console.log(data);

        populateSelectOptions("mobType", data.entidades_invocables);
        populateSelectOptions("itemType", data.items_otorgables);
        populateSelectOptions("setblock", data.bloques_colocables);

        console.log('Fetched JSON data:', data);
        return data;
    } catch (error) {
        console.error('Error fetching JSON:', error);
        return null;
    }
}

function populateSelectOptions(selectId, data) {
    const selectElement = document.getElementById(selectId);
    data.forEach(item => {
        const option = document.createElement("option");
        option.text = item;
        option.value = item;
        selectElement.appendChild(option);
    });
    $(`#${selectId}`).select2(); // Initialize Select2
}

function generateCommands(action, playerName, options = {}) {
    switch (action) {
        case 'summon':
            return generateSummonCommand(playerName, action, options.mobType, options.mobOptions);
        case 'give':
            return generateGiveCommand(playerName, action, options.itemType);
        case 'setblock':
            return generateSetblockCommand(playerName, action, options.setblock);
        default:
            if (options.message) {
                return generateMessageCommand(playerName, action, options.message, options.messageOptions);
            } else {
                alert("Por favor, introduce el mensaje.");
                return '';
            }
    }
}
window.onload = function() {
document.getElementById('generateCommand').addEventListener('click', function() {
    let playerName = document.getElementById('playerName').value || "testUser";
    const action = document.getElementById('action').value;

    const options = {
        mobType: document.getElementById('mobType').value,
        mobOptions: document.getElementById('mobOptions').value,
        itemType: document.getElementById('itemType').value,
        setblock: document.getElementById('setblock').value,
        message: document.getElementById('message').value,
        messageOptions: document.getElementById('messageOptions').value
    };

    const command = generateCommands(action, playerName, options);
    console.log('Generated Command:', command);
    displayCommands(command);
    function displayCommands(command) {
      const outputDiv = document.getElementById('outputcommand');
      outputDiv.innerHTML = '<h3>Comando Generado:</h3>';
      const commandElem = document.createElement('p');
      commandElem.textContent = command;
      outputDiv.appendChild(commandElem);
  }
  
  
});
document.getElementById('action').addEventListener('change', function() {
  const action = this.value;
  const actionGroups = {
      'summon': ['mobTypeGroup', 'mobOptionsGroup'],
      'give': ['itemTypeGroup'],
      'setblock': ['setblockGroup'],
      'title': ['messageGroup', 'messageOptionsGroup'],
      'subtitle': ['messageGroup', 'messageOptionsGroup'],
      'tellraw': ['messageGroup', 'messageOptionsGroup'],
      'actionbar': ['messageGroup', 'messageOptionsGroup']
  };
  
  ['mobTypeGroup', 'mobOptionsGroup', 'itemTypeGroup', 'setblockGroup', 'messageGroup', 'messageOptionsGroup'].forEach(group => {
      document.getElementById(group).style.display = 'none';
  });

  if (actionGroups[action]) {
      actionGroups[action].forEach(group => {
          document.getElementById(group).style.display = 'block';
      });
  }
});
}
function generateSummonCommand(playerName, action, mobType, mobOptions) {
    const options = parseOptions(mobOptions, true);
    return `/execute at ${playerName} run ${action} ${mobType} ~ ~ ~ ${options}`;
}

function generateSetblockCommand(playerName, action, setblock) {
    return `/execute at ${playerName} run ${action} ~ ~ ~ ${setblock}`;
}

function parseOptions(options, isSummon) {
    if (!options) return isSummon ? '' : '';
    const formattedOptions = options.split(',')
        .map(option => option.split(':').map(str => str.trim()))
        .map(pair => `"${pair[0]}":"${pair[1]}"`)
        .join(',');
    return isSummon ? `{${formattedOptions}}` : formattedOptions;
}

function generateGiveCommand(playerName, action, itemType) {
    return `/execute at ${playerName} run ${action} ${playerName} ${itemType}`;
}

function generateMessageCommand(playerName, action, message, messageOptions) {
    const options = parseOptions(messageOptions, false);
    return `/title ${playerName} ${action} {"text":"${message}"${options ? `,${options}` : ''}}`;
}



fetchJsonMinecraft();
