import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'
import { initDictionary } from './dictionary'
import {
  createRoom,
  getRoom,
  generateRoomId,
  startGameLoop,
  broadcastRoomState,
  checkLetterSelectionComplete,
  checkWordEntryComplete,
  handleDisconnect,
  handleReconnect,
  deleteRoom
} from './gameEngine'

dotenv.config()

initDictionary()

const app = express()
app.use(cors())
app.use(express.json())

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*', // For MVP, allow all
    methods: ['GET', 'POST']
  }
})

// Quick Match queue stores player session objects waiting
interface WaitingPlayer {
  socketId: string
  sessionId: string
}
const queue1v1: WaitingPlayer[] = []
const queue2v2: WaitingPlayer[] = []

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`)

  socket.on('reconnect_session', ({ sessionId, roomId }) => {
    handleReconnect(io, socket, sessionId)
  })

  socket.on('create_room', ({ sessionId, mode = '1v1' }) => {
    const roomId = generateRoomId()
    socket.join(roomId)
    const room = createRoom(roomId, false, mode)
    
    room.players[sessionId] = {
      id: sessionId,
      socketId: socket.id,
      isReady: false,
      letter: null,
      word: null,
      wordValid: null,
      wordPoints: 0,
      score: 0,
      streak: 0,
      disconnected: false,
      submittedAt: null,
      joinOrder: 0,
      team: 0
    }

    broadcastRoomState(io, roomId)
  })

  socket.on('join_room', ({ roomId, sessionId }) => {
    const room = getRoom(roomId)
    if (!room) {
      socket.emit('error', 'Room not found')
      return
    }

    const maxPlayers = room.mode === '2v2' ? 4 : 2
    if (Object.keys(room.players).length >= maxPlayers && !room.players[sessionId]) {
      socket.emit('error', 'Room is full')
      return
    }

    socket.join(roomId)
    
    if (!room.players[sessionId]) {
      const numPlayers = Object.keys(room.players).length
      room.players[sessionId] = {
        id: sessionId,
        socketId: socket.id,
        isReady: false,
        letter: null,
        word: null,
        wordValid: null,
        wordPoints: 0,
        score: 0,
        streak: 0,
        disconnected: false,
        submittedAt: null,
        joinOrder: numPlayers,
        team: room.mode === '2v2' ? (numPlayers < 2 ? 0 : 1) : 1
      }
    } else {
      // Reconnecting
      room.players[sessionId].socketId = socket.id
      room.players[sessionId].disconnected = false
    }

    broadcastRoomState(io, roomId)
  })

  socket.on('quick_match', ({ sessionId, mode = '1v1' }) => {
    const existingIdx1 = queue1v1.findIndex(p => p.sessionId === sessionId)
    const existingIdx2 = queue2v2.findIndex(p => p.sessionId === sessionId)
    if (existingIdx1 !== -1 || existingIdx2 !== -1) return

    if (mode === '2v2') {
      queue2v2.push({ socketId: socket.id, sessionId })
      if (queue2v2.length >= 4) {
        const players = queue2v2.splice(0, 4)
        const roomId = generateRoomId()
        const room = createRoom(roomId, true, '2v2')

        players.forEach((p, idx) => {
          room.players[p.sessionId] = {
            id: p.sessionId,
            socketId: p.socketId,
            isReady: true,
            letter: null,
            word: null,
            wordValid: null,
            wordPoints: 0,
            score: 0,
            streak: 0,
            disconnected: false,
            submittedAt: null,
            joinOrder: idx,
            team: idx < 2 ? 0 : 1
          }
          io.sockets.sockets.get(p.socketId)?.join(roomId)
        })
        startGameLoop(io, roomId)
      } else {
        socket.emit('waiting_in_queue')
      }
    } else {
      queue1v1.push({ socketId: socket.id, sessionId })
      if (queue1v1.length >= 2) {
        const p1 = queue1v1.shift()!
        const p2 = queue1v1.shift()!
        const roomId = generateRoomId()
        const room = createRoom(roomId, true, '1v1')

        const createPlayer = (id: string, socketId: string, order: number, team: number) => ({
          id, socketId, isReady: true, letter: null, word: null, wordValid: null, 
          wordPoints: 0, score: 0, streak: 0, disconnected: false, submittedAt: null, 
          joinOrder: order, team
        })

        room.players[p1.sessionId] = createPlayer(p1.sessionId, p1.socketId, 0, 0)
        room.players[p2.sessionId] = createPlayer(p2.sessionId, p2.socketId, 1, 1)

        io.sockets.sockets.get(p1.socketId)?.join(roomId)
        io.sockets.sockets.get(p2.socketId)?.join(roomId)
        startGameLoop(io, roomId)
      } else {
        socket.emit('waiting_in_queue')
      }
    }
  })

  socket.on('set_ready', ({ roomId, sessionId }) => {
    const room = getRoom(roomId)
    if (!room) return
    const player = room.players[sessionId]
    if (player) {
      player.isReady = true
      broadcastRoomState(io, roomId)

      const playersArr = Object.values(room.players)
      const maxPlayers = room.mode === '2v2' ? 4 : 2
      if (playersArr.length === maxPlayers && playersArr.every(p => p.isReady)) {
        startGameLoop(io, roomId)
      }
    }
  })

  socket.on('select_letter', ({ roomId, sessionId, letter }) => {
    const room = getRoom(roomId)
    if (!room || room.state !== 'LETTER_SELECTION') return
    
    const sanitizedLetter = (letter || '').toString().trim().toUpperCase().charAt(0)
    if (!/^[A-Z]$/.test(sanitizedLetter)) return

    const player = room.players[sessionId]
    if (player && player.letter === null) {
      player.letter = sanitizedLetter
      checkLetterSelectionComplete(io, room)
    }
  })

  socket.on('submit_word', ({ roomId, sessionId, word }) => {
    const room = getRoom(roomId)
    if (!room || room.state !== 'WORD_ENTRY') return
    
    const sanitizedWord = (word || '').toString().trim().toLowerCase().replace(/[^a-z]/g, '')
    if (sanitizedWord.length === 0) return

    const player = room.players[sessionId]
    if (player && player.word === null) {
      player.word = sanitizedWord
      player.submittedAt = Date.now()
      checkWordEntryComplete(io, room)
    }
  })

  socket.on('typing_status', ({ roomId, sessionId, isTyping }) => {
    socket.to(roomId).emit('opponent_typing', { sessionId, isTyping })
  })

  socket.on('leave_room', ({ roomId, sessionId }) => {
    socket.leave(roomId)
    const room = getRoom(roomId)
    if (room) {
      if (room.timerInterval) clearInterval(room.timerInterval)
      io.to(roomId).emit('matchEnded', { reason: 'opponent_abandoned' })
      deleteRoom(roomId)
    }
  })

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`)
    const queueIdx1 = queue1v1.findIndex(p => p.socketId === socket.id)
    if (queueIdx1 !== -1) queue1v1.splice(queueIdx1, 1)

    const queueIdx2 = queue2v2.findIndex(p => p.socketId === socket.id)
    if (queueIdx2 !== -1) queue2v2.splice(queueIdx2, 1)

    handleDisconnect(io, socket.id)
  })
})

const PORT = process.env.PORT || 3001
server.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`)
})
