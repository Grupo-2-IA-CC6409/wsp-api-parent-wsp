const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const { Client, LocalAuth } = require('whatsapp-web.js');

require('dotenv').config();

axios.defaults.baseURL = require("process").env.MODEL_API_URL;

const ALLOWED_HOSTS = require("process").env.ALLOWED_HOSTS;

const app = express();
app.use(cors({
  origin: ALLOWED_HOSTS
}));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

const clients = new Map();

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
    res.send({status: "timedout"});
  }
});

// create new session
app.get('/qr-new', (req, res) => {
  const clientId = uuidv4();
  const client = new Client({
    authStrategy: new LocalAuth({ clientId: clientId }),
    puppeteer: {
      args: ['--no-sandbox'],
    }
  });

  var context = {client: client, qr: "", qr_timeouts: 0, status: "not_connected"};
  clients.set(clientId, context);

  client.on("qr", (qr) => {
    context.qr = qr;
    if (context.qr_timeouts >= 3) {
      clients.delete(clientId);
      context.client.destroy();
    }
    context.qr_timeouts++;
  });

  client.on("ready", () => {
    context.status="connected";
  });

  client.on('message', (msg) => {
    var msgContent = msg.body;
    console.log(`received msg: ${msgContent}`);
    var json = {"message": msgContent};
    axios.post("/predict", json)
      .then((response) =>{
        console.log(`is hate?: ${response.data.prediction.label} ${response.data.prediction.score}`);
      });
  });

  client.initialize();

  res.send({clientId});
});

const PORT = require("process").env.PORT || 3000;
app.listen(PORT, () => console.log(`running @ http://localhost:${PORT}`));
