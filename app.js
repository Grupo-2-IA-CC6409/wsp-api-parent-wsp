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
  console.log("SEND");
});

client.on("ready", () => {

  console.log("ready");
});

client.initialize();

client.on('message', async message => {
  // TODO: send message to ai model and return sth indicating if there 
  // is or not hate speech, or percentage idk
  try{
    const contact = await message.getContact();
    const name = contact.pushname
    const number = contact.number
    const chat = await message.getChat();
    console.log("received msg from number: "+ number + "/ chat name: "+ chat.name+ "/ user name: " + name + "/ msg: " + message.body);
  }catch{
    console.log("none");
  }

});

client.on('message_create', (message) => {
  // Fired on all message creations, including your own
  if (message.fromMe) {
    message.
    console.log("send msg: " + message.body);
  }
});

client.on('disconnected', (reason) => {
  console.log('Client was logged out', reason);
});

const PORT = require("process").env.PORT || 3000;
app.listen(PORT, () => console.log(`running @ http://localhost:${PORT}`));
