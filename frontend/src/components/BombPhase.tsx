import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store'
import { getSessionId, submitBombWord, sendTypingStatus } from '../realtime'
import { LetterTile } from './ui/LetterTile'
import { audioEngine } from '../audio'
import confetti from 'canvas-confetti'

export function BombPhase() {
  const room = useGameStore(state => state.room)
  const opponentTyping = useGameStore(state => state.opponentTyping)
  const [input, setInput] = useState('')
  const [shake, setShake] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  
  if (!room || !room.bomb) return null

  const selfId = getSessionId()
  const self = room.players.find(p => p.id === selfId)
  
  const myTeam = self?.team ?? -1
  const isMyTurn = myTeam === room.bomb.holderTeam
  
  // Auto-focus if it's my turn
  useEffect(() => {
    if (isMyTurn && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isMyTurn])

  // Clear input when turn changes
  useEffect(() => {
    setInput('')
  }, [room.bomb.holderTeam])

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!isMyTurn || input.trim().length === 0) return
    
    audioEngine.init()
    if (input.length >= 7) {
      audioEngine.playExplosion()
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } })
      setShake(true)
      setTimeout(() => setShake(false), 500)
    } else {
      audioEngine.playSubmit()
    }

    submitBombWord(room.id, selfId, input)
  }

  // Calculate shake intensity based on multiplier
  const intensity = room.bomb.tickMultiplier
  const shakeAnim = intensity > 1 
    ? { x: [-intensity*2, intensity*2, -intensity*2, intensity*2, 0] } 
    : {}

  return (
    <motion.div 
      animate={shake ? { x: [-10, 10, -15, 15, -10, 10, 0] } : {}}
      transition={{ duration: 0.4 }}
      className={`absolute inset-0 flex flex-col items-center p-8 transition-colors duration-500 ${isMyTurn ? 'bg-berry/20' : 'bg-ink'}`}
    >
      <div className="absolute top-4 w-full flex justify-between px-8 text-sm font-bold font-sans">
        <div className={`px-4 py-2 rounded-lg ${myTeam === 0 ? 'bg-honey text-ink' : 'bg-clay text-cream'}`}>
          TEAM 1
        </div>
        <div className={`px-4 py-2 rounded-lg ${myTeam === 1 ? 'bg-honey text-ink' : 'bg-clay text-cream'}`}>
          TEAM 2
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm">
        
        {/* Giant Bomb Timer */}
        <motion.div 
          animate={shakeAnim}
          transition={{ repeat: Infinity, duration: 0.2 }}
          className="relative mb-12 flex flex-col items-center"
        >
          <div className="text-8xl font-black font-display text-berry drop-shadow-[0_0_20px_rgba(255,107,107,0.6)]">
            {room.timerValue}
          </div>
          <div className="text-terracotta font-bold text-xl uppercase tracking-widest mt-2">
            Tick x{room.bomb.tickMultiplier}
          </div>
          <div className="mt-4 text-center">
            <span className="text-muted text-sm font-bold">PREVIOUS WORD</span>
            <div className="text-2xl font-mono font-bold text-cream">
              {room.bomb.previousWord ? room.bomb.previousWord.toUpperCase() : '---'}
            </div>
          </div>
        </motion.div>

        {/* Current Requirement */}
        <div className="flex flex-col items-center mb-8">
          <span className="bg-clay px-4 py-1.5 rounded-full text-sm text-cream font-bold mb-3 font-sans border-2 border-clay-dark shadow-sm">
            Must start with
          </span>
          <div className="w-20">
            <LetterTile letter={room.bomb.currentLetter} disabled className="pointer-events-none !border-honey-dark !text-honey !bg-transparent" />
          </div>
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col items-center relative">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => {
              audioEngine.init()
              if (e.target.value.length > input.length) audioEngine.playClick()
              setInput(e.target.value)
              sendTypingStatus(room.id, selfId, e.target.value.length > 0)
            }}
            disabled={!isMyTurn}
            className={`w-full border-[3px] outline-none rounded-tile py-4 px-6 text-center text-2xl font-bold tracking-widest uppercase transition-colors font-sans ${isMyTurn ? 'bg-clay-light border-honey text-cream placeholder-muted' : 'bg-clay border-clay-dark text-muted placeholder-muted/30 opacity-50'}`}
            placeholder={isMyTurn ? "TYPE WORD..." : "DEFENDING..."}
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />
          
          <div className="absolute -bottom-8 flex justify-center w-full px-2">
            <AnimatePresence>
              {opponentTyping && !isMyTurn ? (
                <motion.div 
                  key="typing"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center text-berry text-xs font-bold space-x-1 font-sans"
                >
                  <span className="animate-pulse">Enemy is typing...</span>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </form>
      </div>
    </motion.div>
  )
}
