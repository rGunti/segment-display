import { Logger } from '../../log';
import { AppSettings, BaseAppSettingsInterface } from './base';

const PROPERTY_LOGGER = new Logger('App.WPE.PropertyListener');
export class WpeSettingsInterface extends BaseAppSettingsInterface {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  loadSettings(): void {}
  // eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
  saveSettings(_: AppSettings): void {}

  applyUserProperties?<
    T extends {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      value?: any;
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  >(properties: { [key: string]: T }): void {
    PROPERTY_LOGGER.debug('applyUserProperties', properties);

    const currentSettings = { ...this.currentSettings };
    // Setting Keys are always provided in lower case
    if (properties.fadeintime?.value !== undefined) {
      currentSettings.fadeInTime = properties.fadeintime.value;
    }
    if (properties.fadeouttime?.value !== undefined) {
      currentSettings.fadeOutTime = properties.fadeouttime.value;
    }
    if (properties.timestyle?.value !== undefined) {
      currentSettings.timeStyle = properties.timestyle.value;
    }
    if (properties.backglow?.value !== undefined) {
      currentSettings.backglow = properties.backglow.value;
    }
    this.currentSettings = currentSettings;
  }
}
