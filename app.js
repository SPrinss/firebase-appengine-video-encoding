
'use strict';

const express = require('express');
const path = require('path');
const process = require('process'); // Required for mocking environment variables
const fs = require('fs'); 
const Buffer = require('safe-buffer').Buffer;

const {Storage} = require('@google-cloud/storage');

const {PubSub} = require('@google-cloud/pubsub');

const pubsubListener = new PubSub();

const workerTopicName = 'worker-topic-encode';
const workerSubscriptionName = 'worker-encode';
const pubsubWorkerTopic = pubsubListener.topic(workerTopicName);
const workerSubscription = pubsubWorkerTopic.subscription(workerSubscriptionName);


const app = express();

workerSubscription.on('message', (message) => {
  const messageData = Buffer.from(message.data, 'base64').toString();
  var messageDataObj = JSON.parse(messageData);

  console.log('filename ', messageDataObj.name)
  message.ack();

  // TODO make POST call to /encode
  // while not receive finished status push the ack deadline of the message.
  // on finished  message.ack();

  

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
