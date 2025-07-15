import React from 'react';
import { CheckCircle, User, Mail, Phone, MapPin, Heart, DollarSign, Users } from 'lucide-react';
import styles from '../Form.module.css';

const Confirmation = ({ formData, onBack, onSubmit, isSubmitting }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatFrequency = (frequency) => {
    const frequencies = {
      'one-time': 'One-time',
      'weekly': 'Weekly',
      'monthly': 'Monthly',
      'quarterly': 'Quarterly',
      'annually': 'Annually'
    };
    return frequencies[frequency] || frequency;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getContactMethodDisplay = (method) => {
    const methods = {
      'email': 'Email',
      'phone': 'Phone',
      'sms': 'Text Message',
      'mail': 'Mail',
      'no_contact': 'No Contact'
    };
    return methods[method] || method;
  };

  return (
    <div className={styles.confirmationContainer}>
      <div className={styles.confirmationHeader}>
        <CheckCircle className={styles.successIcon} size={48} />
        <h2>Please Review Your Information</h2>
        <p>Please review all the information you've provided before submitting your registration.</p>
      </div>

      <div className={styles.confirmationSections}>
        {/* Personal Information */}
        <div className={styles.confirmationSection}>
          <div className={styles.sectionHeader}>
            <User className={styles.sectionIcon} size={20} />
            <h3>Personal Information</h3>
          </div>
          <div className={styles.confirmationGrid}>
            <div className={styles.confirmationItem}>
              <label>Full Name:</label>
              <span>{formData.firstName} {formData.lastName}</span>
            </div>
            {formData.preferredName && (
              <div className={styles.confirmationItem}>
                <label>Preferred Name:</label>
                <span>{formData.preferredName}</span>
              </div>
            )}
            <div className={styles.confirmationItem}>
              <label>Date of Birth:</label>
              <span>{formatDate(formData.dateOfBirth)}</span>
            </div>
            <div className={styles.confirmationItem}>
              <label>Gender:</label>
              <span>{formData.gender}</span>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className={styles.confirmationSection}>
          <div className={styles.sectionHeader}>
            <Mail className={styles.sectionIcon} size={20} />
            <h3>Contact Information</h3>
          </div>
          <div className={styles.confirmationGrid}>
            <div className={styles.confirmationItem}>
              <label>Email:</label>
              <span>{formData.email}</span>
            </div>
            <div className={styles.confirmationItem}>
              <label>Phone:</label>
              <span>{formData.phone}</span>
            </div>
            {formData.alternatePhone && (
              <div className={styles.confirmationItem}>
                <label>Alternate Phone:</label>
                <span>{formData.alternatePhone}</span>
              </div>
            )}
            <div className={styles.confirmationItem}>
              <label>Preferred Contact Method:</label>
              <span>{getContactMethodDisplay(formData.preferredContactMethod)}</span>
            </div>
            <div className={styles.confirmationItem}>
              <label>Preferred Language:</label>
              <span>{formData.preferredLanguage}</span>
            </div>
          </div>
        </div>

        {/* Address Information */}
        {formData.address && (
          <div className={styles.confirmationSection}>
            <div className={styles.sectionHeader}>
              <MapPin className={styles.sectionIcon} size={20} />
              <h3>Address</h3>
            </div>
            <div className={styles.confirmationGrid}>
              <div className={styles.confirmationItem}>
                <label>Address:</label>
                <span>{formData.address}</span>
              </div>
            </div>
          </div>
        )}

        {/* Ministry Interests */}
        {formData.ministryInterests && formData.ministryInterests.length > 0 && (
          <div className={styles.confirmationSection}>
            <div className={styles.sectionHeader}>
              <Heart className={styles.sectionIcon} size={20} />
              <h3>Ministry Interests</h3>
            </div>
            <div className={styles.confirmationGrid}>
              <div className={styles.confirmationItem}>
                <label>Selected Ministries:</label>
                <div className={styles.ministryList}>
                  {formData.ministryInterests.map((ministry, index) => (
                    <span key={index} className={styles.ministryTag}>
                      {ministry}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pledge Information */}
        {formData.pledgeAmount && (
          <div className={styles.confirmationSection}>
            <div className={styles.sectionHeader}>
              <DollarSign className={styles.sectionIcon} size={20} />
              <h3>Pledge Information</h3>
            </div>
            <div className={styles.confirmationGrid}>
              <div className={styles.confirmationItem}>
                <label>Pledge Amount:</label>
                <span>{formatCurrency(formData.pledgeAmount)}</span>
              </div>
              <div className={styles.confirmationItem}>
                <label>Pledge Frequency:</label>
                <span>{formatFrequency(formData.pledgeFrequency)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Family Information */}
        {formData.familyMembers && formData.familyMembers.length > 0 && (
          <div className={styles.confirmationSection}>
            <div className={styles.sectionHeader}>
              <Users className={styles.sectionIcon} size={20} />
              <h3>Family Information</h3>
            </div>
            <div className={styles.familyMembersList}>
              {formData.familyMembers.map((member, index) => (
                <div key={index} className={styles.familyMemberItem}>
                  <div className={styles.familyMemberInfo}>
                    <span className={styles.familyMemberName}>
                      {member.firstName} {member.lastName}
                    </span>
                    <span className={styles.familyMemberDetails}>
                      {member.relationship} • {formatDate(member.dateOfBirth)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prayer Request */}
        {formData.prayerRequest && (
          <div className={styles.confirmationSection}>
            <div className={styles.sectionHeader}>
              <Heart className={styles.sectionIcon} size={20} />
              <h3>Prayer Request</h3>
            </div>
            <div className={styles.prayerRequestText}>
              {formData.prayerRequest}
            </div>
          </div>
        )}

        {/* Emergency Contact */}
        {(formData.emergencyContactName || formData.emergencyContactPhone) && (
          <div className={styles.confirmationSection}>
            <div className={styles.sectionHeader}>
              <Phone className={styles.sectionIcon} size={20} />
              <h3>Emergency Contact</h3>
            </div>
            <div className={styles.confirmationGrid}>
              {formData.emergencyContactName && (
                <div className={styles.confirmationItem}>
                  <label>Emergency Contact Name:</label>
                  <span>{formData.emergencyContactName}</span>
                </div>
              )}
              {formData.emergencyContactPhone && (
                <div className={styles.confirmationItem}>
                  <label>Emergency Contact Phone:</label>
                  <span>{formData.emergencyContactPhone}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Accessibility Needs */}
        {formData.accessibilityNeeds && (
          <div className={styles.confirmationSection}>
            <div className={styles.sectionHeader}>
              <User className={styles.sectionIcon} size={20} />
              <h3>Accessibility Needs</h3>
            </div>
            <div className={styles.confirmationGrid}>
              <div className={styles.confirmationItem}>
                <label>Special Accommodations:</label>
                <span>{formData.accessibilityNeeds}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Privacy Policy Confirmation */}
      <div className={styles.privacyConfirmation}>
        <div className={styles.privacyNotice}>
          <CheckCircle className={styles.checkIcon} size={16} />
          <span>I agree to the Privacy Policy and Terms of Service</span>
        </div>
        <div className={styles.communicationOptIn}>
          <CheckCircle className={styles.checkIcon} size={16} />
          <span>I consent to receive communications from the church</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={styles.formActions}>
        <button
          type="button"
          onClick={onBack}
          className={styles.backButton}
          disabled={isSubmitting}
        >
          Back to Edit
        </button>
        <button
          type="submit"
          onClick={onSubmit}
          className={styles.submitButton}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <div className={styles.spinner}></div>
              Submitting...
            </>
          ) : (
            'Submit Registration'
          )}
        </button>
      </div>

      {/* Submission Notice */}
      <div className={styles.submissionNotice}>
        <p>
          By submitting this form, you confirm that all information provided is accurate 
          and complete. You will receive a confirmation email shortly after submission.
        </p>
      </div>
    </div>
  );
};

export default Confirmation;