import { useNavigate } from 'react-router-dom'
import './GameHub.css'

export default function GameHub() {
  const navigate = useNavigate()

  const games = [
    {
      id: 'matching',
      title: 'Word Matching',
      description: 'Thách thức trí nhớ! Ghép cặp từ vựng tiếng Anh với định nghĩa tương ứng trên các thẻ lật 3D.',
      icon: 'extension',
      colorClass: 'matching-theme',
      path: '/student/game/matching'
    },
    {
      id: 'scramble',
      title: 'Word Scramble',
      description: 'Luyện chính tả! Sắp xếp các chữ cái bị xáo trộn thành từ vựng hoàn chỉnh dựa trên phiên âm và gợi ý.',
      icon: 'spellcheck',
      colorClass: 'scramble-theme',
      path: '/student/game/scramble'
    },
    {
      id: 'filler',
      title: 'Context Filler',
      description: 'Học theo ngữ cảnh! Điền từ vựng thích hợp vào chỗ trống trong các câu ví dụ thực tế.',
      icon: 'rate_review',
      colorClass: 'filler-theme',
      path: '/student/game/filler'
    },
    {
      id: 'hunter',
      title: 'Vocab Hunter',
      description: 'Phản xạ nhanh nhẹn! Bắn hạ các bong bóng từ vựng đang rơi tương ứng với định nghĩa được yêu cầu.',
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
          Quay lại Thư viện
        </button>
        <div className="text-center header-content">
          <span className="material-symbols-outlined hub-icon-main">sports_esports</span>
          <h2 className="text-headline-lg font-bold">LexiGrow Play Zone</h2>
          <p className="text-body-md text-secondary-color">
            Nâng cao vốn từ vựng của bạn một cách tự nhiên thông qua các trò chơi tương tác thú vị.
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
              Chơi ngay
              <span className="material-symbols-outlined">play_arrow</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
