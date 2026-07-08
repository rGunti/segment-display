import { center, nextOccurrenceOf } from '../src/utils';

describe('centering text', () => {
  it.each([
    ['hello world', 16, [], '  hello world   '],
    ['test', 4, [], 'test'],
    ['test', 6, [], ' test '],
    ['test', 2, [], 'test'],
    ['01.23', 6, ['.'], ' 01.23 '],
    ['2023-06-17', 12, ['.'], ' 2023-06-17 '],
    ['2023.06.17', 12, ['.'], '  2023.06.17  '],
  ])(
    'when the input is "%s" with requested with length of %f while ignoring %s, expect "%s"',
    (inputText, width, ignoreChars, expectedOutput) => {
      expect(center(inputText, width, new Set(ignoreChars))).toBe(
        expectedOutput,
      );
    },
  );
});

describe('finding the next occurrence of a time of day', () => {
  it('returns today at the target time when it is still ahead of now', () => {
    const from = new Date(2026, 0, 1, 10, 0, 0, 0);
    expect(nextOccurrenceOf(18, 30, from)).toEqual(
      new Date(2026, 0, 1, 18, 30, 0, 0),
    );
  });

  it('rolls over to tomorrow when the target time has already passed today', () => {
    const from = new Date(2026, 0, 1, 20, 0, 0, 0);
    expect(nextOccurrenceOf(18, 30, from)).toEqual(
      new Date(2026, 0, 2, 18, 30, 0, 0),
    );
  });

  it('rolls over to tomorrow when the target time exactly matches now', () => {
    const from = new Date(2026, 0, 1, 18, 30, 0, 0);
    expect(nextOccurrenceOf(18, 30, from)).toEqual(
      new Date(2026, 0, 2, 18, 30, 0, 0),
    );
  });
});
