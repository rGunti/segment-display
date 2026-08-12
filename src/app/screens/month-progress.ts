import dateFormat from 'dateformat';
import { ClockScreen } from '.';
import { center, left, repeat } from '../../utils';
import { InputArgs, InputHandler, RenderArgs, Screen } from '../base';
import { MainDisplayCollection } from '../collection';

export class MonthProgressScreen
  implements Screen<MainDisplayCollection>, InputHandler<MainDisplayCollection>
{
  readonly supportsInput = true;

  private moveToScreen: Screen<MainDisplayCollection> | null = null;

  render(renderArgs: RenderArgs<MainDisplayCollection>): void {
    if (this.moveToScreen) {
      renderArgs.changeScreen(this.moveToScreen);
      return;
    }

    const { displays, now } = renderArgs;
    const progress = MonthProgressScreen.elapsedMonthFraction(now);
    const percent = Math.min(99.99, progress * 100);
    const whole = Math.floor(percent);
    const fraction = Math.round((percent - whole) * 100);

    // Main display has fixed colon cells; "XX.YY" lands the '.' there
    // (lighting just the bottom dot) so it reads as a decimal point.
    displays.main.show(
      `${whole}`.padStart(2, '0') + '.' + `${fraction}`.padStart(2, '0'),
    );
    displays.date.show(
      left(
        this.renderProgressBar(progress, displays.date.displayCount),
        displays.date.displayCount,
        displays.date.specialChars,
      ),
    );
    displays.weekday.show(
      center(
        dateFormat(
          now,
          now.getMilliseconds() < 500
            ? 'dd mmm yyyy HH:MM:ss'
            : 'dd mmm yyyy HH MM ss',
        ),
        displays.weekday.displayCount,
        displays.weekday.specialChars,
      ),
    );
  }

  onInputReceived(e: InputArgs<MainDisplayCollection>): boolean | undefined {
    switch (e.input.key) {
      case 'Escape':
        this.moveToScreen = new ClockScreen();
        return true;
    }
  }

  private static elapsedMonthFraction(now: Date): number {
    const monthStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    ).getTime();
    const monthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      1,
    ).getTime();
    return (now.getTime() - monthStart) / (monthEnd - monthStart);
  }

  private renderProgressBar(progress: number, displayCount: number): string {
    const blockDivisions = 5;
    const barLength = Math.ceil(
      Math.min(1, progress) * displayCount * blockDivisions,
    );
    const fullBlocks = Math.floor(barLength / blockDivisions);
    const partialBlockSize = barLength % blockDivisions;

    return (
      repeat('\x05', fullBlocks) + this.renderPartialBlock(partialBlockSize)
    );
  }

  private renderPartialBlock(level: number): string {
    if (level === 0) {
      return '';
    }
    return String.fromCharCode(level);
  }
}
