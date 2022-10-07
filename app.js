const express = require('express');
const fs = require('fs');
const createError = require('http-errors');
const morgan = require('morgan');
const { Client, LocalAuth } = require('whatsapp-web.js');
require('dotenv').config();

const app = express();

const SESSION_FILE_PATH = './session.json';
let sessionCfg;
if (fs.existsSync(SESSION_FILE_PATH)) {
  sessionCfg = require(SESSION_FILE_PATH);
}

const client = new Client({
  authStrategy: new LocalAuth()
});

client.initialize();

