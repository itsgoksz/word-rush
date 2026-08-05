import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Info } from 'lucide-react'
import { quickMatch, joinRoomAsGuest, joinRoomAsHost } from '../realtime'
import { generateRoomId } from '../gameEngine'
import { useGameStore } from '../store'
import { TileButton } from '../components/ui/TileButton'
import { LetterTile } from '../components/ui/LetterTile'
import { HowToPlayModal } from '../components/ui/HowToPlayModal'
import { LeaderboardModal } from '../components/ui/LeaderboardModal'
import { Trophy } from 'lucide-react'

export function HomeScreen() {

  const isWaiting = useGameStore(state => state.isWaiting)
  const profile = useGameStore(state => state.profile)
  const [showHowToPlay, setShowHowToPlay] = useState(false)
  const [showIpModal, setShowIpModal] = useState(false)
  const [showLeaderboard, setShowLeaderboard] = useState(false)

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

      <div className="mb-8 relative z-10">
        <h1 className="text-5xl font-black mb-2 tracking-tighter text-terracotta font-display">
          WordRush
        </h1>
        <p className="text-muted font-medium mb-4">Fast-paced 1v1 Word Game</p>
        
        {profile && (
          <div className="inline-flex flex-col items-center bg-clay-light px-6 py-2 rounded-full border-2 border-clay-dark">
            <span className="text-honey font-bold font-sans text-xs uppercase tracking-widest">{profile.username}</span>
            <div className="flex items-center justify-center">
              <span className="text-cream font-black font-display text-2xl">{profile.elo} IP</span>
              <button 
                onClick={() => setShowIpModal(true)} 
                className="text-muted hover:text-honey transition-colors ml-2 mt-1"
                aria-label="What is IP?"
              >
                <Info size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="w-full space-y-4 relative z-10">
        <TileButton
          variant="primary"
          onClick={() => quickMatch('1v1')}
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

        <div className="flex gap-2 w-full">
          <TileButton
            variant="secondary"
            onClick={() => joinRoomAsHost(generateRoomId(), '1v1')}
            disabled={isWaiting}
            className="flex-1 flex items-center justify-center text-xs sm:text-sm"
          >
            Create 1v1 Room
          </TileButton>
          <TileButton
            variant="secondary"
            onClick={() => joinRoomAsHost(generateRoomId(), '2v2')}
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
                joinRoomAsGuest(code)
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
                joinRoomAsGuest(code)
              }
            }}
          >
            Join
          </TileButton>
        </div>
      </div>
      
      <div className="flex space-x-6 mt-8 relative z-10">
        <button 
          onClick={() => setShowLeaderboard(true)}
          className="text-honey font-sans font-bold hover:text-cream transition-colors uppercase tracking-wider text-sm flex items-center space-x-1"
        >
          <Trophy size={16} />
          <span>Leaderboard</span>
        </button>
        <button 
          onClick={() => setShowHowToPlay(true)}
          className="text-muted font-sans font-bold hover:text-cream transition-colors uppercase tracking-wider text-sm"
        >
          How to Play
        </button>
      </div>

      <HowToPlayModal 
        isOpen={showHowToPlay} 
        onClose={() => setShowHowToPlay(false)} 
      />
      <LeaderboardModal 
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        currentUserId={profile?.id}
      />

      <AnimatePresence>
        {showIpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-clay max-w-sm w-full rounded-2xl border-4 border-clay-dark p-6 text-center shadow-2xl relative z-50"
            >
              <h2 className="text-2xl font-black font-display text-honey mb-4 uppercase">Intelligence Points</h2>
              <p className="text-cream font-sans text-sm mb-6 leading-relaxed">
                IP represents your skill rating. Win matches to earn IP, but be careful—losing against lower-rated players will cost you heavily!
              </p>
              <TileButton variant="primary" onClick={() => setShowIpModal(false)}>
                Got it
              </TileButton>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
