const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');

require('dotenv').config();

const app = express();

const cliendId = "test";
const client = new Client({
  authStrategy: new LocalAuth({ cliendId: cliendId})
});

// Returns a base64 that is used to create the qrcode and then login into wsp
client.on("qr", (qr) => {
  app.get('/get-qr', (req, res) => {
    res.send({qr});
  });
});

client.on("ready", () => {
  console.log("ready");
});

client.initialize();

client.on('message', message => {
  // TODO: send message to ai model and return sth indicating if there 
  // is or not hate speech, or percentage idk
  console.log("received msg: " + message);
});

const PORT = require("process").env.PORT || 3000;
app.listen(PORT, () => console.log(`running @ http://localhost:${PORT}`));
