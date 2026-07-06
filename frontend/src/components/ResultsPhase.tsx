import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store'
import { getSessionId, socket } from '../socket'
import { LetterTile } from './ui/LetterTile'
import { TileButton } from './ui/TileButton'

export function ResultsPhase() {
  const room = useGameStore(state => state.room)
  const navigate = useNavigate()
  const [selfRevealed, setSelfRevealed] = useState(0)
  const [oppRevealed, setOppRevealed] = useState(0)
  const [revealPhase, setRevealPhase] = useState<'self' | 'pause' | 'opponent' | 'done'>('self')

  if (!room) return null

  const selfId = getSessionId()
  const self = room.players.find(p => p.id === selfId)
  
  const players = Object.values(room.players)
  const myTeam = players.filter(p => p.team === self?.team)
  const oppTeam = players.filter(p => p.team !== self?.team)

  const myTeamMaxLen = Math.max(0, ...myTeam.map(p => (p.word || '').length))
  const oppTeamMaxLen = Math.max(0, ...oppTeam.map(p => (p.word || '').length))

  const myTeamScore = myTeam.reduce((acc, p) => acc + p.score, 0)
  const oppTeamScore = oppTeam.reduce((acc, p) => acc + p.score, 0)

  useEffect(() => {
    if (revealPhase === 'self') {
      if (selfRevealed < myTeamMaxLen) {
        const timer = setTimeout(() => setSelfRevealed(p => p + 1), 300)
        return () => clearTimeout(timer)
      } else {
        setRevealPhase('pause')
      }
    } else if (revealPhase === 'pause') {
      const timer = setTimeout(() => setRevealPhase('opponent'), 500)
      return () => clearTimeout(timer)
    } else if (revealPhase === 'opponent') {
      if (oppRevealed < oppTeamMaxLen) {
        const timer = setTimeout(() => setOppRevealed(p => p + 1), 300)
        return () => clearTimeout(timer)
      } else {
        setRevealPhase('done')
      }
    }
  }, [revealPhase, selfRevealed, oppRevealed, myTeamMaxLen, oppTeamMaxLen])

  const renderWord = (word: string | null, isValid: boolean | null, points: number, revealedCount: number) => {
    if (!word) {
      return <div className="text-berry font-bold italic mt-4 text-sm font-sans">NO SUBMISSION</div>
    }

    const chars = word.toUpperCase().split('')
    const isFullyRevealed = revealedCount >= chars.length

    return (
      <div className="flex flex-col items-center">
        <div className="flex flex-wrap justify-center gap-1 mt-4 max-w-full">
          {chars.map((char, idx) => {
            const isRevealed = idx < revealedCount
            
            return (
              <motion.div
                key={idx}
                initial={false}
                animate={{
                  rotateX: isRevealed ? [0, 90, 0] : 0,
                  transition: { duration: 0.3 }
                }}
                className="w-8 sm:w-10"
              >
                <LetterTile
                  letter={isRevealed ? char : ''}
                  isValid={isFullyRevealed && isRevealed ? isValid : null}
                  disabled
                  className="!text-sm sm:!text-base"
                />
              </motion.div>
            )
          })}
        </div>
        
        {isFullyRevealed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 font-bold font-sans ${isValid ? 'text-moss' : 'text-berry'}`}
          >
            {isValid ? `+${points} PTS` : 'INVALID'}
          </motion.div>
        )}
      </div>
    )
  }

  const handleReturnHome = () => {
    socket.emit('leave_room', { roomId: room.id, sessionId: selfId })
    useGameStore.getState().resetRoom()
    navigate('/')
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-ink p-4">
      <h2 className="text-3xl font-display font-black mb-8 text-center text-cream">
        {room.state === 'MATCH_RESULT' ? 'Match Final' : 'Round Results'}
      </h2>

      <div className="w-full flex justify-between items-start px-4 mb-12">
        <div className="flex flex-col items-center w-1/2">
          <span className="text-sm text-muted font-bold mb-1 tracking-widest uppercase font-sans">
            {room.mode === '2v2' ? 'Your Team' : 'You'}
          </span>
          <span className="text-4xl font-display font-black text-honey">{myTeamScore}</span>
          <div className="mt-4 flex flex-col space-y-6 w-full">
            {myTeam.map(p => (
              <div key={p.id}>
                {room.mode === '2v2' && (
                  <div className="text-[10px] text-muted text-center tracking-widest mb-1 font-bold">
                    {p.id === selfId ? 'YOU' : 'TEAMMATE'}
                  </div>
                )}
                {renderWord(p.word || null, p.wordValid ?? null, p.wordPoints || 0, selfRevealed)}
                {p.streak && p.streak >= 3 ? (
                  <div className="text-terracotta text-xs font-bold mt-1 flex justify-center font-sans">
                    🔥 {p.streak} STREAK
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-center w-1/2 border-l-2 border-clay-light pl-4">
          <span className="text-sm text-muted font-bold mb-1 tracking-widest uppercase font-sans">
            {room.mode === '2v2' ? 'Opponents' : 'Opponent'}
          </span>
          <span className="text-4xl font-display font-black text-cream">{oppTeamScore}</span>
          <div className="mt-4 flex flex-col space-y-6 w-full">
            {oppTeam.map((p, idx) => (
              <div key={p.id}>
                {room.mode === '2v2' && (
                  <div className="text-[10px] text-muted text-center tracking-widest mb-1 font-bold">
                    OPPONENT {idx + 1}
                  </div>
                )}
                {renderWord(p.word || null, p.wordValid ?? null, p.wordPoints || 0, oppRevealed)}
                {p.streak && p.streak >= 3 ? (
                  <div className="text-terracotta text-xs font-bold mt-1 flex justify-center font-sans">
                    🔥 {p.streak} STREAK
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>

      {room.state === 'MATCH_RESULT' && (
        <div className="mt-8 flex flex-col space-y-4 w-full max-w-xs">
           <div className="text-center mb-4">
             <div className="text-2xl font-bold font-display text-cream">
               {myTeamScore > oppTeamScore ? '🏆 YOU WIN!' : 
                myTeamScore < oppTeamScore ? '💀 YOU LOSE' : '🤝 DRAW'}
             </div>
           </div>
           
           <TileButton 
             variant="primary"
             onClick={() => {
                socket.emit('quick_match', { sessionId: selfId })
                navigate('/')
             }}
           >
             Play Again (New Match)
           </TileButton>
           <TileButton 
             variant="secondary"
             onClick={handleReturnHome}
           >
             Return Home
           </TileButton>
        </div>
      )}
      
      {room.state === 'ROUND_RESULT' && (
        <div className="absolute bottom-8 flex flex-col items-center space-y-4">
          <div className="flex space-x-2">
            {Array.from({ length: room.maxRounds }).map((_, i) => (
              <div 
                key={i} 
                className={`w-2 h-2 rounded-full ${i < room.round ? 'bg-honey' : 'bg-clay-light'}`} 
              />
            ))}
          </div>
          <div className="text-muted animate-pulse text-sm font-sans">
            Next round starting...
          </div>
        </div>
      )}
    </div>
  )
}
