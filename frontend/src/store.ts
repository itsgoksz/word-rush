import { create } from 'zustand'
import type { RoomState } from './types'

interface GameState {
  room: RoomState | null
  isWaiting: boolean
  opponentTyping: boolean
  setRoomState: (room: RoomState) => void
  setWaiting: (waiting: boolean) => void
  setOpponentTyping: (typing: boolean) => void
  resetRoom: () => void
}

export const useGameStore = create<GameState>((set) => ({
  room: null,
  isWaiting: false,
  opponentTyping: false,
  setRoomState: (room) => set({ room, isWaiting: false }),
  setWaiting: (waiting) => set({ isWaiting: waiting }),
  setOpponentTyping: (typing) => set({ opponentTyping: typing }),
  resetRoom: () => set({ room: null, isWaiting: false, opponentTyping: false })
}))
