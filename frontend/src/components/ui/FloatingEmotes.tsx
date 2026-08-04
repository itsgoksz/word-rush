import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../../store'

export function FloatingEmotes() {
  const activeEmotes = useGameStore(state => state.activeEmotes)
  const removeEmote = useGameStore(state => state.removeEmote)

  useEffect(() => {
    activeEmotes.forEach(emote => {
      const timer = setTimeout(() => {
        removeEmote(emote.id)
      }, 2000)
      return () => clearTimeout(timer)
    })
  }, [activeEmotes, removeEmote])

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden flex justify-center items-center">
      <AnimatePresence>
        {activeEmotes.map(emote => (
          <motion.div
            key={emote.id}
            initial={{ opacity: 0, y: 400, x: (emote.x - window.innerWidth / 2), scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 3 }}
            exit={{ opacity: 0, y: -200 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute text-6xl drop-shadow-2xl"
          >
            {emote.emote}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
