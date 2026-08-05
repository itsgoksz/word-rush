import { create } from 'zustand'
import type { RoomState, Player, Profile } from './types'
import { getSessionId } from './realtime'
import type { User } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'

interface GameState {
  user: User | null
  profile: Profile | null
  room: RoomState | null
  isWaiting: boolean
  opponentTyping: boolean
  rematchRequestedBy: string | null
  activeEmotes: { id: string, emote: string, x: number }[]
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setRoomState: (room: RoomState) => void
  setWaiting: (waiting: boolean) => void
  setOpponentTyping: (typing: boolean) => void
  setRematchRequestedBy: (id: string | null) => void
  addEmote: (emote: string, isSelf: boolean) => void
  removeEmote: (id: string) => void
  resetRoom: () => void
  fetchProfile: () => Promise<void>
}

export const useGameStore = create<GameState>((set, get) => ({
  user: null,
  profile: null,
  room: null,
  isWaiting: false,
  opponentTyping: false,
  rematchRequestedBy: null,
  activeEmotes: [],
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setRoomState: (room) => {
    // Mask opponent data based on game state
    const mySessionId = getSessionId()
    const maskedPlayers = room.players.map(p => {
      const isSelf = p.id === mySessionId
      return {
        ...p,
        letter: (room.state === 'LETTER_SELECTION' && !isSelf) ? (p.letter ? '*' : null) : p.letter,
        word: (room.state === 'WORD_ENTRY' && !isSelf) ? (p.word ? '*' : null) : p.word,
      } as Player
    })
    
    const maskedRoom = { ...room, players: maskedPlayers }
    set({ room: maskedRoom, isWaiting: false })
  },
  setWaiting: (waiting) => set({ isWaiting: waiting }),
  setOpponentTyping: (typing) => set({ opponentTyping: typing }),
  setRematchRequestedBy: (id) => set({ rematchRequestedBy: id }),
  addEmote: (emote, isSelf) => set(state => ({
    activeEmotes: [...state.activeEmotes, { 
       id: Math.random().toString(), 
       emote, 
       x: isSelf ? window.innerWidth * 0.2 : window.innerWidth * 0.8 
    }]
  })),
  removeEmote: (id) => set(state => ({
    activeEmotes: state.activeEmotes.filter(e => e.id !== id)
  })),
  resetRoom: () => set({ room: null, isWaiting: false, opponentTyping: false, rematchRequestedBy: null, activeEmotes: [] }),
  fetchProfile: async () => {
    const user = get().user
    if (!user) return
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (data) set({ profile: data as Profile })
  }
}))
