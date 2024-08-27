class Counter {
  constructor(initialValue = 0, interval = 1000) {
    this.value = initialValue;
    this.interval = interval;
    this.intervalId = null;
  }

  start() {
    if (!this.intervalId) {
      this.intervalId = setInterval(() => {
        this.increment();
        // console.log(`ID generado: ${this.value}`);
      }, this.interval);
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  increment() {
    this.value++;
    return this.value;
  }

  getCurrentValue() {
    return this.value;
  }
}


// Crear múltiples contadores con diferentes intervalos
// const counter1 = new Counter(0, 1000); // Genera ID cada 1 segundo
// // Usar los IDs generados
// setInterval(() => {
//   const id1 = counter1.increment();
//   console.log(id1);
// }, 3000);
export { Counter };
