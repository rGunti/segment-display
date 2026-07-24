export interface AppSettingsInterface {
  loadSettings(): void;
  saveSettings(settings: AppSettings): void;

  readonly currentSettings: AppSettings;

  addUpdateHandler(handler: (settings: AppSettings) => void): void;
}

export abstract class BaseAppSettingsInterface implements AppSettingsInterface {
  private _currentSettings: AppSettings = DEFAULT_SETTINGS;
  private _handlers: ((settings: AppSettings) => void)[] = [];

  get currentSettings(): AppSettings {
    return this._currentSettings;
  }
  protected set currentSettings(settings: AppSettings) {
    this._currentSettings = settings;
    this._handlers.forEach((h) => h(settings));
  }

  abstract loadSettings(): void;
  abstract saveSettings(settings: AppSettings): void;

  addUpdateHandler(handler: (settings: AppSettings) => void): void {
    this._handlers.push(handler);
  }
}

export declare type DisplayStyle = '16seg' | '7seg' | 'matrix';

export interface AppSettings {
  fadeInTime: number;
  fadeOutTime: number;
  color: string;
  segmentColor: string;
  backgroundColor: string;
  timeStyle: DisplayStyle;
  backglow: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  fadeInTime: 100,
  fadeOutTime: 500,
  color: 'red',
  segmentColor: 'rgba(255, 0, 0, 0.1)',
  backgroundColor: 'black',
  timeStyle: '16seg',
  backglow: 1,
};
