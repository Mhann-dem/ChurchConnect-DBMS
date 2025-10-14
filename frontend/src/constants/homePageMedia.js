// Import your media assets
import heroBgJpeg from '../assets/images/hero-bg.jpeg';
import heroBgJpg from '../assets/images/hero-bg.jpg';
import youthMinistry from '../assets/images/hero-bg.jpeg';
import bibleStudy from '../assets/images/hero-bg.jpg';
import communityOutreach from '../assets/images/hero-bg.jpeg';
import choirPractice from '../assets/images/hero-bg.jpg';
import welcomeVideo from '../assets/images/Welcome Message.mp4';

// Welcome Section Media
export const WELCOME_MEDIA = {
  video: welcomeVideo,
  fallbackImage: heroBgJpeg
};

// Activities Section Media Array
export const ACTIVITIES_MEDIA = [
  { type: 'image', src: heroBgJpeg },
  { type: 'video', src: welcomeVideo },
  { type: 'image', src: youthMinistry },
  { type: 'image', src: bibleStudy },
  { type: 'video', src: welcomeVideo },
  { type: 'image', src: communityOutreach },
  { type: 'image', src: choirPractice },
];

// Events Section Media Array
export const EVENTS_MEDIA = [
  { type: 'image', src: heroBgJpg },
  { type: 'video', src: welcomeVideo },
  { type: 'image', src: youthMinistry },
  { type: 'image', src: bibleStudy },
];

// Membership Section Media Array
export const MEMBERSHIP_MEDIA = [
  { type: 'image', src: heroBgJpeg },
  { type: 'video', src: welcomeVideo },
  { type: 'image', src: heroBgJpg },
  { type: 'video', src: welcomeVideo },
  { type: 'image', src: heroBgJpg },
  { type: 'video', src: welcomeVideo },
  { type: 'image', src: heroBgJpeg },
  { type: 'video', src: welcomeVideo }
];

// Rotation Intervals (in milliseconds)
export const ROTATION_INTERVALS = {
  activities: 8000,
  events: 7000,
  membership: 8000
};

// Church Statistics
export const CHURCH_STATS = [
  { number: '500+', label: 'Active Members', ariaLabel: '500 plus' },
  { number: '15+', label: 'Years of Ministry', ariaLabel: '15 plus' },
  { number: '12', label: 'Weekly Programs', ariaLabel: '12' }
];

// Activities Data
export const ACTIVITIES_DATA = [
  {
    id: 'sunday-worship',
    icon: 'worship',
    title: 'Sunday Worship',
    time: 'Every Sunday • 9:00 AM & 11:00 AM',
    dateTime: '09:00',
    description: 'Join us for inspiring worship, biblical teaching, and uplifting music that draws us closer to God and strengthens our faith community.',
    duration: '90 minutes'
  },
  {
    id: 'bible-study',
    icon: 'book',
    title: 'Bible Study',
    time: 'Wednesday • 7:00 PM',
    dateTime: '19:00',
    description: 'Deepen your understanding of God\'s Word through engaging discussions, fellowship, and practical application of biblical principles.',
    duration: '75 minutes'
  },
  {
    id: 'youth-ministry',
    icon: 'users',
    title: 'Youth Ministry',
    time: 'Friday • 6:30 PM',
    dateTime: '18:30',
    description: 'Dynamic programs for teenagers to grow in faith, build lasting friendships, and develop leadership skills in a fun environment.',
    duration: '2 hours'
  },
  {
    id: 'community-outreach',
    icon: 'heart',
    title: 'Community Outreach',
    time: 'Saturday • 10:00 AM',
    dateTime: '10:00',
    description: 'Serve our community through food drives, charity work, and acts of kindness, sharing God\'s love through practical service.',
    duration: '3 hours'
  },
  {
    id: 'prayer-worship',
    icon: 'check',
    title: 'Prayer & Worship',
    time: 'Tuesday • 6:00 AM',
    dateTime: '06:00',
    description: 'Start your week with prayer, meditation, and intimate worship in God\'s presence, finding strength for the days ahead.',
    duration: '60 minutes'
  },
  {
    id: 'children-ministry',
    icon: 'users',
    title: 'Children\'s Ministry',
    time: 'Sunday • 9:00 AM',
    dateTime: '09:00',
    description: 'Fun, faith-filled programs designed to help children discover God\'s love through age-appropriate activities and teaching.',
    duration: '90 minutes'
  }
];

// Additional Activities Info Cards
export const ACTIVITIES_INFO = [
  {
    id: 'join-anytime',
    title: 'Join Any Time',
    description: 'All our activities welcome newcomers. No registration required - just come as you are!'
  },
  {
    id: 'all-ages',
    title: 'All Ages Welcome',
    description: 'From toddlers to seniors, we have programs designed for every stage of life and faith journey.'
  },
  {
    id: 'free-participation',
    title: 'Free Participation',
    description: 'All church activities are completely free. We believe faith should be accessible to everyone.'
  }
];

// Contact Methods
export const CONTACT_METHODS = [
  {
    id: 'phone',
    icon: '📞',
    title: 'Call Us',
    primary: '(555) 123-4567',
    secondary: 'Mon-Fri: 9AM-5PM'
  },
  {
    id: 'email',
    icon: '✉️',
    title: 'Email Us',
    primary: 'info@deeperlife.org',
    secondary: 'We respond within 24hrs'
  },
  {
    id: 'location',
    icon: '📍',
    title: 'Visit Us',
    primary: '123 Faith Avenue',
    secondary: 'Campus District',
    tertiary: 'Sunday Services: 9AM & 11AM'
  }
];

// Membership Benefits
export const MEMBERSHIP_BENEFITS = [
  'Pastoral care and spiritual guidance',
  'Access to all ministry programs',
  'Leadership and service opportunities',
  'Fellowship with like-minded believers',
  'Prayer support during life challenges',
  'Discipleship and mentorship programs'
];

// Social Media Links
export const SOCIAL_MEDIA = [
  { platform: 'facebook', icon: '📘', url: '#', label: 'Follow us on Facebook' },
  { platform: 'instagram', icon: '📷', url: '#', label: 'Follow us on Instagram' },
  { platform: 'twitter', icon: '🦅', url: '#', label: 'Follow us on Twitter' },
  { platform: 'youtube', icon: '📺', url: '#', label: 'Subscribe on YouTube' }
];

// Export all images for use in other components
export const IMAGES = {
  heroBgJpeg,
  heroBgJpg,
  youthMinistry,
  bibleStudy,
  communityOutreach,
  choirPractice
};

export const VIDEOS = {
  welcomeVideo
};