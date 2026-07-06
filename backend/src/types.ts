export type GameState =
  | 'LOBBY'
  | 'LETTER_SELECTION'
  | 'LETTER_REVEAL'
  | 'WORD_ENTRY'
  | 'ROUND_RESULT'
  | 'MATCH_RESULT'

export interface Player {
  id: string
  socketId: string
  isReady: boolean
  letter: string | null
  word: string | null
  wordValid: boolean | null
  wordPoints: number
  score: number
  streak: number
  disconnected: boolean // for grace period
  submittedAt: number | null
  joinOrder: number // 0 to 3
  team: number // 0 or 1
}

export interface Room {
  id: string
  isQuickMatch: boolean
  mode: '1v1' | '2v2'
  players: Record<string, Player> // max 2 or 4
  state: GameState
  round: number
  maxRounds: number
  timerValue: number
  timeRemaining?: number
  timerInterval: NodeJS.Timeout | null
  timerOnComplete?: () => void
  disconnectTimeout: NodeJS.Timeout | null
  history: {
    round: number
    letters: string[]
    words: string[]
    validity: boolean[]
    points: number[]
  }[]
}
