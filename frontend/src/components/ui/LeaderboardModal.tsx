import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trophy, Medal } from 'lucide-react'
import { supabase } from '../../supabaseClient'
import { TileButton } from './TileButton'

interface LeaderboardEntry {
  id: string
  username: string
  elo: number
}

interface LeaderboardModalProps {
  isOpen: boolean
  onClose: () => void
  currentUserId?: string
}

export function LeaderboardModal({ isOpen, onClose, currentUserId }: LeaderboardModalProps) {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      supabase
        .from('profiles')
        .select('id, username, elo')
        .order('elo', { ascending: false })
        .limit(50)
        .then(({ data, error }) => {
          if (!error && data) {
            setLeaders(data)
          }
          setLoading(false)
        })
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-clay max-w-md w-full rounded-[24px] border-[4px] border-clay-dark overflow-hidden shadow-2xl flex flex-col h-[80vh] md:h-[600px]"
          >
            <div className="bg-clay-dark p-6 flex justify-between items-center shrink-0">
              <div className="flex items-center space-x-3 text-honey">
                <Trophy size={28} />
                <h2 className="text-2xl font-black font-display uppercase tracking-widest">Global Top 50</h2>
              </div>
              <button 
                onClick={onClose}
                className="text-muted hover:text-cream transition-colors p-2 -mr-2"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="flex justify-center items-center h-full text-honey font-bold animate-pulse">
                  LOADING...
                </div>
              ) : leaders.length === 0 ? (
                <div className="text-center text-muted font-bold mt-8">
                  No players found.
                </div>
              ) : (
                leaders.map((player, index) => {
                  const isCurrentUser = player.id === currentUserId
                  return (
                    <div 
                      key={player.id} 
                      className={`flex items-center justify-between p-4 rounded-xl border-[3px] transition-colors ${
                        isCurrentUser 
                          ? 'bg-honey/10 border-honey' 
                          : 'bg-clay-light border-clay-dark'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? 'bg-yellow-400 text-yellow-900 shadow-[0_0_10px_rgba(250,204,21,0.5)]' :
                          index === 1 ? 'bg-slate-300 text-slate-800' :
                          index === 2 ? 'bg-amber-600 text-amber-100' :
                          'bg-clay border border-clay-dark text-muted'
                        }`}>
                          {index < 3 ? <Medal size={16} /> : index + 1}
                        </div>
                        <span className={`font-bold font-sans tracking-widest uppercase ${isCurrentUser ? 'text-honey' : 'text-cream'}`}>
                          {player.username}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-black font-display text-xl text-terracotta">
                          {player.elo} <span className="text-sm">IP</span>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
            <div className="p-4 bg-clay-dark shrink-0">
               <TileButton variant="secondary" onClick={onClose} className="w-full">
                 Close
               </TileButton>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
