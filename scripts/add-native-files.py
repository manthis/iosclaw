#!/usr/bin/env python3
"""Add native files to Xcode project.pbxproj"""
import re
import uuid

def generate_uuid():
    """Generate a 24-character uppercase hex UUID"""
    return uuid.uuid4().hex[:24].upper()

def add_files_to_project(pbxproj_path):
    with open(pbxproj_path, 'r') as f:
        content = f.read()
    
    # Check if already added
    if 'SecureWebSocket.swift' in content:
        print("Files already in project")
        return
    
    # Generate UUIDs for new files
    uuids = {
        'swift_ref': generate_uuid(),
        'swift_build': generate_uuid(),
        'm_ref': generate_uuid(),
        'm_build': generate_uuid(),
        'pem_ref': generate_uuid(),
        'pem_build': generate_uuid(),
        'der_ref': generate_uuid(),
        'der_build': generate_uuid(),
    }
    
    # 1. Add PBXFileReference entries (path is relative to ios/ folder)
    file_ref_section = """/* Begin PBXFileReference section */"""
    new_refs = f"""/* Begin PBXFileReference section */
		{uuids['swift_ref']} /* SecureWebSocket.swift */ = {{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; name = SecureWebSocket.swift; path = iOSclaw/SecureWebSocket.swift; sourceTree = "<group>"; }};
		{uuids['m_ref']} /* SecureWebSocket.m */ = {{isa = PBXFileReference; lastKnownFileType = sourcecode.c.objc; name = SecureWebSocket.m; path = iOSclaw/SecureWebSocket.m; sourceTree = "<group>"; }};
		{uuids['pem_ref']} /* gateway-cert.pem */ = {{isa = PBXFileReference; lastKnownFileType = text; name = "gateway-cert.pem"; path = "iOSclaw/gateway-cert.pem"; sourceTree = "<group>"; }};
		{uuids['der_ref']} /* gateway-cert.der */ = {{isa = PBXFileReference; lastKnownFileType = file; name = "gateway-cert.der"; path = "iOSclaw/gateway-cert.der"; sourceTree = "<group>"; }};"""
    
    content = content.replace(file_ref_section, new_refs)
    
    # 2. Add to iOSclaw group children (after Info.plist)
    info_plist_pattern = r'(13B07FB61A68108700A75B9A /\* Info\.plist \*/,)'
    new_children = f"""\\1
				{uuids['swift_ref']} /* SecureWebSocket.swift */,
				{uuids['m_ref']} /* SecureWebSocket.m */,
				{uuids['pem_ref']} /* gateway-cert.pem */,
				{uuids['der_ref']} /* gateway-cert.der */,"""
    content = re.sub(info_plist_pattern, new_children, content)
    
    # 3. Add to PBXSourcesBuildPhase (compile Swift and .m files)
    # Find the Sources build phase for iOSclaw target
    sources_pattern = r'(/\* Sources \*/ = \{\s*isa = PBXSourcesBuildPhase;\s*buildActionMask = \d+;\s*files = \()'
    new_sources = f"""\\1
				{uuids['swift_build']} /* SecureWebSocket.swift in Sources */,
				{uuids['m_build']} /* SecureWebSocket.m in Sources */,"""
    content = re.sub(sources_pattern, new_sources, content)
    
    # 4. Add to PBXResourcesBuildPhase (bundle cert files)
    resources_pattern = r'(/\* Resources \*/ = \{\s*isa = PBXResourcesBuildPhase;\s*buildActionMask = \d+;\s*files = \()'
    new_resources = f"""\\1
				{uuids['pem_build']} /* gateway-cert.pem in Resources */,
				{uuids['der_build']} /* gateway-cert.der in Resources */,"""
    content = re.sub(resources_pattern, new_resources, content)
    
    # 5. Add PBXBuildFile entries
    build_file_section = """/* Begin PBXBuildFile section */"""
    new_build_files = f"""/* Begin PBXBuildFile section */
		{uuids['swift_build']} /* SecureWebSocket.swift in Sources */ = {{isa = PBXBuildFile; fileRef = {uuids['swift_ref']} /* SecureWebSocket.swift */; }};
		{uuids['m_build']} /* SecureWebSocket.m in Sources */ = {{isa = PBXBuildFile; fileRef = {uuids['m_ref']} /* SecureWebSocket.m */; }};
		{uuids['pem_build']} /* gateway-cert.pem in Resources */ = {{isa = PBXBuildFile; fileRef = {uuids['pem_ref']} /* gateway-cert.pem */; }};
		{uuids['der_build']} /* gateway-cert.der in Resources */ = {{isa = PBXBuildFile; fileRef = {uuids['der_ref']} /* gateway-cert.der */; }};"""
    
    content = content.replace(build_file_section, new_build_files)
    
    with open(pbxproj_path, 'w') as f:
        f.write(content)
    
    print(f"Added files to project with UUIDs:")
    for k, v in uuids.items():
        print(f"  {k}: {v}")

if __name__ == '__main__':
    add_files_to_project('/Users/manthis/.openclaw/workspace/iosclaw/ios/iOSclaw.xcodeproj/project.pbxproj')
