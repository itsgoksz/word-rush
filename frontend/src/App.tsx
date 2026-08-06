import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { connectSocket } from './realtime'
import { HomeScreen } from './screens/HomeScreen'
import { LobbyScreen } from './screens/LobbyScreen'
import { GameScreen } from './screens/GameScreen'
import { AuthScreen } from './screens/AuthScreen'
import { useGameStore } from './store'
import { supabase } from './supabaseClient'

function App() {
  const room = useGameStore((state) => state.room)
  const user = useGameStore((state) => state.user)
  const setUser = useGameStore((state) => state.setUser)
  const setProfile = useGameStore((state) => state.setProfile)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        useGameStore.getState().fetchProfile().then(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        useGameStore.getState().fetchProfile()
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) {
      connectSocket()
    }
  }, [user])

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-ink flex items-center justify-center">
        <div className="text-honey animate-pulse font-display text-xl tracking-widest font-bold">LOADING...</div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-[100dvh] bg-ink text-cream flex flex-col items-center md:p-8"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      <div className="w-full max-w-md bg-clay md:rounded-[24px] shadow-2xl overflow-hidden h-[100dvh] md:h-auto md:min-h-[650px] flex flex-col relative md:border-[4px] border-clay-dark">
        <Router>
          <Routes>
            {!user ? (
              <Route path="*" element={<AuthScreen />} />
            ) : (
              <>
                <Route path="/" element={!room ? <HomeScreen /> : <Navigate to={room.state === 'LOBBY' ? '/lobby' : '/game'} />} />
                <Route path="/lobby" element={room?.state === 'LOBBY' ? <LobbyScreen /> : <Navigate to={room ? '/game' : '/'} />} />
                <Route path="/game" element={room && room.state !== 'LOBBY' ? <GameScreen /> : <Navigate to={room ? '/lobby' : '/'} />} />
              </>
            )}
          </Routes>
        </Router>
      </div>
    </div>
  )
}

export default App
