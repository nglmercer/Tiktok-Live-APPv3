
document.addEventListener('DOMContentLoaded', (event) => {
    const eventContainer = document.getElementById('overlayEventContainer');
    const comboCounters = {};
    let isImageLink = false;

    function sanitizeText(text) {
        return text ? text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : '';
    }

    function getRandomPosition() {
        return {
            top: Math.floor(Math.random() * window.innerHeight) + 'px',
            left: Math.floor(Math.random() * window.innerWidth) + 'px'
        };
    }

    function createEventDiv(text, color, count, data) {
        const eventDiv = document.createElement('div');
        eventDiv.className = 'event-div';
        const position = getRandomPosition();
        eventDiv.style.top = position.top;
        eventDiv.style.left = position.left;
        console.log(data.profilePictureUrl);

        let content;
        if (isImageLink) {
            content = `<img src="${text}" class="event-image"><img class="profile-picture profile-animation" src="${data.profilePictureUrl}" style="border-radius: 50%;">`;
        } else if (text && (text.includes('sige') || text.includes('compartió') || text.includes('gato') || text.includes('directo') || text.includes('likes'))) {
            content = `<img class="profile-picture profile-animation" src="${data.profilePictureUrl}" style="border-radius: 50%;"><span class="event-text text-animation" style="color: ${color};">${text}</span>`;
        } else {
            content = `<span class="event-text text-animation" style="color:${color}">${sanitizeText(text)}</span>`;
            if (!isImageLink) {
                eventDiv.className += ' marquee';
            }
        }

        eventDiv.innerHTML = content;
        eventContainer.appendChild(eventDiv);

        setTimeout(() => {
            eventContainer.removeChild(eventDiv);
        }, 20000); // Remove eventDiv after 20 seconds

        return eventDiv;
    }

    window.addEventListener('pageAB', (event) => {
        const { data, text, color, isGift, repeatCount } = event.detail;
        console.log(text);
        isImageLink = text && ['.jpg', '.jpeg', '.png', '.gif'].some(ext => text.endsWith(ext));
        let giftPictureUrl = isValidUrl(data.giftPictureUrl) ? data.giftPictureUrl : 'url_de_imagen_por_defecto';
        if (!comboCounters[text]) {
            comboCounters[text] = { count: 0, timeout: null, div: null };
        }

        comboCounters[text].count++;

        let baseTime = isGift ? 20000 : 18000;
        let totalTime = baseTime * Math.pow(1.01, comboCounters[text].count);

        const eventDiv = comboCounters[text].div;

        if (comboCounters[text].count > 1 && eventDiv) {
            clearTimeout(comboCounters[text].timeout);
            eventDiv.innerHTML = createEventDiv(text, color, comboCounters[text].count, data).innerHTML;

            comboCounters[text].timeout = setTimeout(() => {
                comboCounters[text].count = 0;
                if (eventDiv.parentNode) {
                    eventContainer.removeChild(eventDiv);
                }
                comboCounters[text].div = null;
            }, totalTime);
        } else {
            comboCounters[text].div = createEventDiv(text, color, comboCounters[text].count, data);
        }
    });
});
    
function isValidUrl(string) {
  try {
      new URL(string);
  } catch (_) {
      return false;
  }

  return true;
}
function addOverlayEvent1(data, text, color, isGift, repeatCount) {
    console.log(tags)
    console.log(`Message img ${getMessageHTML(message, tags)}`)
    console.log(`${tags['display-name']}: ${message}`);
    
    var messageBlock = document.createElement('div');
    messageBlock.id = `message=${tags['id']}`
  /*  messageBlock.innerHTML = `
    <div class = "title-bar" >
      <div class = "title-bar-text" >
      ${tags['display-name']}
      </div>
      <div class="title-bar-controls">
        <button aria-label="Minimize"> </button>
        <button aria-label="Maximize"> </button>
        <button aria-label="Close"> </button>
        </div>
    </div>
    <div class = "window-body">
      <p> ${message} </p>
    </div>
    `*/
    var titleBar = document.createElement('div');
    titleBar.classList.add("title-bar");
      
    titleBar.onmousedown = function(event){
      titleBar.classList.add("active")
      titleBar.addEventListener("mousemove", onDrag);
      div.style.zIndex = gz;
      gz= gz + 1;
    }
  
    titleBar.onmouseup = function(event){
      titleBar.classList.remove("active");
      titleBar.removeEventListener("mousemove", onDrag);
      div.style.zIndex = gz;
      gz= gz + 1;
    }
  
    titleBar.onmouseleave = function(event){
      titleBar.classList.remove("active");
      titleBar.removeEventListener("mousemove", onDrag);
    }
  
    var titleBarText = document.createElement('div');
    titleBarText.innerHTML = `${tags['display-name']}`
    titleBarText.classList.add("title-bar-text");
  
    var titleBatControls = document.createElement('div');
    titleBatControls.classList.add('title-bar-controls')
     
    var minimizeButton = document.createElement('button');
    minimizeButton.ariaLabel = "Minimize";
    titleBatControls.appendChild(minimizeButton);
  
    var maximizeButton = document.createElement('button');
    maximizeButton.ariaLabel = "Maximize";
    titleBatControls.appendChild(maximizeButton);
  
    var closeButton = document.createElement('button');
    closeButton.ariaLabel = "Close";
    closeButton.onclick = function(event){
      messageBlock.remove();
    }
    titleBatControls.appendChild(closeButton);
    
  
    titleBar.appendChild(titleBarText);
    titleBar.appendChild(titleBatControls);
  
    var windowBody = document.createElement('div');
    windowBody.classList.add('window-body');
  
    var messageText = document.createElement('p');
    messageText.innerHTML = ` ${getMessageHTML(message, tags)} `
    windowBody.appendChild(messageText);
  
    messageBlock.appendChild(titleBar);
    messageBlock.appendChild(windowBody);
  
    var div = app.appendChild(messageBlock);
  
    function onDrag({movementX, movementY}){
      let getStyle = window.getComputedStyle(div);
      let leftVal = parseInt(getStyle.left);
      let topVal = parseInt(getStyle.top);
      div.style.left = `${leftVal + movementX}px`;
      div.style.top = `${topVal + movementY}px`;
    }
  
    var randomtop = Math.floor(Math.random() * window.innerHeight);
    var randomright = Math.floor(Math.random() * window.innerWidth);
    if (randomright < window.innerWidth + 250 && randomright > 250)
      randomright = randomright - 250;
    if (randomtop > window.innerHeight - messageBlock.clientHeight)
      randomtop = randomtop - messageBlock.clientHeight
    div.classList.add("window")
    div.style.width = "250px"
    div.style.position = "fixed"
    div.style.right = randomright + "px"
    div.style.top = randomtop + "px"
    div.style.zIndex = gz;
    div.onclick = function(event) {
      console.log(event);
      div.style.zIndex = gz;
      gz= gz + 1;
    }
    gz = gz + 1;
    if (app.children.length > urlParams.get("maxmessages")) {
      app.children[0].remove();
    }
  };