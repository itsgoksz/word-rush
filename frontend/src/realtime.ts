import { supabase } from './supabaseClient'
import { useGameStore } from './store'
import { RealtimeChannel } from '@supabase/supabase-js'
import {
  createRoom as engineCreateRoom,
  getRoom,
  generateRoomId,
  startGameLoop,
  deleteRoom,
  checkLetterSelectionComplete,
  checkWordEntryComplete,
  handleDisconnect,
  handleReconnect
} from './gameEngine'
import type { RoomState } from './types'

export function getSessionId(): string {
  const user = useGameStore.getState().user
  if (user) return user.id

  let sessionId = localStorage.getItem('wordrush_session_id')
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    localStorage.setItem('wordrush_session_id', sessionId)
  }
  return sessionId
}

let activeChannel: RealtimeChannel | null = null
let lobbyChannel: RealtimeChannel | null = null
let isHost = false
let currentRoomId: string | null = null

// --- LOBBY & MATCHMAKING ---

export function connectSocket() {
  if (lobbyChannel) return
  
  lobbyChannel = supabase.channel('global_lobby', {
    config: {
      presence: { key: getSessionId() }
    }
  })
  
  lobbyChannel
    .on('presence', { event: 'sync' }, () => {
      const state = lobbyChannel?.presenceState()
      console.log('[WordRush] Presence sync fired. State:', state)
      if (!state) return

      const mySessionId = getSessionId()
      const myPresence = state[mySessionId]?.[0] as any
      console.log(`[WordRush] My session: ${mySessionId}, My presence:`, myPresence)
      if (!myPresence || myPresence.status !== 'searching') return

      for (const [key, presences] of Object.entries(state)) {
        if (key === mySessionId) continue
        const presence = presences[0] as any
        
        console.log(`[WordRush] Evaluating peer: ${key}`, presence)
        
        if (presence && presence.status === 'searching' && presence.mode === myPresence.mode) {
          console.log(`[WordRush] Found match: ${key}. Comparing ${mySessionId} < ${key}:`, mySessionId < key)
          if (mySessionId < key) {
            console.log('[WordRush] I am the host, creating room...')
            const newRoomId = generateRoomId()
            
            lobbyChannel?.send({
              type: 'broadcast',
              event: 'invite',
              payload: { to: key, roomId: newRoomId, mode: myPresence.mode }
            })

            joinRoomAsHost(newRoomId, myPresence.mode)
            break // Prevent creating multiple rooms if multiple matches
          }
        }
      }
    })
    .on('broadcast', { event: 'invite' }, ({ payload }) => {
      console.log('[WordRush] Received invite payload:', payload)
      if (payload.to === getSessionId()) {
        console.log('[WordRush] Joining as guest...')
        joinRoomAsGuest(payload.roomId)
      }
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await lobbyChannel?.track({
          sessionId: getSessionId(),
          status: 'idle'
        })
      }
    })
}

export function quickMatch(mode: '1v1' | '2v2' = '1v1') {
  useGameStore.getState().setWaiting(true)
  console.log('[WordRush] quickMatch called, tracking searching...')
  lobbyChannel?.track({
    sessionId: getSessionId(),
    status: 'searching',
    mode
  }).then((res) => {
    console.log('[WordRush] track result:', res)
  }).catch((err) => {
    console.error('[WordRush] track error:', err)
  })
}

// --- ROOM LOGIC ---

function setupRoomChannel(roomId: string, onSubscribe: () => void) {
  if (activeChannel) {
    activeChannel.unsubscribe()
  }
  currentRoomId = roomId
  activeChannel = supabase.channel(`room:${roomId}`)

  activeChannel
    .on('broadcast', { event: 'roomUpdate' }, ({ payload }) => {
      const state = payload as RoomState
      useGameStore.getState().setRoomState(state)
    })
    .on('broadcast', { event: 'matchEnded' }, ({ payload }) => {
      console.log('Match ended', payload)
      useGameStore.getState().resetRoom()
    })
    .on('broadcast', { event: 'opponent_typing' }, ({ payload }) => {
      if (payload.sessionId !== getSessionId()) {
        useGameStore.getState().setOpponentTyping(payload.isTyping)
      }
    })
    .on('broadcast', { event: 'rematch_requested' }, ({ payload }) => {
      useGameStore.getState().setRematchRequestedBy(payload.sessionId)
    })
    .on('broadcast', { event: 'emote' }, ({ payload }) => {
      const isSelf = payload.sessionId === getSessionId()
      useGameStore.getState().addEmote(payload.emote, isSelf)
    })
    // Guest sending actions to Host
    .on('broadcast', { event: 'action' }, ({ payload }) => {
      if (!isHost) return
      handleGuestAction(payload)
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        onSubscribe()
      }
    })
}

