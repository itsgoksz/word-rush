const checkWord = require('check-word')

let wordsChecker: any = null

/**
 * Initializes the dictionary set into memory.
 */
export function initDictionary() {
  try {
    wordsChecker = checkWord('en')
    console.log(`Loaded english words into dictionary (via check-word).`)
  } catch (error) {
    console.error('Failed to load dictionary:', error)
  }
}

/**
 * Sanitizes input word: lowercases, trims, and strips punctuation
 */
export function sanitizeWord(word: string): string {
  // Remove anything that is not a lowercase alphabetical character
  return word.toLowerCase().trim().replace(/[^a-z]/g, '')
}

/**
 * Validates if the given word is in the dictionary and matches the start/end letter rules
 */
export function validateWord(word: string, startLetter: string, endLetter: string): boolean {
  const sanitized = sanitizeWord(word)
  const requiredStart = startLetter.toLowerCase()
  const requiredEnd = endLetter.toLowerCase()

  // Must be strictly greater than 2 letters
  if (sanitized.length <= 2) return false

  if (
    !sanitized.startsWith(requiredStart) ||
    !sanitized.endsWith(requiredEnd)
  ) {
    return false
  }

  if (!wordsChecker) return false
  return wordsChecker.check(sanitized)
}
