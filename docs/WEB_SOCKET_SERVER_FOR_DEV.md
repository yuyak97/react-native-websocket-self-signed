## Local Development Guide　

In order to test this library for the local development, we need a local web socket sever.

Here is the set up instruction

1. Set Up Your Project

Begin by creating a new directory and initializing a Node.js project within it:

```sh
mkdir websocket-server
cd websocket-server
npm init -y
npm install ws
touch server.js
# Generate self-signed certificates for secure WebSocket connections
openssl req -subj '/C=JP/ST=TestState/O=TestOrganization' -addext 'subjectAltName = IP:127.0.0.1' -x509 -nodes -days 3650 -newkey rsa:2048 -keyout ./server.key -out ./server.crt
```

After executing these commands, your project structure should look like this:

```sh
.
├── package-lock.json
├── package.json
├── server-without-ssl.js
├── server.crt
├── server.js
├── sample.png # If onBinaryMessage test is required, please add a sample image.
└── server.key
```

1. Add the Server Code

Copy and paste the following code into the server.js file:

```js
const https = require('https');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

// Read SSL certificates
const server = https.createServer({
  cert: fs.readFileSync('./server.crt'),
  key: fs.readFileSync('./server.key'),
});

// Initialize WebSocket Server
const wss = new WebSocket.Server({ server });

// Message Handlers
const messageHandlers = {
  /**
   * Repeats a message to the client multiple times with an interval.
   * @param {WebSocket} ws - The WebSocket connection.
   * @param {string} payload - The message payload to repeat.
   */
  repeat: (ws, payload) => {
    let count = 0;
    const intervalId = setInterval(() => {
      if (count < 10) {
        console.log(`Sending message ${count + 1}: ${payload}`);
        ws.send(`Message ${count + 1}: ${payload}`);
        count++;
      } else {
        clearInterval(intervalId);
      }
    }, 1000);
  },

  /**
   * Sends a sample image from the server's filesystem to the client.
   * @param {WebSocket} ws - The WebSocket connection.
   * @param {string} imageName - The name of the image file to send.
   */
  getSampleImage: (ws, imageName) => {
    const imagePath = path.join(__dirname, imageName);

    fs.readFile(imagePath, (err, data) => {
      if (err) {
        console.error('Failed to read image:', err);
        ws.send('Error: Image not found');
        return;
      }

      console.log('Sending image:', imageName);
      ws.send(data);
    });
  },

  /**
   * Default handler for any unspecified topics.
   * @param {WebSocket} ws - The WebSocket connection.
   * @param {string} payload - The message payload.
   */
  default: (ws, payload) => {
    console.log(`Default handler invoked with payload: ${payload}`);
    ws.send(`Received: ${payload}`);
  },
};

// WebSocket connection setup
wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message) => {
    console.log('Received message:', message.toString());

    try {
      const parsedMessage = JSON.parse(message.toString());
      const topic = parsedMessage.topic || 'default';
      const handler = messageHandlers[topic] || messageHandlers.default;
      handler(ws, parsedMessage.payload);
    } catch (error) {
      console.log('Binary data received or failed to parse JSON');
      messageHandlers.upload(ws, message);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Start the HTTPS server with WebSocket
const PORT = 8443;
server.listen(PORT, () => {
  console.log(`WebSocket server is running on wss://localhost:${PORT}`);
});
```

3. Run the Server

Start your WebSocket server with the following command

```sh
# The server will run on wss://localhost:8443
node server.js
```

## list of topics

Here’s a list of topics that the WebSocket server supports along with a brief description of each.

### repeat

Description: Repeats a given message payload to the client 10 times at 1-second intervals.
Payload: A string message that will be repeated.

Example Request:

```json
{
  "topic": "repeat",
  "payload": "Hello, WebSocket!"
}
```

Example Response: `Message 1: Hello, WebSocket!, Message 2: Hello, WebSocket!, ..., Message 10: Hello, WebSocket!`

### getSampleImage

Description: Sends a sample image from the server's filesystem to the client. The image name should be provided as the payload.
Payload: The name of the image file to send (relative to the server's directory).

Example Request:

```json
{
  "topic": "getSampleImage",
  "payload": "sample.jpg"
}
```

Example Response: `Binary data representing the image file.`

### default

Description: Handles any unspecified topics. Simply echoes back the received payload.
Payload: Any string payload.
Example Request:

```json
{
  "topic": "unknownTopic",
  "payload": "This will trigger the default handler."
}
```

Example Response: Received: This will trigger the default handler.
