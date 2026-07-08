import { ClockScreen } from '.';
import { Logger } from '../../log';
import { formatTime, nextOccurrenceOf } from '../../utils';
import { InputArgs, InputHandler, RenderArgs, Screen } from '../base';
import { MainDisplayCollection } from '../collection';
import { loadCountdownTarget, saveCountdownTarget } from './countdown-storage';

const LOGGER = new Logger('Countdown');
const MODES = {
  Countdown: 0,
  SetTime: 1,
  SetTargetTime: 2,
  Exit: 0xff,
};
const SET_TIME_CURSOR = {
  Hour: 0,
  Minute: 1,
  Second: 2,
};
const SET_TARGET_TIME_CURSOR = {
  Hour: 0,
  Minute: 1,
};

export class CountdownScreen
  implements Screen<MainDisplayCollection>, InputHandler<MainDisplayCollection>
{
  readonly supportsInput = true;

  private mode = MODES.Countdown;
  private countdownTime = 0;
  private isTargetTimeMode = false;

  private lastInput = 0;

  private setHour = 0;
  private setMinute = 0;
  private setSecond = 0;
  private cursorPos = SET_TIME_CURSOR.Hour;

  private targetHour = 0;
  private targetMinute = 0;
  private targetCursorPos = SET_TARGET_TIME_CURSOR.Hour;

  constructor() {
    const persistedTarget = loadCountdownTarget();
    if (persistedTarget) {
      this.targetHour = persistedTarget.hour;
      this.targetMinute = persistedTarget.minute;
      this.countdownTime = nextOccurrenceOf(
        persistedTarget.hour,
        persistedTarget.minute,
      ).getTime();
      this.isTargetTimeMode = true;
    }
  }

  render(renderArgs: RenderArgs<MainDisplayCollection>): void {
    switch (this.mode) {
      case MODES.Countdown:
        this.renderCountdown(renderArgs);
        break;
      case MODES.SetTime:
        this.renderSetTime(renderArgs);
        break;
      case MODES.SetTargetTime:
        this.renderSetTargetTime(renderArgs);
        break;
      case MODES.Exit:
        renderArgs.changeScreen(new ClockScreen());
        break;
      default:
        throw new Error(`Unknown mode: ${this.mode}`);
    }
  }

  private renderCountdown(renderArgs: RenderArgs<MainDisplayCollection>): void {
    const { displays } = renderArgs;
    const showFlash = (renderArgs.time / 1000) % 1 > 0.5;

    if (this.countdownTime > 0) {
      const timeDiff = this.countdownTime - renderArgs.time;
      if (timeDiff >= 0) {
        displays.main.show(
          formatTime(timeDiff / 1000, {
            joinWith: timeDiff % 1000 > 500 ? ' ' : ':',
          }),
        );
        displays.weekday.showCenter('');
      } else if (timeDiff >= -60_000) {
        displays.main.show(showFlash ? '' : '0:00');
        displays.weekday.showCenter(showFlash ? '' : 'Time Over!');
      } else {
        this.countdownTime = 0;
        if (this.isTargetTimeMode) {
          this.isTargetTimeMode = false;
          saveCountdownTarget(null);
        }
      }
    } else {
      displays.main.show('--:--:--');
      displays.weekday.showCenter('[S] Timer  [T] Time');
    }

    displays.date.show('');
  }

  private renderSetTime(renderArgs: RenderArgs<MainDisplayCollection>): void {
    const { displays } = renderArgs;
    const showFlash =
      (renderArgs.time / 1000) % 1 > 0.65 &&
      this.lastInput < renderArgs.time - 1000;

    const displayTime = [
      showFlash && this.cursorPos === SET_TIME_CURSOR.Hour
        ? '  '
        : this.setHour.toString().padStart(2, '0'),
      showFlash && this.cursorPos === SET_TIME_CURSOR.Minute
        ? '  '
        : this.setMinute.toString().padStart(2, '0'),
      showFlash && this.cursorPos === SET_TIME_CURSOR.Second
        ? '  '
        : this.setSecond.toString().padStart(2, '0'),
    ].join(':');

    displays.main.showLeft(displayTime);
    displays.date.show('');
    displays.weekday.showCenter('Enter Time');
  }

  private renderSetTargetTime(
    renderArgs: RenderArgs<MainDisplayCollection>,
  ): void {
    const { displays } = renderArgs;
    const showFlash =
      (renderArgs.time / 1000) % 1 > 0.65 &&
      this.lastInput < renderArgs.time - 1000;

    const displayTime = [
      showFlash && this.targetCursorPos === SET_TARGET_TIME_CURSOR.Hour
        ? '  '
        : this.targetHour.toString().padStart(2, '0'),
      showFlash && this.targetCursorPos === SET_TARGET_TIME_CURSOR.Minute
        ? '  '
        : this.targetMinute.toString().padStart(2, '0'),
    ].join(':');

    displays.main.showLeft(displayTime);
    displays.date.show('');
    displays.weekday.showCenter('Set Target Time');
  }

  onInputReceived(e: InputArgs<MainDisplayCollection>): boolean | undefined {
    LOGGER.debug('onInputReceived', e.input.key);
    switch (this.mode) {
      case MODES.Countdown:
        return this.handleInputCountdown(e.input);
      case MODES.SetTime:
        return this.handleInputSetTime(e.input);
      case MODES.SetTargetTime:
        return this.handleInputSetTargetTime(e.input);
      default:
        throw new Error(`Unknown mode: ${this.mode}`);
    }
  }

  private handleInputCountdown(e: KeyboardEvent): boolean | undefined {
    switch (e.key) {
      case 's':
        this.mode = MODES.SetTime;
        return true;
      case 't':
        this.mode = MODES.SetTargetTime;
        return true;
      case 'Escape':
        this.mode = MODES.Exit;
        return true;
      default:
        return undefined;
    }
  }

  private handleInputSetTime(e: KeyboardEvent): boolean | undefined {
    this.lastInput = Date.now();
    switch (e.key) {
      case 'ArrowUp':
        switch (this.cursorPos) {
          case SET_TIME_CURSOR.Hour:
            this.setHour = (this.setHour + 1) % 24;
            break;
          case SET_TIME_CURSOR.Minute:
            this.setMinute = (this.setMinute + 1) % 60;
            break;
          case SET_TIME_CURSOR.Second:
            this.setSecond = (this.setSecond + 1) % 60;
            break;
        }
        return true;
      case 'ArrowDown':
        switch (this.cursorPos) {
          case SET_TIME_CURSOR.Hour:
            this.setHour = (this.setHour + 23) % 24;
            break;
          case SET_TIME_CURSOR.Minute:
            this.setMinute = (this.setMinute + 59) % 60;
            break;
          case SET_TIME_CURSOR.Second:
            this.setSecond = (this.setSecond + 59) % 60;
            break;
        }
        return true;
      case 'ArrowLeft':
        this.cursorPos = (this.cursorPos - 1) % 3;
        return true;
      case 'ArrowRight':
        this.cursorPos = (this.cursorPos + 1) % 3;
        return true;
      case 'Enter':
        this.setTime();
        this.mode = MODES.Countdown;
        return true;
      case 'Escape':
        this.mode = MODES.Countdown;
        return true;
      default:
        return undefined;
    }
  }

  private setTime(): void {
    const timeDiff =
      this.setHour * 3600 + this.setMinute * 60 + this.setSecond + 1;
    this.countdownTime = Date.now() + timeDiff * 1000;
    this.isTargetTimeMode = false;
    saveCountdownTarget(null);
  }

  private handleInputSetTargetTime(e: KeyboardEvent): boolean | undefined {
    this.lastInput = Date.now();
    switch (e.key) {
      case 'ArrowUp':
        switch (this.targetCursorPos) {
          case SET_TARGET_TIME_CURSOR.Hour:
            this.targetHour = (this.targetHour + 1) % 24;
            break;
          case SET_TARGET_TIME_CURSOR.Minute:
            this.targetMinute = (this.targetMinute + 1) % 60;
            break;
        }
        return true;
      case 'ArrowDown':
        switch (this.targetCursorPos) {
          case SET_TARGET_TIME_CURSOR.Hour:
            this.targetHour = (this.targetHour + 23) % 24;
            break;
          case SET_TARGET_TIME_CURSOR.Minute:
            this.targetMinute = (this.targetMinute + 59) % 60;
            break;
        }
        return true;
      case 'ArrowLeft':
        this.targetCursorPos = (this.targetCursorPos + 1) % 2;
        return true;
      case 'ArrowRight':
        this.targetCursorPos = (this.targetCursorPos + 1) % 2;
        return true;
      case 'Enter':
        this.setTargetTime();
        this.mode = MODES.Countdown;
        return true;
      case 'Escape':
        this.mode = MODES.Countdown;
        return true;
      default:
        return undefined;
    }
  }

  private setTargetTime(): void {
    this.countdownTime = nextOccurrenceOf(
      this.targetHour,
      this.targetMinute,
    ).getTime();
    this.isTargetTimeMode = true;
    saveCountdownTarget({ hour: this.targetHour, minute: this.targetMinute });
  }
}
