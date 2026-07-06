import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store'
import { socket, getSessionId } from '../socket'
import { Check } from 'lucide-react'
import { LetterTile } from './ui/LetterTile'
import { TileButton } from './ui/TileButton'

export function WordEntry() {
  const room = useGameStore(state => state.room)
  const opponentTyping = useGameStore(state => state.opponentTyping)
  const [input, setInput] = useState('')
  
  if (!room) return null

  const selfId = getSessionId()
  const self = room.players.find(p => p.id === selfId)

  
  const team0Picker = room.round % 2 !== 0 ? 0 : 2
  const team1Picker = room.round % 2 !== 0 ? 1 : 3
  const pickers = room.mode === '2v2' ? [team0Picker, team1Picker] : [0, 1]

  const players = Object.values(room.players)
  const p1 = players.find(p => p.joinOrder === pickers[0]) || players.find(p => p.team === 0)
  const p2 = players.find(p => p.joinOrder === pickers[1]) || players.find(p => p.team === 1)
  
  const startIdx = room.round % 2 !== 0 ? 0 : 1
  const endIdx = 1 - startIdx
  
  const orderedPlayers = [p1, p2]
  const startLetter = orderedPlayers[startIdx]?.letter || 'A'
  const endLetter = orderedPlayers[endIdx]?.letter || 'A'

  const isSubmitted = self?.word !== null
  const numOpponentsSubmitted = players.filter(p => p.team !== self?.team && p.word !== null).length
  const totalOpponents = room.mode === '2v2' ? 2 : 1
  const opponentSubmitted = numOpponentsSubmitted === totalOpponents

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (isSubmitted || input.trim().length === 0) return
    socket.emit('submit_word', { roomId: room.id, sessionId: selfId, word: input })
  }

  // Auto-focus input on mount
  useEffect(() => {
    const el = document.getElementById('word-input')
    if (el && !isSubmitted) {
      el.focus()
    }
  }, [isSubmitted])

  return (
    <div className="absolute inset-0 flex flex-col items-center p-8 bg-ink">
      <div className="text-center mb-12 mt-8">
        <p className="text-muted font-medium mb-4 tracking-widest uppercase text-sm font-sans">Your Goal</p>
        <div className="flex items-center justify-center space-x-6">
          <div className="flex flex-col items-center">
            <span className="bg-clay px-4 py-1.5 rounded-full text-sm text-cream font-bold mb-3 font-sans border-2 border-clay-dark shadow-sm">Starts with</span>
            <div className="w-16">
              <LetterTile letter={startLetter} disabled className="pointer-events-none !border-honey-dark !text-honey !bg-transparent" />
            </div>
          </div>
          <div className="text-muted font-bold text-xl font-display">...</div>
          <div className="flex flex-col items-center">
            <span className="bg-clay px-4 py-1.5 rounded-full text-sm text-cream font-bold mb-3 font-sans border-2 border-clay-dark shadow-sm">Ends with</span>
            <div className="w-16">
              <LetterTile letter={endLetter} disabled className="pointer-events-none !border-terracotta !text-terracotta !bg-transparent" />
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col items-center relative">
        <input
          id="word-input"
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            socket.emit('typing_status', { roomId: room.id, sessionId: selfId, isTyping: e.target.value.length > 0 })
          }}
          disabled={isSubmitted}
          className="w-full bg-clay-light border-[3px] border-clay-dark focus:border-honey outline-none rounded-tile py-4 px-6 text-center text-2xl font-bold tracking-widest uppercase transition-colors disabled:opacity-50 text-cream font-sans placeholder-muted/50"
          placeholder="TYPE WORD..."
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
        />
        <div className="absolute -bottom-8 flex justify-between w-full px-2">
          <span className="text-xs font-mono text-muted">{input.length} characters</span>
          <AnimatePresence>
            {opponentSubmitted ? (
              <motion.div 
                key="submitted"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center text-moss text-xs font-bold space-x-1"
              >
                <Check size={14} />
                <span>{room.mode === '2v2' ? 'Opponents have submitted' : 'Opponent has submitted'}</span>
              </motion.div>
            ) : opponentTyping ? (
              <motion.div 
                key="typing"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center text-muted text-xs font-bold space-x-1 font-sans"
              >
                <span className="animate-pulse">{room.mode === '2v2' ? 'Opponent is typing...' : 'Opponent is typing...'}</span>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="mt-12 w-full">
          <TileButton
            type="submit"
            disabled={isSubmitted || input.trim().length === 0}
            variant="primary"
          >
            {isSubmitted ? 'Waiting for opponent...' : 'Submit Word'}
          </TileButton>
        </div>
      </form>
    </div>
  )
}
