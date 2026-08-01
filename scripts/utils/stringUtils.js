/**
 * Utility functions for string manipulation.
 */

class StringUtils {
  /**
   * Capitalizes the first letter of a given string.
   *
   * @param {string} str The input string.
   * @returns {string} The string with its first letter capitalized.
   */
  static capitalize(str) {
    if (typeof str !== 'string' || str.length === 0) {
      return str;
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

module.exports = StringUtils;
