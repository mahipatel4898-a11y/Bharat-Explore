import React, { useState, useRef, useEffect } from 'react';
import './VisualExperience.css';

const VisualExperience = ({ targetId, targetType = 'city' }) => {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Top Experiences');

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/visual/${targetType}/${targetId}`);
        const data = await response.json();
        setContent(data);
      } catch (error) {
        console.error('Error fetching visual content:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [targetId, targetType]);

  const categories = ['Top Experiences', 'Nearby Attractions', 'Hidden Gems'];

  if (loading) return <div className="visual-loading">Loading Immersive Experience...</div>;
  if (content.length === 0) return null;

  const filteredContent = content.filter(item => item.category === activeCategory);

  return (
    <section className="visual-experience-section">
      <div className="section-header">
        <h2 className="premium-title">Visual Experience</h2>
        <p className="section-subtitle">Explore the vibe before you arrive</p>
      </div>

      <div className="category-tabs">
        {categories.map(cat => (
          <button
            key={cat}
            className={`tab-btn ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="visual-carousel">
        {filteredContent.map((item) => (
          item.type === 'video' ? (
            <VideoCard key={item._id} item={item} />
          ) : (
            <PanoramaCard key={item._id} item={item} />
          )
        ))}
      </div>
    </section>
  );
};

const VideoCard = ({ item }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const isInstagram = item.url.includes('instagram.com');

  useEffect(() => {
    if (isInstagram) {
      // Ensure script is loaded
      if (!window.instgrm) {
        const script = document.createElement('script');
        script.src = "//www.instagram.com/embed.js";
        script.async = true;
        document.body.appendChild(script);
        script.onload = () => {
          if (window.instgrm) window.instgrm.Embeds.process();
        };
      } else {
        window.instgrm.Embeds.process();
      }
    }

    if (videoRef.current && !isInstagram) {
      if (isPlaying) {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => setIsPlaying(false));
        }
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, item.url, isInstagram]);

  const togglePlay = (e) => {
    if (isInstagram) return;
    e.preventDefault();
    e.stopPropagation();
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="media-card video-card" onClick={togglePlay}>
      {isInstagram ? (
        <div className="instagram-container">
          <blockquote
            className="instagram-media"
            data-instgrm-permalink={item.url}
            data-instgrm-version="14"
            style={{ width: '100%', height: '100%', margin: 0 }}
          ></blockquote>
        </div>
      ) : (
        <video
          ref={videoRef}
          src={item.url}
          poster={item.thumbnail}
          loop
          muted
          autoPlay
          playsInline
          className="reels-video"
        />
      )}
      {!isInstagram && (
        <div className="card-overlay">
          {!isPlaying && <div className="play-icon">▶</div>}
          <div className="card-info">
            <span className="duration-tag">{item.duration}</span>
            <h4 className="card-title">{item.title}</h4>
          </div>
        </div>
      )}
    </div>
  );
};

const PanoramaCard = ({ item }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [lastX, setLastX] = useState(0);
  const viewerRef = useRef(null);

  const handleStart = (e) => {
    setIsDragging(true);
    setLastX(e.type.includes('touch') ? e.touches[0].clientX : e.clientX);
  };

  const handleMove = (e) => {
    if (!isDragging) return;
    const currentX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const delta = currentX - lastX;
    setRotation(prev => prev + delta);
    setLastX(currentX);
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  return (
    <div className="media-card panorama-card">
      <div className="panorama-badge">360° VIEW</div>
      <div
        className="panorama-viewer"
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      >
        <div
          className="pano-track"
          style={{ transform: `translateX(${rotation % 1000}px)` }}
        >
          <img src={item.url} alt={item.title} className="pano-image" />
          <img src={item.url} alt={item.title} className="pano-image" />
        </div>
      </div>
      <div className="card-info">
        <h4 className="card-title">{item.title}</h4>
        <p className="drag-hint">Drag to explore</p>
      </div>
    </div>
  );
};

export default VisualExperience;
