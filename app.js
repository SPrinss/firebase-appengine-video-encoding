
'use strict';

const express = require('express');
const path = require('path');
const process = require('process'); // Required for mocking environment variables
const fs = require('fs'); 
const Buffer = require('safe-buffer').Buffer;
const bodyParser = require('body-parser');

const {Storage} = require('@google-cloud/storage');

const {PubSub} = require('@google-cloud/pubsub');
const topicName = 'worker-topic-encode';

const pubsubPublisher = new PubSub();
const pubsubListener = new PubSub();

const publisher = pubsubPublisher.topic(topicName).publisher();

const workerTopicName = 'worker-topic-encode';
const workerSubscriptionName = 'worker-encode';

const pubsubWorkerTopic = pubsubListener.topic(workerTopicName);
const workerSubscription = pubsubWorkerTopic.subscription(workerSubscriptionName);

const jsonBodyParser = bodyParser.json();

const app = express();
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));


// The following environment variables are set by app.yaml when running on GAE,
// but will need to be manually set when running locally.
const PUBSUB_VERIFICATION_TOKEN = process.env.PUBSUB_VERIFICATION_TOKEN;
const TOPIC = process.env.PUBSUB_TOPIC;

app.get('/', (req, res) => {    
  res.status(200).send('Hello world');
});


app.post('/add-video-to-encode-queue', jsonBodyParser,  async (req, res) => {
  // if (req.query.token !== PUBSUB_VERIFICATION_TOKEN) {
  //   res.status(400).send();
  //   return;
  // }

  try {
    const fileBucket = 'testing-video-slices.appspot.com'; // The Storage bucket that contains the file.
    const filePath = 'Neo.svg'; // File path in the bucket.

    const data = JSON.stringify({ name: filePath, bucket: fileBucket});
  
    const dataBuffer = Buffer.from(data);
  
    const messageId = await publisher.publish(dataBuffer);
    
    res.status(200).send();
  } catch(error) {
    res.status(500).send(error);
  }
});

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
