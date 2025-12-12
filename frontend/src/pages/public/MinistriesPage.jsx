import React, { useState, useEffect } from 'react';
import styles from './PublicPages.module.css';

// Try to import manifests with error handling
let choirManifest, prayerManifest, maintenanceManifest, evangelismManifest;
let transportManifest, childrenManifest, dramaManifest, mediaManifest;
let womenManifest, menManifest, alumniManifest;

try {
  choirManifest = require('../../assets/ministries/choir-and-chorister/manifest.json');
} catch (e) {
  console.warn('Choir manifest not found');
  choirManifest = { images: [] };
}

try {
  prayerManifest = require('../../assets/ministries/prayer-band/manifest.json');
} catch (e) {
  console.warn('Prayer manifest not found');
  prayerManifest = { images: [] };
}

try {
  maintenanceManifest = require('../../assets/ministries/maintenance/manifest.json');
} catch (e) {
  console.warn('Maintenance manifest not found');
  maintenanceManifest = { images: [] };
}

try {
  evangelismManifest = require('../../assets/ministries/evangelism/manifest.json');
} catch (e) {
  console.warn('Evangelism manifest not found');
  evangelismManifest = { images: [] };
}

try {
  transportManifest = require('../../assets/ministries/transport/manifest.json');
} catch (e) {
  console.warn('Transport manifest not found');
  transportManifest = { images: [] };
}

try {
  childrenManifest = require('../../assets/ministries/children/manifest.json');
} catch (e) {
  console.warn('Children manifest not found');
  childrenManifest = { images: [] };
}

try {
  dramaManifest = require('../../assets/ministries/drama/manifest.json');
} catch (e) {
  console.warn('Drama manifest not found');
  dramaManifest = { images: [] };
}

try {
  mediaManifest = require('../../assets/ministries/media/manifest.json');
} catch (e) {
  console.warn('Media manifest not found');
  mediaManifest = { images: [] };
}

try {
  womenManifest = require('../../assets/ministries/women/manifest.json');
} catch (e) {
  console.warn('Women manifest not found');
  womenManifest = { images: [] };
}

try {
  menManifest = require('../../assets/ministries/men/manifest.json');
} catch (e) {
  console.warn('Men manifest not found');
  menManifest = { images: [] };
}

try {
  alumniManifest = require('../../assets/ministries/alumni-group/manifest.json');
} catch (e) {
  console.warn('Alumni manifest not found');
  alumniManifest = { images: [] };
}

