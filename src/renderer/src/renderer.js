import SliderCreator from "./components/slider";
import {socketManager} from "./tiktoksocketdata";
import keyboardMap  from '../json/keyboard.json';
import { initializeFilterComponent,initializecomponents ,addFilterItemToGroup } from './filters/filters'
const sliderCreator = new SliderCreator('sliders-container');

socketManager.onMessage("audioData", (data) => {
  // console.log("Received message from server:", data);
  sliderCreator.createOrUpdateSlider({
    id: "masterVolume",
    text: "Master Volume",
    value: Number((data.masterVolume * 100).toFixed(5)),
    min: 0,
    max: 100,
    step: 1,
    callback: (value) => {
      socketManager.emitMessage("setMasterVolume", value / 100);
    }
  });
  data.sessions.forEach(element => {
    setupSliders(element);
  });
});
function setupSliders(element) {
  const roundedValue = Number((element.volume * 100).toFixed(5));

  sliderCreator.createOrUpdateSlider({
    id: element.pid,
    text: element.name + " - " + element.pid,
    value: roundedValue,
    min: 0,
    max: 100,
    step: 1,
    callback: (value) => {
      socketManager.emitMessage("setVolume", { pid: element.pid, volume: value / 100 });
    }
  });
}
initializecomponents();
const AutoUpdate = document.getElementById("AutoUpdate");
AutoUpdate.addEventListener("click", () => {
  console.log("AutoUpdate clicked");
  AutoUpdate.innerHTML = "Actualizando...";
  AutoUpdate.disabled = true;
  socketManager.emitMessage("autoupdate");
});
socketManager.onMessage("autoupdateResponse", (data) => {
  const updateResult = document.getElementById("updateResult");
  console.log("autoupdateResponse", data);
  if (data) {
    updateResult.style.display = "none";
    AutoUpdate.innerHTML = "Actualizado";
    AutoUpdate.disabled = false;
  } else {
    updateResult.style.display = "block";
    AutoUpdate.innerHTML = "Error al actualizar";
    AutoUpdate.disabled = false;
    updateResult.innerHTML = data;
  }
});
