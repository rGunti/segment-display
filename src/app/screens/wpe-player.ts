import {
  WallpaperMediaPlaybackEvent,
  WallpaperMediaPropertiesEvent,
  WallpaperMediaTimelineEvent,
} from '../../types/wallpaper-engine';
import { Logger } from '../../log';
import {
  center,
  formatTime,
  left,
  repeat,
  scrollToPosition,
} from '../../utils';
import {
  RenderArgs,
  Screen,
  WPE_PAUSED,
  WPE_STOPPED,
  WpeEventReceiver,
} from '../base';
import { MainDisplayCollection } from '../collection';

export const WPE_MP_LOGGER = new Logger('WpeMusicPlayer');

const AUDIO_BAR_CHAR = '=';
const AUDIO_BAR_MODE: 'mean' | 'max' = 'max';

export class WpeMusicPlayer
  implements Screen<MainDisplayCollection>, WpeEventReceiver
{
  static readonly SCROLL_SPEED = 500;
  readonly supportsWpeEvents = true;

  private lastTimelineEvent: WallpaperMediaTimelineEvent | undefined;
  private lastTimelineEventReceived = 0;
  private timelineSkew = 0;
  private lastPlaybackEvent: WallpaperMediaPlaybackEvent | undefined;
  //private lastPlaybackEventReceived = 0;
  private lastPropertiesEvent: WallpaperMediaPropertiesEvent | undefined;
  //private lastPropertiesEventReceived = 0;

  private lastScrollReset = 0;
  private audioLevel = 0;

  //private songStartedAt = 0;

  render(renderArgs: RenderArgs<MainDisplayCollection>): void {
    const { displays } = renderArgs;
    const now = renderArgs.now.getTime();

    const playbackState = this.lastPlaybackEvent?.state;
    const isStopped =
      playbackState === undefined ||
      playbackState === null ||
      playbackState === WPE_STOPPED;
    const isPaused = playbackState === WPE_PAUSED;
    const showFlashText = Math.floor(now / 1000) % 2 === 0;

    if (isStopped) {
      displays.main.show('-- -- --');
      displays.date.show(
        center('READY', displays.date.displayCount, displays.date.specialChars),
      );
      displays.weekday.show('');
      return;
    }

    if (isPaused && showFlashText) {
      displays.main.show('');
    } else if (this.lastTimelineEvent && this.lastTimelineEvent.duration > 0) {
      const { position } = this.lastTimelineEvent;
      const offset =
        this.lastTimelineEventReceived > 0 &&
        this.lastPlaybackEvent?.state !== 2
          ? now - this.lastTimelineEventReceived
          : 0;
      // If we're paused, we negate the offset for later
      const skew = this.lastPlaybackEvent?.state !== 2 ? this.timelineSkew : 0;
      const time = formatTime(
        Math.round((position * 1000 + offset - skew) / 1000),
      );
      displays.main.show(time);
    }

    if (isPaused && showFlashText) {
      displays.date.show(
        center(
          '< PAUSE >',
          displays.date.displayCount,
          displays.date.specialChars,
        ),
      );
      displays.weekday.show('');
    } else {
      const titleText = this.lastPropertiesEvent?.title || 'No Title';
      const artistText = this.lastPropertiesEvent?.artist || 'No Artist';

      const textToDisplay =
        (now - this.lastScrollReset) % 10000 < 5000 ? titleText : artistText;

      const titleIndex = isPaused
        ? 0
        : (Math.floor(
            (now - this.lastScrollReset) / WpeMusicPlayer.SCROLL_SPEED,
          ) %
            (textToDisplay.length + displays.date.displayCount)) -
          displays.date.displayCount;
      const formattedTitleText = scrollToPosition(
        textToDisplay,
        displays.date.displayCount,
        displays.date.specialChars,
        titleIndex,
      );
      displays.date.show(formattedTitleText);

      // Audio Bar
      const formattedString = repeat(
        AUDIO_BAR_CHAR,
        Math.ceil(this.audioLevel * displays.weekday.displayCount),
      );
      displays.weekday.show(
        left(
          formattedString,
          displays.weekday.displayCount,
          displays.weekday.specialChars,
        ),
      );
    }
  }

  onTimelineChanged(event: WallpaperMediaTimelineEvent): void {
    const now = new Date().getTime();
    if (this.lastTimelineEventReceived > 0) {
      const positionDiff =
        (event.position - (this.lastTimelineEvent?.position || 0)) * 1000;
      const eventTimeDiff =
        positionDiff <= 0 ? 0 : now - this.lastTimelineEventReceived;
      const skew = positionDiff - eventTimeDiff;
      //WPE_MP_LOGGER.debug('Calculated time diff', {
      //  positionDiff,
      //  eventTimeDiff: now - this.lastTimelineEventReceived,
      //  skew,
      //  lastTimelineEventReceived: this.lastTimelineEventReceived,
      //  lastTimelineEventUpdateDiff: this.timelineSkew,
      //  now,
      //});
      this.timelineSkew =
        Math.abs(skew) > 1500 ? 0 : Math.max(Math.min(500, skew), -500);
    }

    this.lastTimelineEvent = event;
    this.lastTimelineEventReceived = now;
  }

  onPlaybackChanged(event: WallpaperMediaPlaybackEvent): void {
    const now = new Date().getTime();
    if (this.lastPlaybackEvent?.state === 2 && event.state == 1 /* playing */) {
      this.lastTimelineEventReceived = now;
    }
    this.lastPlaybackEvent = event;
    this.lastScrollReset = now;
    //this.lastPlaybackEventReceived = new Date().getTime();
  }

  onPropertyChanged(event: WallpaperMediaPropertiesEvent): void {
    const now = new Date().getTime();
    this.lastPropertiesEvent = event;
    //this.lastPropertiesEventReceived = new Date().getTime();
    this.lastScrollReset = now;
  }

  onAudioLevelChanged(audioLevels: number[]): void {
    if (audioLevels.length !== 128) {
      WPE_MP_LOGGER.error(
        'Received audio levels with invalid length',
        audioLevels.length,
      );
      return;
    }

    const combinedLevels = [];
    for (let i = 0; i < 64; i++) {
      combinedLevels.push(Math.max(audioLevels[i], audioLevels[i + 64]));
    }

    switch (AUDIO_BAR_MODE) {
      case 'mean':
        this.audioLevel = combinedLevels.reduce((a, b) => a + b, 0) / 64;
        break;
      case 'max':
        this.audioLevel = Math.max(...combinedLevels);
        break;
    }
  }
}
