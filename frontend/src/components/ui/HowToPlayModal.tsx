import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { TileButton } from './TileButton'
import { LetterTile } from './LetterTile'

interface HowToPlayModalProps {
  isOpen: boolean
  onClose: () => void
}

export function HowToPlayModal({ isOpen, onClose }: HowToPlayModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink/80 backdrop-blur-sm z-40"
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-clay-light border-[4px] border-clay-dark rounded-[24px] w-full max-w-sm overflow-hidden flex flex-col pointer-events-auto shadow-2xl"
            >
              <div className="flex justify-between items-center p-6 border-b border-clay-dark/50 bg-clay">
                <h3 className="text-2xl font-display font-black text-honey">How to Play</h3>
                <button
                  onClick={onClose}
                  className="p-2 bg-clay-dark text-muted hover:text-cream rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
                <div className="space-y-2">
                  <h4 className="font-bold text-cream font-sans flex items-center space-x-2">
                    <span className="bg-terracotta text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                    <span>Pick Your Letter</span>
                  </h4>
                  <p className="text-muted text-sm leading-relaxed">
                    At the start of the match, both you and your opponent pick a letter from the alphabet grid.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-cream font-sans flex items-center space-x-2">
                    <span className="bg-terracotta text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                    <span>Find the Word</span>
                  </h4>
                  <p className="text-muted text-sm leading-relaxed mb-3">
                    You have 60 seconds to type a valid word. In the first round, the word must <strong className="text-cream">start</strong> with the first player's letter and <strong className="text-cream">end</strong> with the second player's letter. Then, the next round will swap, starting with the second player's letter and ending with the first player's letter!
                  </p>
                  <div className="flex items-center justify-center space-x-2 py-3 bg-ink rounded-xl border border-clay-dark">
                    <div className="w-10"><LetterTile letter="F" disabled /></div>
                    <span className="text-muted font-bold font-display">...</span>
                    <div className="w-10"><LetterTile letter="X" disabled /></div>
                  </div>
                  <p className="text-center text-xs font-mono text-moss mt-2">Example: "FOX"</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-cream font-sans flex items-center space-x-2">
                    <span className="bg-terracotta text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">3</span>
                    <span>Score Points</span>
                  </h4>
                  <p className="text-muted text-sm leading-relaxed">
                    Longer words and faster typing score more points! The first player to submit a valid word gets a <strong className="text-honey">+5 point speed bonus</strong>. Build a streak for multiplier bonuses!
                  </p>
                </div>
              </div>

              <div className="p-6 pt-2 bg-clay-light border-t border-clay-dark/50">
                <TileButton variant="primary" onClick={onClose}>
                  Got it! Let's play
                </TileButton>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
