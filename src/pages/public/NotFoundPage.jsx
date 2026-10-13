import { Link } from 'react-router-dom'
import './NotFoundPage.css'

export default function NotFoundPage() {

  return (
    <div className="eduvia-page eduvia-404-page">
      <div className="eduvia-404-hero">
        <h1 className="eduvia-404-code">404</h1>
        <h2 className="eduvia-404-title">Oops, Page Not Found</h2>
        <p className="eduvia-404-desc">
          Volutpat eu massa cras mauris lacus adipiscing ultrices. Imperdiet eu amet imperdiet suscipit quisque ipsum odio. Blandit ac mi magna maecenas arcu semper. Aliquam porttitor augue id diam.
        </p>
        <Link to="/student/home" className="eduvia-btn eduvia-btn--lime">
          Back To Homepage
        </Link>
      </div>
    </div>
  )
}
