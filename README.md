# 💫 react-native-websocket-self-signed

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

### Version <= 0.4.0

From version 0.4.0, support for multiple concurrent WebSocket connections was added.
Each connection is managed independently using `WebSocketWithSelfSignedCert.getInstance(url)`.

<details>
<summary>Example: Using multiple WebSocket connections</summary>

```ts
import WebSocketWithSelfSignedCert from 'react-native-websocket-self-signed';

const [connected1, setConnected1] = useState<boolean>(false);
const [connected2, setConnected2] = useState<boolean>(false);
const [messages1, setMessages1] = useState<string[]>([]);
const [messages2, setMessages2] = useState<string[]>([]);
const [error1, setError1] = useState<string | null>(null);
const [error2, setError2] = useState<string | null>(null);
const [payload, setPayload] = useState<string>('Hello, World!');

const targetWebSocket1 =
  Platform.OS === 'android' ? 'wss://10.0.2.2:8443' : 'wss://localhost:8443';
const targetWebSocket2 = 'wss://echo.websocket.org';

const ws1: WebSocketWithSelfSignedCert = useMemo(
  () => WebSocketWithSelfSignedCert.getInstance(targetWebSocket1),
  [targetWebSocket1]
);

const ws2: WebSocketWithSelfSignedCert = useMemo(
  () => WebSocketWithSelfSignedCert.getInstance(targetWebSocket2),
  [targetWebSocket2]
);

const connectToWebSocket = useCallback(
  (
    ws: WebSocketWithSelfSignedCert,
    setConnected: React.Dispatch<React.SetStateAction<boolean>>,
    setMessages: React.Dispatch<React.SetStateAction<string[]>>,
    setError: React.Dispatch<React.SetStateAction<string | null>>,
    target: string
  ) => {
    setError(null);

    ws.onOpen(() => {
      console.log(`WebSocket connection opened: ${target}`);
      setConnected(true);
    });

    ws.onMessage((message: string) => {
      console.log(`Received message from ${target}:`, message);
      setMessages((prev) => [...prev, message]);
    });

    ws.onClose(() => {
      console.log(`WebSocket connection closed: ${target}`);
      setConnected(false);
    });

    ws.onError((err: string) => {
      console.error(`Failed to connect to ${target}:`, err);
      setError(`Failed to connect: ${err}`);
    });

    ws.connect({ Authorization: 'Bearer your_token' })
      .then(() => {
        console.log(`Connected to ${target}`);
        setConnected(true);
      })
      .catch((err) => {
        console.error(`Failed to connect to ${target}: `, err);
        setError(`Failed to connect: ${err}`);
      });

    return () => {
      ws.close();
    };
  },
  []
);

useEffect(() => {
  const cleanup1 = connectToWebSocket(
    ws1,
    setConnected1,
    setMessages1,
    setError1,
    targetWebSocket1
  );
  const cleanup2 = connectToWebSocket(
    ws2,
    setConnected2,
    setMessages2,
    setError2,
    targetWebSocket2
  );

  return () => {
    cleanup1();
    cleanup2();
  };
}, [connectToWebSocket, ws1, ws2, targetWebSocket1, targetWebSocket2]);

const sendMessage1 = () => {
  console.log('Sending message to WebSocket 1:', payload);
  ws1.send(payload);
};

const sendMessage2 = () => {
  console.log('Sending message to WebSocket 2:', payload);
  ws2.send(payload);
};
```

</details>

### Version >= 0.3.1

<details>
<summary>Example: for version less than 0.3.1</summary>

```ts
import WebSocketWithSelfSignedCert from 'react-native-websocket-self-signed';

const wsWithSelfSignedCert = new WebSocketWithSelfSignedCert();
const targetWebSocket = 'wss://example.com';

wsWithSelfSignedCert.onOpen(() => {
  console.log('WebSocket connection opened');
});

wsWithSelfSignedCert.onMessage((message: string) => {
  console.log('Received message:', message);
});

wsWithSelfSignedCert.onBinaryMessage((data: Uint8Array) => {
  console.log('Received binary data');
  const base64String = `data:image/jpeg;base64,${data}`;
});

wsWithSelfSignedCert.onClose(() => {
  console.log('WebSocket connection closed');
});

wsWithSelfSignedCert.onError((err: string) => {
  console.log('Error state updated:', `Failed to connect: ${err}`);
});

wsWithSelfSignedCert
  .connect(targetWebSocket)
  .then((data) => {
    console.log('Connected to WebSocketWithSelfSignedCert', data);
  })
  .catch((err) => {
    console.error('Failed to connect: ' + err);
  });

return () => {
  wsWithSelfSignedCert.close();
};

wsWithSelfSignedCert.send("message"));
```

</details>

You can check this whole example here.

- [./example/src/App.tsx](./example/src/App.tsx)

To run the example, start the WebSocket server by following the instructions provided in [WEB_SOCKET_SERVER_FOR_DEV.md](./docs/WEB_SOCKET_SERVER_FOR_DEV.md).

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
