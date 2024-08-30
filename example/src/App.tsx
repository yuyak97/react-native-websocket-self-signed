import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, Text, Button, Platform } from 'react-native';
import WebSocketSelfSigned from 'react-native-websocket-self-signed';

const App: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const wsSelfSigned = useMemo(() => new WebSocketSelfSigned(), []);

  const targetWebSocket =
    Platform.OS === 'android' ? 'wss://10.0.2.2:8443' : 'wss://localhost:8443';

  const webSocketConnect = useCallback(() => {
    // Reset error state before attempting to connect
    setError(null);

    // Connect to the WebSocket
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

    // Listen for the WebSocket open event
    wsSelfSigned.onOpen(() => {
      console.log('WebSocketSelfSigned opened');
    });

    // Listen for messages from the server
    wsSelfSigned.onMessage((message: string) => {
      console.log('Received message:', message);
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    // Listen for the WebSocket close event
    wsSelfSigned.onClose(() => {
      console.log('WebSocketSelfSigned closed');
      setConnected(false);
    });

    // Listen for WebSocket errors
    wsSelfSigned.onError((err: string) => {
      setError(`Failed to connect: ${err}`);
      console.log('Error state updated:', `Failed to connect: ${err}`);
    });

    // Return a cleanup function to close the connection and remove listeners
    return () => {
      wsSelfSigned.close(); // Automatically removes listeners
    };
  }, [wsSelfSigned, targetWebSocket]);

  // Manage WebSocket connection and cleanup on component mount/unmount
  useEffect(() => {
    const cleanup = webSocketConnect();

    return () => {
      cleanup();
    };
  }, [wsSelfSigned, webSocketConnect]);

  // Handler for sending messages
  const sendMessage = () => {
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
        onPress={sendMessage}
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
