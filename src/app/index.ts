import {
  ColonDisplay,
  DotMatrixDisplay,
  FancySevenSegmentDisplay,
  SegmentDisplayController,
  SixteenSegmentDisplay,
} from '../segment-display';
import { SEVEN_FONT, SIXTEEN_FONT } from '../segment-display/fonts';

import { Logger } from '../log';
import { MATRIX_DEBUG_FONT, MATRIX_FONT } from '../segment-display/matrix/font';
import { repeatArr } from '../utils';
import {
  Application,
  InputArgs,
  InputHandler,
  RenderArgs,
  Screen,
  WPE_PAUSED,
  WPE_PLAYING,
  WPE_STOPPED,
  WpeEventReceiver,
} from './base';
import { MainDisplayCollection } from './collection';
import { isWpeEnabled } from './plugins';
import {
  CountdownScreen,
  InteractiveCountdownScreen,
  ProgressBarScreen,
  TextScrollerScreen,
  WelcomeScreen,
  WpePlayer2,
} from './screens';
import { loadCountdownTarget } from './screens/countdown-storage';
import {
  AppSettings,
  DEFAULT_SETTINGS,
  createSettingsInterface,
} from './settings';
import { AppSettingsInterface, DisplayStyle } from './settings/base';
import './style.scss';

function determineDefaultScreen(): Screen<MainDisplayCollection> {
  const queryParams = new URLSearchParams(window.location.search);
  const app =
    queryParams.get('app') || `${window.location.hash.replace('#', '')}`;

  switch (app) {
    case 'newyear':
      return new CountdownScreen(
        new Date(new Date().getFullYear() + 1, 0, 1, 0, 0, 0, 0),
        queryParams.get('message') || `Happy ${new Date().getFullYear() + 1}!`,
      );
    case 'countdown':
      return new CountdownScreen(
        queryParams.get('target') || '',
        queryParams.get('message'),
      );
    case 'demo-scroller':
      return new TextScrollerScreen();
    case 'demo-progressbar':
      return new ProgressBarScreen();
    default:
      if (loadCountdownTarget()) {
        return new InteractiveCountdownScreen();
      }
      return new WelcomeScreen();
  }
}

const LOGGER = new Logger('App');
const WPE_LOGGER = new Logger('App.WPE');

function getSettings(
  input: AppSettingsInterface | null,
): Promise<AppSettingsInterface> {
  if (input) {
    return new Promise((resolve) => resolve(input));
  }
  return createSettingsInterface();
}

export class App implements Application<MainDisplayCollection> {
  private timeController: SegmentDisplayController;
  private timeControllerMode = DEFAULT_SETTINGS.timeStyle;
  private readonly dateController: SegmentDisplayController;
  private readonly weekdayController: SegmentDisplayController;

  private readonly timeControllerRoot: HTMLElement;
  private readonly dateControllerRoot: HTMLElement;
  private readonly weekdayControllerRoot: HTMLElement;

  private readonly displays: MainDisplayCollection;
  private defaultScreen: Screen<MainDisplayCollection> =
    determineDefaultScreen();
  private wpeScreen = new WpePlayer2();

  private settings?: AppSettingsInterface;

  private currentScreen: Screen<MainDisplayCollection> = this.defaultScreen;

  private framerate: number;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private tickTimer: any | undefined;

  constructor(
    appRoot: HTMLElement,
    framerate = 60,
    appSettings: AppSettingsInterface | null = null,
  ) {
    LOGGER.debug('Creating app ...');
    this.framerate = framerate;
    getSettings(appSettings).then((settings) => {
      LOGGER.debug('Loading settings …');
      settings.loadSettings();
      settings.addUpdateHandler((s) => {
        this.updateCustomizableCss(s);
        this.updateTimeDisplay(s, false);
      });
      this.updateCustomizableCss(settings.currentSettings);
      this.updateTimeDisplay(settings.currentSettings, true);

      this.settings = settings;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as unknown as any).APP_SETTINGS = this.settings;
    });

    this.timeControllerRoot = App.createDisplayContainer('time');
    this.timeController = this.createTimeSegmentController(
      this.timeControllerRoot,
      this.timeControllerMode,
    );

    this.dateControllerRoot = App.createDisplayContainer('date');
    this.dateController = new SegmentDisplayController(
      repeatArr(() => new DotMatrixDisplay(this.dateControllerRoot), 20),
      MATRIX_FONT,
    );

    this.weekdayControllerRoot = App.createDisplayContainer('date');
    this.weekdayController = new SegmentDisplayController(
      repeatArr(() => new DotMatrixDisplay(this.weekdayControllerRoot), 20),
      MATRIX_FONT,
    );

    this.displays = {
      main: this.timeController,
      date: this.dateController,
      weekday: this.weekdayController,
    };

