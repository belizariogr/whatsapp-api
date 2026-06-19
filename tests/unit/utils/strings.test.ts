import { describe, expect, test } from 'bun:test';
import {
  extractUrls,
  isNonEmptyString,
  normalizeWhitespace,
  truncate,
} from '../../../src/utils/strings.ts';

describe('utils/strings', () => {
  test('isNonEmptyString', () => {
    expect(isNonEmptyString('hello')).toBe(true);
    expect(isNonEmptyString('  ')).toBe(false);
    expect(isNonEmptyString(null)).toBe(false);
  });

  test('normalizeWhitespace', () => {
    expect(normalizeWhitespace('  hello   world  ')).toBe('hello world');
  });

  test('truncate', () => {
    expect(truncate('abcdefghij', 8)).toBe('abcde...');
    expect(truncate('abc', 8)).toBe('abc');
  });

  test('extractUrls', () => {
    const text = 'Visite https://example.com e http://test.org/page';
    expect(extractUrls(text)).toEqual(['https://example.com', 'http://test.org/page']);
  });
});
