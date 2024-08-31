## Local Development Guide　

In order to test this library for the local development, we need a local web socket sever.

Here it how to set up it.

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
└── server.key
```

2. Add the Server Code

Copy and paste the following code into the server.js file:

```js
const https = require('https');
const fs = require('fs');
const WebSocket = require('./node_modules/ws');

const server = https.createServer({
  cert: fs.readFileSync('./server.crt'),
  key: fs.readFileSync('./server.key'),
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message) => {
    if (message.toString() === 'Repeat') {
      // For Repeat, return Message N: Repeat for 10 seconds every 1 second
      let count = 0;
      const intervalId = setInterval(() => {
        if (count < 10) {
          console.log(count);
          ws.send(`Message ${count + 1}: ${message}`);
          count++;
        } else {
          clearInterval(intervalId);
        }
      }, 1000);
    } else {
      ws.send(`Received: ${message}`);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

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
