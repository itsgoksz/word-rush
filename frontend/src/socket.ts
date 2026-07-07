import { io, Socket } from 'socket.io-client'
import { useGameStore } from './store'

const SERVER_URL = import.meta.env.PROD
  ? 'https://word-rush-production-15e5.up.railway.app'
  : '/'

export const socket: Socket = io(SERVER_URL, {
  autoConnect: false,
})

export function getSessionId(): string {
  let sessionId = localStorage.getItem('wordrush_session_id')
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem('wordrush_session_id', sessionId)
  }
  return sessionId
}

// Attach listeners globally once
socket.on('connect', () => {
  console.log('Connected to server')
  const sessionId = getSessionId()

  // Check if we are reconnecting
  const roomId = useGameStore.getState().room?.id
  if (roomId) {
    socket.emit('reconnect_session', { sessionId, roomId })
  }
})

socket.on('roomUpdate', (roomState) => {
  useGameStore.getState().setRoomState(roomState)
})

socket.on('matchEnded', (data) => {
  console.log('Match ended', data)
  useGameStore.getState().resetRoom()
})

socket.on('waiting_in_queue', () => {
  useGameStore.getState().setWaiting(true)
})

socket.on('opponent_typing', ({ isTyping }) => {
  useGameStore.getState().setOpponentTyping(isTyping)
})

socket.on('disconnect', () => {
  console.log('Disconnected from server')
})

export function connectSocket() {
  if (!socket.connected) {
    socket.connect()
  }
}
