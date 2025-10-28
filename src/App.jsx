import { useState } from 'react'
import StartMenu from './components/StartMenu'
import Game from './components/Game'
import './App.css'

function App() {
  const [gameState, setGameState] = useState('menu') // 'menu', 'playing', 'gameover'
  const [gameConfig, setGameConfig] = useState(null)

  const startGame = (config) => {
    setGameConfig(config)
    setGameState('playing')
  }

  const endGame = () => {
    setGameState('gameover')
  }

  const returnToMenu = () => {
    setGameState('menu')
    setGameConfig(null)
  }

  return (
    <div className="app">
      {gameState === 'menu' && <StartMenu onStart={startGame} />}
      {gameState === 'playing' && (
        <Game config={gameConfig} onGameOver={endGame} onReturnToMenu={returnToMenu} />
      )}
      {gameState === 'gameover' && (
        <div className="game-over-screen">
          <h1>GAME OVER</h1>
          <button onClick={returnToMenu}>Return to Menu</button>
        </div>
      )}
    </div>
  )
}

export default App
