export type WallpaperMediaPlaybackState = number;

export interface WallpaperMediaPlaybackEvent {
  state: WallpaperMediaPlaybackState;
}

export interface WallpaperMediaTimelineEvent {
  position: number;
  duration: number;
}

export interface WallpaperMediaPropertiesEvent {
  title?: string;
  artist?: string;
  albumTitle?: string;
  subTitle?: string;
  contentType?: string;
}

export interface WallpaperPropertyListener {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  applyUserProperties?: (properties: { [key: string]: { value?: any } }) => void;
}

declare global {
  interface Window {
    wallpaperPropertyListener: WallpaperPropertyListener;
    wallpaperRegisterMediaPlaybackListener(
      callback: (event: WallpaperMediaPlaybackEvent) => void,
    ): void;
    wallpaperRegisterMediaTimelineListener(
      callback: (event: WallpaperMediaTimelineEvent) => void,
    ): void;
    wallpaperRegisterMediaPropertiesListener(
      callback: (event: WallpaperMediaPropertiesEvent) => void,
    ): void;
    wallpaperRegisterMediaThumbnailListener(
      callback: (thumbnail: string) => void,
    ): void;
    wallpaperRegisterAudioListener(callback: (audioLevels: number[]) => void): void;
  }
}
