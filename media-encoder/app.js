'use strict';

/*
Import Dependencies
*/
const express = require('express');
const path = require('path');
const process = require('process'); // Required for mocking environment variables
const Buffer = require('safe-buffer').Buffer;
const bodyParser = require('body-parser');
const {Storage} = require('@google-cloud/storage');

// The following environment variables are set by app.yaml when running on GAE,
// but will need to be manually set when running locally.
const PUBSUB_VERIFICATION_TOKEN = process.env.PUBSUB_VERIFICATION_TOKEN;
const TOPIC = process.env.PUBSUB_TOPIC;

async function triggerEncoder (req, res) {
  
  //thou shalt not pass if no verification token
  if (req.query.token !== PUBSUB_VERIFICATION_TOKEN) return res.status(400).send();

  try {
    
    // const messageData = parseMessageToJSON(req.body.message);
    // const storage = new Storage({projectId: messageData.projectId});
    // const file = await storage.bucket(messageData.bucket).file(messageData.name);
    // await file.copy('new-copy-buffer-test');

    //mock complex work, set response timeout to 1 minute
    window.setTimeout(() => {
      res.status(200).send();
    }, 1000*60);

  } catch(error) {
    console.error(error);
    res.status(500).send();
  }
};

/*
Send hello
*/
async function sendHello(req, res) {
  res.status(200).send('Hello from media encoder!');
}

/*
Parses raw message data to JSON object
*/
function parseMessageToJSON(message) {
  var data = Buffer.from(message.data, 'base64').toString();
  var json = JSON.parse(data);
  return json;
}

/*
Create, Init & Start Express Web Server
*/
const app = express();
app.get('/', sendHello);
app.post('/encode', bodyParser.json(), triggerEncoder);
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`App listening on port ${PORT}`));

/*
Export
*/
module.exports = app;