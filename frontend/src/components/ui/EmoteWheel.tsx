import { useState } from 'react'
import { Smile } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { sendEmote, getSessionId } from '../../realtime'
import { useGameStore } from '../../store'

const EMOTES = ['🥵', '🤯', '🥱', '🤬', '😎', '💀']

export function EmoteWheel() {
  const [isOpen, setIsOpen] = useState(false)
  const room = useGameStore(state => state.room)

  if (!room) return null

  const handleEmote = (emote: string) => {
    sendEmote(room.id, getSessionId(), emote)
    setIsOpen(false)
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 md:absolute md:bottom-4 md:right-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-16 right-0 bg-clay-light border-[3px] border-clay-dark p-2 rounded-2xl flex flex-wrap gap-2 w-48 shadow-xl"
          >
            {EMOTES.map(emote => (
              <button
                key={emote}
                onClick={() => handleEmote(emote)}
                className="w-12 h-12 text-3xl hover:bg-clay-dark rounded-xl transition-colors flex items-center justify-center"
              >
                {emote}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-honey text-ink rounded-full flex items-center justify-center shadow-[0_4px_0_0_#92400e] hover:translate-y-1 hover:shadow-[0_0px_0_0_#92400e] transition-all"
      >
        <Smile size={28} strokeWidth={3} />
      </button>
    </div>
  )
}
