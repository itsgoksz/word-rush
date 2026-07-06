import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface TileButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary'
  onClick?: () => void
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit' | 'reset'
}

// Primary/secondary action button with a two-tone "pressed tile" edge.
// Compresses on tap instead of glowing — keeps the flat, tactile feel.
export function TileButton({ children, variant = 'primary', onClick, disabled, className = '', type = 'button' }: TileButtonProps) {
  const isPrimary = variant === 'primary'
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { y: 2 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      className={`w-full rounded-tile px-4 py-3 font-sans font-bold text-base border-b-4 disabled:opacity-50 disabled:cursor-not-allowed ${
        isPrimary
          ? 'bg-honey text-ink border-honey-dark'
          : 'bg-clay-light text-cream border-clay-dark hover:bg-clay transition-colors'
      } ${className}`}
    >
      {children}
    </motion.button>
  )
}
