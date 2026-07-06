import { motion } from 'framer-motion'

interface LetterTileProps {
  letter: string
  selected?: boolean
  onClick?: () => void
  disabled?: boolean
  className?: string
  isValid?: boolean | null
}

// Single alphabet tile used in the letter-selection grid and word reveals.
// Selected state lifts the tile slightly, echoing a raised game piece.
export function LetterTile({ letter, selected, onClick, disabled, className = '', isValid = null }: LetterTileProps) {
  let colors = selected
    ? 'bg-honey text-ink border-honey-dark'
    : 'bg-clay-light text-cream border-clay-dark'
  
  if (isValid === true) {
    colors = 'bg-moss text-ink border-[rgba(0,0,0,0.2)]'
  } else if (isValid === false) {
    colors = 'bg-berry text-cream border-[rgba(0,0,0,0.2)]'
  }

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      initial={false}
      animate={{ y: selected ? -2 : 0 }}
      whileTap={disabled ? undefined : { scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={`w-full aspect-square rounded-tile flex items-center justify-center font-display font-semibold text-lg sm:text-2xl border-b-[3px] disabled:opacity-50 disabled:cursor-not-allowed ${colors} ${className}`}
    >
      {letter}
    </motion.button>
  )
}
