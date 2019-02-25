'use strict';

/*
Import Dependencies
*/
const express = require('express');
const process = require('process'); // Required for mocking environment variables
const Buffer = require('safe-buffer').Buffer;
const {PubSub} = require('@google-cloud/pubsub');

/*
Init
*/
const pubsubListener = new PubSub();
const pubsubWorkerTopic = pubsubListener.topic(process.env.TOPIC || 'worker-topic-encode');
const workerSubscription = pubsubWorkerTopic.subscription(process.env.SUBSCRIPTION || 'worker-encode');
const messages = new Map(); //A Map is very handy here because we don't like duplicate values

// TODO app.get('/_ah/start'...., the server (re)boots. -> Get all messages from subscription and handle each message.

workerSubscription.on('message', (message) => {
  
  const messageData = JSON.parse(Buffer.from(message.data, 'base64').toString());
  console.info('receiving message', messageData);
  /*
  message.id = ID of the message.
  message.ackId = ID used to acknowledge the message receival.
  message.data = Contents of the message.
  message.attributes = Attributes of the message.
  message.publishTime = Timestamp when Pub/Sub received the message
  */

  switch(messageData.status) {

    case 'new':
      console.info(`Adding message to queue`, messageData.name);
      messages.set(messageData.name, messageData);
      // POST `/encode`, body = `messageData`
      break;

    case 'finished':
      console.info(`Adding message to queue`, messageData.name);
      messages.set(messageData.name, messageData);
      break;

    default:
      console.info(`Message finished, deleting from queue: ${messageData.status}`);
      messages.delete(messageData.name);
      /*
      If message type is finished, the message is sent from the worker (basic instance: encoding).
      In the payload of the message, the id of the message that triggered the POST call to the worker is added.
      We use this id to acknowledge the message (removing it from the pubsub).
      We should also acknowledge the message that is sent from the worker.
      */
      break;
  }

})

/*
Create & Start Express Web Server
*/
const app = express();
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`App listening on port ${PORT}`));


/*
Export
*/
module.exports = app;