export function joinRoomAsHost(roomId: string, mode: '1v1' | '2v2' = '1v1') {
  isHost = true
  const sessionId = getSessionId()
  
  setupRoomChannel(roomId, () => {
    const room = engineCreateRoom(roomId, true, mode)
    // Add host as player
    room.players[sessionId] = {
      id: sessionId,
      isReady: true,
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
    broadcastRoomState(roomId)
    
    lobbyChannel?.track({ sessionId, status: 'playing' })
    useGameStore.getState().setWaiting(false)
  })
}

export function joinRoomAsGuest(roomId: string) {
  isHost = false
  const sessionId = getSessionId()

  setupRoomChannel(roomId, () => {
    // Tell host we joined
    activeChannel?.send({
      type: 'broadcast',
      event: 'action',
      payload: { type: 'join_room', sessionId }
    })
    
    lobbyChannel?.track({ sessionId, status: 'playing' })
    useGameStore.getState().setWaiting(false)
  })
}

// Called by gameEngine to push state to everyone
export function broadcastRoomState(roomId: string) {
  if (!isHost) return
  const room = getRoom(roomId)
  if (!room) return

  const playersArr = Object.values(room.players)
  
  const state: RoomState = {
    id: room.id,
    mode: room.mode,
    state: room.state,
    round: room.round,
    maxRounds: room.maxRounds,
    timerValue: room.timerValue,
    players: playersArr
  }

  // Update local host UI
  useGameStore.getState().setRoomState(state)

  // Broadcast to guests
  activeChannel?.send({
    type: 'broadcast',
    event: 'roomUpdate',
    payload: state
  })
}

export function emitToRoom(_roomId: string, event: string, payload: any) {
  if (!isHost) return
  activeChannel?.send({ type: 'broadcast', event, payload })
}

// --- ACTIONS (UI calls these) ---

function sendAction(action: any) {
  if (isHost) {
    handleGuestAction(action)
  } else {
    activeChannel?.send({
      type: 'broadcast',
      event: 'action',
      payload: action
    })
  }
}

export function setReady(roomId: string, sessionId: string) {
  sendAction({ type: 'set_ready', roomId, sessionId })
}

export function selectLetter(roomId: string, sessionId: string, letter: string) {
  sendAction({ type: 'select_letter', roomId, sessionId, letter })
}

export function submitWord(roomId: string, sessionId: string, word: string) {
  sendAction({ type: 'submit_word', roomId, sessionId, word })
}

export function sendTypingStatus(_roomId: string, sessionId: string, isTyping: boolean) {
  activeChannel?.send({
    type: 'broadcast',
    event: 'opponent_typing',
    payload: { sessionId, isTyping }
  })
}

export function leaveRoom(roomId: string, sessionId: string) {
  if (activeChannel) {
    activeChannel.unsubscribe()
    activeChannel = null
  }
  if (isHost) {
    emitToRoom(roomId, 'matchEnded', { reason: 'opponent_abandoned' })
    deleteRoom(roomId)
  } else {
    sendAction({ type: 'leave_room', roomId, sessionId })
  }
  useGameStore.getState().resetRoom()
  lobbyChannel?.track({ sessionId: getSessionId(), status: 'idle' })
}

export function sendRematchRequest(roomId: string, sessionId: string) {
  emitToRoom(roomId, 'rematch_requested', { sessionId })
  if (!isHost) {
    activeChannel?.send({
      type: 'broadcast',
      event: 'rematch_requested',
      payload: { sessionId }
    })
  }
}

export function sendEmote(roomId: string, sessionId: string, emote: string) {
  emitToRoom(roomId, 'emote', { sessionId, emote })
  if (!isHost) {
    activeChannel?.send({
      type: 'broadcast',
      event: 'emote',
      payload: { sessionId, emote }
    })
  }
}

// --- HOST ACTION HANDLER ---

function handleGuestAction(payload: any) {
  const room = getRoom(payload.roomId || currentRoomId!)
  if (!room) return
  
  const sessionId = payload.sessionId

  switch (payload.type) {
    case 'join_room': {
      const numPlayers = Object.values(room.players).length
      if (!room.players[sessionId]) {
        room.players[sessionId] = {
          id: sessionId,
          isReady: true, // Auto ready for quick match
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
        handleReconnect(sessionId)
      }
      broadcastRoomState(room.id)
      
      // Auto start if full
      const maxPlayers = room.mode === '2v2' ? 4 : 2
      const playersArr = Object.values(room.players)
      if (playersArr.length >= maxPlayers && playersArr.every(p => p.isReady)) {
        startGameLoop(room.id)
      }
      break
    }
    case 'set_ready': {
      const player = room.players[sessionId]
      if (player) {
        player.isReady = true
        broadcastRoomState(room.id)
        const playersArr = Object.values(room.players)
        const maxPlayers = room.mode === '2v2' ? 4 : 2
        if (playersArr.length === maxPlayers && playersArr.every(p => p.isReady)) {
          startGameLoop(room.id)
        }
      }
      break
    }
    case 'select_letter': {
      if (room.state !== 'LETTER_SELECTION') return
      const player = room.players[sessionId]
      const sanitizedLetter = (payload.letter || '').toString().trim().toUpperCase().charAt(0)
      if (player && player.letter === null && /^[A-Z]$/.test(sanitizedLetter)) {
        player.letter = sanitizedLetter
        checkLetterSelectionComplete(room)
      }
      break
    }
    case 'submit_word': {
      if (room.state !== 'WORD_ENTRY') return
      const player = room.players[sessionId]
      const sanitizedWord = (payload.word || '').toString().trim().toLowerCase().replace(/[^a-z]/g, '')
      if (player && player.word === null && sanitizedWord.length > 0) {
        player.word = sanitizedWord
        player.submittedAt = Date.now()
        checkWordEntryComplete(room)
      }
      break
    }
    case 'leave_room': {
      handleDisconnect(sessionId)
      break
    }
  }
}
