import words from 'an-array-of-english-words'

let wordsSet: Set<string> | null = null

export function initDictionary() {
  if (!wordsSet) {
    wordsSet = new Set(words)
    console.log(`Loaded ${wordsSet.size} english words into dictionary.`)
  }
}

export function sanitizeWord(word: string): string {
  return word.toLowerCase().trim().replace(/[^a-z]/g, '')
}

export function validateWord(word: string, startLetter: string, endLetter: string): boolean {
  const sanitized = sanitizeWord(word)
  const requiredStart = startLetter.toLowerCase()
  const requiredEnd = endLetter.toLowerCase()

  if (sanitized.length <= 2) return false

  if (
    !sanitized.startsWith(requiredStart) ||
    !sanitized.endsWith(requiredEnd)
  ) {
    return false
  }

  if (!wordsSet) initDictionary()
  
  return wordsSet!.has(sanitized)
}
