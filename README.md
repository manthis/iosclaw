# 🦞 iOSclaw

A React Native iOS client for chatting with OpenClaw Gateway via WebSocket.

## Features

- **WebSocket Connection**: Connects to OpenClaw Gateway using JSON-RPC over WebSocket
- **Real-time Streaming**: Displays AI responses as they stream in
- **Local Credentials**: Saves Gateway URL and token locally
- **Auto-reconnect**: Automatically attempts to reconnect on connection loss
- **Simple UI**: Clean, functional chat interface

## Requirements

- Node.js 18+
- Expo CLI
- iOS device or Simulator
- OpenClaw Gateway running and accessible

## Quick Start

### 1. Install dependencies

```bash
cd iosclaw
npm install
```

### 2. Start the development server

```bash
npx expo start
```

### 3. Run on iOS

Press `i` in the terminal to open iOS Simulator, or:
- Install **Expo Go** app on your iPhone
- Scan the QR code with your camera

## Configuration

Default connection settings (can be changed in the app):

- **Gateway URL**: `wss://hal9000.local:18789`
- **Token**: Your Gateway token

## Building for iOS

### Development Build (recommended for testing)

For full native capabilities, create a development build:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure the project
eas build:configure

# Build for iOS (requires Apple Developer account)
eas build --platform ios --profile development
```

### Local Development Build

To build locally without Expo servers:

```bash
# Generate native project
npx expo prebuild --platform ios

# Open in Xcode
open ios/iosclaw.xcworkspace

# Build and run from Xcode
```

### Standalone App (Production)

```bash
eas build --platform ios --profile production
```

## Self-Signed TLS Certificates

If your Gateway uses a self-signed certificate, you may need to:

1. **iOS Simulator**: Usually works without issues
2. **Physical Device**: 
   - Install the CA certificate in Settings > General > About > Certificate Trust Settings
   - Or use a proper certificate (Let's Encrypt, etc.)
   - Or use HTTP for local development (not recommended)

### Workaround: Trust Certificate on iOS

1. Email or AirDrop the `.crt` file to your device
2. Open Settings > General > VPN & Device Management
3. Install the certificate
4. Go to Settings > General > About > Certificate Trust Settings
5. Enable full trust for the certificate

## OpenClaw Gateway Protocol

The app implements the OpenClaw Gateway WebSocket protocol:

### Handshake

1. Server sends `connect.challenge` event
2. Client sends `connect` request with auth token
3. Server responds with `hello-ok`

### Chat Methods

- `chat.send` - Send a message (streaming response)
- `chat.history` - Get chat history
- `chat.abort` - Abort current generation

### Events

- `chat.chunk` - Streaming text chunk
- `chat.done` - Generation complete
- `chat.error` - Error occurred

## Project Structure

```
iosclaw/
├── App.tsx                 # Main app component
├── src/
│   ├── types/              # TypeScript types
│   │   └── index.ts
│   ├── services/           # Gateway & Chat services
│   │   ├── GatewayService.ts
│   │   └── ChatService.ts
│   ├── hooks/              # React hooks
│   │   ├── useGateway.ts
│   │   └── useChat.ts
│   └── screens/            # UI screens
│       ├── ConnectionScreen.tsx
│       └── ChatScreen.tsx
├── package.json
└── README.md
```

## Troubleshooting

### "Connection timeout"

- Ensure the Gateway is running
- Check the URL is correct (use IP address if `.local` doesn't resolve)
- Verify the token is correct
- Check firewall settings

### "WebSocket error"

- The Gateway might not be accessible
- Try using the IP address instead of hostname
- Check if TLS certificate is trusted

### App crashes on connect

- Clear app data and try again
- Check for JavaScript errors in the Expo console

## Development

### Running tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

## License

MIT
