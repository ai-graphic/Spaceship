import EventEmitter from 'events';

// Animated Image Url
export function getAnimatedImageUrl(url) {
  if (typeof url === 'string') return `${url}&animated=true`;
  return null;
}

// Emitter
class MatrixAppearance extends EventEmitter {
  constructor() {
    super();
    this.Initialized = false;
  }

  start() {
    if (!this.Initialized) {
      this.Initialized = true;

      this.content = global.localStorage.getItem('ponyHouse-appearance');

      try {
        this.content = JSON.parse(this.content) ?? {};
      } catch (err) {
        this.content = {};
      }

      this.content.isEmbedEnabled =
        typeof this.content.isEmbedEnabled === 'boolean' ? this.content.isEmbedEnabled : true;
      this.content.isUNhoverEnabled =
        typeof this.content.isUNhoverEnabled === 'boolean' ? this.content.isUNhoverEnabled : true;
      this.content.isAnimateAvatarsEnabled =
        typeof this.content.isAnimateAvatarsEnabled === 'boolean'
          ? this.content.isAnimateAvatarsEnabled
          : true;

      this.content.showUserDMstatus =
        typeof this.content.showUserDMstatus === 'boolean' ? this.content.showUserDMstatus : true;
      this.content.pinDMmessages =
        typeof this.content.pinDMmessages === 'boolean' ? this.content.pinDMmessages : true;
      this.content.sendMessageEnter =
        typeof this.content.sendMessageEnter === 'boolean' ? this.content.sendMessageEnter : true;

      this.content.enableAnimParams =
        typeof this.content.enableAnimParams === 'boolean'
          ? this.content.enableAnimParams
          : !!__ENV_APP__.USE_ANIM_PARAMS;

      this.content.isDiscordStyleEnabled =
        typeof this.content.isDiscordStyleEnabled === 'boolean'
          ? this.content.isDiscordStyleEnabled
          : !!__ENV_APP__.DISCORD_STYLE;

      this.content.useFreezePlugin =
        typeof this.content.useFreezePlugin === 'boolean' ? this.content.useFreezePlugin : false;

      this.content.hidePinMessageEvents =
        typeof this.content.hidePinMessageEvents === 'boolean'
          ? this.content.hidePinMessageEvents
          : false;
      this.content.hideUnpinMessageEvents =
        typeof this.content.hideUnpinMessageEvents === 'boolean'
          ? this.content.hideUnpinMessageEvents
          : false;
    }
  }

  get(folder) {
    this.start();
    if (typeof folder === 'string' && folder.length > 0) {
      if (typeof this.content[folder] !== 'undefined') return this.content[folder];
      return null;
    }

    return this.content;
  }

  set(folder, value) {
    this.start();
    if (typeof folder === 'string') {
      this.content[folder] = value;
      global.localStorage.setItem('ponyHouse-appearance', JSON.stringify(this.content));
      this.emit(folder, value);
    }
  }
}

// Functions and class
const matrixAppearance = new MatrixAppearance();
export function getAppearance(folder) {
  return matrixAppearance.get(folder);
}

export function setAppearance(folder, value) {
  return matrixAppearance.set(folder, value);
}

const toggleAppearanceAction = (dataFolder, setToggle) => (data) => {
  setAppearance(dataFolder, data);
  setToggle(data === true);
};

matrixAppearance.setMaxListeners(Infinity);

export { toggleAppearanceAction };
export default matrixAppearance;

global.appearanceApi = {
  getCfg: getAppearance,
  setCfg: setAppearance,
};
