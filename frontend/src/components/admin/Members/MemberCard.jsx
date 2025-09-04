import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, Calendar, Users, Edit, Trash2 } from 'lucide-react';
import styles from './Members.module.css';

// Utility functions
const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return '';
  }
};

// Simple Avatar component
const Avatar = ({ src, alt, size = 'md', fallback, className = '' }) => {
  const [imageError, setImageError] = React.useState(false);
  
  const sizeClasses = {
    sm: styles.avatarSm,
    md: styles.avatarMd,
    lg: styles.avatarLg,
    large: styles.avatarLarge
  };
  
  const handleImageError = () => {
    setImageError(true);
  };
  
  if (imageError || !src) {
    return (
      <div className={`${styles.avatarFallback} ${sizeClasses[size]} ${className}`}>
        {fallback || alt?.[0] || '?'}
      </div>
    );
  }
  
  return (
    <img 
      src={src} 
      alt={alt} 
      className={`${styles.avatar} ${sizeClasses[size]} ${className}`}
      onError={handleImageError}
    />
  );
};

// Simple Badge component
const Badge = ({ children, variant = 'default', size = 'md', className = '' }) => {
  const variantClasses = {
    default: styles.badgeDefault,
    success: styles.badgeSuccess,
    warning: styles.badgeWarning,
    danger: styles.badgeDanger,
    secondary: styles.badgeSecondary
  };
  
  const sizeClasses = {
    sm: styles.badgeSm,
    md: styles.badgeMd
  };
  
  return (
    <span className={`${styles.badge} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {children}
    </span>
  );
};

// Simple Button component
const Button = ({ children, variant = 'default', size = 'md', onClick, disabled, className = '', ...props }) => {
  const variantClasses = {
    default: styles.buttonDefault,
    ghost: styles.buttonGhost,
    primary: styles.buttonPrimary,
    outline: styles.buttonOutline
  };
  
  const sizeClasses = {
    sm: styles.buttonSm,
    md: styles.buttonMd
  };
  
  return (
    <button 
      className={`${styles.button} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

// Simple Card component
const Card = ({ children, className = '' }) => {
  return (
    <div className={`${styles.card} ${className}`}>
      {children}
    </div>
  );
};

const MemberCard = ({ 
  member = {}, 
  isSelected = false, 
  onSelect, 
  onDelete, 
  onStatusChange,
  disabled = false
}) => {
  const navigate = useNavigate();

  // Ensure member has required properties with defaults
  const memberData = {
    id: member.id || '',
    first_name: member.first_name || '',
    last_name: member.last_name || '',
    preferred_name: member.preferred_name || '',
    email: member.email || '',
    phone: member.phone || '',
    photo_url: member.photo_url || '',
    status: member.status || 'active',
    registration_date: member.registration_date || '',
    groups: member.groups || [],
    pledge_amount: member.pledge_amount || '',
    pledge_frequency: member.pledge_frequency || '',
    ...member
  };

  const handleCardClick = (e) => {
    // Prevent navigation if clicking on interactive elements
    if (e.target.closest(`.${styles.cardActions}`) || 
        e.target.closest('input[type="checkbox"]') ||
        e.target.closest('button')) {
      return;
    }
    
    if (memberData.id) {
      navigate(`/admin/members/${memberData.id}`);
    }
  };

  const handleSelectChange = (e) => {
    e.stopPropagation();
    if (onSelect && !disabled) {
      onSelect(memberData.id);
    }
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    if (memberData.id && !disabled) {
      navigate(`/admin/members/${memberData.id}/edit`);
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (onDelete && !disabled) {
      onDelete(memberData.id);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'suspended':
        return 'danger';
      default:
        return 'default';
    }
  };

  const fullName = `${memberData.first_name} ${memberData.last_name}`.trim();
  const avatarFallback = `${memberData.first_name?.[0] || ''}${memberData.last_name?.[0] || ''}`;

  return (
    <Card className={`${styles.memberCard} ${isSelected ? styles.selected : ''} ${disabled ? styles.disabled : ''}`}>
      <div className={styles.cardHeader}>
        <div className={styles.memberInfo} onClick={handleCardClick}>
          <Avatar
            src={memberData.photo_url}
            alt={fullName}
            size="md"
            fallback={avatarFallback}
            className={styles.avatar}
          />
          <div className={styles.memberDetails}>
            <h3 className={styles.memberName}>
              {fullName || 'Unknown Member'}
            </h3>
            {memberData.preferred_name && (
              <p className={styles.preferredName}>
                "{memberData.preferred_name}"
              </p>
            )}
            <Badge 
              variant={getStatusColor(memberData.status)}
              className={styles.statusBadge}
            >
              {memberData.status || 'active'}
            </Badge>
          </div>
        </div>
        
        <div className={styles.cardActions}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleSelectChange}
            className={styles.checkbox}
            disabled={disabled}
            aria-label={`Select ${fullName}`}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEditClick}
            className={styles.actionButton}
            disabled={disabled}
            aria-label={`Edit ${fullName}`}
          >
            <Edit size={16} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteClick}
            className={styles.actionButton}
            disabled={disabled}
            aria-label={`Delete ${fullName}`}
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      <div className={styles.cardBody} onClick={handleCardClick}>
        <div className={styles.contactInfo}>
          {memberData.email && (
            <div className={styles.contactItem}>
              <Mail size={14} />
              <span>{memberData.email}</span>
            </div>
          )}
          {memberData.phone && (
            <div className={styles.contactItem}>
              <Phone size={14} />
              <span>{formatPhoneNumber(memberData.phone)}</span>
            </div>
          )}
          {memberData.registration_date && (
            <div className={styles.contactItem}>
              <Calendar size={14} />
              <span>Joined {formatDate(memberData.registration_date)}</span>
            </div>
          )}
        </div>

        {memberData.groups && memberData.groups.length > 0 && (
          <div className={styles.groupInfo}>
            <Users size={14} />
            <div className={styles.groupList}>
              {memberData.groups.slice(0, 2).map((group, index) => (
                <Badge key={group.id || index} variant="secondary" size="sm">
                  {group.name || `Group ${index + 1}`}
                </Badge>
              ))}
              {memberData.groups.length > 2 && (
                <Badge variant="secondary" size="sm">
                  +{memberData.groups.length - 2} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {memberData.pledge_amount && (
          <div className={styles.pledgeInfo}>
            <span className={styles.pledgeAmount}>
              ${memberData.pledge_amount}
              {memberData.pledge_frequency && `/${memberData.pledge_frequency}`}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default MemberCard;