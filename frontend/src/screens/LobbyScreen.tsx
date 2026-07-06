import React, { useState } from 'react'
import { Copy, CheckCircle } from 'lucide-react'
import { useGameStore } from '../store'
import { socket, getSessionId } from '../socket'
import { TileButton } from '../components/ui/TileButton'

export function LobbyScreen() {
  const room = useGameStore(state => state.room)
  const [copied, setCopied] = useState(false)
  const [joinCode, setJoinCode] = useState('')

  if (!room) {
    // If not in a room, maybe show the Join Room input here, 
    // or we could have a separate Join Room state in HomeScreen.
    // Wait, HomeScreen has "Play with Friend" which emits create_room.
    // Let's add a "Join Room" button in HomeScreen later or handle it here.
    return null
  }

  const selfId = getSessionId()
  const self = room.players.find(p => p.id === selfId)
  const opponent = room.players.find(p => p.id !== selfId)

  const handleCopy = () => {
    navigator.clipboard.writeText(room.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleReady = () => {
    socket.emit('set_ready', { roomId: room.id, sessionId: selfId })
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <h2 className="text-3xl font-display font-black mb-8 text-center text-cream">Room Lobby</h2>
      
      <div className="bg-clay-light p-6 rounded-tile border-[3px] border-clay-dark w-full mb-8 flex flex-col items-center">
        <p className="text-sm text-muted mb-2 uppercase tracking-widest font-bold font-sans">Room Code</p>
        <div className="flex items-center space-x-4">
          <span className="text-4xl font-mono tracking-widest font-black text-honey">{room.id}</span>
          <button onClick={handleCopy} className="p-2 hover:bg-clay rounded-lg transition-colors">
            {copied ? <CheckCircle className="text-moss" /> : <Copy className="text-muted" />}
          </button>
        </div>
      </div>

      <div className="w-full space-y-4 mb-12">
        <div className="flex justify-between items-center p-4 bg-clay-light rounded-tile border-[3px] border-clay-dark font-sans text-cream">
          <div className="font-semibold">You</div>
          <div className={self?.isReady ? 'text-moss font-bold' : 'text-muted'}>
            {self?.isReady ? 'Ready' : 'Not Ready'}
          </div>
        </div>
        <div className="flex justify-between items-center p-4 bg-clay-light rounded-tile border-[3px] border-clay-dark font-sans text-cream">
          <div className="font-semibold">Opponent</div>
          {opponent ? (
            <div className={opponent.isReady ? 'text-moss font-bold' : 'text-muted'}>
              {opponent.isReady ? 'Ready' : 'Not Ready'}
            </div>
          ) : (
            <div className="text-muted italic">Waiting to join...</div>
          )}
        </div>
      </div>

      <TileButton
        variant="primary"
        onClick={handleReady}
        disabled={self?.isReady || !opponent}
      >
        {self?.isReady ? 'Waiting for opponent...' : 'Ready Up'}
      </TileButton>
    </div>
  )
}
