export type FormatTimeOptions = {
  joinWith: string;
  showUnits: boolean;
  padLargestUnitWithZero: boolean;
  alwaysShowHours: boolean;
};

export const DEFAULT_FORMAT_TIME_OPTIONS: FormatTimeOptions = {
  joinWith: ':',
  showUnits: false,
  padLargestUnitWithZero: false,
  alwaysShowHours: false,
};

export function formatTime(
  time: number,
  options: Partial<FormatTimeOptions> = DEFAULT_FORMAT_TIME_OPTIONS,
): string {
  const finalOptions = {
    ...DEFAULT_FORMAT_TIME_OPTIONS,
    ...options,
  };

  // Takes the number of seconds and formats it into the format HH:mm:ss, including padding 0
  // eslint-disable-next-line no-bitwise
  const hours = ~~(time / 3600);
  // eslint-disable-next-line no-bitwise
  const minutes = ~~((time % 3600) / 60);
  // eslint-disable-next-line no-bitwise
  const seconds = ~~time % 60;

  const elements: string[] = [
    hours > 0 || finalOptions.alwaysShowHours
      ? formatTimeComponent(
          hours,
          finalOptions.padLargestUnitWithZero,
          'h',
          finalOptions.showUnits,
        )
      : '',
    formatTimeComponent(
      minutes,
      hours > 0 || finalOptions.padLargestUnitWithZero,
      'm',
      finalOptions.showUnits,
    ),
    formatTimeComponent(seconds, true, 's', finalOptions.showUnits),
  ];

  return elements.filter((i) => i !== '').join(finalOptions.joinWith);
}

export function nextOccurrenceOf(
  hour: number,
  minute: number,
  from: Date = new Date(),
): Date {
  const target = new Date(from);
  target.setHours(hour, minute, 0, 0);
  if (target.getTime() <= from.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target;
}

function formatTimeComponent(
  value: number,
  padWithZero: boolean,
  unit: string,
  showUnits: boolean,
): string {
  return (
    value.toString().padStart(2, padWithZero ? '0' : ' ') +
    (showUnits ? unit : '')
  );
}
