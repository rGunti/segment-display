import { Logger } from '../../log';
import {
  AppSettings,
  BaseAppSettingsInterface,
  DEFAULT_SETTINGS,
  DisplayStyle,
} from './base';

const LOGGER = new Logger('LocalStorageSettingsInterface');

export class LocalStorageSettingsInterface extends BaseAppSettingsInterface {
  constructor(private readonly readFromQuery: boolean) {
    super();
  }

  loadSettings(): void {
    const settings: AppSettings = {
      ...this.readSettingsFromLocalStorage(),
      ...this.readSettingsFromQuery(),
    };
    this.currentSettings = settings;
  }

  saveSettings(settings: AppSettings): void {
    localStorage.setItem('settings', JSON.stringify(settings));
    this.currentSettings = settings;
  }

  private readSettingsFromLocalStorage(): AppSettings {
    const settingsJson = localStorage.getItem('settings');
    if (!settingsJson) {
      return DEFAULT_SETTINGS;
    }

    return { ...DEFAULT_SETTINGS, ...JSON.parse(settingsJson) };
  }

  private readSettingsFromQuery(): Partial<AppSettings> {
    if (!this.readFromQuery) {
      return {};
    }

    if (!window.location.search) {
      return {};
    }

    const urlSearchParams = new URLSearchParams(window.location.search);
    let returnValue: Partial<AppSettings> = {};

    const iter = urlSearchParams.entries();
    let result = iter.next();
    while (!result.done) {
      const key = result.value[0];
      const value = result.value[1];

      switch (key) {
        case 'timeStyle':
          returnValue = { ...returnValue, timeStyle: value as DisplayStyle };
          break;
        case 'fadeInTime':
          returnValue = { ...returnValue, fadeInTime: Number.parseInt(value) };
          break;
        case 'fadeOutTime':
          returnValue = { ...returnValue, fadeOutTime: Number.parseInt(value) };
          break;
        case 'color':
          returnValue = { ...returnValue, color: value };
          break;
        case 'bg':
          returnValue = { ...returnValue, backgroundColor: value };
          break;
        case 'seg':
          returnValue = { ...returnValue, segmentColor: value };
          break;
        case 'backglow':
          returnValue = { ...returnValue, backglow: Number.parseFloat(value) };
          break;
        default:
          LOGGER.warning('Unsupported query parameter', key, value);
          break;
      }

      result = iter.next();
    }

    return returnValue;
  }
}
