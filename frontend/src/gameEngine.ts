import type { Room, Player, GameState } from './types'
import { validateWord } from './dictionary'
import { broadcastRoomState } from './realtime'

const rooms: Record<string, Room> = {}

const TICK_RATE = 1000 // 1 second timer ticks
const LETTER_SELECTION_TIME = 10
const LETTER_REVEAL_TIME = 2
const WORD_ENTRY_TIME = 30
const ROUND_RESULT_TIME = 5
const MAX_ROUNDS = 10
const DISCONNECT_GRACE_PERIOD = 15000 // 15 seconds to reconnect

export function createRoom(roomId: string, isQuickMatch: boolean = false, mode: '1v1' | '2v2' = '1v1'): Room {
  const room: Room = {
    id: roomId,
    isQuickMatch,
    mode,
    players: {},
    state: 'LOBBY',
    round: 1,
    maxRounds: MAX_ROUNDS,
    timerValue: 0,
    timerInterval: null,
    disconnectTimeout: null,
    history: [],
  }
  rooms[roomId] = room
  return room
}

export function getRoom(roomId: string): Room | undefined {
  return rooms[roomId]
}

export function deleteRoom(roomId: string) {
  const room = rooms[roomId]
  if (room && room.timerInterval) clearInterval(room.timerInterval)
  if (room && room.disconnectTimeout) clearTimeout(room.disconnectTimeout)
  delete rooms[roomId]
}

export function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export function setTimer(room: Room, seconds: number, onComplete: () => void) {
  if (room.timerInterval) clearInterval(room.timerInterval)
  
  room.timerValue = seconds
  room.timerOnComplete = onComplete
  broadcastRoomState(room.id)

  room.timerInterval = setInterval(() => {
    room.timerValue--
    if (room.timerValue <= 0) {
      if (room.timerInterval) clearInterval(room.timerInterval)
      if (room.timerOnComplete) room.timerOnComplete()
    } else {
      broadcastRoomState(room.id)
    }
  }, TICK_RATE)
}

export function startGameLoop(roomId: string) {
  const room = rooms[roomId]
  if (!room) return
  startLetterSelection(room)
}

function getPickers(room: Room): number[] {
  if (room.mode === '1v1') return [0, 1]
  const team0Picker = room.round % 2 !== 0 ? 0 : 2
  const team1Picker = room.round % 2 !== 0 ? 1 : 3
  return [team0Picker, team1Picker]
}

function startLetterSelection(room: Room) {
  room.state = 'LETTER_SELECTION'
  
  // Reset round local state
  Object.values(room.players).forEach(p => {
    p.letter = null
    p.word = null
    p.wordValid = null
    p.wordPoints = 0
    p.submittedAt = null
  })

  setTimer(room, LETTER_SELECTION_TIME, () => {
    // If timer expires and some players didn't pick, assign random letter
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const pickers = getPickers(room)
    Object.values(room.players).forEach(p => {
      if (pickers.includes(p.joinOrder) && !p.letter) {
        p.letter = alphabet[Math.floor(Math.random() * alphabet.length)]
      }
    })
    startLetterReveal(room)
  })
}

export function checkLetterSelectionComplete(room: Room) {
  const pickers = getPickers(room)
  const allSelected = Object.values(room.players)
    .filter(p => pickers.includes(p.joinOrder))
    .every(p => p.letter !== null)

  if (allSelected) {
    if (room.timerInterval) clearInterval(room.timerInterval)
    startLetterReveal(room)
  } else {
    broadcastRoomState(room.id)
  }
}

function startLetterReveal(room: Room) {
  room.state = 'LETTER_REVEAL'
  setTimer(room, LETTER_REVEAL_TIME, () => {
    startWordEntry(room)
  })
}

function startWordEntry(room: Room) {
  room.state = 'WORD_ENTRY'
  setTimer(room, WORD_ENTRY_TIME, () => {
    processRoundResults(room)
  })
}

export function checkWordEntryComplete(room: Room) {
  const allSubmitted = Object.values(room.players).every(p => p.word !== null)
  if (allSubmitted) {
    if (room.timerInterval) clearInterval(room.timerInterval)
    processRoundResults(room)
  } else {
    // Broadcast immediately so opponent sees the "submitted" checkmark
    broadcastRoomState(room.id)
  }
}

