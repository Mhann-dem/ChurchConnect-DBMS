import React from 'react';
import PropTypes from 'prop-types';

const BackgroundMedia = ({ 
  media, 
  overlayClassName,
  containerClassName,
  videoClassName,
  imageClassName,
  altText = 'Background media'
}) => {
  if (!media) return null;

  return (
    <div className={containerClassName}>
      {media.type === 'video' ? (
        <video 
          className={videoClassName}
          autoPlay
          muted
          loop
          playsInline
          key={media.src}
          aria-label={altText}
        >
          <source src={media.src} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      ) : (<img 
          className={imageClassName}
          src={media.src}
          alt={altText}
          key={media.src}
        />
      )}
      {overlayClassName && <div className={overlayClassName} aria-hidden="true"></div>}
    </div>
  );
};

BackgroundMedia.propTypes = {
  media: PropTypes.shape({
    type: PropTypes.oneOf(['image', 'video']).isRequired,
    src: PropTypes.string.isRequired
  }).isRequired,
  overlayClassName: PropTypes.string,
  containerClassName: PropTypes.string,
  videoClassName: PropTypes.string,
  imageClassName: PropTypes.string,
  altText: PropTypes.string
};

export default BackgroundMedia;