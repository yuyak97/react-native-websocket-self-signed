import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Button,
  Platform,
  TextInput,
  ScrollView,
  Image,
} from 'react-native';
import WebSocketWithSelfSignedCert from 'react-native-websocket-self-signed';

const App: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [topic, setTopic] = useState<string>('Repeat');
  const [payload, setPayload] = useState<string>('Hello, World!');
  const [receivedImage, setReceivedImage] = useState<string | null>(null);

  const wsWithSelfSignedCert = useMemo(
    () => new WebSocketWithSelfSignedCert(),
    []
  );

  // In order to use this example, please set up local web socket server.
  // Please check /docs/WEB_SOCKET_SERVER_FOR_DEV.md
  const targetWebSocket =
    Platform.OS === 'android' ? 'wss://10.0.2.2:8443' : 'wss://localhost:8443';

  const webSocketConnect = useCallback(() => {
    setError(null);

    wsWithSelfSignedCert
      .connect(targetWebSocket)
      .then((data) => {
        console.log('Connected to WebSocketWithSelfSignedCert', data);
        setConnected(true);
      })
      .catch((err) => {
        console.error('Failed to connect: ' + err);
        setError('Failed to connect: ' + err);
      });

    wsWithSelfSignedCert.onOpen(() => {
      console.log('WebSocket connection opened');
    });

    wsWithSelfSignedCert.onMessage((message: string) => {
      console.log('Received message:', message);
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    wsWithSelfSignedCert.onBinaryMessage((data: Uint8Array) => {
      console.log('Received binary data');
      const base64String = `data:image/jpeg;base64,${data}`;
      setReceivedImage(base64String);
    });

    wsWithSelfSignedCert.onClose(() => {
      console.log('WebSocket connection closed');
      setConnected(false);
    });

    wsWithSelfSignedCert.onError((err: string) => {
      setError(`Failed to connect: ${err}`);
      console.log('Error state updated:', `Failed to connect: ${err}`);
    });

    return () => {
      wsWithSelfSignedCert.close();
    };
  }, [wsWithSelfSignedCert, targetWebSocket]);

  useEffect(() => {
    const cleanup = webSocketConnect();

    return () => {
      cleanup();
    };
  }, [wsWithSelfSignedCert, webSocketConnect]);

  const sendMessage = () => {
    console.log('Sending message with topic and payload:', { topic, payload });
    wsWithSelfSignedCert.send(JSON.stringify({ topic, payload }));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.status}>
        {connected
          ? 'Connected to WebSocketWithSelfSignedCert'
          : 'Disconnected from WebSocketWithSelfSignedCert'}
      </Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <TextInput
        style={styles.input}
        placeholder="Enter topic"
        value={topic}
        onChangeText={setTopic}
      />

      <TextInput
        style={styles.input}
        placeholder="Enter payload"
        value={payload}
        onChangeText={setPayload}
      />

      <Button
        title="Send Message"
        onPress={sendMessage}
        disabled={!connected}
      />

      <ScrollView style={styles.scrollView}>
        {receivedImage && (
          <Image source={{ uri: receivedImage }} style={styles.image} />
        )}

        <View style={styles.messages}>
          {messages.map((msg, index) => (
            <Text key={index} style={styles.message}>
              {msg}
            </Text>
          ))}
        </View>
      </ScrollView>
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
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  scrollView: {
    marginTop: 16,
    flex: 1,
  },
  messages: {
    marginBottom: 16,
  },
  message: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  image: {
    width: '100%',
    height: 200,
    marginBottom: 16,
  },
});

export default App;
