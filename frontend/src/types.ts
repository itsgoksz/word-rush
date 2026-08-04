export type GameState =
  | 'LOBBY'
  | 'LETTER_SELECTION'
  | 'LETTER_REVEAL'
  | 'WORD_ENTRY'
  | 'ROUND_RESULT'
  | 'MATCH_RESULT'
  | 'BOMB_PHASE'
  | 'BOMB_EXPLODED'

export interface Profile {
  id: string
  username: string
  elo: number
  wins: number
  losses: number
}

export interface Player {
  id: string
  elo: number
  isReady: boolean
  letter: string | null
  word: string | null
  wordValid: boolean | null
  wordPoints: number
  score: number
  streak: number
  disconnected: boolean
  submittedAt: number | null
  joinOrder: number
  team: number
}

export interface BombState {
  holderTeam: number
  currentLetter: string
  previousWord: string
  tickMultiplier: number
  usedWords: string[]
}

export interface Room {
  id: string
  isQuickMatch: boolean
  mode: '1v1' | '2v2'
  players: Record<string, Player>
  state: GameState
  round: number
  maxRounds: number
  timerValue: number
  timeRemaining?: number
  timerInterval: number | null
  timerOnComplete?: () => void
  disconnectTimeout: number | null
  bomb?: BombState
  matchResult?: {
    winnerId: string | null
    loserId: string | null
    winnerChange: number
    loserChange: number
  }
  history: {
    round: number
    letters: string[]
    words: string[]
    validity: boolean[]
    points: number[]
  }[]
}

export interface RoomState {
  id: string
  state: GameState
  round: number
  maxRounds: number
  timerValue: number
  players: Player[]
  mode: '1v1' | '2v2'
  bomb?: BombState
  matchResult?: {
    winnerId: string | null
    loserId: string | null
    winnerChange: number
    loserChange: number
  }
}
