import words10 from 'wordlist-english/english-words-10.json'
import words20 from 'wordlist-english/english-words-20.json'
import words35 from 'wordlist-english/english-words-35.json'
import words40 from 'wordlist-english/english-words-40.json'
import words50 from 'wordlist-english/english-words-50.json'
import words55 from 'wordlist-english/english-words-55.json'
import words60 from 'wordlist-english/english-words-60.json'
import words70 from 'wordlist-english/english-words-70.json'

let wordsSet: Set<string> | null = null

export function initDictionary() {
  if (!wordsSet) {
    const allWords = [
      ...words10, ...words20, ...words35, ...words40,
      ...words50, ...words55, ...words60, ...words70
    ]
    wordsSet = new Set(allWords)
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
