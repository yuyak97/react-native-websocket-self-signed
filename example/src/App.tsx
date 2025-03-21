import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  Button,
  Platform,
  TextInput,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import WebSocketWithSelfSignedCert from 'react-native-websocket-self-signed';

const App: React.FC = () => {
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

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.status}>
        {connected1
          ? `Connected to ${targetWebSocket1}`
          : `Disconnected from ${targetWebSocket1}`}
      </Text>
      {error1 && <Text style={styles.error}>{error1}</Text>}
      <Button
        title="Send to WebSocket 1"
        onPress={sendMessage1}
        disabled={!connected1}
      />

      <Text style={styles.status}>
        {connected2
          ? `Connected to ${targetWebSocket2}`
          : `Disconnected from ${targetWebSocket2}`}
      </Text>
      {error2 && <Text style={styles.error}>{error2}</Text>}
      <Button
        title="Send to WebSocket 2"
        onPress={sendMessage2}
        disabled={!connected2}
      />

      <TextInput
        style={styles.input}
        placeholder="Enter message"
        value={payload}
        onChangeText={setPayload}
      />

      <ScrollView style={styles.scrollView}>
        <Text style={styles.messageHeader}>
          Messages from {targetWebSocket1}:
        </Text>
        {messages1.map((msg, index) => (
          <Text key={`ws1-${index}`} style={styles.message}>
            {msg}
          </Text>
        ))}

        <Text style={styles.messageHeader}>
          Messages from {targetWebSocket2}:
        </Text>
        {messages2.map((msg, index) => (
          <Text key={`ws2-${index}`} style={styles.message}>
            {msg}
          </Text>
        ))}
      </ScrollView>
    </SafeAreaView>
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
    marginBottom: 8,
    textAlign: 'center',
  },
  error: {
    color: 'red',
    marginBottom: 8,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  scrollView: {
    marginTop: 16,
    flex: 1,
  },
  messageHeader: {
    fontWeight: 'bold',
    marginTop: 10,
  },
  message: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
});

export default App;
