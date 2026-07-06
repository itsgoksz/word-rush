import React from 'react'
import { motion } from 'framer-motion'
import { useGameStore } from '../store'
import { socket, getSessionId } from '../socket'
import { LetterTile } from './ui/LetterTile'

const QWERTY = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
]

export function LetterSelection() {
  const room = useGameStore(state => state.room)
  if (!room) return null

  const selfId = getSessionId()
  const self = room.players.find(p => p.id === selfId)
  
  const team0Picker = room.round % 2 !== 0 ? 0 : 2
  const team1Picker = room.round % 2 !== 0 ? 1 : 3
  const pickers = room.mode === '2v2' ? [team0Picker, team1Picker] : [0, 1]
  const isPicker = self ? pickers.includes(self.joinOrder) : false

  const opponent = room.players.find(p => p.id !== selfId && (!self || p.team !== self.team) && pickers.includes(p.joinOrder))
  const activeTeammate = room.players.find(p => p.id !== selfId && self && p.team === self.team && pickers.includes(p.joinOrder))

  const handleSelect = (letter: string) => {
    if (!isPicker || self?.letter) return // already selected or not picker
    socket.emit('select_letter', { roomId: room.id, sessionId: selfId, letter })
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-ink">
      <h2 className="text-2xl font-sans font-bold text-cream mb-2">Choose a Letter</h2>
      
      <div className="flex justify-between w-full max-w-sm mb-6 px-4">
        <div className="flex flex-col items-center">
          <span className="text-xs text-muted uppercase tracking-wider font-sans mb-2">
            {isPicker ? "You" : "Teammate"}
          </span>
          <div className="w-14">
            <LetterTile 
              letter={isPicker ? (self?.letter || '?') : (activeTeammate?.letter || '?')} 
              selected={isPicker ? !!self?.letter : !!activeTeammate?.letter} 
              disabled={true} 
            />
          </div>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs text-muted uppercase tracking-wider font-sans mb-2">Opponent</span>
          <div className="w-14 h-14 flex items-center justify-center relative">
             {opponent?.letter ? (
               <motion.div 
                 initial={{ scale: 0.8, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 className="absolute inset-0 bg-moss/20 border-2 border-moss rounded-tile flex items-center justify-center"
               >
                 <span className="text-moss font-black text-2xl">✓</span>
               </motion.div>
             ) : (
               <div className="w-full h-full rounded-tile border-2 border-clay-light border-dashed flex items-center justify-center">
                 <span className="text-muted font-bold">...</span>
               </div>
             )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:gap-3 w-full max-w-[500px] px-1 mt-8 mb-4">
        {isPicker ? QWERTY.map((row, rowIdx) => (
          <div key={rowIdx} className="flex justify-center gap-1.5 sm:gap-2">
            {row.map((char) => (
              <div key={char} className="w-[8.5vw] sm:w-12 max-w-[48px]">
                <LetterTile
                  letter={char}
                  selected={self?.letter === char}
                  onClick={() => handleSelect(char)}
                  disabled={!!self?.letter}
                  className="!aspect-[3/4] sm:!aspect-[4/5] !text-xl sm:!text-2xl !rounded-xl"
                />
              </div>
            ))}
          </div>
        )) : (
          <div className="flex items-center justify-center h-48">
             <p className="text-muted text-lg animate-pulse">Waiting for teammate to pick...</p>
          </div>
        )}
      </div>
    </div>
  )
}
