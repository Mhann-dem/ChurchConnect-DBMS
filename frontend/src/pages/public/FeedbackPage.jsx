import React, { useState } from 'react';
import styles from './PublicPages.module.css';

const FeedbackPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    feedbackType: 'general',
    serviceDate: '',
    rating: 5,
    subject: '',
    message: '',
    anonymous: false,
    followUp: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const feedbackTypes = [
    { id: 'general', name: 'General Feedback', icon: '💬', description: 'General comments or suggestions' },
    { id: 'service', name: 'Service Experience', icon: '⛪', description: 'Feedback about worship services' },
    { id: 'ministry', name: 'Ministry Programs', icon: '🤝', description: 'Comments about specific ministries' },
    { id: 'facilities', name: 'Facilities & Environment', icon: '🏢', description: 'Building, parking, accessibility' },
    { id: 'staff', name: 'Staff & Leadership', icon: '👥', description: 'Pastor, staff, or volunteer feedback' },
    { id: 'events', name: 'Events & Activities', icon: '🎉', description: 'Special events and programs' },
    { id: 'website', name: 'Website & Technology', icon: '💻', description: 'Digital experience and online services' },
    { id: 'suggestion', name: 'Suggestions', icon: '💡', description: 'Ideas for improvement or new initiatives' }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        phone: '',
        feedbackType: 'general',
        serviceDate: '',
        rating: 5,
        subject: '',
        message: '',
        anonymous: false,
        followUp: true
      });
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating, interactive = false) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span
        key={index}
        className={`${styles.star} ${index < rating ? styles.starFilled : ''} ${
          interactive ? styles.starInteractive : ''
        }`}
        onClick={interactive ? () => setFormData(prev => ({ ...prev, rating: index + 1 })) : undefined}
      >
        ⭐
      </span>
    ));
  };

  return (
    <div className={styles.homePage}>
      {/* Feedback Hero Section */}
      <section className={styles.feedbackHeroSection}>
        <div className={styles.feedbackHeroBackground}>
          <div className={styles.feedbackHeroOverlay}></div>
        </div>
        <div className={styles.container}>
          <div className={styles.feedbackHeroContent}>
            <div className={styles.welcomeChip}>
              <span className={styles.chipIcon}>💭</span>
              Your Voice Matters
            </div>
            <h1 className={styles.feedbackHeroTitle}>Share Your Feedback</h1>
            <p className={styles.feedbackHeroSubtitle}>
              Help us serve you better by sharing your thoughts, suggestions, and experiences. 
              Your feedback helps us grow and improve as a church family.
            </p>
          </div>
        </div>
      </section>

      {/* Feedback Types Section */}
      <section className={styles.feedbackTypesSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>What would you like to share feedback about?</h2>
          </div>
          
          <div className={styles.feedbackTypesGrid}>
            {feedbackTypes.map(type => (
              <div
                key={type.id}
                className={`${styles.feedbackTypeCard} ${
                  formData.feedbackType === type.id ? styles.feedbackTypeCardActive : ''
                }`}
                onClick={() => setFormData(prev => ({ ...prev, feedbackType: type.id }))}
              >
                <div className={styles.feedbackTypeIcon}>{type.icon}</div>
                <h3 className={styles.feedbackTypeName}>{type.name}</h3>
                <p className={styles.feedbackTypeDescription}>{type.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feedback Form Section */}
      <section className={styles.feedbackFormSection}>
        <div className={styles.container}>
          <div className={styles.feedbackFormContainer}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>Tell Us More</h2>
              <p className={styles.formSubtitle}>
                Your feedback is confidential and will be reviewed by our leadership team.
              </p>
            </div>

            {submitStatus === 'success' && (
              <div className={styles.successMessage}>
                <div className={styles.successIcon}>✅</div>
                <h3>Thank You!</h3>
                <p>Your feedback has been submitted successfully. We appreciate you taking the time to help us improve.</p>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className={styles.errorMessage}>
                <div className={styles.errorIcon}>❌</div>
                <h3>Submission Failed</h3>
                <p>There was an error submitting your feedback. Please try again or contact us directly.</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.feedbackForm}>
              {/* Contact Information */}
              <div className={styles.formSection}>
                <h3 className={styles.formSectionTitle}>Contact Information</h3>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={styles.formInput}
                      disabled={formData.anonymous}
                      required={!formData.anonymous}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={styles.formInput}
                      disabled={formData.anonymous}
                      required={!formData.anonymous}
                    />
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Phone (Optional)</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={styles.formInput}
                      disabled={formData.anonymous}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <div className={styles.checkboxGroup}>
                      <input
                        type="checkbox"
                        name="anonymous"
                        checked={formData.anonymous}
                        onChange={handleInputChange}
                        className={styles.formCheckbox}
                        id="anonymous"
                      />
                      <label htmlFor="anonymous" className={styles.checkboxLabel}>
                        Submit anonymously
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feedback Details */}
              <div className={styles.formSection}>
                <h3 className={styles.formSectionTitle}>Feedback Details</h3>
                
                {formData.feedbackType === 'service' && (
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Service Date (Optional)</label>
                    <input
                      type="date"
                      name="serviceDate"
                      value={formData.serviceDate}
                      onChange={handleInputChange}
                      className={styles.formInput}
                    />
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Overall Rating</label>
                  <div className={styles.ratingContainer}>
                    <div className={styles.starsContainer}>
                      {renderStars(formData.rating, true)}
                    </div>
                    <span className={styles.ratingText}>
                      {formData.rating} of 5 stars
                    </span>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className={styles.formInput}
                    placeholder="Brief summary of your feedback"
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Your Feedback</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    className={styles.formTextarea}
                    rows="6"
                    placeholder="Please share your detailed feedback, suggestions, or concerns..."
                    required
                  ></textarea>
                  <div className={styles.characterCount}>
                    {formData.message.length} characters
                  </div>
                </div>
              </div>

              {/* Follow-up Preference */}
              {!formData.anonymous && (
                <div className={styles.formSection}>
                  <h3 className={styles.formSectionTitle}>Follow-up Preference</h3>
                  <div className={styles.checkboxGroup}>
                    <input
                      type="checkbox"
                      name="followUp"
                      checked={formData.followUp}
                      onChange={handleInputChange}
                      className={styles.formCheckbox}
                      id="followUp"
                    />
                    <label htmlFor="followUp" className={styles.checkboxLabel}>
                      I would like someone to follow up with me about this feedback
                    </label>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className={styles.formActions}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`${styles.submitBtn} ${isSubmitting ? styles.submitting : ''}`}
                >
                  {isSubmitting ? (
                    <>
                      <span className={styles.spinner}></span>
                      Submitting...
                    </>
                  ) : (
                    'Submit Feedback'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Contact Alternatives */}
          <div className={styles.contactAlternatives}>
            <h3 className={styles.alternativesTitle}>Other Ways to Reach Us</h3>
            <div className={styles.alternativesGrid}>
              <div className={styles.contactMethod}>
                <div className={styles.contactIcon}>📞</div>
                <div className={styles.contactDetails}>
                  <h5>Call Us</h5>
                  <p>+233 24 123 4567</p>
                  <small>Mon-Fri: 9AM-5PM</small>
                </div>
              </div>
              <div className={styles.contactMethod}>
                <div className={styles.contactIcon}>✉️</div>
                <div className={styles.contactDetails}>
                  <h5>Email Us</h5>
                  <p>feedback@deeperlife.org</p>
                  <small>We respond within 24 hours</small>
                </div>
              </div>
              <div className={styles.contactMethod}>
                <div className={styles.contactIcon}>📍</div>
                <div className={styles.contactDetails}>
                  <h5>Visit Us</h5>
                  <p>123 Church Street, Kumasi</p>
                  <small>Office hours: Tue-Thu</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FeedbackPage;