function processRoundResults(room: Room) {
  room.state = 'ROUND_RESULT'
  
  const players = Object.values(room.players)
  const pickers = getPickers(room)
  
  const p1 = players.find(p => p.joinOrder === pickers[0]) || players.find(p => p.team === 0)!
  const p2 = players.find(p => p.joinOrder === pickers[1]) || players.find(p => p.team === 1)!
  
  const startIdx = room.round % 2 !== 0 ? 0 : 1
  const endIdx = 1 - startIdx
  
  const orderedPlayers = [p1, p2]
  const startLetter = orderedPlayers[startIdx].letter || 'A'
  const endLetter = orderedPlayers[endIdx].letter || 'A'

  const historyEntry = {
    round: room.round,
    letters: [startLetter, endLetter],
    words: room.mode === '1v1' ? ['', ''] : ['', '', '', ''],
    validity: room.mode === '1v1' ? [false, false] : [false, false, false, false],
    points: room.mode === '1v1' ? [0, 0] : [0, 0, 0, 0]
  }

  let fastestPlayerId: string | null = null
  let minTime = Infinity
  players.forEach(p => {
    const submittedWord = p.word || ''
    const isValid = validateWord(submittedWord, startLetter, endLetter)
    if (isValid && p.submittedAt !== null && p.submittedAt < minTime) {
      minTime = p.submittedAt
      fastestPlayerId = p.id
    }
  })

  let maxLen = 0
  players.forEach(p => {
    const submittedWord = p.word || ''
    const isValid = validateWord(submittedWord, startLetter, endLetter)
    
    p.wordValid = isValid
    if (isValid) {
      let points = 10 + submittedWord.length
      if (p.id === fastestPlayerId) {
        points += 5
      }
      p.wordPoints = points
      p.score += p.wordPoints
      p.streak += 1
    } else {
      p.wordPoints = 0
      p.streak = 0
    }

    historyEntry.words[p.joinOrder] = submittedWord
    historyEntry.validity[p.joinOrder] = isValid
    historyEntry.points[p.joinOrder] = p.wordPoints
    maxLen = Math.max(maxLen, submittedWord.length)
  })

  room.history.push(historyEntry)

  const animationTime = Math.ceil(maxLen * 0.3 + 0.5)
  const dynamicResultTime = Math.max(ROUND_RESULT_TIME, animationTime + 4)

  setTimer(room, dynamicResultTime, () => {
    if (room.round >= room.maxRounds) {
      endMatch(room)
    } else {
      room.round++
      startLetterSelection(room)
    }
  })
}

function endMatch(room: Room) {
  room.state = 'MATCH_RESULT'
  broadcastRoomState(room.id)

  if (room.mode === '1v1') {
    const players = Object.values(room.players)
    if (players.length === 2 && players[0].score !== players[1].score) {
      const winner = players[0].score > players[1].score ? players[0] : players[1]
      const loser = players[0].score > players[1].score ? players[1] : players[0]

      import('./supabaseClient').then(({ supabase }) => {
        supabase.rpc('update_match_result', {
          winner_id: winner.id,
          loser_id: loser.id,
          winner_elo_change: 25,
          loser_elo_change: -20
        }).then(({ error }) => {
          if (error) console.error("Failed to update elo:", error)
        })
      })
    }
  }
  
  // Clean up room after match ends
  setTimeout(() => {
    deleteRoom(room.id)
  }, 60000)
}

export function handleDisconnect(sessionId: string) {
  for (const roomId in rooms) {
    const room = rooms[roomId]
    const player = room.players[sessionId]
    
    if (player) {
      player.disconnected = true

      // Pause timer
      if (room.timerInterval) {
        clearInterval(room.timerInterval)
        room.timerInterval = null
        room.timeRemaining = room.timerValue
      }

      broadcastRoomState(roomId)

      // Start grace period
      if (!room.disconnectTimeout) {
        room.disconnectTimeout = setTimeout(() => {
          const stillDisconnected = Object.values(room.players).some(p => p.disconnected)
          if (stillDisconnected) {
            if (room.timerInterval) clearInterval(room.timerInterval)
            import('./realtime').then(({ emitToRoom }) => {
              emitToRoom(roomId, 'matchEnded', { reason: 'opponent_abandoned' })
            })
            deleteRoom(roomId)
          }
        }, DISCONNECT_GRACE_PERIOD)
      }
      break
    }
  }
}

export function handleReconnect(sessionId: string) {
  for (const roomId in rooms) {
    const room = rooms[roomId]
    const player = room.players[sessionId]
    if (player) {
      player.disconnected = false
      
      // Clear grace period timeout if everyone is back
      const anyDisconnected = Object.values(room.players).some(p => p.disconnected)
      if (!anyDisconnected) {
        if (room.disconnectTimeout) {
          clearTimeout(room.disconnectTimeout)
          room.disconnectTimeout = null
        }
        
        // Resume timer if it was paused
        if (room.timeRemaining !== undefined && room.timerOnComplete) {
          setTimer(room, room.timeRemaining, room.timerOnComplete)
          room.timeRemaining = undefined
        }
      }
      
      broadcastRoomState(roomId)
      break
    }
  }
}
