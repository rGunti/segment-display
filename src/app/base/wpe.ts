import {
  WallpaperMediaPlaybackEvent,
  WallpaperMediaPropertiesEvent,
  WallpaperMediaTimelineEvent,
} from '../../types/wallpaper-engine';

export interface WpeEventReceiver {
  readonly supportsWpeEvents: true;
  onTimelineChanged(event: WallpaperMediaTimelineEvent): void;
  onPlaybackChanged(event: WallpaperMediaPlaybackEvent): void;
  onPropertyChanged(event: WallpaperMediaPropertiesEvent): void;
  onAudioLevelChanged?(audioLevels: number[]): void;
}

export const WPE_STOPPED = 0;
export const WPE_PLAYING = 1;
export const WPE_PAUSED = 2;
