import { useNavigate } from 'react-router-dom'
import './GameHub.css'

export default function GameHub() {
  const navigate = useNavigate()

  const games = [
    {
      id: 'matching',
      title: 'Word Matching',
      description: 'Memory challenge! Match English vocabulary with corresponding definitions on 3D flip cards.',
      icon: 'extension',
      colorClass: 'matching-theme',
      path: '/student/game/matching'
    },
    {
      id: 'scramble',
      title: 'Word Scramble',
      description: 'Spelling mastery! Rearrange scrambled letters to form complete vocabulary words using phonetic hints.',
      icon: 'spellcheck',
      colorClass: 'scramble-theme',
      path: '/student/game/scramble'
    },
    {
      id: 'filler',
      title: 'Context Filler',
      description: 'Contextual learning! Fill in missing vocabulary blanks in real-world example sentences.',
      icon: 'rate_review',
      colorClass: 'filler-theme',
      path: '/student/game/filler'
    },
    {
      id: 'hunter',
      title: 'Vocab Hunter',
      description: 'Quick reflexes! Target falling vocabulary bubbles matching the target definition.',
      icon: 'target',
      colorClass: 'hunter-theme',
      path: '/student/game/hunter'
    }
  ]

  return (
    <div className="game-hub-container animate-fade-in">
      <div className="game-hub-header">
        <button className="back-to-library-btn" onClick={() => navigate('/student/vocabulary')}>
          <span className="material-symbols-outlined">arrow_back</span>
          Back to Library
        </button>
        <div className="text-center header-content">
          <span className="material-symbols-outlined hub-icon-main">sports_esports</span>
          <h2 className="text-headline-lg font-bold">LexiGrow Play Zone</h2>
          <p className="text-body-md text-secondary-color">
            Expand your vocabulary naturally through interactive, high-retention mini-games.
          </p>
        </div>
      </div>

      <div className="games-grid">
        {games.map((game) => (
          <div key={game.id} className={`game-hub-card card-base ${game.colorClass}`}>
            <div className="game-card-icon-wrap">
              <span className="material-symbols-outlined game-card-icon">{game.icon}</span>
            </div>
            <div className="game-card-info">
              <h3 className="text-title-lg font-bold">{game.title}</h3>
              <p className="text-body-sm card-description">{game.description}</p>
            </div>
            <button className="play-game-btn" onClick={() => navigate(game.path)}>
              Play Now
              <span className="material-symbols-outlined">play_arrow</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
