import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../contexts/LanguageContext.jsx'
import './GameHub.css'

export default function GameHub() {
  const navigate = useNavigate()
  const { t } = useLanguage()

  const games = [
    {
      id: 'matching',
      title: t('games.matchingTitle', 'Word Matching'),
      description: t('games.matchingDesc', 'Memory challenge! Match English vocabulary with corresponding definitions on 3D flip cards.'),
      icon: 'extension',
      colorClass: 'matching-theme',
      path: '/student/game/matching'
    },
    {
      id: 'scramble',
      title: t('games.scrambleTitle', 'Word Scramble'),
      description: t('games.scrambleDesc', 'Spelling mastery! Rearrange scrambled letters to form complete vocabulary words using clues.'),
      icon: 'spellcheck',
      colorClass: 'scramble-theme',
      path: '/student/game/scramble'
    },
    {
      id: 'filler',
      title: t('games.fillerTitle', 'Context Filler'),
      description: t('games.fillerDesc', 'Contextual learning! Fill in missing vocabulary blanks in real-world example sentences.'),
      icon: 'rate_review',
      colorClass: 'filler-theme',
      path: '/student/game/filler'
    },
    {
      id: 'hunter',
      title: t('games.hunterTitle', 'Vocab Hunter'),
      description: t('games.hunterDesc', 'Quick reflexes! Target falling vocabulary bubbles matching the target definition.'),
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
          {t('games.wordLibrary', 'Back to Library')}
        </button>
        <div className="text-center header-content">
          <span className="material-symbols-outlined hub-icon-main">sports_esports</span>
          <h2 className="text-headline-lg font-bold">{t('games.hubTitle', 'LexiGrow Play Zone')}</h2>
          <p className="text-body-md text-secondary-color">
            {t('games.hubSubtitle', 'Expand your vocabulary naturally through interactive, high-retention mini-games.')}
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
              {t('games.playNow', 'Play Now')}
              <span className="material-symbols-outlined">play_arrow</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
