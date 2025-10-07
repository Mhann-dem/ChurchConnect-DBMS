#!/usr/bin/env python3
"""
Improved script to add @extend_schema_field decorators to serializer methods
Run this from your backend directory: python fix_serializers.py
"""

import re
import os

# Mapping of method names to their return types
METHOD_TYPE_MAPPING = {
    'full_name': 'CharField()',
    'display_name': 'CharField()',
    'age': 'IntegerField()',
    'age_group': 'CharField()',
    'member_count': 'IntegerField()',
    'pending_requests_count': 'IntegerField()',
    'is_full': 'BooleanField()',
    'available_spots': 'IntegerField()',
    'registration_open': 'BooleanField()',
    'is_upcoming': 'BooleanField()',
    'is_past': 'BooleanField()',
    'is_today': 'BooleanField()',
    'duration_hours': 'FloatField()',
    'hours_volunteered': 'FloatField()',
    'completion_percentage': 'FloatField()',
    'is_overdue': 'BooleanField()',
    'family_summary': 'DictField()',
    'contact_info': 'DictField()',
}

def add_decorators_to_file(filepath):
    """Add @extend_schema_field decorators to a serializer file"""
    
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Check if import already exists
    has_import = any('from drf_spectacular.utils import extend_schema_field' in line for line in lines)
    
    modified = False
    new_lines = []
    i = 0
    
    while i < len(lines):
        line = lines[i]
        
        # Add import after rest_framework imports if not present
        if not has_import and 'from rest_framework import serializers' in line:
            new_lines.append(line)
            new_lines.append('from drf_spectacular.utils import extend_schema_field\n')
            has_import = True
            modified = True
            i += 1
            continue
        
        # Check if this is a method definition that needs a decorator
        # Match any indentation, def, get_<method_name>, (self, obj)
        method_match = re.match(r'^(\s+)def (get_)?(\w+)\(self, obj\):\s*$', line)
        
        if method_match:
            indent = method_match.group(1)
            prefix = method_match.group(2) or ''  # 'get_' or empty
            method_name = method_match.group(3)
            
            # Check if this method needs a decorator
            full_method_name = f"{prefix}{method_name}"
            
            # Look for the method in our mapping (with or without 'get_' prefix)
            field_type = None
            if method_name in METHOD_TYPE_MAPPING:
                field_type = METHOD_TYPE_MAPPING[method_name]
            elif full_method_name in METHOD_TYPE_MAPPING:
                field_type = METHOD_TYPE_MAPPING[full_method_name]
            
            if field_type:
                # Check if previous line already has decorator
                prev_line = new_lines[-1] if new_lines else ''
                if '@extend_schema_field' not in prev_line:
                    # Add decorator before the method
                    decorator = f'{indent}@extend_schema_field(serializers.{field_type})\n'
                    new_lines.append(decorator)
                    modified = True
                    print(f"  ✓ Added decorator for {full_method_name} (line {i+1})")
        
        new_lines.append(line)
        i += 1
    
    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        return True
    return False

def show_line_samples(filepath, line_num):
    """Show context around a specific line for debugging"""
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    start = max(0, line_num - 2)
    end = min(len(lines), line_num + 3)
    
    print(f"\n  Context around line {line_num + 1}:")
    for i in range(start, end):
        marker = ">>>" if i == line_num else "   "
        print(f"  {marker} {i+1:4d}: {lines[i].rstrip()}")

def analyze_file(filepath):
    """Analyze a file to find methods that need decorators"""
    print(f"\n🔍 Analyzing {filepath}...")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    found_methods = []
    
    for i, line in enumerate(lines):
        # Look for method definitions
        method_match = re.match(r'^\s+def (get_)?(\w+)\(self, obj\):', line)
        if method_match:
            prefix = method_match.group(1) or ''
            method_name = method_match.group(2)
            full_name = f"{prefix}{method_name}"
            
            # Check if it's in our mapping
            if method_name in METHOD_TYPE_MAPPING or full_name in METHOD_TYPE_MAPPING:
                # Check if it already has decorator
                prev_line = lines[i-1] if i > 0 else ''
                has_decorator = '@extend_schema_field' in prev_line
                
                found_methods.append({
                    'line': i + 1,
                    'name': full_name,
                    'has_decorator': has_decorator
                })
    
    if found_methods:
        print(f"  Found {len(found_methods)} relevant methods:")
        for method in found_methods:
            status = "✓ Has decorator" if method['has_decorator'] else "✗ Needs decorator"
            print(f"    Line {method['line']:4d}: {method['name']:30s} {status}")
    else:
        print("  No relevant methods found")
    
    return found_methods

def main():
    """Main function to process all serializer files"""
    
    serializer_files = [
        'authentication/serializers.py',
        'events/serializers.py',
        'families/serializers.py',
        'groups/serializers.py',
        'members/serializers.py',
        'pledges/serializers.py',
    ]
    
    print("🔧 Fixing serializer type hints...\n")
    print("=" * 70)
    
    # First, analyze all files
    print("\n📊 ANALYSIS PHASE")
    print("=" * 70)
    
    for filepath in serializer_files:
        if os.path.exists(filepath):
            analyze_file(filepath)
        else:
            print(f"\n⚠️  File not found: {filepath}")
    
    print("\n" + "=" * 70)
    print("\n🔨 FIXING PHASE")
    print("=" * 70)
    
    total_modified = 0
    for filepath in serializer_files:
        if os.path.exists(filepath):
            print(f"\nProcessing {filepath}...")
            if add_decorators_to_file(filepath):
                total_modified += 1
                print(f"  ✅ Modified")
            else:
                print(f"  ℹ️  No changes needed")
        else:
            print(f"\n⚠️  File not found: {filepath}")
    
    print("\n" + "=" * 70)
    print(f"\n✨ Complete! Modified {total_modified} file(s)")
    print("\n📝 Next steps:")
    print("1. Review the changes in each file")
    print("2. Run: python manage.py spectacular --file schema.yml")
    print("3. Check that warnings are reduced")

if __name__ == '__main__':
    main()