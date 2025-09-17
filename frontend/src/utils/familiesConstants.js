// frontend/src/utils/familiesConstants.js

export const RELATIONSHIP_TYPES = {
  HEAD: 'head',
  SPOUSE: 'spouse',
  CHILD: 'child',
  DEPENDENT: 'dependent',
  OTHER: 'other'
};

export const RELATIONSHIP_LABELS = {
  [RELATIONSHIP_TYPES.HEAD]: 'Head of Household',
  [RELATIONSHIP_TYPES.SPOUSE]: 'Spouse',
  [RELATIONSHIP_TYPES.CHILD]: 'Child',
  [RELATIONSHIP_TYPES.DEPENDENT]: 'Dependent',
  [RELATIONSHIP_TYPES.OTHER]: 'Other'
};

export const RELATIONSHIP_PRIORITIES = {
  [RELATIONSHIP_TYPES.HEAD]: 1,
  [RELATIONSHIP_TYPES.SPOUSE]: 2,
  [RELATIONSHIP_TYPES.CHILD]: 3,
  [RELATIONSHIP_TYPES.DEPENDENT]: 4,
  [RELATIONSHIP_TYPES.OTHER]: 5
};

export const FAMILY_SORT_OPTIONS = [
  { value: 'family_name', label: 'Family Name (A-Z)' },
  { value: '-family_name', label: 'Family Name (Z-A)' },
  { value: 'created_at', label: 'Oldest First' },
  { value: '-created_at', label: 'Newest First' },
  { value: 'updated_at', label: 'Least Recently Updated' },
  { value: '-updated_at', label: 'Most Recently Updated' }
];

export const FAMILY_FILTER_DEFAULTS = {
  has_children: '',
  member_count_min: '',
  member_count_max: '',
  missing_primary_contact: '',
  created_at__gte: '',
  created_at__lte: '',
  ordering: 'family_name'
};

// Utility functions
export const getRelationshipLabel = (type) => {
  return RELATIONSHIP_LABELS[type] || type;
};

export const getRelationshipPriority = (type) => {
  return RELATIONSHIP_PRIORITIES[type] || 5;
};

export const sortMembersByRelationship = (members) => {
  return members.sort((a, b) => 
    getRelationshipPriority(a.relationship_type) - getRelationshipPriority(b.relationship_type)
  );
};

export const formatFamilyName = (name) => {
  if (!name) return '';
  // Ensure "Family" is at the end if not already present
  const cleanName = name.trim();
  if (cleanName.toLowerCase().endsWith('family')) {
    return cleanName;
  }
  return `${cleanName} Family`;
};

export const validateFamilyName = (name) => {
  const errors = [];
  
  if (!name || !name.trim()) {
    errors.push('Family name is required');
  } else if (name.trim().length < 2) {
    errors.push('Family name must be at least 2 characters long');
  } else if (name.trim().length > 100) {
    errors.push('Family name must be less than 100 characters');
  }
  
  return errors;
};

export const getUniqueRelationshipTypes = (existingTypes = []) => {
  const uniqueTypes = [RELATIONSHIP_TYPES.HEAD, RELATIONSHIP_TYPES.SPOUSE];
  return uniqueTypes.filter(type => !existingTypes.includes(type));
};

export const canAddRelationshipType = (type, existingTypes = []) => {
  // Head and spouse can only exist once per family
  if (type === RELATIONSHIP_TYPES.HEAD && existingTypes.includes(RELATIONSHIP_TYPES.HEAD)) {
    return false;
  }
  if (type === RELATIONSHIP_TYPES.SPOUSE && existingTypes.includes(RELATIONSHIP_TYPES.SPOUSE)) {
    return false;
  }
  return true;
};