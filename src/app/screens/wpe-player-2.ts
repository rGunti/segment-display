import {
  WallpaperMediaPlaybackEvent,
  WallpaperMediaPlaybackState,
  WallpaperMediaPropertiesEvent,
  WallpaperMediaTimelineEvent,
} from '../../types/wallpaper-engine';
import { TextScrollerScreen } from '.';
import { center, formatTime, left, repeat } from '../../utils';
import {
  RenderArgs,
  WPE_PAUSED,
  WPE_PLAYING,
  WPE_STOPPED,
  WpeEventReceiver,
} from '../base';
import { MainDisplayCollection } from '../collection';

const WPE2_IDLE_TEXT = ['Welcome', 'Ready to play', 'No song selected'];
const WPE2_DEFAULT_TITLE = 'No Title';
const WPE2_DEFAULT_ARTIST = 'No Artist';
const WPE2_DEFAULT_ALBUM = '';

export class WpePlayer2 extends TextScrollerScreen implements WpeEventReceiver {
  readonly supportsWpeEvents = true;

  private currentPlaybackState: WallpaperMediaPlaybackState = WPE_STOPPED;
  private currentTrackTime = 0;
  //private currentTrackDuration = 0;
  private currentTrackTitle = WPE2_DEFAULT_TITLE;
  private currentTrackArtist = WPE2_DEFAULT_ARTIST;
  private currentTrackAlbum = WPE2_DEFAULT_ALBUM;

  private lastTrackTimeUpdateReceived = 0;
  private timelineSkew = 0;

  private audioLevel = 3;

  constructor(private readonly audioBarMode: 'mean' | 'max' = 'max') {
    super(500, 5_000, false);
    this.updateText(WPE2_IDLE_TEXT);
  }

  render(renderArgs: RenderArgs<MainDisplayCollection>): void {
    if (
      this.currentPlaybackState === WPE_PAUSED &&
      Math.floor(renderArgs.time / 1000) % 2 === 0
    ) {
      renderArgs.displays.date.show(
        center(
          'PAUSED',
          renderArgs.displays.date.displayCount,
          renderArgs.displays.date.specialChars,
        ),
      );
    } else {
      super.render(renderArgs);
    }
    renderArgs.displays.main.show(this.renderPlaybackTime(renderArgs.time));
    renderArgs.displays.weekday.show(
      left(
        this.renderAudioLevel(renderArgs.displays.weekday.displayCount),
        renderArgs.displays.weekday.displayCount,
        renderArgs.displays.weekday.specialChars,
      ),
    );
  }

  private renderPlaybackTime(now: number): string {
    if (this.currentPlaybackState === WPE_STOPPED) {
      return '-- -- --';
    }

    if (
      this.currentPlaybackState === WPE_PAUSED &&
      Math.floor(now / 1000) % 2 === 0
    ) {
      return '';
    }

    const position = this.currentTrackTime;
    const offset =
      this.lastTrackTimeUpdateReceived > 0 &&
      this.currentPlaybackState !== WPE_PAUSED
        ? now - this.lastTrackTimeUpdateReceived
        : 0;
    // If we're paused, we negate the offset for later
    const skew =
      this.currentPlaybackState !== WPE_PAUSED ? this.timelineSkew : 0;
    return formatTime(Math.round((position * 1000 + offset - skew) / 1000));
  }

  private renderAudioLevel(maxBarLength: number): string {
    if (this.currentPlaybackState !== WPE_PLAYING) {
      return '';
    }

    const blockDivisions = 5;
    const barLength = Math.ceil(
      this.audioLevel * maxBarLength * blockDivisions,
    );
    const fullBlocks = Math.floor(barLength / blockDivisions);
    const partialBlockSize = barLength % blockDivisions;

    return (
      repeat('\x05', fullBlocks) +
      this.renderPartialAudioBlock(partialBlockSize)
    );
  }

  private renderPartialAudioBlock(level: number): string {
    if (level === 0) {
      return '';
    }
    return String.fromCharCode(level);
  }

  private setTextToCurrentTrack(): void {
    this.updateText(
      [
        this.currentTrackTitle,
        this.currentTrackArtist,
        this.currentTrackAlbum,
      ].filter((s) => s.length > 0),
    );
  }

  onTimelineChanged(event: WallpaperMediaTimelineEvent): void {
    const now = Date.now();
    if (this.lastTrackTimeUpdateReceived > 0) {
      const positionDiff =
        (event.position - (this.currentTrackTime || 0)) * 1000;
      const eventTimeDiff =
        positionDiff <= 0 ? 0 : now - this.lastTrackTimeUpdateReceived;
      const skew = positionDiff - eventTimeDiff;
      this.timelineSkew =
        Math.abs(skew) > 1500 ? 0 : Math.max(Math.min(500, skew), -500);
    }

    this.currentTrackTime = event.position;
    //this.currentTrackDuration = event.duration;
    this.lastTrackTimeUpdateReceived = now;
  }

  onPlaybackChanged(event: WallpaperMediaPlaybackEvent): void {
    this.currentPlaybackState = event.state;
    if (this.currentPlaybackState !== WPE_STOPPED) {
      this.setTextToCurrentTrack();
    }
  }

  onPropertyChanged(event: WallpaperMediaPropertiesEvent): void {
    this.currentTrackTitle = event.title || WPE2_DEFAULT_TITLE;
    this.currentTrackArtist = event.artist || WPE2_DEFAULT_ARTIST;
    this.currentTrackAlbum = event.albumTitle || WPE2_DEFAULT_ALBUM;
    if (this.currentPlaybackState !== WPE_STOPPED) {
      this.setTextToCurrentTrack();
    }
  }

  onAudioLevelChanged?(audioLevels: number[]): void {
    if (audioLevels.length !== 128) {
      return;
    }

    const combinedLevels = [];
    for (let i = 0; i < 64; i++) {
      combinedLevels.push(Math.max(audioLevels[i], audioLevels[i + 64]));
    }

    switch (this.audioBarMode) {
      case 'mean':
        this.audioLevel = combinedLevels.reduce((a, b) => a + b, 0) / 64;
        break;
      case 'max':
        this.audioLevel = Math.max(...combinedLevels);
        break;
    }
  }
}
