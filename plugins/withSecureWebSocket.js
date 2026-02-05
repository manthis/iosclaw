const {
  withXcodeProject,
  withDangerousMod,
  IOSConfig,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Config plugin to add SecureWebSocket native module and SSL certificates
 */
const withSecureWebSocket = (config) => {
  // First, copy the native files
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const iosDir = path.join(projectRoot, 'ios', 'iOSclaw');
      const nativeModulesDir = path.join(projectRoot, 'native-modules', 'ios');
      const certSource = path.join(
        process.env.HOME,
        '.openclaw',
        'gateway',
        'tls',
        'gateway-cert.pem'
      );

      // Ensure ios directory exists
      if (!fs.existsSync(iosDir)) {
        fs.mkdirSync(iosDir, { recursive: true });
      }

      // Copy native module files
      const nativeFiles = ['SecureWebSocket.swift', 'SecureWebSocket.m'];
      for (const file of nativeFiles) {
        const src = path.join(nativeModulesDir, file);
        const dest = path.join(iosDir, file);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
          console.log(`[withSecureWebSocket] Copied ${file}`);
        }
      }

      // Copy certificate files
      if (fs.existsSync(certSource)) {
        fs.copyFileSync(certSource, path.join(iosDir, 'gateway-cert.pem'));
        console.log('[withSecureWebSocket] Copied gateway-cert.pem');

        // Also create DER version using openssl
        const { execSync } = require('child_process');
        try {
          execSync(
            `openssl x509 -in "${certSource}" -outform DER -out "${path.join(
              iosDir,
              'gateway-cert.der'
            )}"`
          );
          console.log('[withSecureWebSocket] Created gateway-cert.der');
        } catch (e) {
          console.warn('[withSecureWebSocket] Failed to create DER cert:', e.message);
        }
      } else {
        console.warn('[withSecureWebSocket] Gateway cert not found at:', certSource);
      }

      return config;
    },
  ]);

  // Then, add files to Xcode project
  config = withXcodeProject(config, async (config) => {
    const xcodeProject = config.modResults;
    const projectName = config.modRequest.projectName || 'iOSclaw';
    
    // Get the main target
    const target = xcodeProject.getFirstTarget();
    if (!target) {
      console.warn('[withSecureWebSocket] No target found in Xcode project');
      return config;
    }

    // Files to add to compile sources
    const sourceFiles = ['SecureWebSocket.swift', 'SecureWebSocket.m'];

    // Files to add to bundle resources
    const resourceFiles = ['gateway-cert.pem', 'gateway-cert.der'];

    // Add source files to the main group (not a subgroup)
    for (const file of sourceFiles) {
      if (!projectHasFile(xcodeProject, file)) {
        try {
          xcodeProject.addSourceFile(file, { target: target.uuid });
          console.log(`[withSecureWebSocket] Added ${file} to sources`);
        } catch (e) {
          console.warn(`[withSecureWebSocket] Failed to add ${file}:`, e.message);
        }
      }
    }

    // Add resource files
    for (const file of resourceFiles) {
      if (!projectHasFile(xcodeProject, file)) {
        try {
          xcodeProject.addResourceFile(file, { target: target.uuid });
          console.log(`[withSecureWebSocket] Added ${file} to resources`);
        } catch (e) {
          console.warn(`[withSecureWebSocket] Failed to add ${file}:`, e.message);
        }
      }
    }

    return config;
  });

  return config;
};

function projectHasFile(project, fileName) {
  const files = project.pbxFileReferenceSection();
  for (const key in files) {
    if (files[key].name === fileName || files[key].path === fileName) {
      return true;
    }
  }
  return false;
}

module.exports = withSecureWebSocket;