const MinistriesPage = () => {
  const [ministries, setMinistries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [ministryImages, setMinistryImages] = useState({});
  const [currentImageIndex, setCurrentImageIndex] = useState({});
  const [showTestimonial, setShowTestimonial] = useState(true);
  const [isAutoPlaying, setIsAutoPlaying] = useState({});

  // Enhanced ministries data
  useEffect(() => {
    setTimeout(() => {
      setMinistries([
        {
          id: 1,
          name: "Choir and Chorister",
          description: "Leading worship through music and vocal excellence. Join us in creating beautiful harmonies that lift our spirits and glorify God through song.",
          category: "worship",
          leader: "David Wilson",
          meetingTime: "Thursdays 7:30 PM",
          location: "Sanctuary",
          contactEmail: "choir@churchconnect.org",
          memberCount: 45,
          established: "2010",
          highlights: ["Weekly performances", "Special holiday concerts", "Community outreach events"],
          openToNew: true,
          manifest: choirManifest,
          folderName: "choir-and-chorister"
        },
        {
          id: 2,
          name: "Prayer Band",
          description: "Interceding for our church, community, and world through organized prayer groups and chains. Experience the power of united prayer.",
          category: "spiritual",
          leader: "Sister Margaret Lee",
          meetingTime: "Daily 6:00 AM",
          location: "Prayer Chapel",
          contactEmail: "prayer@churchconnect.org",
          memberCount: 30,
          established: "2005",
          highlights: ["24/7 prayer chain", "Intercessory prayer training", "Prayer request system"],
          openToNew: true,
          manifest: prayerManifest,
          folderName: "prayer-band"
        },
        {
          id: 3,
          name: "Maintenance",
          description: "Maintaining our facilities to ensure a clean, safe, and welcoming space for all members and visitors. Serving through practical care of God's house.",
          category: "service",
          leader: "James Patterson",
          meetingTime: "Saturdays 9:00 AM",
          location: "All Areas",
          contactEmail: "maintenance@churchconnect.org",
          memberCount: 15,
          established: "2008",
          highlights: ["Regular facility upkeep", "Emergency repairs", "Beautification projects"],
          openToNew: true,
          manifest: maintenanceManifest,
          folderName: "maintenance"
        },
        {
          id: 4,
          name: "Evangelism",
          description: "Sharing the Gospel message and reaching out to the community with God's love and truth. Be part of the Great Commission in action.",
          category: "service",
          leader: "Pastor Robert Brown",
          meetingTime: "Wednesdays 6:30 PM",
          location: "Community",
          contactEmail: "evangelism@churchconnect.org",
          memberCount: 35,
          established: "2007",
          highlights: ["Street evangelism", "Campus outreach", "Door-to-door ministry"],
          openToNew: true,
          manifest: evangelismManifest,
          folderName: "evangelism"
        },
        {
          id: 5,
          name: "Transport",
          description: "Providing transportation support for members attending services and church events. Ensuring everyone can worship together regardless of mobility.",
          category: "service",
          leader: "Deacon Michael Davis",
          meetingTime: "As Needed",
          location: "Various",
          contactEmail: "transport@churchconnect.org",
          memberCount: 12,
          established: "2012",
          highlights: ["Sunday service transport", "Event shuttles", "Hospital visits"],
          openToNew: true,
          manifest: transportManifest,
          folderName: "transport"
        },
        {
          id: 6,
          name: "Children",
          description: "Nurturing children's spiritual growth through age-appropriate lessons, activities, and safe environments. Training the next generation in God's ways.",
          category: "children",
          leader: "Mrs. Emily Rodriguez",
          meetingTime: "Sundays 9:30 AM & 11:00 AM",
          location: "Children's Wing",
          contactEmail: "children@churchconnect.org",
          memberCount: 25,
          established: "2006",
          highlights: ["Age-graded classes", "VBS programs", "Children's church"],
          openToNew: true,
          manifest: childrenManifest,
          folderName: "children"
        },
        {
          id: 7,
          name: "Drama",
          description: "Using creative storytelling and performance to communicate biblical messages and inspire audiences. Bringing Scripture to life through art.",
          category: "worship",
          leader: "Victoria Thompson",
          meetingTime: "Fridays 7:00 PM",
          location: "Fellowship Hall",
          contactEmail: "drama@churchconnect.org",
          memberCount: 20,
          established: "2015",
          highlights: ["Easter & Christmas productions", "Youth skits", "Community theater"],
          openToNew: true,
          manifest: dramaManifest,
          folderName: "drama"
        },
        {
          id: 8,
          name: "Media",
          description: "Managing audio, video, and technical support for services to enhance worship experience. Using technology to amplify God's message.",
          category: "worship",
          leader: "Samuel Okonkwo",
          meetingTime: "Thursdays 6:00 PM",
          location: "Media Room",
          contactEmail: "media@churchconnect.org",
          memberCount: 18,
          established: "2013",
          highlights: ["Live streaming", "Sound & lighting", "Content creation"],
          openToNew: true,
          manifest: mediaManifest,
          folderName: "media"
        },
        {
          id: 9,
          name: "Women",
          description: "Building sisterhood through Bible study, prayer, community service, and meaningful connections. Empowering women to grow in faith and purpose.",
          category: "fellowship",
          leader: "Mary Thompson",
          meetingTime: "Wednesdays 7:00 PM",
          location: "Fellowship Hall",
          contactEmail: "women@churchconnect.org",
          memberCount: 60,
          established: "2005",
          highlights: ["Monthly retreats", "Mentorship programs", "Community service"],
          openToNew: true,
          manifest: womenManifest,
          folderName: "women"
        },
        {
          id: 10,
          name: "Men",
          description: "Strengthening men in faith and brotherhood through study, accountability, and community service. Building godly men who lead with integrity.",
          category: "fellowship",
          leader: "Deacon Michael Davis",
          meetingTime: "Saturdays 8:00 AM",
          location: "Conference Room",
          contactEmail: "men@churchconnect.org",
          memberCount: 40,
          established: "2006",
          highlights: ["Men's breakfast", "Accountability groups", "Service projects"],
          openToNew: true,
          manifest: menManifest,
          folderName: "men"
        },
        {
          id: 11,
          name: "Alumni Group",
          description: "Connecting past and present members, fostering fellowship and maintaining relationships within our community. Once a member, always family.",
          category: "fellowship",
          leader: "Jennifer Martinez",
          meetingTime: "Monthly on 2nd Saturday",
          location: "Main Hall",
          contactEmail: "alumni@churchconnect.org",
          memberCount: 85,
          established: "2010",
          highlights: ["Reunion events", "Networking opportunities", "Legacy projects"],
          openToNew: true,
          manifest: alumniManifest,
          folderName: "alumni-group"
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  // Load images using dynamic imports
  useEffect(() => {
    const loadImages = async () => {
      const images = {};
      const imageIndexes = {};
      const autoPlayStates = {};
      
      for (const ministry of ministries) {
        if (ministry.manifest && ministry.manifest.images && ministry.manifest.images.length > 0) {
          const imagePaths = [];
          
          for (const imageName of ministry.manifest.images) {
            try {
              const imageModule = await import(`../../assets/ministries/${ministry.folderName}/${imageName}`);
              imagePaths.push(imageModule.default);
            } catch (error) {
              console.warn(`Could not load image: ${imageName} for ${ministry.name}`, error);
            }
          }
          
          if (imagePaths.length > 0) {
            images[ministry.id] = imagePaths;
            imageIndexes[ministry.id] = 0;
            // Enable autoplay by default for galleries with multiple images
            autoPlayStates[ministry.id] = imagePaths.length > 1;
          }
        }
      }
      
      setMinistryImages(images);
      setCurrentImageIndex(imageIndexes);
      setIsAutoPlaying(autoPlayStates);
    };

    if (ministries.length > 0) {
      loadImages();
    }
  }, [ministries]);

  // Automatic image rotation
  useEffect(() => {
    const intervals = {};

    Object.keys(ministryImages).forEach(ministryId => {
      const images = ministryImages[ministryId];
      if (images && images.length > 1 && isAutoPlaying[ministryId]) {
        intervals[ministryId] = setInterval(() => {
          setCurrentImageIndex(prev => ({
            ...prev,
            [ministryId]: (prev[ministryId] + 1) % images.length
          }));
        }, 4000); // Change image every 4 seconds
      }
    });

    return () => {
      Object.values(intervals).forEach(interval => clearInterval(interval));
    };
  }, [ministryImages, isAutoPlaying]);

  const categories = [
    { value: 'all', label: 'All Ministries', icon: '🏛️' },
    { value: 'worship', label: 'Worship', icon: '🎵' },
    { value: 'children', label: 'Children', icon: '👶' },
    { value: 'fellowship', label: 'Fellowship', icon: '🤝' },
    { value: 'service', label: 'Service', icon: '❤️' },
    { value: 'spiritual', label: 'Spiritual Growth', icon: '🙏' }
  ];

  const filteredMinistries = selectedCategory === 'all' 
    ? ministries 
    : ministries.filter(ministry => ministry.category === selectedCategory);

  const totalMembers = ministries.reduce((sum, m) => sum + (m.memberCount || 0), 0);

  const handleNextImage = (ministryId) => {
    const images = ministryImages[ministryId];
    setCurrentImageIndex(prev => ({
      ...prev,
      [ministryId]: (prev[ministryId] + 1) % images.length
    }));
    // Pause autoplay when user manually navigates
    setIsAutoPlaying(prev => ({ ...prev, [ministryId]: false }));
  };

  const handlePrevImage = (ministryId) => {
    const images = ministryImages[ministryId];
    setCurrentImageIndex(prev => ({
      ...prev,
      [ministryId]: (prev[ministryId] - 1 + images.length) % images.length
    }));
    // Pause autoplay when user manually navigates
    setIsAutoPlaying(prev => ({ ...prev, [ministryId]: false }));
  };

  const handleGoToImage = (ministryId, index) => {
    setCurrentImageIndex(prev => ({
      ...prev,
      [ministryId]: index
    }));
    // Pause autoplay when user manually navigates
    setIsAutoPlaying(prev => ({ ...prev, [ministryId]: false }));
  };

  const toggleAutoPlay = (ministryId) => {
    setIsAutoPlaying(prev => ({
      ...prev,
      [ministryId]: !prev[ministryId]
    }));
  };

  const getPlaceholderSvg = () => {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjI1MCIgdmlld0JveD0iMCAwIDQwMCAyNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMjUwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiBmaWxsPSIjNjY3ZWVhIiBmb250LWZhbWlseT0iQXJpYWwiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7ihpzihpzihpw8L3RleHQ+Cjwvc3ZnPgo=';
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading ministries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* Enhanced Hero Section with Gradient Animation */}
      <section style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        backgroundSize: '200% 200%',
        animation: 'gradientShift 15s ease infinite',
        padding: '80px 20px',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <style>{`
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
        `}</style>
        
        <div className={styles.heroContent} style={{ 
          maxWidth: '900px', 
          margin: '0 auto',
          animation: 'fadeInUp 1s ease-out'
        }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            padding: '10px 24px',
            borderRadius: '50px',
            marginBottom: '24px',
            fontSize: '0.95rem',
            fontWeight: '500'
          }}>
            <span style={{ marginRight: '8px' }}>✨</span>
            Campus Ministries Fellowship
          </div>
          
          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: '800',
            marginBottom: '20px',
            textShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            Discover Your Ministry
          </h1>
          
          <p style={{
            fontSize: '1.25rem',
            lineHeight: '1.8',
            marginBottom: '10px',
            maxWidth: '700px',
            margin: '0 auto 40px',
            opacity: 0.95
          }}>
            "Now you are the body of Christ, and each one of you is a part of it."
          </p>
          <p style={{
            fontSize: '1rem',
            fontStyle: 'italic',
            opacity: 0.85,
            marginBottom: '50px'
          }}>
            — 1 Corinthians 12:27
          </p>
          
          {/* Enhanced Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '30px',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            {[
              { number: ministries.length, label: 'Active Ministries', icon: '🏛️' },
              { number: `${totalMembers}+`, label: 'Serving Members', icon: '👥' },
              { number: '100%', label: 'Open to New Members', icon: '✅' }
            ].map((stat, idx) => (
              <div key={idx} style={{
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                padding: '30px 20px',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                animation: `fadeInUp 1s ease-out ${idx * 0.2}s backwards`
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{stat.icon}</div>
                <div style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '8px' }}>
                  {stat.number}
                </div>
                <div style={{ fontSize: '0.95rem', opacity: 0.9 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Quote Section */}
      {showTestimonial && (
        <section style={{
          padding: '60px 20px',
          background: 'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)',
          color: 'white',
          position: 'relative'
        }}>
          <button 
            onClick={() => setShowTestimonial(false)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255,255,255,0.25)',
              border: 'none',
              color: 'white',
              padding: '10px 14px',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '20px',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.4)'}
            onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.25)'}
          >
            ×
          </button>
          <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>💭</div>
            <h2 style={{ fontSize: '2rem', marginBottom: '20px', fontWeight: '700' }}>
              Why Join a Ministry?
            </h2>
            <p style={{ 
              fontSize: '1.2rem', 
              lineHeight: '1.8', 
              marginBottom: '30px',
              fontStyle: 'italic'
            }}>
              "Joining the choir transformed my walk with God. I found not just a place to serve, 
              but a family that prays together, grows together, and celebrates together. 
              Every Thursday rehearsal is a blessing!"
            </p>
            <div style={{
              display: 'inline-block',
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '12px 24px',
              borderRadius: '50px',
              fontWeight: '600'
            }}>
              — Sarah M., Choir Member since 2018
            </div>
          </div>
        </section>
      )}

      {/* Enhanced Filter Section */}
      <section style={{ padding: '50px 20px', background: '#f9fafb' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h3 style={{ 
            textAlign: 'center', 
            fontSize: '1.8rem', 
            marginBottom: '30px',
            color: '#1f2937',
            fontWeight: '700'
          }}>
            Explore By Category
          </h3>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '15px',
            justifyContent: 'center',
            marginBottom: '20px'
          }}>
            {categories.map(category => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                style={{
                  background: selectedCategory === category.value 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                    : 'white',
                  color: selectedCategory === category.value ? 'white' : '#374151',
                  border: selectedCategory === category.value ? 'none' : '2px solid #e5e7eb',
                  padding: '12px 24px',
                  borderRadius: '50px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: selectedCategory === category.value 
                    ? '0 4px 15px rgba(102, 126, 234, 0.4)' 
                    : '0 2px 5px rgba(0,0,0,0.05)',
                  transform: selectedCategory === category.value ? 'translateY(-2px)' : 'none'
                }}
                onMouseOver={(e) => {
                  if (selectedCategory !== category.value) {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseOut={(e) => {
                  if (selectedCategory !== category.value) {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.transform = 'none';
                  }
                }}
              >
                <span style={{ marginRight: '8px' }}>{category.icon}</span>
                {category.label}
              </button>
            ))}
          </div>
          <p style={{ 
            textAlign: 'center', 
            color: '#6b7280',
            fontSize: '1rem',
            fontWeight: '500'
          }}>
            Showing {filteredMinistries.length} {filteredMinistries.length === 1 ? 'ministry' : 'ministries'}
          </p>
        </div>
      </section>

      {/* Ministries Grid with Enhanced Cards */}
      <section style={{ padding: '60px 20px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {filteredMinistries.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: 'white',
              borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🔍</div>
              <h3 style={{ fontSize: '1.8rem', marginBottom: '10px', color: '#1f2937' }}>
                No ministries found
              </h3>
              <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
                Try selecting a different category or check back later for updates.
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
              gap: '30px'
            }}>
              {filteredMinistries.map(ministry => {
                const hasImages = ministryImages[ministry.id] && ministryImages[ministry.id].length > 0;
                const currentIndex = currentImageIndex[ministry.id] || 0;
                
                return (
                  <div key={ministry.id} style={{
                    background: 'white',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-8px)';
                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.12)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.08)';
                  }}>
                    {/* Image Gallery */}
                    <div style={{ position: 'relative', height: '280px', overflow: 'hidden' }}>
                      {hasImages ? (
                        <>
                          <img 
                            src={ministryImages[ministry.id][currentIndex]}
                            alt={`${ministry.name} - Image ${currentIndex + 1}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              transition: 'transform 0.5s ease'
                            }}
                            onError={(e) => {
                              e.target.src = getPlaceholderSvg();
                            }}
                          />
                          
                          {/* Gradient Overlay */}
                          <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: '100px',
                            background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)'
                          }} />
                          
                          {ministryImages[ministry.id].length > 1 && (
                            <>
                              {/* Navigation Buttons */}
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePrevImage(ministry.id);
                                }}
                                style={{
                                  position: 'absolute',
                                  left: '15px',
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  background: 'rgba(255, 255, 255, 0.9)',
                                  border: 'none',
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '50%',
                                  fontSize: '18px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.3s ease',
                                  boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                                }}
                                onMouseOver={(e) => {
                                  e.target.style.background = 'white';
                                  e.target.style.transform = 'translateY(-50%) scale(1.1)';
                                }}
                                onMouseOut={(e) => {
                                  e.target.style.background = 'rgba(255, 255, 255, 0.9)';
                                  e.target.style.transform = 'translateY(-50%) scale(1)';
                                }}
                              >
                                ◀
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNextImage(ministry.id);
                                }}
                                style={{
                                  position: 'absolute',
                                  right: '15px',
                                  top: '50%',
                                  transform: 'translateY(-50%)',
                                  background: 'rgba(255, 255, 255, 0.9)',
                                  border: 'none',
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '50%',
                                  fontSize: '18px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.3s ease',
                                  boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                                }}
                                onMouseOver={(e) => {
                                  e.target.style.background = 'white';
                                  e.target.style.transform = 'translateY(-50%) scale(1.1)';
                                }}
                                onMouseOut={(e) => {
                                  e.target.style.background = 'rgba(255, 255, 255, 0.9)';
                                  e.target.style.transform = 'translateY(-50%) scale(1)';
                                }}
                              >
                                ▶
                              </button>
                              
                              {/* Play/Pause Button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleAutoPlay(ministry.id);
                                }}
                                style={{
                                  position: 'absolute',
                                  top: '15px',
                                  right: '15px',
                                  background: 'rgba(0, 0, 0, 0.6)',
                                  backdropFilter: 'blur(10px)',
                                  border: 'none',
                                  color: 'white',
                                  padding: '8px 16px',
                                  borderRadius: '20px',
                                  fontSize: '0.85rem',
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease',
                                  fontWeight: '600'
                                }}
                                onMouseOver={(e) => {
                                  e.target.style.background = 'rgba(0, 0, 0, 0.8)';
                                }}
                                onMouseOut={(e) => {
                                  e.target.style.background = 'rgba(0, 0, 0, 0.6)';
                                }}
                              >
                                {isAutoPlaying[ministry.id] ? '⏸ Pause' : '▶ Play'}
                              </button>
                              
                              {/* Dots Indicator */}
                              <div style={{
                                position: 'absolute',
                                bottom: '15px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                display: 'flex',
                                gap: '8px',
                                zIndex: 10
                              }}>
                                {ministryImages[ministry.id].map((_, idx) => (
                                  <button
                                    key={idx}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleGoToImage(ministry.id, idx);
                                    }}
                                    style={{
                                      width: idx === currentIndex ? '24px' : '8px',
                                      height: '8px',
                                      borderRadius: '4px',
                                      border: 'none',
                                      background: idx === currentIndex 
                                        ? 'white' 
                                        : 'rgba(255, 255, 255, 0.5)',
                                      cursor: 'pointer',
                                      transition: 'all 0.3s ease',
                                      boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
                                    }}
                                  />
                                ))}
                              </div>
                              
                              {/* Image Counter */}
                              <div style={{
                                position: 'absolute',
                                bottom: '15px',
                                right: '15px',
                                background: 'rgba(0, 0, 0, 0.6)',
                                backdropFilter: 'blur(10px)',
                                color: 'white',
                                padding: '6px 12px',
                                borderRadius: '20px',
                                fontSize: '0.85rem',
                                fontWeight: '600'
                              }}>
                                {currentIndex + 1} / {ministryImages[ministry.id].length}
                              </div>
                            </>
                          )}
                        </>
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#6b7280'
                        }}>
                          <span style={{ fontSize: '3rem', marginBottom: '10px', animation: 'float 3s ease-in-out infinite' }}>
                            📸
                          </span>
                          <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>Images Coming Soon</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Category Badge */}
                    <div style={{
                      position: 'absolute',
                      top: '295px',
                      left: '20px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      boxShadow: '0 4px 10px rgba(102, 126, 234, 0.4)',
                      zIndex: 10
                    }}>
                      {categories.find(cat => cat.value === ministry.category)?.icon}{' '}
                      {categories.find(cat => cat.value === ministry.category)?.label}
                    </div>
                    
                    {/* Ministry Content */}
                    <div style={{ padding: '30px 25px 25px' }}>
                      <h3 style={{
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        marginBottom: '15px',
                        color: '#1f2937',
                        marginTop: '10px'
                      }}>
                        {ministry.name}
                      </h3>
                      
                      {/* Stats */}
                      <div style={{ 
                        display: 'flex', 
                        gap: '15px', 
                        marginBottom: '15px',
                        fontSize: '0.9rem',
                        color: '#6b7280',
                        fontWeight: '500'
                      }}>
                        {ministry.memberCount && (
                          <span style={{
                            background: '#f3f4f6',
                            padding: '6px 12px',
                            borderRadius: '20px'
                          }}>
                            👥 {ministry.memberCount} members
                          </span>
                        )}
                        {ministry.established && (
                          <span style={{
                            background: '#f3f4f6',
                            padding: '6px 12px',
                            borderRadius: '20px'
                          }}>
                            📅 Est. {ministry.established}
                          </span>
                        )}
                      </div>
                      
                      <p style={{
                        color: '#4b5563',
                        lineHeight: '1.7',
                        marginBottom: '20px',
                        fontSize: '0.95rem'
                      }}>
                        {ministry.description}
                      </p>
                      
                      {/* Highlights */}
                      {ministry.highlights && ministry.highlights.length > 0 && (
                        <div style={{ 
                          margin: '20px 0',
                          padding: '15px',
                          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                          borderRadius: '12px',
                          border: '1px solid #fcd34d'
                        }}>
                          <h4 style={{ 
                            fontSize: '0.95rem', 
                            fontWeight: '700',
                            marginBottom: '10px',
                            color: '#92400e',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            ⭐ Key Highlights
                          </h4>
                          <ul style={{ 
                            margin: 0,
                            paddingLeft: '20px',
                            fontSize: '0.9rem',
                            color: '#78350f'
                          }}>
                            {ministry.highlights.map((highlight, idx) => (
                              <li key={idx} style={{ marginBottom: '6px' }}>{highlight}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Details Grid */}
                      <div style={{
                        display: 'grid',
                        gap: '12px',
                        marginBottom: '20px'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px',
                          background: '#f9fafb',
                          borderRadius: '8px'
                        }}>
                          <span style={{ fontSize: '1.2rem' }}>👤</span>
                          <div>
                            <div style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: '600' }}>Leader</div>
                            <div style={{ fontSize: '0.95rem', color: '#1f2937', fontWeight: '600' }}>{ministry.leader}</div>
                          </div>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px',
                          background: '#f9fafb',
                          borderRadius: '8px'
                        }}>
                          <span style={{ fontSize: '1.2rem' }}>⏰</span>
                          <div>
                            <div style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: '600' }}>Meeting Time</div>
                            <div style={{ fontSize: '0.95rem', color: '#1f2937', fontWeight: '600' }}>{ministry.meetingTime}</div>
                          </div>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px',
                          background: '#f9fafb',
                          borderRadius: '8px'
                        }}>
                          <span style={{ fontSize: '1.2rem' }}>📍</span>
                          <div>
                            <div style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: '600' }}>Location</div>
                            <div style={{ fontSize: '0.95rem', color: '#1f2937', fontWeight: '600' }}>{ministry.location}</div>
                          </div>
                        </div>
                      </div>
                      
                      {ministry.openToNew && (
                        <div style={{
                          background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                          color: '#065f46',
                          padding: '12px',
                          borderRadius: '10px',
                          fontSize: '0.9rem',
                          fontWeight: '700',
                          textAlign: 'center',
                          margin: '20px 0',
                          border: '2px solid #10b981'
                        }}>
                          ✅ Currently Accepting New Members!
                        </div>
                      )}
                      
                      {/* Action Buttons */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '12px',
                        marginTop: '20px'
                      }}>
                        <a 
                          href={`/form?ministry=${encodeURIComponent(ministry.name)}`}
                          style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            padding: '14px 20px',
                            borderRadius: '12px',
                            textDecoration: 'none',
                            fontWeight: '700',
                            textAlign: 'center',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                            fontSize: '0.95rem'
                          }}
                          onMouseOver={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
                          }}
                          onMouseOut={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                          }}
                        >
                          Join Now
                        </a>
                        <a 
                          href={`mailto:${ministry.contactEmail}`}
                          style={{
                            background: 'white',
                            color: '#667eea',
                            padding: '14px 20px',
                            borderRadius: '12px',
                            textDecoration: 'none',
                            fontWeight: '700',
                            textAlign: 'center',
                            border: '2px solid #667eea',
                            transition: 'all 0.3s ease',
                            fontSize: '0.95rem'
                          }}
                          onMouseOver={(e) => {
                            e.target.style.background = '#667eea';
                            e.target.style.color = 'white';
                            e.target.style.transform = 'translateY(-2px)';
                          }}
                          onMouseOut={(e) => {
                            e.target.style.background = 'white';
                            e.target.style.color = '#667eea';
                            e.target.style.transform = 'translateY(0)';
                          }}
                        >
                          Contact
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section style={{ padding: '80px 20px', background: 'linear-gradient(to bottom, #f9fafb, white)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ 
            textAlign: 'center', 
            fontSize: '2.5rem', 
            marginBottom: '50px',
            color: '#1f2937',
            fontWeight: '800'
          }}>
            Frequently Asked Questions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {[
              {
                q: "Can I join multiple ministries?",
                a: "Absolutely! Many members serve in 2-3 ministries. We encourage you to start with one and expand as you feel led.",
                icon: "🤔"
              },
              {
                q: "Do I need special skills?",
                a: "Not at all! Every ministry provides training and mentorship. Your willingness to serve is what matters most.",
                icon: "💪"
              },
              {
                q: "What's the time commitment?",
                a: "It varies by ministry. Most require 2-4 hours per week. We'll help you find what fits your schedule.",
                icon: "⏱️"
              },
              {
                q: "How do I get started?",
                a: "Click 'Join Now' on any card above, or attend our monthly Ministry Fair on the first Sunday.",
                icon: "🚀"
              }
            ].map((faq, idx) => (
              <details 
                key={idx}
                style={{
                  background: 'white',
                  padding: '25px',
                  borderRadius: '16px',
                  border: '2px solid #e5e7eb',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#667eea';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.15)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <summary style={{ 
                  fontWeight: '700',
                  color: '#1f2937',
                  fontSize: '1.15rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span style={{ fontSize: '1.5rem' }}>{faq.icon}</span>
                  {faq.q}
                </summary>
                <p style={{ 
                  marginTop: '15px',
                  marginLeft: '40px',
                  color: '#6b7280',
                  lineHeight: '1.7',
                  fontSize: '1rem'
                }}>
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section style={{
        padding: '80px 20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          top: '-200px',
          right: '-100px',
          animation: 'float 6s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          bottom: '-150px',
          left: '-100px',
          animation: 'float 8s ease-in-out infinite'
        }} />
        
        <div style={{ 
          maxWidth: '800px', 
          margin: '0 auto',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🌟</div>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: '800',
            marginBottom: '20px'
          }}>
            Your Ministry Journey Starts Here
          </h2>
          <p style={{
            fontSize: '1.2rem',
            lineHeight: '1.8',
            marginBottom: '40px',
            opacity: 0.95
          }}>
            Don't wait to make an impact! Join hundreds of members who are already 
            serving, growing, and transforming lives through our ministries. 
            Your gifts and talents are needed in God's kingdom work.
          </p>
          <div style={{
            display: 'flex',
            gap: '20px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '30px'
          }}>
            <a 
              href="/form"
              style={{
                background: 'white',
                color: '#667eea',
                padding: '16px 40px',
                borderRadius: '50px',
                textDecoration: 'none',
                fontWeight: '700',
                fontSize: '1.1rem',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                display: 'inline-block'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-4px)';
                e.target.style.boxShadow = '0 12px 30px rgba(0,0,0,0.3)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)';
              }}
            >
              Register as Member
            </a>
            <a 
              href="/contact"
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                padding: '16px 40px',
                borderRadius: '50px',
                textDecoration: 'none',
                fontWeight: '700',
                fontSize: '1.1rem',
                border: '2px solid white',
                transition: 'all 0.3s ease',
                display: 'inline-block'
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'white';
                e.target.style.color = '#667eea';
                e.target.style.transform = 'translateY(-4px)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                e.target.style.color = 'white';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              Ask Questions
            </a>
          </div>
          <p style={{ 
            fontSize: '0.95rem',
            fontStyle: 'italic',
            opacity: 0.9
          }}>
            📧 Questions? Contact our Ministry Coordinator at ministries@churchconnect.org
          </p>
        </div>
      </section>
    </div>
  );
};

export default MinistriesPage;