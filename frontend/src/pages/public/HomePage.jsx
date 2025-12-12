// frontend/src/pages/public/HomePage.jsx - FIXED VIDEO AUTOPLAY VERSION
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Card from '../../components/ui/Card';
import EventSkeleton from '../../components/shared/EventSkeleton';
import useScrollAnimation from '../../hooks/useScrollAnimation';
import BackgroundMedia from '../../components/shared/BackgroundMedia';
import ActivityIcon from '../../components/shared/ActivityIcon';
import { eventsService } from '../../services/events';
import styles from './PublicPages.module.css';

// Import constants
import {
  WELCOME_MEDIA,
  ACTIVITIES_MEDIA,
  EVENTS_MEDIA,
  MEMBERSHIP_MEDIA,
  ROTATION_INTERVALS,
  CHURCH_STATS,
  ACTIVITIES_DATA,
  ACTIVITIES_INFO,
  CONTACT_METHODS,
  MEMBERSHIP_BENEFITS,
  SOCIAL_MEDIA,
  IMAGES
} from '../../constants/homePageMedia';

// Destructure needed images
const { heroBgJpeg } = IMAGES;
const { welcomeVideo } = WELCOME_MEDIA;

const HomePage = () => {
  // State management
  const [currentActivitiesMediaIndex, setCurrentActivitiesMediaIndex] = useState(0);
  const [currentEventsMediaIndex, setCurrentEventsMediaIndex] = useState(0);
  const [currentMembershipMediaIndex, setCurrentMembershipMediaIndex] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const [shouldLoadEvents, setShouldLoadEvents] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  // Refs for scroll animations and video
  const activitiesRef = useRef(null);
  const eventsRef = useRef(null);
  const membershipRef = useRef(null);
  const videoRef = useRef(null);

  // Scroll animations
  const activitiesVisible = useScrollAnimation(activitiesRef, 0.1, '50px');
  const eventsVisible = useScrollAnimation(eventsRef, 0.1, '50px');
  const membershipVisible = useScrollAnimation(membershipRef, 0.1, '50px');

  // Get current media
  const currentActivitiesMedia = ACTIVITIES_MEDIA[currentActivitiesMediaIndex];
  const currentEventsMedia = EVENTS_MEDIA[currentEventsMediaIndex];
  const currentMembershipMedia = MEMBERSHIP_MEDIA[currentMembershipMediaIndex];

  // ✅ FIX: Force video to play with proper attributes
  useEffect(() => {
    if (videoRef.current && !videoError) {
      // Ensure video is muted and attempt to play
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
      
      // Attempt to play the video
      const playPromise = videoRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('[HomePage] Video autoplay started successfully');
          })
          .catch((error) => {
            console.warn('[HomePage] Video autoplay failed:', error);
            // Fallback: try playing again after a short delay
            setTimeout(() => {
              if (videoRef.current) {
                videoRef.current.play().catch(() => {
                  console.warn('[HomePage] Second autoplay attempt failed');
                });
              }
            }, 500);
          });
      }
    }
  }, [videoError]);

  // Lazy load events when section is visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShouldLoadEvents(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    if (eventsRef.current) {
      observer.observe(eventsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Fetch events when should load
  useEffect(() => {
    if (shouldLoadEvents) {
      fetchUpcomingEvents();
    }
  }, [shouldLoadEvents]);

  // Rotate activities background
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentActivitiesMediaIndex((prevIndex) => 
        (prevIndex + 1) % ACTIVITIES_MEDIA.length
      );
    }, ROTATION_INTERVALS.activities);

    return () => clearInterval(interval);
  }, []);

  // Rotate events background
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentEventsMediaIndex((prevIndex) => 
        (prevIndex + 1) % EVENTS_MEDIA.length
      );
    }, ROTATION_INTERVALS.events);

    return () => clearInterval(interval);
  }, []);

  // Rotate membership background
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMembershipMediaIndex((prevIndex) => 
        (prevIndex + 1) % MEMBERSHIP_MEDIA.length
      );
    }, ROTATION_INTERVALS.membership);

    return () => clearInterval(interval);
  }, []);

  // Preload next media items
  useEffect(() => {
    const preloadMedia = (mediaArray, currentIndex) => {
      const nextIndex = (currentIndex + 1) % mediaArray.length;
      const nextMedia = mediaArray[nextIndex];
      
      if (nextMedia.type === 'image') {
        const img = new Image();
        img.src = nextMedia.src;
      } else if (nextMedia.type === 'video') {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = nextMedia.src;
      }
    };

    preloadMedia(ACTIVITIES_MEDIA, currentActivitiesMediaIndex);
    preloadMedia(EVENTS_MEDIA, currentEventsMediaIndex);
    preloadMedia(MEMBERSHIP_MEDIA, currentMembershipMediaIndex);
  }, [currentActivitiesMediaIndex, currentEventsMediaIndex, currentMembershipMediaIndex]);

  // Fetch upcoming events with retry
  const fetchUpcomingEvents = async () => {
    try {
      setLoadingEvents(true);
      setEventsError(null);
      
      console.log('[HomePage] Fetching upcoming events... (Attempt:', retryCount + 1, ')');
      
      const response = await eventsService.getEvents({
        is_public: true,
        status: 'published',
        upcoming: 'true',
        ordering: 'start_datetime',
        limit: 3
      });
      
      const events = response.results || response.data || [];
      console.log('[HomePage] Loaded events:', events.length);
      setUpcomingEvents(events);
      setRetryCount(0);
    } catch (error) {
      console.error('[HomePage] Error fetching events:', error);
      const errorMessage = error.message || 'Failed to load events';
      setEventsError(errorMessage);
      
      // Auto-retry with exponential backoff
      if (retryCount < MAX_RETRIES) {
        const delay = 2000 * Math.pow(2, retryCount);
        console.log(`[HomePage] Retrying in ${delay}ms...`);
        
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchUpcomingEvents();
        }, delay);
      }
    } finally {
      setLoadingEvents(false);
    }
  };

  // Handle video error
  const handleVideoError = () => {
    console.error('[HomePage] Video failed to load');
    setVideoError(true);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return '';
    }
  };

  // Format time
  const formatTime = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className={styles.homePage}>
      {/* SEO Meta Tags */}
      <Helmet>
        <title>Home | Deeper Life Campus Fellowship - Welcome to Our Community</title>
        <meta 
          name="description" 
          content="Join Deeper Life Campus Fellowship, a vibrant community of believers. Experience God's love through worship, Bible study, and meaningful connections. 500+ active members, 15+ years of ministry." 
        />
        <meta 
          name="keywords" 
          content="Deeper Life Campus Fellowship, church, campus ministry, Christian fellowship, worship, Bible study, faith community, DLCF" 
        />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:title" content="Deeper Life Campus Fellowship - Welcome Home" />
        <meta 
          property="og:description" 
          content="Earnestly contend for the faith which was once delivered unto the saints. Join our vibrant community of believers." 
        />
        <meta property="og:image" content={heroBgJpeg} />
        <meta property="og:image:alt" content="Deeper Life Campus Fellowship welcome" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={window.location.href} />
        <meta property="twitter:title" content="Deeper Life Campus Fellowship" />
        <meta 
          property="twitter:description" 
          content="Join our vibrant community of believers. Experience God's love through worship and fellowship." 
        />
        <meta property="twitter:image" content={heroBgJpeg} />
        
        {/* Additional SEO */}
        <link rel="canonical" href={window.location.href} />
        <meta name="author" content="Deeper Life Campus Fellowship" />
        <meta name="robots" content="index, follow" />
        <meta name="language" content="English" />
        <meta name="revisit-after" content="7 days" />
        
        {/* Structured Data - Organization */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Deeper Life Campus Fellowship",
            "alternateName": "DLCF",
            "url": window.location.origin,
            "logo": heroBgJpeg,
            "description": "A vibrant campus Christian fellowship dedicated to worship, Bible study, and community service",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "123 Faith Avenue",
              "addressLocality": "Campus District",
              "addressCountry": "GH"
            },
            "contactPoint": {
              "@type": "ContactPoint",
              "telephone": "+1-555-123-4567",
              "contactType": "General Inquiries",
              "email": "info@deeperlife.org",
              "availableLanguage": "English"
            },
            "sameAs": [
              "https://facebook.com/dlcf",
              "https://instagram.com/dlcf",
              "https://twitter.com/dlcf"
            ]
          })}
        </script>
        
        {/* Structured Data - Events */}
        {upcomingEvents.length > 0 && (
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              "itemListElement": upcomingEvents.map((event, index) => ({
                "@type": "Event",
                "position": index + 1,
                "name": event.title,
                "description": event.description,
                "startDate": event.start_datetime,
                "location": {
                  "@type": "Place",
                  "name": event.location || "Deeper Life Campus Fellowship"
                },
                "image": event.image_url || heroBgJpeg,
                "organizer": {
                  "@type": "Organization",
                  "name": "Deeper Life Campus Fellowship"
                }
              }))
            })}
          </script>
        )}
      </Helmet>

      {/* Welcome Section */}
      <section className={styles.welcomeSection} aria-labelledby="welcome-heading">
        <div className={styles.welcomeVideoBackground} role="presentation" aria-hidden="true">
          {!videoError ? (
            <video 
              ref={videoRef}
              className={styles.welcomeBackgroundVideo}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              poster={heroBgJpeg}
              onError={handleVideoError}
              aria-label="Welcome background video"
            >
              <source src={welcomeVideo} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <div 
              className={styles.welcomeFallbackImage}
              style={{ backgroundImage: `url(${heroBgJpeg})` }}
              role="img"
              aria-label="Church welcome background"
            />
          )}
          <div className={styles.welcomeOverlay} aria-hidden="true"></div>
        </div>

        <div className={styles.container}>
          <div className={styles.welcomeContent}>
            <div className={styles.welcomeMessage}>
              <div className={styles.welcomeChip} aria-label="Welcome badge">
                <span className={styles.chipIcon} aria-hidden="true">🛐</span>
                <span>Welcome To</span>
              </div>
              <h1 id="welcome-heading" className={styles.welcomeTitle}>
                Deeper Life Campus Fellowship
              </h1>
              <blockquote className={styles.welcomeSubtitle}>
                "Earnestly contend for the faith which was once delivered unto the saints." 
                <cite className={styles.scriptureRef}>- Jude 1:3b</cite>
              </blockquote>
              <p className={styles.welcomeDescription}>
                Join our vibrant community of believers as we grow together in faith, fellowship, and service. 
                Experience God's love through worship, Bible study, and meaningful connections that last a lifetime.
              </p>
            </div>
            <div className={styles.welcomeStats} role="region" aria-label="Church statistics">
              {CHURCH_STATS.map((stat, index) => (
                <div key={index} className={styles.stat}>
                  <div className={styles.statNumber} aria-label={stat.ariaLabel}>
                    {stat.number}
                  </div>
                  <div className={styles.statLabel}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Activities Section */}
      <section 
        ref={activitiesRef}
        className={`${styles.activitiesSection} ${activitiesVisible ? styles.fadeInUp : ''}`}
        aria-labelledby="activities-heading"
      >
        <BackgroundMedia
          media={currentActivitiesMedia}
          containerClassName={styles.activitiesBackground}
          videoClassName={styles.activitiesBackgroundVideo}
          imageClassName={styles.activitiesBackgroundImage}
          overlayClassName={styles.activitiesOverlay}
          altText="Church activities background"
        />

        <div className={styles.container}>
          <div className={styles.activitiesContent} id="main-content">
            <div className={styles.sectionHeader}>
              <h2 id="activities-heading" className={styles.sectionTitle}>Our Church Activities</h2>
              <p className={styles.sectionSubtitle}>
                Discover the many ways we come together to worship, learn, and serve our community
              </p>
            </div>
            
            <div className={styles.activitiesGrid} role="list">
              {ACTIVITIES_DATA.map((activity) => (
                <article key={activity.id} className={styles.activityCard} role="listitem">
                  <div className={styles.activityIcon} aria-hidden="true">
                    <ActivityIcon iconType={activity.icon} />
                  </div>
                  <h3 className={styles.activityTitle}>{activity.title}</h3>
                  <p className={styles.activityTime}>
                    <time dateTime={activity.dateTime}>{activity.time}</time>
                  </p>
                  <p className={styles.activityDescription}>
                    {activity.description}
                  </p>
                  <div className={styles.activityFooter}>
                    <span className={styles.activityDuration}>{activity.duration}</span>
                  </div>
                </article>
              ))}
            </div>

            <div className={styles.activitiesInfo}>
              {ACTIVITIES_INFO.map((info) => (
                <div key={info.id} className={styles.infoCard}>
                  <h4>{info.title}</h4>
                  <p>{info.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section 
        ref={eventsRef} 
        className={`${styles.eventsSection} ${eventsVisible ? styles.fadeInUp : ''}`}
        aria-labelledby="events-heading"
      >
        <BackgroundMedia
          media={currentEventsMedia}
          containerClassName={styles.eventsBackground}
          videoClassName={styles.eventsBackgroundVideo}
          imageClassName={styles.eventsBackgroundImage}
          overlayClassName={styles.eventsOverlay}
          altText="Church events background"
        />

        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 id="events-heading" className={styles.sectionTitle}>Upcoming Events</h2>
            <p className={styles.sectionSubtitle}>
              Join us for these exciting events and special gatherings
            </p>
          </div>

          {loadingEvents ? (
            <div className={styles.eventsGrid}>
              <EventSkeleton />
              <EventSkeleton />
              <EventSkeleton />
            </div>
          ) : eventsError ? (
            <div className={styles.eventsError}>
              <svg 
                className={styles.errorIcon}
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <p>Unable to load events at this time</p>
              <button 
                className={styles.retryButton}
                onClick={() => {
                  setEventsError(null);
                  setRetryCount(0);
                  fetchUpcomingEvents();
                }}
                aria-label="Retry loading events"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 4 23 10 17 10"></polyline>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                </svg>
                Try Again
              </button>
            </div>
          ) : upcomingEvents.length > 0 ? (
            <>
              <div className={styles.eventsGrid}>
                {upcomingEvents.map((event, index) => (
                  <Link
                    key={event.id}
                    to={`/events`}
                    className={styles.eventCardLink}
                    style={{ animationDelay: `${index * 0.1}s` }}
                    aria-label={`View ${event.title} on ${formatDate(event.start_datetime)}`}
                  >
                    <article className={styles.eventCard}>
                      {/* Event Image with Overlay */}
                      <div className={styles.eventImageContainer}>
                        <img 
                          src={event.image_url || heroBgJpeg} 
                          alt={`${event.title} event`}
                          className={styles.eventCardImage}
                          onError={(e) => {
                            e.target.src = heroBgJpeg;
                          }}
                          loading="lazy"
                        />
                        <div className={styles.eventImageOverlay}></div>
                        
                        {/* Event Badge (Featured/Today) */}
                        {event.is_featured && (
                          <div className={styles.eventBadge}>
                            <svg viewBox="0 0 24 24" fill="currentColor">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                            </svg>
                            Featured
                          </div>
                        )}
                        
                        {/* Date Badge */}
                        <div className={styles.eventDateBadge}>
                          <div className={styles.eventMonth}>
                            {new Date(event.start_datetime).toLocaleDateString('en-US', { month: 'short' })}
                          </div>
                          <div className={styles.eventDay}>
                            {new Date(event.start_datetime).getDate()}
                          </div>
                        </div>
                      </div>

                      {/* Event Content */}
                      <div className={styles.eventCardContent}>
                        {/* Event Type Badge */}
                        {event.event_type && (
                          <div className={styles.eventType}>
                            {event.event_type_display || event.event_type}
                          </div>
                        )}

                        <h3 className={styles.eventCardTitle}>{event.title}</h3>
                        
                        {/* Event Meta Information */}
                        <div className={styles.eventMeta}>
                          <div className={styles.eventMetaItem}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"></circle>
                              <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            <time dateTime={event.start_datetime}>
                              {formatTime(event.start_datetime)}
                            </time>
                          </div>
                          
                          {event.location && (
                            <div className={styles.eventMetaItem}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                              </svg>
                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>

                        {/* Description */}
                        {event.description && (
                          <p className={styles.eventCardDescription}>
                            {event.description.length > 120 
                              ? `${event.description.substring(0, 120)}...` 
                              : event.description
                            }
                          </p>
                        )}

                        {/* Registration Info */}
                        {event.requires_registration && (
                          <div className={styles.eventRegistration}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                              <circle cx="9" cy="7" r="4"></circle>
                              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                            <span>
                              {event.registration_count || 0}
                              {event.max_capacity && ` / ${event.max_capacity}`} registered
                            </span>
                          </div>
                        )}

                        {/* View Details Button */}
                        <div className={styles.eventCardAction}>
                          <span className={styles.eventActionButton}>
                            View Details
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="5" y1="12" x2="19" y2="12"></line>
                              <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                ))}
              </div>

              <div className={styles.eventsViewAll}>
                <Link to="/events" className={styles.viewAllButton}>
                  <span>View All Events</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </Link>
              </div>
            </>
          ) : (
            <div className={styles.eventsEmpty}>
              <svg className={styles.emptyIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <h3>No Upcoming Events</h3>
              <p>Check back soon for exciting new events and gatherings!</p>
              <Link to="/events" className={styles.browseButton}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                Browse All Events
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Membership Section */}
      <section 
        ref={membershipRef}
        className={`${styles.membershipSection} ${membershipVisible ? styles.fadeInUp : ''}`}
        aria-labelledby="membership-heading"
      >
        <BackgroundMedia
          media={currentMembershipMedia}
          containerClassName={styles.membershipBackground}
          videoClassName={styles.membershipBackgroundVideo}
          imageClassName={styles.membershipBackgroundImage}
          overlayClassName={styles.membershipOverlay}
          altText="Church membership background"
        />
        
        <div className={styles.container}>
          <div className={styles.membershipContent}>
            <div className={styles.membershipText}>
              <h2 id="membership-heading" className={styles.membershipTitle}>Join Our Church Family</h2>
              <p className={styles.membershipDescription}>
                Take the next step in your faith journey by becoming a member of Deeper Life Campus Fellowship. 
                Experience the joy of belonging to a community that celebrates God's love, supports one another, 
                and serves with purpose and passion.
              </p>
              
              <div className={styles.membershipBenefits}>
                <h4 className={styles.benefitsTitle}>Membership Benefits</h4>
                <div className={styles.benefitsGrid}>
                  {MEMBERSHIP_BENEFITS.map((benefit, index) => (
                    <div key={index} className={styles.benefit}>
                      <div className={styles.benefitIcon}>✓</div>
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className={styles.membershipForm}>
              <Card className={styles.membershipCard}>
                <h3 className={styles.cardTitle}>Connect With Us Today</h3>
                <p className={styles.cardDescription}>
                  We'd love to hear from you and help you take your next step in faith. 
                  Reach out through any of these channels.
                </p>
                
                <div className={styles.contactMethods}>
                  {CONTACT_METHODS.map((method) => (
                    <div key={method.id} className={styles.contactMethod}>
                      <div className={styles.contactIcon}>{method.icon}</div>
                      <div className={styles.contactDetails}>
                        <h5>{method.title}</h5>
                        <p>{method.primary}</p>
                        {method.secondary && <small>{method.secondary}</small>}
                        {method.tertiary && <small>{method.tertiary}</small>}
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.socialLinks}>
                  <h5>Follow Us</h5>
                  <div className={styles.socialIcons}>
                    {SOCIAL_MEDIA.map((social) => (
                      <a 
                        key={social.platform}
                        href={social.url} 
                        className={styles.socialIcon}
                        aria-label={social.label}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {social.icon}
                      </a>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;