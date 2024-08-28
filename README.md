# react-native-websocket-self-signed

provides support for secure WebSocket (wss://) connections with self-signed certificates. This package allows developers to seamlessly establish secure WebSocket communication in their React Native applications, even when using self-signed SSL/TLS certificates, which are typically not trusted by default. Ideal for development environments and internal applications where secure communication is necessary without the need for a publicly trusted certificate authority.

## Installation

```sh
npm install react-native-websocket-self-signed
```

## Usage


```js
import { multiply } from 'react-native-websocket-self-signed';

// ...

const result = await multiply(3, 7);
```


## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
