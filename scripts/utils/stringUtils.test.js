const assert = require('assert');
const StringUtils = require('./stringUtils');

(async () => {
  console.log('Running StringUtils tests...');

  // Test case 1: Capitalize a normal string
  assert.strictEqual(StringUtils.capitalize('hello'), 'Hello', 'Test Case 1 Failed: Should capitalize "hello"');

  // Test case 2: Capitalize a string that is already capitalized
  assert.strictEqual(StringUtils.capitalize('World'), 'World', 'Test Case 2 Failed: Should not change "World"');

  // Test case 3: Capitalize an empty string
  assert.strictEqual(StringUtils.capitalize(''), '', 'Test Case 3 Failed: Should return empty string for empty input');

  // Test case 4: Capitalize a string with leading space (should only capitalize first char)
  assert.strictEqual(StringUtils.capitalize('  test'), '  test', 'Test Case 4 Failed: Should capitalize first character of string, not trim');

  // Test case 5: Capitalize a string with numbers
  assert.strictEqual(StringUtils.capitalize('123abc'), '123abc', 'Test Case 5 Failed: Should not alter numbers');

  // Test case 6: Capitalize a single character string
  assert.strictEqual(StringUtils.capitalize('a'), 'A', 'Test Case 6 Failed: Should capitalize single character "a"');

  console.log('All StringUtils tests passed successfully!');
})();
