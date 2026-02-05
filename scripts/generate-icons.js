/**
 * Generate HAL 9000 inspired app icons for iOSclaw
 * Run with: node scripts/generate-icons.js
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const colors = {
  background: '#0d0d0d',
  halDark: '#330d0d',
  halSubtle: '#661a1a',
  halPrimary: '#cc0000',
  halGlow: '#ff1a1a',
  white: '#ffffff',
};

function drawHalEye(ctx, centerX, centerY, size) {
  // Outer glow
  const glowGradient = ctx.createRadialGradient(
    centerX, centerY, 0,
    centerX, centerY, size * 0.6
  );
  glowGradient.addColorStop(0, 'rgba(255, 26, 26, 0.4)');
  glowGradient.addColorStop(0.5, 'rgba(255, 26, 26, 0.2)');
  glowGradient.addColorStop(1, 'rgba(255, 26, 26, 0)');
  
  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, size * 0.6, 0, Math.PI * 2);
  ctx.fill();

  // Dark outer ring
  ctx.fillStyle = colors.halDark;
  ctx.beginPath();
  ctx.arc(centerX, centerY, size * 0.45, 0, Math.PI * 2);
  ctx.fill();

  // Subtle ring
  ctx.strokeStyle = colors.halSubtle;
  ctx.lineWidth = size * 0.04;
  ctx.beginPath();
  ctx.arc(centerX, centerY, size * 0.42, 0, Math.PI * 2);
  ctx.stroke();

  // Main red eye gradient
  const eyeGradient = ctx.createRadialGradient(
    centerX - size * 0.08, centerY - size * 0.08, 0,
    centerX, centerY, size * 0.35
  );
  eyeGradient.addColorStop(0, colors.halGlow);
  eyeGradient.addColorStop(0.6, colors.halPrimary);
  eyeGradient.addColorStop(1, colors.halDark);

  ctx.fillStyle = eyeGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, size * 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Inner bright core
  const coreGradient = ctx.createRadialGradient(
    centerX - size * 0.04, centerY - size * 0.04, 0,
    centerX, centerY, size * 0.18
  );
  coreGradient.addColorStop(0, '#ffffff');
  coreGradient.addColorStop(0.3, colors.halGlow);
  coreGradient.addColorStop(1, 'rgba(255, 26, 26, 0)');

  ctx.fillStyle = coreGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, size * 0.18, 0, Math.PI * 2);
  ctx.fill();

  // Small reflection highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.beginPath();
  ctx.arc(centerX - size * 0.08, centerY - size * 0.1, size * 0.05, 0, Math.PI * 2);
  ctx.fill();
}

function generateIcon(size, filename, addText = false) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, size, size);

  // Add subtle radial gradient background
  const bgGradient = ctx.createRadialGradient(
    size / 2, size / 3, 0,
    size / 2, size / 2, size
  );
  bgGradient.addColorStop(0, 'rgba(51, 13, 13, 0.6)');
  bgGradient.addColorStop(1, 'transparent');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, size, size);

  // Draw HAL eye
  const eyeSize = addText ? size * 0.35 : size * 0.45;
  const eyeCenterY = addText ? size * 0.4 : size * 0.5;
  drawHalEye(ctx, size / 2, eyeCenterY, eyeSize);

  // Add text if requested
  if (addText) {
    ctx.fillStyle = colors.white;
    ctx.font = `bold ${size * 0.12}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('iOSclaw', size / 2, size * 0.7);
  }

  // Save to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
  console.log(`Generated: ${filename} (${size}x${size})`);
}

function generateSplashIcon(width, height, filename) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, width, height);

  // Add subtle radial gradient background
  const bgGradient = ctx.createRadialGradient(
    width / 2, height / 3, 0,
    width / 2, height / 2, Math.max(width, height)
  );
  bgGradient.addColorStop(0, 'rgba(51, 13, 13, 0.4)');
  bgGradient.addColorStop(1, 'transparent');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // Draw HAL eye (centered, large)
  const eyeSize = Math.min(width, height) * 0.4;
  drawHalEye(ctx, width / 2, height / 2, eyeSize);

  // Save to file
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filename, buffer);
  console.log(`Generated: ${filename} (${width}x${height})`);
}

// Ensure assets directory exists
const assetsDir = path.join(__dirname, '..', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Generate icons
console.log('Generating HAL 9000 themed icons...\n');

// App icon (1024x1024 recommended for App Store)
generateIcon(1024, path.join(assetsDir, 'icon.png'));

// Adaptive icon foreground for Android
generateIcon(1024, path.join(assetsDir, 'adaptive-icon.png'));

// Favicon
generateIcon(48, path.join(assetsDir, 'favicon.png'));

// Splash icon
generateSplashIcon(512, 512, path.join(assetsDir, 'splash-icon.png'));

console.log('\nDone! Icons generated in assets/ folder.');
