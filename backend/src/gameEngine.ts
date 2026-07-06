import { Server, Socket } from 'socket.io'
import { Room, Player, GameState } from './types'
import { validateWord } from './dictionary'

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
  delete rooms[roomId]
}

export function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// Emits state to all connected players in the room
export function broadcastRoomState(io: Server, roomId: string) {
  const room = rooms[roomId]
  if (!room) return

  // We need to hide opponent's letter during LETTER_SELECTION
  // and opponent's word during WORD_ENTRY
  const playersArr = Object.values(room.players)

  for (const player of playersArr) {
    if (player.disconnected) continue

    const sanitizedPlayers = playersArr.map(p => {
      const isSelf = p.id === player.id
      return {
        id: p.id,
        isReady: p.isReady,
        score: p.score,
        streak: p.streak,
        disconnected: p.disconnected,
        // Hide letter if not self during selection
        letter: (room.state === 'LETTER_SELECTION' && !isSelf) ? (p.letter ? '*' : null) : p.letter,
        // Hide word if not self during entry
        word: (room.state === 'WORD_ENTRY' && !isSelf) ? (p.word ? '*' : null) : p.word,
        wordValid: p.wordValid,
        wordPoints: p.wordPoints,
        joinOrder: p.joinOrder,
        team: p.team
      }
    })

    io.to(player.socketId).emit('roomUpdate', {
      id: room.id,
      mode: room.mode,
      state: room.state,
      round: room.round,
      maxRounds: room.maxRounds,
      timerValue: room.timerValue,
      players: sanitizedPlayers
    })
  }
}

export function setTimer(io: Server, room: Room, seconds: number, onComplete: () => void) {
  if (room.timerInterval) clearInterval(room.timerInterval)
  
  room.timerValue = seconds
  room.timerOnComplete = onComplete
  broadcastRoomState(io, room.id)

  room.timerInterval = setInterval(() => {
    room.timerValue--
    if (room.timerValue <= 0) {
      if (room.timerInterval) clearInterval(room.timerInterval)
      if (room.timerOnComplete) room.timerOnComplete()
    } else {
      broadcastRoomState(io, room.id)
    }
  }, TICK_RATE)
}

export function startGameLoop(io: Server, roomId: string) {
  const room = rooms[roomId]
  if (!room) return
  startLetterSelection(io, room)
}

function getPickers(room: Room): number[] {
  if (room.mode === '1v1') return [0, 1]
  const team0Picker = room.round % 2 !== 0 ? 0 : 2
  const team1Picker = room.round % 2 !== 0 ? 1 : 3
  return [team0Picker, team1Picker]
}

function startLetterSelection(io: Server, room: Room) {
  room.state = 'LETTER_SELECTION'
  
  // Reset round local state
  Object.values(room.players).forEach(p => {
    p.letter = null
    p.word = null
    p.wordValid = null
    p.wordPoints = 0
    p.submittedAt = null
  })

  setTimer(io, room, LETTER_SELECTION_TIME, () => {
    // If timer expires and some players didn't pick, assign random letter
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const pickers = getPickers(room)
    Object.values(room.players).forEach(p => {
      if (pickers.includes(p.joinOrder) && !p.letter) {
        p.letter = alphabet[Math.floor(Math.random() * alphabet.length)]
      }
    })
    startLetterReveal(io, room)
  })
}

export function checkLetterSelectionComplete(io: Server, room: Room) {
  const pickers = getPickers(room)
  const allSelected = Object.values(room.players)
    .filter(p => pickers.includes(p.joinOrder))
    .every(p => p.letter !== null)

  if (allSelected) {
    if (room.timerInterval) clearInterval(room.timerInterval)
    startLetterReveal(io, room)
  } else {
    broadcastRoomState(io, room.id)
  }
}

function startLetterReveal(io: Server, room: Room) {
  room.state = 'LETTER_REVEAL'
  setTimer(io, room, LETTER_REVEAL_TIME, () => {
    startWordEntry(io, room)
  })
}

function startWordEntry(io: Server, room: Room) {
  room.state = 'WORD_ENTRY'
  setTimer(io, room, WORD_ENTRY_TIME, () => {
    processRoundResults(io, room)
  })
}

export function checkWordEntryComplete(io: Server, room: Room) {
  const allSubmitted = Object.values(room.players).every(p => p.word !== null)
  if (allSubmitted) {
    if (room.timerInterval) clearInterval(room.timerInterval)
    processRoundResults(io, room)
  } else {
    // Broadcast immediately so opponent sees the "submitted" checkmark
    broadcastRoomState(io, room.id)
  }
}

function processRoundResults(io: Server, room: Room) {
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
  // In 2v2 there are up to 4 words to display, but they can animate in parallel per team.
  // We'll just give it a safe buffer.
  const dynamicResultTime = Math.max(ROUND_RESULT_TIME, animationTime + 4)

  setTimer(io, room, dynamicResultTime, () => {
    if (room.round >= room.maxRounds) {
      endMatch(io, room)
    } else {
      room.round++
      startLetterSelection(io, room)
    }
  })
}

function endMatch(io: Server, room: Room) {
  room.state = 'MATCH_RESULT'
  broadcastRoomState(io, room.id)
  
  import('./supabase').then(({ saveMatchResult }) => {
    saveMatchResult(room)
  })

  // Auto-delete room after 60 seconds to prevent memory leaks
  setTimeout(() => {
    if (rooms[room.id]) {
      io.to(room.id).emit('matchEnded', { reason: 'room_closed' })
      delete rooms[room.id]
    }
  }, 60000)
}

export function handleDisconnect(io: Server, socketId: string) {
  for (const roomId in rooms) {
    const room = rooms[roomId]
    const playerArr = Object.values(room.players)
    const player = playerArr.find(p => p.socketId === socketId)
    
    if (player) {
      player.disconnected = true

      // Pause timer
      if (room.timerInterval) {
        clearInterval(room.timerInterval)
        room.timerInterval = null
        room.timeRemaining = room.timerValue
      }

      broadcastRoomState(io, roomId)

      // Start grace period
      if (!room.disconnectTimeout) {
        room.disconnectTimeout = setTimeout(() => {
          // If still disconnected after grace period, end match or drop room
          const stillDisconnected = Object.values(room.players).some(p => p.disconnected)
          if (stillDisconnected) {
            if (room.timerInterval) clearInterval(room.timerInterval)
            io.to(roomId).emit('matchEnded', { reason: 'opponent_abandoned' })
            delete rooms[roomId]
          }
        }, DISCONNECT_GRACE_PERIOD)
      }
      break
    }
  }
}

export function handleReconnect(io: Server, socket: Socket, playerSessionId: string) {
  for (const roomId in rooms) {
    const room = rooms[roomId]
    const player = room.players[playerSessionId]
    if (player) {
      player.socketId = socket.id
      player.disconnected = false
      socket.join(roomId)
      
      // Clear grace period timeout if everyone is back
      const anyDisconnected = Object.values(room.players).some(p => p.disconnected)
      if (!anyDisconnected) {
        if (room.disconnectTimeout) {
          clearTimeout(room.disconnectTimeout)
          room.disconnectTimeout = null
        }
        
        // Resume timer if it was paused
        if (room.timeRemaining !== undefined && room.timerOnComplete) {
          setTimer(io, room, room.timeRemaining, room.timerOnComplete)
          room.timeRemaining = undefined
        }
      }
      
      broadcastRoomState(io, roomId)
      break
    }
  }
}


