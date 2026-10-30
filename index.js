const express = require('express');
const bedrock = require('bedrock-protocol');

const app = express();
app.use(express.json());

let bot = null;
let botStatus = 'Stopped';
let lastMessage = 'Bot is stopped';

const HOST = process.env.MC_HOST || 'play.battlepie.net';
const PORT = Number(process.env.MC_PORT || 19132);
const ADMIN_KEY = process.env.ADMIN_KEY;

app.get('/', (req, res) => {
  res.send(`
    <h1>BattlePie AFK Bot</h1>
    <input id="key" type="password" placeholder="Admin key">
    <button onclick="start()">Start Bot</button>
    <button onclick="stop()">Stop Bot</button>
    <button onclick="status()">Check Status</button>
    <pre id="out">Ready</pre>
    <script>
      async function call(path) {
        const r = await fetch(path, {
          method: path === '/status' ? 'GET' : 'POST',
          headers: {'Content-Type':'application/json','x-admin-key':
            document.getElementById('key').value}
        });
        document.getElementById('out').textContent =
          JSON.stringify(await r.json(), null, 2);
      }
      function start(){call('/start')}
      function stop(){call('/stop')}
      function status(){call('/status')}
    </script>
  `);
});

app.use((req, res, next) => {
  if (!ADMIN_KEY || req.headers['x-admin-key'] !== ADMIN_KEY) {
    return res.status(401).json({ error: 'Invalid admin key' });
  }
  next();
});

app.get('/status', (req, res) => {
  res.json({ status: botStatus, message: lastMessage });
});

app.post('/start', (req, res) => {
  if (bot) return res.json({ status: botStatus, message: 'Bot already started' });

  try {
    botStatus = 'Connecting';
    lastMessage = 'Starting Microsoft authentication';

    bot = bedrock.createClient({
      host: HOST,
      port: PORT,
      username: process.env.MC_USERNAME || 'MinecraftPlayer',
      profilesFolder: './minecraft-auth',
      onMsaCode: (data) => {
        lastMessage = 'Microsoft login required';
        console.log('Microsoft login instructions:', data);
      }
    });

    bot.on('join', () => {
      botStatus = 'Connected';
      lastMessage = 'Connected to Minecraft server';
    });

    bot.on('spawn', () => {
      botStatus = 'Online';
      lastMessage = 'Spawned in the world. AFK warp not automated yet.';
    });

    bot.on('error', (err) => {
      lastMessage = err.message;
      console.error(err);
    });

    bot.on('close', () => {
      bot = null;
      botStatus = 'Stopped';
      lastMessage = 'Connection closed';
    });

    res.json({ status: botStatus, message: 'Connection started. Check Render logs for Microsoft login instructions.' });
  } catch (err) {
    bot = null;
    botStatus = 'Error';
    lastMessage = err.message;
    res.status(500).json({ error: err.message });
  }
});

app.post('/stop', (req, res) => {
  if (bot) {
    const currentBot = bot;
    bot = null;
    botStatus = 'Stopped';
    lastMessage = 'Bot stopped';
    currentBot.disconnect();
  }
  res.json({ status: botStatus, message: lastMessage });
});

app.listen(process.env.PORT || 3000, '0.0.0.0', () => {
  console.log('BattlePie dashboard started');
});