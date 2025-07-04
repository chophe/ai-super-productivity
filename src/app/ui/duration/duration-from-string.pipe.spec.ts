import { DurationFromStringPipe, durationFromString } from './duration-from-string.pipe';

describe('DurationFromStringPipe', () => {
  it('create an instance', () => {
    const pipe = new DurationFromStringPipe();
    expect(pipe).toBeTruthy();
  });

  describe('durationFromString', () => {
    it('should return SimpleDuration for valid time strings', () => {
      const result = durationFromString('2h30m');
      expect(result).not.toBeNull();
      expect(result!.asMilliseconds()).toBe(2.5 * 60 * 60 * 1000);
    });

    it('should handle different time formats', () => {
      expect(durationFromString('1h')!.asMilliseconds()).toBe(60 * 60 * 1000);
      expect(durationFromString('30m')!.asMilliseconds()).toBe(30 * 60 * 1000);
      expect(durationFromString('45s')!.asMilliseconds()).toBe(45 * 1000);
      expect(durationFromString('1.5h')!.asMilliseconds()).toBe(1.5 * 60 * 60 * 1000);
    });

    it('should handle complex time strings', () => {
      expect(durationFromString('1h 30m 45s')!.asMilliseconds()).toBe(
        // eslint-disable-next-line no-mixed-operators
        (60 + 30) * 60 * 1000 + 45 * 1000,
      );
    });

    it('should return null for invalid strings', () => {
      expect(durationFromString('')).toBeNull();
      expect(durationFromString('invalid')).toBeNull();
      expect(durationFromString(null)).toBeNull();
    });

    it('should return null for zero milliseconds', () => {
      expect(durationFromString('0m')).toBeNull();
    });
  });
});
