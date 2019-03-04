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
const {PubSub} = require('@google-cloud/pubsub');


// The following environment variables are set by app.yaml when running on GAE,
// but will need to be manually set when running locally.
const pubsub = new PubSub({projectId: 'testing-video-slices'});
const PUBSUB_VERIFICATION_TOKEN = process.env.PUBSUB_VERIFICATION_TOKEN;
const PUBSUB_TOPIC = process.env.PUBSUB_TOPIC;
const topic = pubsub.topic(PUBSUB_TOPIC)
const pubsubPublisher = topic.publisher()

async function triggerEncoder (req, res) {
  console.info('Encoder method triggered')
  //thou shalt not pass if no verification token
  if (req.query.token !== PUBSUB_VERIFICATION_TOKEN) return res.status(400).send();

  try {
    console.log('req.body', req.body)

    const messageData = req.body;
    //mock complex work, set response timeout to 1 minute
    setTimeout(async () => {
      
      // Encoding completed
      const dataToPublish = JSON.stringify({ newMessageId: messageData['newMessageId'], newMessageAckId: messageData['newMessageAckId'], status: "finished"});
      const dataBuffer = Buffer.from(dataToPublish);      
      await pubsubPublisher.publish(dataBuffer);

      res.status(200).send();
    }, 1000 * 80);

  } catch(error) {
    console.error(error);
    res.status(500).send();
  }
};

/*
Create, Init & Start Express Web Server
*/
const app = express();
app.post('/encode', bodyParser.json(), triggerEncoder);
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`App listening on port ${PORT}`));


/*
Send hello
*/
async function sendHello(req, res) {
  res.status(200).send('Hello from media encoder!');
}

app.get('/', sendHello);

/*
Export
*/
module.exports = app;
