export type GameState =
  | 'LOBBY'
  | 'LETTER_SELECTION'
  | 'LETTER_REVEAL'
  | 'WORD_ENTRY'
  | 'ROUND_RESULT'
  | 'MATCH_RESULT'

export interface Player {
  id: string
  isReady: boolean
  letter: string | null
  word: string | null
  wordValid: boolean | null
  wordPoints: number
  score: number
  streak: number
  disconnected: boolean
  submittedAt: number | null
  team: number
  joinOrder: number
}

export interface RoomState {
  id: string
  state: GameState
  round: number
  maxRounds: number
  timerValue: number
  players: Player[]
  mode: '1v1' | '2v2'
}
