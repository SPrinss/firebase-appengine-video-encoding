
'use strict';

const express = require('express');
const path = require('path');
const process = require('process'); // Required for mocking environment variables
const fs = require('fs'); 
const Buffer = require('safe-buffer').Buffer;

const {Storage} = require('@google-cloud/storage');

const {PubSub} = require('@google-cloud/pubsub');

const pubsubListener = new PubSub();

// TODO: Create env variables
const workerTopicName = 'worker-topic-encode';
const workerSubscriptionName = 'worker-encode';
const pubsubWorkerTopic = pubsubListener.topic(workerTopicName);
const workerSubscription = pubsubWorkerTopic.subscription(workerSubscriptionName);


const app = express();

const messages = [];

// TODO app.get('/_ah/start'...., the server (re)boots. -> Get all messages from subscription and handle each message.


workerSubscription.on('message', (message) => {
  const messageData = Buffer.from(message.data, 'base64').toString();
  var messageDataObj = JSON.parse(messageData);

  console.log('filename ', messageDataObj.name)
  
  // If the message is new or hasn't been handled fully yet...
  // TODO: What if worker is still encoding and workerSubscription is triggered? Add type = 'handling' ?
  if(messageDataObj.type == 'new') {
    // Make POST call to '/encode' with messageDataObj
      messages.push(messageDataObj);
  }
  // If message type is finished, the message is sent from the worker (basic instance: encoding). 
  // In the payload of the message, the id of the message that triggered the POST call to the worker is added.
  // We use this id to acknowledge the message (removing it from the pubsub).
  // We should also acknowledge the message that is sent from the worker.
  else if (messageDataObj.type == 'finished') {
    const idOfFinishedMessage = messageDataObj.finishedMessageId;
  } else {
    console.warn('Unkown message type :', messageDataObj.id)
  }
  

  // message.id = ID of the message.
  // message.ackId = ID used to acknowledge the message receival.
  // message.data = Contents of the message.
  // message.attributes = Attributes of the message.
  // message.publishTime = Timestamp when Pub/Sub received the message
})

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});

module.exports = app;
