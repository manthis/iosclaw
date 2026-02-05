const { withXcodeProject } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

/**
 * Expo config plugin to add certificate files to the iOS bundle
 */
const withCertificates = (config) => {
  return withXcodeProject(config, async (config) => {
    const xcodeProject = config.modResults;
    const projectRoot = config.modRequest.projectRoot;
    
    // Files to add to the bundle
    const certFiles = [
      'gateway-cert.pem',
      'gateway-cert.der',
    ];
    
    const targetName = 'iOSclaw';
    const groupName = targetName;
    
    // Find the main group
    const mainGroup = xcodeProject.getFirstProject().firstProject.mainGroup;
    
    // Add each certificate file
    for (const certFile of certFiles) {
      const certPath = path.join(projectRoot, 'ios', targetName, certFile);
      
      if (fs.existsSync(certPath)) {
        console.log(`[withCertificates] Adding ${certFile} to bundle resources`);
        
        // Add file to project
        xcodeProject.addResourceFile(
          certFile,
          { target: xcodeProject.getFirstTarget().uuid },
          groupName
        );
      } else {
        console.warn(`[withCertificates] Certificate file not found: ${certPath}`);
      }
    }
    
    return config;
  });
};

module.exports = withCertificates;
