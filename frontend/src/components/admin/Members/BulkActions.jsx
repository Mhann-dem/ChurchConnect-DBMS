import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Mail, 
  MessageSquare, 
  Download, 
  Trash2, 
  Tag, 
  UserPlus, 
  Filter,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import styles from './Members.module.css';

const BulkActions = ({ 
  selectedMembers, 
  onClearSelection, 
  onBulkAction,
  totalMembers,
  allMembers 
}) => {
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [actionType, setActionType] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResult, setProcessingResult] = useState(null);

  // Tag management state
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([
    { id: 1, name: 'New Member', color: '#10B981' },
    { id: 2, name: 'Leadership', color: '#8B5CF6' },
    { id: 3, name: 'Volunteer', color: '#F59E0B' },
    { id: 4, name: 'Young Adult', color: '#3B82F6' },
    { id: 5, name: 'Senior', color: '#EF4444' },
    { id: 6, name: 'Follow Up', color: '#F97316' }
  ]);

  // Email composition state
  const [emailData, setEmailData] = useState({
    subject: '',
    message: '',
    template: 'custom'
  });

  const emailTemplates = {
    welcome: {
      subject: 'Welcome to Our Church Family',
      message: `Dear [Name],

We're thrilled to welcome you to our church family! Thank you for taking the time to register with us.

We look forward to getting to know you better and helping you find your place in our community.

Blessings,
Church Administration Team`
    },
    event: {
      subject: 'Upcoming Church Event',
      message: `Dear [Name],

We have an exciting upcoming event that we'd love for you to join us for!

Event details will be shared soon. Stay tuned!

Blessings,
Church Administration Team`
    },
    followup: {
      subject: 'Following Up With You',
      message: `Dear [Name],

We wanted to reach out and see how you're doing. If you have any questions or need prayer, please don't hesitate to reach out.

We're here for you!

Blessings,
Church Administration Team`
    }
  };

  useEffect(() => {
    if (selectedMembers.length === 0) {
      setShowActionMenu(false);
      setActionType('');
    }
  }, [selectedMembers]);

  const handleBulkAction = async (action) => {
    setIsProcessing(true);
    setProcessingResult(null);
    
    try {
      let result;
      
      switch (action) {
        case 'delete':
          result = await onBulkAction('delete', selectedMembers);
          break;
        case 'tag':
          result = await onBulkAction('tag', selectedMembers, { tags: selectedTags });
          break;
        case 'email':
          result = await onBulkAction('email', selectedMembers, emailData);
          break;
        case 'export':
          result = await onBulkAction('export', selectedMembers);
          break;
        case 'activate':
          result = await onBulkAction('activate', selectedMembers);
          break;
        case 'deactivate':
          result = await onBulkAction('deactivate', selectedMembers);
          break;
        default:
          throw new Error('Unknown action');
      }

      setProcessingResult({
        type: 'success',
        message: result.message || `Successfully processed ${selectedMembers.length} members`
      });
      
      // Clear selection after successful action
      setTimeout(() => {
        onClearSelection();
        setShowActionMenu(false);
        setActionType('');
        setProcessingResult(null);
      }, 2000);

    } catch (error) {
      setProcessingResult({
        type: 'error',
        message: error.message || 'An error occurred while processing the action'
      });
    } finally {
      setIsProcessing(false);
      setShowConfirmDialog(false);
      setShowTagDialog(false);
      setShowEmailDialog(false);
    }
  };

  const handleActionSelect = (action) => {
    setActionType(action);
    setShowActionMenu(false);
    
    switch (action) {
      case 'delete':
        setShowConfirmDialog(true);
        break;
      case 'tag':
        setShowTagDialog(true);
        break;
      case 'email':
        setShowEmailDialog(true);
        break;
      case 'export':
      case 'activate':
      case 'deactivate':
        handleBulkAction(action);
        break;
      default:
        break;
    }
  };

  const handleTemplateChange = (template) => {
    if (template === 'custom') {
      setEmailData({
        subject: '',
        message: '',
        template: 'custom'
      });
    } else {
      setEmailData({
        ...emailTemplates[template],
        template
      });
    }
  };

  const getSelectedMemberNames = () => {
    return selectedMembers.map(id => {
      const member = allMembers.find(m => m.id === id);
      return member ? `${member.first_name} ${member.last_name}` : 'Unknown';
    }).join(', ');
  };

  if (selectedMembers.length === 0) {
    return null;
  }

  return (
    <div className={styles.bulkActionsContainer}>
      <div className={styles.bulkActionsBar}>
        <div className={styles.selectionInfo}>
          <CheckCircle className={styles.selectionIcon} />
          <span className={styles.selectionText}>
            {selectedMembers.length} of {totalMembers} members selected
          </span>
        </div>
        
        <div className={styles.bulkActions}>
          <button
            className={styles.actionButton}
            onClick={() => setShowActionMenu(!showActionMenu)}
            disabled={isProcessing}
          >
            Actions
          </button>
          
          <button
            className={styles.clearButton}
            onClick={onClearSelection}
            disabled={isProcessing}
          >
            <X size={16} />
            Clear Selection
          </button>
        </div>
      </div>

      {processingResult && (
        <div className={`${styles.processingResult} ${styles[processingResult.type]}`}>
          {processingResult.type === 'success' ? (
            <CheckCircle size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span>{processingResult.message}</span>
        </div>
      )}

      {showActionMenu && (
        <div className={styles.actionMenu}>
          <button
            className={styles.actionItem}
            onClick={() => handleActionSelect('email')}
            disabled={isProcessing}
          >
            <Mail size={16} />
            Send Email
          </button>
          
          <button
            className={styles.actionItem}
            onClick={() => handleActionSelect('tag')}
            disabled={isProcessing}
          >
            <Tag size={16} />
            Add Tags
          </button>
          
          <button
            className={styles.actionItem}
            onClick={() => handleActionSelect('export')}
            disabled={isProcessing}
          >
            <Download size={16} />
            Export Selected
          </button>
          
          <button
            className={styles.actionItem}
            onClick={() => handleActionSelect('activate')}
            disabled={isProcessing}
          >
            <UserPlus size={16} />
            Activate Members
          </button>
          
          <button
            className={styles.actionItem}
            onClick={() => handleActionSelect('deactivate')}
            disabled={isProcessing}
          >
            <Users size={16} />
            Deactivate Members
          </button>
          
          <hr className={styles.menuDivider} />
          
          <button
            className={`${styles.actionItem} ${styles.dangerAction}`}
            onClick={() => handleActionSelect('delete')}
            disabled={isProcessing}
          >
            <Trash2 size={16} />
            Delete Selected
          </button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showConfirmDialog && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Confirm Deletion</h3>
            <p>
              Are you sure you want to delete {selectedMembers.length} member(s)?
              This action cannot be undone.
            </p>
            <div className={styles.membersList}>
              <strong>Members to be deleted:</strong>
              <p>{getSelectedMemberNames()}</p>
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowConfirmDialog(false)}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                className={styles.dangerButton}
                onClick={() => handleBulkAction('delete')}
                disabled={isProcessing}
              >
                {isProcessing ? 'Deleting...' : 'Delete Members'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tag Dialog */}
      {showTagDialog && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Add Tags to Selected Members</h3>
            <p>Select tags to add to {selectedMembers.length} member(s):</p>
            
            <div className={styles.tagGrid}>
              {availableTags.map(tag => (
                <label key={tag.id} className={styles.tagOption}>
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(tag.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTags([...selectedTags, tag.id]);
                      } else {
                        setSelectedTags(selectedTags.filter(id => id !== tag.id));
                      }
                    }}
                  />
                  <span 
                    className={styles.tagLabel}
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.name}
                  </span>
                </label>
              ))}
            </div>
            
            <div className={styles.modalActions}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowTagDialog(false)}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                className={styles.primaryButton}
                onClick={() => handleBulkAction('tag')}
                disabled={isProcessing || selectedTags.length === 0}
              >
                {isProcessing ? 'Adding Tags...' : 'Add Tags'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Dialog */}
      {showEmailDialog && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Send Email to Selected Members</h3>
            <p>Compose email for {selectedMembers.length} member(s):</p>
            
            <div className={styles.emailForm}>
              <div className={styles.formGroup}>
                <label>Email Template:</label>
                <select
                  value={emailData.template}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className={styles.formControl}
                >
                  <option value="custom">Custom Message</option>
                  <option value="welcome">Welcome Message</option>
                  <option value="event">Event Invitation</option>
                  <option value="followup">Follow Up</option>
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label>Subject:</label>
                <input
                  type="text"
                  value={emailData.subject}
                  onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
                  className={styles.formControl}
                  placeholder="Enter email subject"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Message:</label>
                <textarea
                  value={emailData.message}
                  onChange={(e) => setEmailData({...emailData, message: e.target.value})}
                  className={styles.formTextarea}
                  rows="6"
                  placeholder="Enter your message here..."
                />
              </div>
              
              <div className={styles.emailPreview}>
                <small>
                  <strong>Note:</strong> [Name] will be replaced with each member's name
                </small>
              </div>
            </div>
            
            <div className={styles.modalActions}>
              <button
                className={styles.cancelButton}
                onClick={() => setShowEmailDialog(false)}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                className={styles.primaryButton}
                onClick={() => handleBulkAction('email')}
                disabled={isProcessing || !emailData.subject || !emailData.message}
              >
                {isProcessing ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkActions;