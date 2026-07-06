import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { connectSocket } from './socket'
import { HomeScreen } from './screens/HomeScreen'
import { LobbyScreen } from './screens/LobbyScreen'
import { GameScreen } from './screens/GameScreen'
import { useGameStore } from './store'

function App() {
  const room = useGameStore((state) => state.room)

  useEffect(() => {
    connectSocket()
  }, [])

  return (
    <div className="min-h-[100dvh] bg-ink text-cream flex flex-col items-center p-0 md:p-8">
      <div className="w-full max-w-md bg-clay md:rounded-[24px] shadow-2xl overflow-hidden h-[100dvh] md:h-auto md:min-h-[650px] flex flex-col relative md:border-[4px] border-clay-dark">
        <Router>
          <Routes>
            <Route path="/" element={!room ? <HomeScreen /> : <Navigate to={room.state === 'LOBBY' ? '/lobby' : '/game'} />} />
            <Route path="/lobby" element={room?.state === 'LOBBY' ? <LobbyScreen /> : <Navigate to={room ? '/game' : '/'} />} />
            <Route path="/game" element={room && room.state !== 'LOBBY' ? <GameScreen /> : <Navigate to={room ? '/lobby' : '/'} />} />
          </Routes>
        </Router>
      </div>
    </div>
  )
}

export default App
