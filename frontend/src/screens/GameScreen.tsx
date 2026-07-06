
import { useGameStore } from '../store'
import { LetterSelection } from '../components/LetterSelection'
import { WordEntry } from '../components/WordEntry'
import { ResultsPhase } from '../components/ResultsPhase'

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
          <div className="absolute inset-0 flex items-center justify-center text-4xl font-black animate-pulse">
            Get Ready!
          </div>
        )}
        {room.state === 'WORD_ENTRY' && <WordEntry />}
        {(room.state === 'ROUND_RESULT' || room.state === 'MATCH_RESULT') && <ResultsPhase />}
      </div>
    </div>
  )
}
