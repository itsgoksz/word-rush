import { useState } from 'react'
import { motion } from 'framer-motion'
import { Zap, Users } from 'lucide-react'
import { socket, getSessionId } from '../socket'
import { useGameStore } from '../store'
import { TileButton } from '../components/ui/TileButton'
import { LetterTile } from '../components/ui/LetterTile'
import { HowToPlayModal } from '../components/ui/HowToPlayModal'

export function HomeScreen() {

  const isWaiting = useGameStore(state => state.isWaiting)
  const [showHowToPlay, setShowHowToPlay] = useState(false)

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
      {/* Ambient Background Tiles */}
      <div className="absolute inset-0 pointer-events-none opacity-20 flex justify-center items-center z-0">
        <motion.div animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="absolute -left-4 top-12 w-20">
          <LetterTile letter="W" disabled />
        </motion.div>
        <motion.div animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute right-4 top-20 w-16">
          <LetterTile letter="R" disabled />
        </motion.div>
        <motion.div animate={{ y: [0, -25, 0], rotate: [0, 15, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="absolute left-8 bottom-32 w-16">
          <LetterTile letter="U" disabled />
        </motion.div>
        <motion.div animate={{ y: [0, 15, 0], rotate: [0, -5, 0] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} className="absolute -right-2 bottom-24 w-24">
          <LetterTile letter="S" disabled />
        </motion.div>
      </div>

      <div className="mb-12 relative z-10">
        <h1 className="text-5xl font-black mb-2 tracking-tighter text-terracotta font-display">
          WordRush
        </h1>
        <p className="text-muted font-medium">Fast-paced 1v1 Word Game</p>
      </div>

      <div className="w-full space-y-4 relative z-10">
        <TileButton
          variant="primary"
          onClick={() => socket.emit('quick_match', { sessionId: getSessionId(), mode: '1v1' })}
          disabled={isWaiting}
          className="flex items-center justify-center space-x-2"
        >
          {isWaiting ? (
            <span className="animate-pulse">Finding Opponent...</span>
          ) : (
            <>
              <Zap size={24} />
              <span>1v1 Quick Match</span>
            </>
          )}
        </TileButton>

        <TileButton
          variant="primary"
          onClick={() => socket.emit('quick_match', { sessionId: getSessionId(), mode: '2v2' })}
          disabled={isWaiting}
          className="flex items-center justify-center space-x-2 bg-honey text-ink border-none hover:bg-honey/90"
        >
          {isWaiting ? (
            <span className="animate-pulse">Finding Opponents...</span>
          ) : (
            <>
              <Users size={24} />
              <span>2v2 Quick Match</span>
            </>
          )}
        </TileButton>

        <div className="flex gap-2 w-full">
          <TileButton
            variant="secondary"
            onClick={() => socket.emit('create_room', { sessionId: getSessionId(), mode: '1v1' })}
            disabled={isWaiting}
            className="flex-1 flex items-center justify-center text-xs sm:text-sm"
          >
            Create 1v1 Room
          </TileButton>
          <TileButton
            variant="secondary"
            onClick={() => socket.emit('create_room', { sessionId: getSessionId(), mode: '2v2' })}
            disabled={isWaiting}
            className="flex-1 flex items-center justify-center text-xs sm:text-sm"
          >
            Create 2v2 Room
          </TileButton>
        </div>
      </div>

      <div className="w-full mt-6 flex space-x-2 relative z-10">
        <input 
          type="text" 
          placeholder="Room Code" 
          maxLength={6}
          className="flex-1 bg-clay-light border-[3px] border-clay-dark rounded-tile px-4 py-3 font-mono tracking-widest text-center uppercase outline-none focus:border-honey transition-colors text-cream placeholder-muted"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const code = e.currentTarget.value.trim().toUpperCase()
              if (code.length === 6) {
                socket.emit('join_room', { roomId: code, sessionId: getSessionId() })
              }
            }
          }}
        />
        <div className="w-1/3">
          <TileButton 
            variant="primary"
            onClick={(e: any) => {
              const wrapper = (e.currentTarget as HTMLButtonElement).parentElement;
              const input = wrapper?.previousElementSibling as HTMLInputElement;
              if (!input) return;
              const code = input.value.trim().toUpperCase()
              if (code.length === 6) {
                socket.emit('join_room', { roomId: code, sessionId: getSessionId() })
              }
            }}
          >
            Join
          </TileButton>
        </div>
      </div>
      
      <button 
        onClick={() => setShowHowToPlay(true)}
        className="text-muted font-sans font-bold hover:text-cream transition-colors mt-8 uppercase tracking-wider text-sm relative z-10"
      >
        How to Play
      </button>

      <HowToPlayModal 
        isOpen={showHowToPlay} 
        onClose={() => setShowHowToPlay(false)} 
      />
    </div>
  )
}
