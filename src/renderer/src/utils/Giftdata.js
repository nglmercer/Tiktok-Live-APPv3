import giftdatajson from '../../json/simplifiedStates.json';

const propertyMap = {
  'diamondcost': ['diamondcost', 'diamond_count'],
  'imageUrl': ['imageUrl', 'image.url_list.1'],
  'name': ['name'],
  'giftId': ['giftId', 'id']
};

class GiftDataManager {
  constructor(propertyMap) {
    this.propertyMap = propertyMap;
    this.giftDataJson = giftdatajson;
  }

  getNormalizedProperty(gift, propertyName) {
    const possibleNames = this.propertyMap[propertyName];
    for (const name of possibleNames) {
      if (name.includes('.')) {
        // Handle nested properties
        const parts = name.split('.');
        let value = gift;
        for (const part of parts) {
          value = value && value[part];
          if (value === undefined) break;
        }
        if (value !== undefined) return value;
      } else if (gift[name] !== undefined) {
        return gift[name];
      }
    }
    return undefined;
  }

  getInverseMappedProperty(gift, propertyName) {
    const inverseMap = this._generateInverseMap();
    const possibleNames = inverseMap[propertyName];
    for (const name of possibleNames) {
      if (name.includes('.')) {
        const parts = name.split('.');
        let value = gift;
        for (const part of parts) {
          value = value && value[part];
          if (value === undefined) break;
        }
        if (value !== undefined) return value;
      } else if (gift[name] !== undefined) {
        return gift[name];
      }
    }
    return undefined;
  }

  _generateInverseMap() {
    const inverseMap = {};
    for (const key in this.propertyMap) {
      this.propertyMap[key].forEach(mappedKey => {
        if (!inverseMap[mappedKey]) {
          inverseMap[mappedKey] = [];
        }
        inverseMap[mappedKey].push(key);
      });
    }
    return inverseMap;
  }

  getGiftDataFromLocalStorage() {
    const giftData = localStorage.getItem('connected');
    return giftData ? JSON.parse(giftData) : null;
  }

  async getGiftById(giftId) {
    if (!Number.isInteger(giftId)) {
      return null;
    }
    try {
      const gift = this.giftDataJson.availableGifts.find(gift => gift.giftId === giftId);
      return gift;
    } catch (error) {
      console.error('Error getting gift by ID:', error);
      return null;
    }
  }

  getAvailableGifts(type = "array") {
    if (type === "array") {
      return this.giftDataJson.availableGifts;
    }
  }

  convertSaveDataToJson(state) {
    if (!state) return;

    const mappedGifts = state.availableGifts.map(gift => {
      const mappedGift = {};
      for (const [key, paths] of Object.entries(this.propertyMap)) {
        mappedGift[key] = this.getNormalizedProperty(gift, key);
      }
      return mappedGift;
    });

    this.saveData({ availableGifts: mappedGifts });
    return mappedGifts;
  }

  getimageandurl(state) {
    const giftImages = [];
    state.availableGifts.sort((a, b) => this.getNormalizedProperty(a, 'diamondcost') - this.getNormalizedProperty(b, 'diamondcost'));
    state.availableGifts.forEach(gift => {
      const giftName = this.getNormalizedProperty(gift, 'name');
      const imageUrl = this.getNormalizedProperty(gift, 'imageUrl');
      giftImages[giftName] = imageUrl;
    });
    console.log("giftImages", giftImages);

    return giftImages;
  }

  saveData(state) {
    const simplifiedStateJson = JSON.stringify(state);
    localStorage.setItem('simplifiedState', simplifiedStateJson);
  }
}

const giftManager = new GiftDataManager(propertyMap);
function getdatagiftparsed(state) {
  const statevalue = giftManager.getGiftDataFromLocalStorage();
  // console.log("getdatagiftparsed", statevalue,giftdatajson);
  if (state) {
      return giftManager.convertSaveDataToJson(state);
    } else {
      if (statevalue) {
        return giftManager.convertSaveDataToJson(statevalue);
      } else {
        return giftdatajson[0].availableGifts;
    }
  }

}
export { giftManager, giftdatajson, getdatagiftparsed };
