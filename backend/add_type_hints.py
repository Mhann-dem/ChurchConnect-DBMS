"""
Script to add type hints to all model @property decorators and methods
Run from backend directory: python add_type_hints.py
"""

import re
from pathlib import Path
from typing import Dict, List, Tuple

# Define type hints for each property/method by model
TYPE_HINTS = {
    'pledges/models.py': {
        'completion_percentage': 'float',
        'is_overdue': 'bool',
        'remaining_amount': 'Decimal',
        'is_active': 'bool',
    },
    'events/models.py': {
        'available_spots': 'Optional[int]',
        'is_past': 'bool',
        'is_upcoming': 'bool',
        'is_today': 'bool',
        'registration_open': 'bool',
        'is_full': 'bool',
        'duration_hours': 'float',
        'hours_volunteered': 'float',
    },
    'members/models.py': {
        'full_name': 'str',
        'display_name': 'str',
        'age': 'Optional[int]',
        'age_group': 'str',
        'has_family': 'bool',
        'contact_info': 'List[Tuple[str, str]]',
    },
    'groups/models.py': {
        'member_count': 'int',
        'pending_requests_count': 'int',
        'is_full': 'bool',
        'available_spots': 'Optional[int]',
    },
    'families/models.py': {
        # Note: These are methods, not properties
        'get_member_count': 'int',
        'get_children_count': 'int',
        'get_adults_count': 'int',
        'get_dependents_count': 'int',
        'get_family_summary': 'Dict[str, Any]',
        'get_contact_info': 'Optional[Dict[str, Any]]',
    },
    'authentication/models.py': {
        'full_name': 'str',
    },
}

def add_imports_if_missing(content: str, filepath: str) -> Tuple[str, bool]:
    """Add typing imports if they're missing"""
    modified = False
    
    # Check what imports we need
    needs_optional = 'Optional[' in str(TYPE_HINTS.get(filepath, {}))
    needs_dict = 'Dict[' in str(TYPE_HINTS.get(filepath, {}))
    needs_list = 'List[' in str(TYPE_HINTS.get(filepath, {}))
    needs_tuple = 'Tuple[' in str(TYPE_HINTS.get(filepath, {}))
    needs_any = 'Any]' in str(TYPE_HINTS.get(filepath, {}))
    needs_decimal = filepath == 'pledges/models.py'
    
    # Build import statement
    imports_needed = []
    if needs_optional or needs_dict or needs_list or needs_tuple or needs_any:
        typing_imports = []
        if needs_optional:
            typing_imports.append('Optional')
        if needs_dict:
            typing_imports.append('Dict')
        if needs_list:
            typing_imports.append('List')
        if needs_tuple:
            typing_imports.append('Tuple')
        if needs_any:
            typing_imports.append('Any')
        
        if typing_imports:
            import_line = f"from typing import {', '.join(typing_imports)}\n"
            
            # Check if typing import already exists
            if 'from typing import' not in content:
                # Find a good place to add it (after other imports)
                lines = content.split('\n')
                insert_pos = 0
                
                # Find last import line
                for i, line in enumerate(lines):
                    if line.startswith('import ') or line.startswith('from '):
                        insert_pos = i + 1
                
                lines.insert(insert_pos, import_line)
                content = '\n'.join(lines)
                modified = True
    
    # Add Decimal import for pledges
    if needs_decimal and 'from decimal import Decimal' not in content:
        lines = content.split('\n')
        insert_pos = 0
        for i, line in enumerate(lines):
            if line.startswith('import ') or line.startswith('from '):
                insert_pos = i + 1
        lines.insert(insert_pos, 'from decimal import Decimal\n')
        content = '\n'.join(lines)
        modified = True
    
    return content, modified

def add_type_hint_to_property(content: str, property_name: str, type_hint: str) -> Tuple[str, bool]:
    """Add type hint to a @property decorator"""
    modified = False
    
    # Pattern for @property without type hint
    pattern = rf'(@property\s+def {property_name}\(self\):)'
    replacement = rf'@property\n    def {property_name}(self) -> {type_hint}:'
    
    if re.search(pattern, content):
        content = re.sub(pattern, replacement, content)
        modified = True
        print(f"  ✓ Added type hint to @property {property_name} -> {type_hint}")
    
    return content, modified

def add_type_hint_to_method(content: str, method_name: str, type_hint: str) -> Tuple[str, bool]:
    """Add type hint to a regular method"""
    modified = False
    
    # Pattern for method without type hint
    pattern = rf'(def {method_name}\(self\):)'
    replacement = rf'def {method_name}(self) -> {type_hint}:'
    
    if re.search(pattern, content):
        content = re.sub(pattern, replacement, content)
        modified = True
        print(f"  ✓ Added type hint to method {method_name} -> {type_hint}")
    
    return content, modified

def process_file(filepath: Path) -> bool:
    """Process a single file to add type hints"""
    
    rel_path = str(filepath.relative_to(Path.cwd()))
    
    if rel_path not in TYPE_HINTS:
        return False
    
    print(f"\n📝 Processing {rel_path}...")
    
    try:
        content = filepath.read_text(encoding='utf-8')
        original_content = content
        
        # Add imports if needed
        content, imports_modified = add_imports_if_missing(content, rel_path)
        if imports_modified:
            print("  ✓ Added typing imports")
        
        # Add type hints
        file_modified = imports_modified
        for prop_name, type_hint in TYPE_HINTS[rel_path].items():
            # Try as property first
            content, prop_modified = add_type_hint_to_property(content, prop_name, type_hint)
            if prop_modified:
                file_modified = True
            else:
                # Try as method
                content, method_modified = add_type_hint_to_method(content, prop_name, type_hint)
                if method_modified:
                    file_modified = True
        
        # Write back if modified
        if file_modified:
            filepath.write_text(content, encoding='utf-8')
            print(f"  ✅ File updated successfully")
            return True
        else:
            print(f"  ℹ️  No changes needed")
            return False
            
    except Exception as e:
        print(f"  ❌ Error: {str(e)}")
        return False

def main():
    """Main function"""
    print("🔧 Adding type hints to model properties...\n")
    print("=" * 70)
    
    files_to_process = [
        Path('pledges/models.py'),
        Path('events/models.py'),
        Path('members/models.py'),
        Path('groups/models.py'),
        Path('families/models.py'),
        Path('authentication/models.py'),
    ]
    
    total_modified = 0
    
    for filepath in files_to_process:
        if filepath.exists():
            if process_file(filepath):
                total_modified += 1
        else:
            print(f"\n⚠️  File not found: {filepath}")
    
    print("\n" + "=" * 70)
    print(f"\n✨ Complete! Modified {total_modified} file(s)")
    print("\n📝 Next steps:")
    print("1. Review the changes in each file")
    print("2. Run: python manage.py spectacular --file schema.yml")
    print("3. Check that warnings are significantly reduced")

if __name__ == '__main__':
    main()