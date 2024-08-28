import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, Text, Button, Platform } from 'react-native';
import WebSocketSelfSigned, {
  WebSocketEvent,
} from 'react-native-websocket-self-signed';

const App: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const wsSelfSigned = useMemo(() => new WebSocketSelfSigned(), []);

  const targetWebSocket =
    Platform.OS === 'android' ? 'wss://10.0.2.2:8443' : 'wss://localhost:8443';

  const webSocketUnsafe = useCallback(() => {
    // Reset error state before attempting to connect
    setError(null);

    wsSelfSigned
      .connect(targetWebSocket)
      .then((data) => {
        console.log('Connected to WebSocketSelfSigned', data);
        setConnected(true);
      })
      .catch((err) => {
        console.error('Failed to connect: ' + err);
        setError('Failed to connect: ' + err);
      });

    wsSelfSigned.onOpen(() => {
      console.log('WebSocketSelfSigned opened');
    });

    wsSelfSigned.onMessage((message: string) => {
      console.log('Received message:', message);
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    wsSelfSigned.onClose(() => {
      console.log('WebSocketSelfSigned closed');
      setConnected(false);
    });

    wsSelfSigned.onError((err: string) => {
      setError(`Failed to connect: ${err}`);
      console.log('Error state updated:', `Failed to connect: ${err}`);
    });

    return () => {
      wsSelfSigned.close();
      wsSelfSigned.removeAllListeners(WebSocketEvent.OPEN);
      wsSelfSigned.removeAllListeners(WebSocketEvent.MESSAGE);
      wsSelfSigned.removeAllListeners(WebSocketEvent.CLOSE);
      wsSelfSigned.removeAllListeners(WebSocketEvent.ERROR);
    };
  }, [wsSelfSigned, targetWebSocket]);

  useEffect(() => {
    const cleanup = webSocketUnsafe();

    return () => {
      cleanup();
    };
  }, [wsSelfSigned, webSocketUnsafe]);

  const sendMessageUnsafe = () => {
    console.log('CLICK send button');
    wsSelfSigned.send('Repeat');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.status}>
        {connected
          ? 'Connected to WebSocketSelfSigned'
          : 'Disconnected from WebSocketSelfSigned'}
      </Text>

      {error && <Text style={styles.error}>{error}</Text>}
      <Button
        title="Send Message (WebSocketSelfSigned)"
        onPress={sendMessageUnsafe}
        disabled={!connected}
      />
      <View style={styles.messages}>
        {messages.map((msg, index) => (
          <Text key={index} style={styles.message}>
            {msg}
          </Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  status: {
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  error: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
  },
  messages: {
    marginTop: 16,
  },
  message: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
});

export default App;
