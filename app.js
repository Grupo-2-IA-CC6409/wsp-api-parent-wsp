const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const { Client, LocalAuth } = require('whatsapp-web.js');
const fs = require('fs');

require('dotenv').config();

var model_api = axios.create({baseURL : require('process').env.MODEL_API_URL});
var session_api = axios.create({baseURL : require('process').env.SESSION_API_URL});

const ALLOWED_HOSTS = require('process').env.ALLOWED_HOSTS;

const app = express();

app.use(cors({
  origin: ALLOWED_HOSTS
}));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

const clients = new Map();


const readyFun = (clientId) => console.log(`${clientId} ready`);
const messageFun = (msg, clientId) => {
  model_api.post('/predict', {'message': msg.body})
    .then(async (response) => {
      console.log(`msg for ${clientId}, results: ${response.data.prediction.label} ${response.data.prediction.score}`);
      if (response.data.prediction.label === 'Bullying') {
        const contact = await msg.getContact();
        const name = contact.pushname;
        const number = contact.number;
        const chat = await msg.getChat();
        var data = {session: clientId, message: msg.body, sender: name, chat_name: chat.name, sender_number: number};
        session_api.post('notification/', data)
          .then((response) => {
            console.log(`notification api status: ${response.status}`);
          });
      }
    });
};
const disconnectFun = (clientId) => {
  var data = {session: clientId};
  session_api.post('disconnect/', data)
    .then((response) => {
      console.log(`Session disconnected: ${clientId}; response: ${response.status}`);
    });
};

// initialize existing session on startup
const folder = '.wwebjs_auth';
fs.readdirSync(folder).forEach(file => {
  // really shity code, not to use irl
  var clientId = file.substring(8);
  var client = new Client({
    authStrategy: new LocalAuth({ clientId: clientId }),
  });

  var context = {client: client, qr: '', qr_timeouts: 0, status: 'connected'};
  clients.set(clientId, context);

  client.on('ready', () => {
    readyFun(clientId);
  });

  client.on('message', (msg) => {
    messageFun(msg, clientId);
  });

  client.on('disconnected', (reason) => {
    disconnectFun(clientId);
    context.client.destroy();
  });

  client.initialize();
});

// get qr code
app.post('/qr-code', (req, res) => {
  var clientId = req.body.clientId;
  var context = clients.get(clientId);
  if (context) {
    res.send({qr: context.qr});
  }
});

// get qr code status
app.post('/qr-status', (req, res) => {
  var clientId = req.body.clientId;
  var context = clients.get(clientId);
  if (context) {
    res.send({status: context.status});
  } else {
    res.send({status: 'timedout'});
  }
});

// create new session
app.get('/qr-new', (req, res) => {
  const clientId = uuidv4();
  const client = new Client({
    authStrategy: new LocalAuth({ clientId: clientId }),
  });

  var context = {client: client, qr: '', qr_timeouts: 0, status: 'not_connected'};
  clients.set(clientId, context);

  client.on('qr', (qr) => {
    context.qr = qr;
    if (context.qr_timeouts >= 3) {
      clients.delete(clientId);
      context.client.destroy();
    }
    context.qr_timeouts++;
    console.log(`qr for ${clientId}`);
  });

  client.on('ready', () => {
    context.status='connected';
    readyFun(clientId);
  });

  client.on('message', (msg) => {
    messageFun(msg, clientId);
  });

  client.on('disconnected', (reason) => {
    disconnectFun(clientId);
    context.client.destroy();
  });

  client.initialize();

  res.send({clientId});
});

const PORT = require('process').env.PORT || 3000;
app.listen(PORT, () => console.log(`running @ http://localhost:${PORT}`));