    appRoot.appendChild(this.timeControllerRoot);
    appRoot.appendChild(this.dateControllerRoot);
    appRoot.appendChild(this.weekdayControllerRoot);
  }

  private setTimeDisplayStyle(timeDisplay: DisplayStyle, force = false): void {
    if (timeDisplay === this.timeControllerMode && !force) {
      LOGGER.debug('Time style did not change, skipping update');
      return;
    }

    LOGGER.info('Updating time display to', timeDisplay);
    const root = this.timeControllerRoot;
    root.replaceChildren();

    this.timeController = this.createTimeSegmentController(root, timeDisplay);
    this.timeControllerMode = timeDisplay;
    this.displays.main = this.timeController;
  }

  private updateTimeDisplay(settings: AppSettings, force = false): void {
    this.setTimeDisplayStyle(settings.timeStyle, force);
  }

  private createTimeSegmentController(
    root: HTMLElement,
    timeStyle: DisplayStyle,
  ): SegmentDisplayController {
    switch (timeStyle) {
      case '16seg':
        return new SegmentDisplayController(
          [
            new SixteenSegmentDisplay(root),
            new SixteenSegmentDisplay(root),
            new ColonDisplay(root),
            new SixteenSegmentDisplay(root),
            new SixteenSegmentDisplay(root),
            new ColonDisplay(root),
            new SixteenSegmentDisplay(root),
            new SixteenSegmentDisplay(root),
          ],
          SIXTEEN_FONT,
        );
      case '7seg':
        return new SegmentDisplayController(
          [
            new FancySevenSegmentDisplay(root),
            new FancySevenSegmentDisplay(root),
            new ColonDisplay(root),
            new FancySevenSegmentDisplay(root),
            new FancySevenSegmentDisplay(root),
            new ColonDisplay(root),
            new FancySevenSegmentDisplay(root),
            new FancySevenSegmentDisplay(root),
          ],
          SEVEN_FONT,
        );
      case 'matrix':
        return new SegmentDisplayController(
          repeatArr(() => new DotMatrixDisplay(root), 8),
          MATRIX_FONT,
        );
    }
    return new SegmentDisplayController(
      [new DotMatrixDisplay(root)],
      MATRIX_DEBUG_FONT,
    );
  }

  private updateCustomizableCss(settings: AppSettings): void {
    LOGGER.debug('Updating customizable CSS', settings);
    const root = document.documentElement;
    root.style.setProperty('--fade-in-time', `${settings.fadeInTime}ms`);
    root.style.setProperty('--fade-out-time', `${settings.fadeOutTime}ms`);
    root.style.setProperty('--color-on', `${settings.color}`);
    root.style.setProperty('--color-off', `${settings.segmentColor}`);
    root.style.setProperty('--color-background', `${settings.backgroundColor}`);
  }

  registerEvents(): void {
    if (isWpeEnabled()) {
      LOGGER.debug('Detected Wallpaper Engine, registering events');
      this.registerWpeEvents();
    }

    this.registerInputEvents();
  }

  private registerWpeEvents(): void {
    if (
      !window.wallpaperRegisterMediaPlaybackListener ||
      !window.wallpaperRegisterMediaTimelineListener ||
      !window.wallpaperRegisterMediaPropertiesListener ||
      !window.wallpaperRegisterMediaThumbnailListener ||
      !window.wallpaperRegisterAudioListener
    ) {
      LOGGER.error('Tried to initialize WPE events outside of WPE!');
      return;
    }
    window.wallpaperRegisterMediaPlaybackListener((e) => {
      WPE_LOGGER.debug('Playback Status changed', e);

      switch (e.state) {
        case WPE_STOPPED:
          this.setScreen(this.defaultScreen);
          break;
        case WPE_PLAYING:
        case WPE_PAUSED:
          this.setScreen(this.wpeScreen);
          break;
      }

      const wpe = this.currentWpeEventReceiver;
      if (wpe) {
        wpe.onPlaybackChanged(e);
      }
    });
    window.wallpaperRegisterMediaTimelineListener((e) => {
      WPE_LOGGER.debug('Timeline changed', e);
      const wpe = this.currentWpeEventReceiver;
      if (wpe) {
        wpe.onTimelineChanged(e);
      }
    });
    window.wallpaperRegisterMediaPropertiesListener((e) => {
      WPE_LOGGER.debug('Media Properties changed', e);
      const wpe = this.currentWpeEventReceiver;
      if (wpe) {
        wpe.onPropertyChanged(e);
      }
    });
    window.wallpaperRegisterAudioListener((e) => {
      //WPE_LOGGER.debug('Audio changed', e);
      const wpe = this.currentWpeEventReceiver;
      if (wpe && wpe.onAudioLevelChanged) {
        wpe.onAudioLevelChanged(e);
      }
    });
  }

  private registerInputEvents(): void {
    LOGGER.debug('Registering input events');
    window.onkeydown = (e) => {
      if (
        this.currentInputHandler &&
        this.currentInputHandler.onInputReceived(
          new InputArgs(this.displays, new Date(), this, e),
        )
      ) {
        e.stopPropagation();
        return;
      }
    };
  }

  get currentScreenSupportsWpeEvents(): boolean {
    return (this.currentScreen as unknown as WpeEventReceiver)
      .supportsWpeEvents;
  }

  get currentScreenSupportsInput(): boolean {
    return (
      this.currentScreen as unknown as InputHandler<MainDisplayCollection>
    ).supportsInput;
  }

  get currentWpeEventReceiver(): WpeEventReceiver | undefined {
    const screen = this.currentScreen as unknown as WpeEventReceiver;
    return screen.supportsWpeEvents ? screen : undefined;
  }

  get currentInputHandler(): InputHandler<MainDisplayCollection> | undefined {
    const screen = this
      .currentScreen as unknown as InputHandler<MainDisplayCollection>;
    return screen.supportsInput ? screen : undefined;
  }

  startTicking(): void {
    if (this.tickTimer) {
      throw new Error('Tried to start ticking while already ticking!');
    }
    this.tickTimer = setInterval(() => this.tick(), 1000 / this.framerate);
  }

  stopTicking(): void {
    if (this.tickTimer) {
      clearTimeout(this.tickTimer);
    }
  }

  setScreen(screen: Screen<MainDisplayCollection>): void {
    this.currentScreen = screen;
  }

  getSettingsInterface(): AppSettingsInterface {
    return this.settings!;
  }

  private tick(): void {
    this.currentScreen.render(new RenderArgs(this.displays, new Date(), this));
  }

  private static createDisplayContainer(
    ...additionalClasses: string[]
  ): HTMLElement {
    const container = document.createElement('div');
    container.classList.add('display');
    container.classList.add(...additionalClasses);
    return container;
  }
}
