export interface PersistedCountdownTarget {
  hour: number;
  minute: number;
}

const STORAGE_KEY = 'countdownTargetTime';

export function loadCountdownTarget(): PersistedCountdownTarget | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.hour === 'number' &&
      typeof parsed?.minute === 'number'
    ) {
      return { hour: parsed.hour, minute: parsed.minute };
    }
    return null;
  } catch {
    return null;
  }
}

export function saveCountdownTarget(
  target: PersistedCountdownTarget | null,
): void {
  if (target) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(target));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}
