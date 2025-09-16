import React, { useState, useCallback, useRef, useEffect } from 'react'

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  fallback?: string
  lazy?: boolean
  quality?: 'low' | 'medium' | 'high'
  preload?: boolean
}

export function SmartImage({
  src,
  alt,
  fallback,
  lazy = true,
  quality,
  preload = false,
  className = '',
  onLoad,
  onError,
  ...props
}: SmartImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isInView, setIsInView] = useState(!lazy)
  const imgRef = useRef<HTMLImageElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const optimizedSrc = src

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || isInView) return

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observerRef.current?.disconnect()
          }
        })
      },
      { threshold: 0.1 }
    )

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current)
    }

    return () => observerRef.current?.disconnect()
  }, [lazy, isInView])

  const handleLoad = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoaded(true)
    onLoad?.(event)
  }, [onLoad])

  const handleError = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    setHasError(true)
    onError?.(event)
  }, [onError])

  // Show placeholder while not in view or loading
  if (!isInView || (!isLoaded && !hasError)) {
    return (
      <div
        ref={imgRef}
        className={`bg-slate-200 animate-pulse flex items-center justify-center ${className}`}
        style={props.style}
      >
        {!isInView && lazy && (
          <span className="text-slate-400 text-sm">Loading...</span>
        )}
      </div>
    )
  }

  // Show fallback on error
  if (hasError && fallback) {
    return (
      <img
        ref={imgRef}
        src={fallback}
        alt={alt}
        className={className}
        onLoad={handleLoad}
        {...props}
      />
    )
  }

  // Show error state if no fallback
  if (hasError) {
    return (
      <div
        ref={imgRef}
        className={`bg-slate-100 flex items-center justify-center ${className}`}
        style={props.style}
      >
        <span className="text-slate-400 text-sm">Failed to load</span>
      </div>
    )
  }

  return (
    <img
      ref={imgRef}
      src={optimizedSrc}
      alt={alt}
      className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
      onLoad={handleLoad}
      onError={handleError}
      {...props}
    />
  )
}

// Progressive image component for hero images
export function ProgressiveImage({
  src,
  lowQualitySrc,
  alt,
  className = '',
  ...props
}: {
  src: string
  lowQualitySrc?: string
  alt: string
  className?: string
} & React.ImgHTMLAttributes<HTMLImageElement>) {
  const [isHighQualityLoaded, setIsHighQualityLoaded] = useState(false)

  return (
    <div className={`relative ${className}`}>
      {/* Low quality placeholder */}
      {lowQualitySrc && (
        <img
          src={lowQualitySrc}
          alt={alt}
          className={`absolute inset-0 w-full h-full object-cover filter blur-sm transition-opacity duration-500 ${
            isHighQualityLoaded ? 'opacity-0' : 'opacity-100'
          }`}
          {...props}
        />
      )}
      
      {/* High quality image */}
      <img
        src={src}
        alt={alt}
        className={`relative w-full h-full object-cover transition-opacity duration-500 ${
          isHighQualityLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={() => setIsHighQualityLoaded(true)}
        {...props}
      />
    </div>
  )
}
