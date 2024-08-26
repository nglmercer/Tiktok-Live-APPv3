export default class SliderCreator {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Container with id "${containerId}" not found`);
    }
    this.sliders = new Map(); // Para almacenar referencias a los sliders creados
  }

  createOrUpdateSlider(config) {
    const {
      id,
      text,
      value,
      min = 0,
      max = 100,
      step = 1,
      callback
    } = config;

    if (this.sliders.has(id)) {
      // Si el slider ya existe, actualízalo
      this.updateSlider(id, { text, value });
    } else {
      // Si el slider no existe, créalo
      this.createSlider(config);
    }
  }

  createSlider(config) {
    const {
      id,
      text,
      value,
      min = 0,
      max = 100,
      step = 1,
      callback
    } = config;

    const sliderContainer = document.createElement('div');
    sliderContainer.className = 'slider-container range-field';
    const datainfo = document.createElement('div');
    datainfo.className = 'slider-content';
    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = text;

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.id = id;
    slider.className = 'custom-slider range-field light-blue';
    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.value = value;

    const valueDisplay = document.createElement('span');
    valueDisplay.className = 'slider-value';
    valueDisplay.textContent = value + '%';

    slider.addEventListener('input', (event) => {
      valueDisplay.textContent = event.target.value + '%';
    });

    slider.addEventListener('change', (event) => {
      if (typeof callback === 'function') {
        callback(event.target.value);
      }
    });

    datainfo.appendChild(label);
    datainfo.appendChild(valueDisplay);
    sliderContainer.appendChild(datainfo);
    sliderContainer.appendChild(slider);

    this.container.appendChild(sliderContainer);

    // Almacenar referencia al slider y sus elementos
    this.sliders.set(id, { slider, label, valueDisplay });

    return slider;
  }

  updateSlider(id, updateConfig) {
    const sliderInfo = this.sliders.get(id);
    if (!sliderInfo) {
      console.warn(`Slider with id "${id}" not found`);
      return;
    }

    const { slider, label, valueDisplay } = sliderInfo;
    const { text, value } = updateConfig;

    if (text !== undefined) {
      label.textContent = text;
    }

    if (value !== undefined) {
      slider.value = value;
      valueDisplay.textContent = value + '%';
    }
  }

  removeSlider(id) {
    const sliderInfo = this.sliders.get(id);
    if (sliderInfo) {
      sliderInfo.slider.parentElement.remove();
      this.sliders.delete(id);
    }
  }
}
