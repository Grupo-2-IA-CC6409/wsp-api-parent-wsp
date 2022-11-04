const express = require('express');
const axios = require('axios');
const { Client, LocalAuth } = require('whatsapp-web.js');

require('dotenv').config();

const app = express();

axios.defaults.baseURL = require("process").env.MODEL_API_URL || "127.0.0.1:5000";
console.log(axios.defaults.baseURL);

const clientId = "test";
const client = new Client({
  authStrategy: new LocalAuth({ clientId: clientId })
});

var clientStatus = {"status": "not_connected"};
app.get('/qr-status', (req, res) => {
  res.send(clientStatus);
});

// Returns a str that is used to create the qrcode and then login into wsp
client.on("qr", (qr) => {
  console.log(`qr: ${qr}`);
  console.log(new Date());
  app.get('/get-qr', (req, res) => {
    res.send({qr});
  });
});

client.on("ready", () => {
  console.log("ready");
  clientStatus.status = "connected";
});


client.on('message', (msg) => {
  let msgContent = msg.body;
  console.log(`received msg: ${msgContent}`);
  let json = {"message": msgContent};
  axios.post("/predict", json)
    .then((response) =>{
      console.log(`is hate?: ${response.data.prediction.label} ${response.data.prediction.score}`);
    });
});

client.initialize();

const PORT = require("process").env.PORT || 3000;
app.listen(PORT, () => console.log(`running @ http://localhost:${PORT}`));
