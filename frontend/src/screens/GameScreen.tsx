
import { useGameStore } from '../store'
import { LetterSelection } from '../components/LetterSelection'
import { WordEntry } from '../components/WordEntry'
import { ResultsPhase } from '../components/ResultsPhase'
import { EmoteWheel } from '../components/ui/EmoteWheel'
import { FloatingEmotes } from '../components/ui/FloatingEmotes'
import { BombPhase } from '../components/BombPhase'

export function GameScreen() {
  const room = useGameStore(state => state.room)

  if (!room) return null

  // We can render a common header like the Scoreboard
  return (
    <div className="flex-1 flex flex-col w-full h-full">
      <div className="p-4 flex justify-between items-center border-b-[3px] border-clay-dark bg-clay">
        <div className="text-sm font-semibold text-cream font-sans">
          Round <span className="text-honey">{room.round}</span> / {room.maxRounds}
        </div>
        <div className={`text-lg font-mono font-bold transition-colors ${room.timerValue <= 3 ? 'text-berry animate-pulse' : 'text-terracotta'}`}>
          {room.timerValue}s
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {room.state === 'LETTER_SELECTION' && <LetterSelection />}
        {room.state === 'LETTER_REVEAL' && (
          <div className="absolute inset-0 flex items-center justify-center text-4xl font-black animate-pulse text-cream font-display">
            Get Ready!
          </div>
        )}
        {room.state === 'WORD_ENTRY' && <WordEntry />}
        {(room.state === 'ROUND_RESULT' || room.state === 'MATCH_RESULT') && <ResultsPhase />}
        
        {room.state === 'BOMB_PHASE' && <BombPhase />}
        {room.state === 'BOMB_EXPLODED' && (
           <div className="absolute inset-0 flex items-center justify-center text-5xl font-black animate-bounce text-berry font-display uppercase tracking-widest drop-shadow-[0_0_15px_rgba(255,107,107,0.8)]">
             BOOM!
           </div>
        )}
      </div>
      
      <FloatingEmotes />
      {room.state !== 'MATCH_RESULT' && <EmoteWheel />}
    </div>
  )
}
