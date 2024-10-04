class EventManager {
  constructor(config) {
      this.functionslist = config.functionslist || {};
      this.EVENT_TYPES = config.EVENT_TYPES || {};
      this.mediaTypes = config.mediaTypes || [];
      this.customProcessors = config.customProcessors || {};
      this.actions = config.actions || {};
      this.actionEventDBManager = config.actionEventDBManager;
      this.defaultFunction = config.defaultFunction; // Store the default function name
  }

  eventmanager = async (eventType, data) => {
      const eventsfind = await this.actionEventDBManager.getAllData();
      let matched = false;

      for (const eventname of eventsfind) {
          matched = await this.processEvent(eventname, eventType, data);
          if (matched) break;
      }

      if (!matched && this.EVENT_TYPES.GIFT === eventType) {
          await this.processDefaultGift(eventsfind, data);
      }

      // si no encuentra el marched entonces ejecuta esta function por defecto
      // if (!matched && this.defaultFunction) {
      //     const defaultFunc = this.functionslist[this.defaultFunction];
      //     if (defaultFunc) {
      //         console.log(`Executing default function: ${this.defaultFunction}`);
      //         await defaultFunc(eventType, data);
      //     } else {
      //         console.warn(`Default function ${this.defaultFunction} not found`);
      //     }
      // }
  }

  async processEvent(eventname, eventType, data) {
      for (const [key, value] of Object.entries(eventname)) {
          const splitkey = key.split('-');
          if (splitkey[1] !== eventType || !value.check) continue;

          const processor = this.customProcessors[eventType] || this.defaultProcessor;
          const matched = processor(value, data);

          if (matched) {
              logdebug.EventManagerdebug("matched", matched, eventname);
              await this.processActions(eventname, data);
              return true;
          }
      }
      return false;
  }

  defaultProcessor(value, data) {
      return true;
  }

  async processDefaultGift(eventsfind, data) {
      for (const eventname of eventsfind) {
          for (const [key, value] of Object.entries(eventname)) {
              const splitkey = key.split('-');
              if (splitkey[1] !== this.EVENT_TYPES.GIFT) continue;
              if (value.select === 'default') {
                  await this.processActions(eventname, data);
                  return;
              }
          }
      }
  }

  async processActions(eventname, data) {
      for (const [actionType, actionConfig] of Object.entries(eventname)) {
          if (!actionConfig.check) continue;

          const action = this.actions[actionType];
          if (action) {
              try {
                  await action(actionConfig, data, this);
              } catch (error) {
                  console.warn(`Error executing action ${actionType}:`, error);
              }
          } else {
              console.log(`Action ${actionType} not found`);
          }
      }
  }
}
export { EventManager}
