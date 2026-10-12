import { useState, useEffect } from 'react'
import imageManifest from '../../assets/editorial/image-manifest.json'
import { useLanguage } from '../../contexts/LanguageContext'
import './EditorialCoverImage.css'

export default function EditorialCoverImage({
  topicSlug,
  src,
  alt,
  className = '',
  aspectRatio = '16/9',
  priority = false,
  fallbackTitle,
  fallbackIcon = 'auto_stories'
}) {
  const { language } = useLanguage()
  const [hasError, setHasError] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  // Resolve manifest data
  const manifestEntry = topicSlug ? imageManifest.topics[topicSlug] : null
  const resolvedSrc = src || manifestEntry?.localPath || manifestEntry?.remoteUrl
  const resolvedAlt = alt || (manifestEntry?.alt ? (language === 'vi' ? manifestEntry.alt.vi : manifestEntry.alt.en) : (fallbackTitle || 'Topic Cover'))

  useEffect(() => {
    setHasError(false)
    setIsLoaded(false)
  }, [resolvedSrc])

  if (!resolvedSrc || hasError) {
    return (
      <div
        className={`editorial-cover-container ${className}`}
        style={{ aspectRatio }}
        role="img"
        aria-label={resolvedAlt}
      >
        <div className="editorial-fallback-cover">
          <span className="material-symbols-outlined editorial-fallback-icon" aria-hidden="true">
            {fallbackIcon}
          </span>
          <span className="editorial-fallback-title">
            {fallbackTitle || manifestEntry?.title || topicSlug || 'LexiGrow Learning'}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={`editorial-cover-container ${className}`} style={{ aspectRatio }}>
      <img
        src={resolvedSrc}
        alt={resolvedAlt}
        className={`editorial-cover-img ${isLoaded ? 'is-loaded' : 'is-loading'}`}
        style={{ objectPosition: manifestEntry?.focalPoint || 'center' }}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
      />
    </div>
  )
}
