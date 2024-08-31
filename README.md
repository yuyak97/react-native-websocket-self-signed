# react-native-websocket-self-signed

[![MIT License](https://img.shields.io/github/license/yuyak97/react-native-websocket-self-signed)](LICENSE)
[![Package Version](https://img.shields.io/npm/v/react-native-websocket-self-signed)](https://www.npmjs.com/package/react-native-websocket-self-signed)
[![CI](https://github.com/yuyak97/react-native-websocket-self-signed/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/yuyak97/react-native-websocket-self-signed/actions/workflows/ci.yml)
[![GitHub Repo stars](https://img.shields.io/github/stars/yuyak97/react-native-websocket-self-signed?style=social)](https://github.com/yuyak97/react-native-websocket-self-signed)

This package provides support for establishing WebSocket (wss://) connections in React Native applications while bypassing SSL/TLS certificate validation. It allows developers to create secure WebSocket connections with self-signed certificates by explicitly bypassing the standard certificate validation process. This is particularly useful in development environments or internal applications where self-signed certificates are used, and strict certificate validation is not required.

### ⚠️ Security Warning ⚠️

🚨 Bypassing SSL/TLS certificate validation can introduce significant security risks, including exposure to Man-in-the-Middle (MITM) attacks.

🔒 This package should only be used in development environments or controlled internal applications where security risks are minimal.

❌ Do NOT use this package in production environments where data security is critical. The potential for sensitive information to be intercepted is high. Always prioritize using proper SSL/TLS certificate validation in production settings.

## Installation

```sh
npm install react-native-websocket-self-signed
```

## OPTIONAL: Disable expo-dev-client Network Inspector

If you are building an iOS Expo development build and want to use ths library in the development environment, you need to disable expo-dev-client's network inspector because it is intercepting network requests. Note that the network inspector is automatically disabled on production builds and so this library would function properly on production builds without following process

1. Install expo-build-properties

```sh
npx expo install expo-build-properties
```

2. Add the following plugin configuration to your app.json

```json
{
  "expo": {
    "plugins": [
      [
        "expo-build-properties",
        {
          "ios": {
            "networkInspector": false
          }
        }
      ]
    ]
  }
}
```

3. Run prebuild to update native files

```
npx expo prebuild
```

## Usage

```ts
import WebSocketWithSelfSignedCert from 'react-native-websocket-self-signed';

const wsWithSelfSignedCert = new WebSocketWithSelfSignedCert();
const targetWebSocket = 'wss://example.com';

try {
  await wsWithSelfSignedCert.connect(targetWebSocket);
  console.log('Connected to WebSocketWithSelfSignedCert');

  wsWithSelfSignedCert.onOpen(() => {
    console.log('WebSocketWithSelfSignedCert opened');
  });

  wsWithSelfSignedCert.onMessage((message: string) => {
    console.log('Received message:', message);
  });

  wsWithSelfSignedCert.onClose(() => {
    console.log('WebSocketWithSelfSignedCert closed');
  });

  wsWithSelfSignedCert.onError((err: string) => {
    console.error('Failed to connect:', err);
  });
} catch (err) {
  console.error('Failed to connect:', err);
}

// Clean-up when done
return () => {
  wsWithSelfSignedCert.close();
};
```

You can check an example here

- [./example/src/App.tsx](./example/src/App.tsx)

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
