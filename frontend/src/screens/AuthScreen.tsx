import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { TileButton } from '../components/ui/TileButton'
import { motion, AnimatePresence } from 'framer-motion'

export function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const cleanUsername = username.trim().toLowerCase()
    if (!cleanUsername || !password) {
      setError("Username and password required")
      setLoading(false)
      return
    }

    if (import.meta.env.VITE_SUPABASE_URL === undefined || import.meta.env.VITE_SUPABASE_URL === '') {
      setError("Supabase environment variables are missing in Vercel.")
      setLoading(false)
      return
    }

    const email = `${cleanUsername}@wordrush.app`

    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (signInError) throw signInError
      } else {
        const { error: signUpError, data } = await supabase.auth.signUp({
          email,
          password
        })
        if (signUpError) throw signUpError
        
        // If successful, create profile
        if (data.user) {
          const { error: profileError } = await supabase.from('profiles').insert([
            { id: data.user.id, username: cleanUsername }
          ])
          
          if (profileError) {
             // Rollback user if profile creation fails? For now just show error.
             throw new Error("Failed to create profile. Username might be taken.")
          }
        }
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-ink w-full">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black mb-2 text-honey font-display">WordRush</h1>
          <p className="text-muted font-bold font-sans">Ranked Multiplayer</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-1 ml-1 font-sans">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-clay-light border-[3px] border-clay-dark focus:border-honey outline-none rounded-tile py-3 px-4 text-cream font-sans text-lg transition-colors placeholder-muted"
              placeholder="Your username"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-muted uppercase tracking-widest mb-1 ml-1 font-sans">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-clay-light border-[3px] border-clay-dark focus:border-honey outline-none rounded-tile py-3 px-4 text-cream font-sans text-lg transition-colors placeholder-muted"
              placeholder="••••••••"
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-berry text-sm font-bold text-center">
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pt-4">
            <TileButton type="submit" variant="primary" disabled={loading} className="w-full justify-center">
              {loading ? 'Processing...' : isLogin ? 'Login' : 'Create Account'}
            </TileButton>
          </div>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
            className="text-muted hover:text-cream transition-colors text-sm font-bold font-sans tracking-wide"
          >
            {isLogin ? "Need an account? Sign up" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  )
}
