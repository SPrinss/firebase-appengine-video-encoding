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
const encodeMediaFile = require('./media-encoder');

var firebase = require('firebase');
var firebaseApp = firebase.initializeApp({ 
  apiKey: "AIzaSyBI1dA_kYhrAu7bddwNLS5PUqcxVe51Bxo",
  authDomain: "testing-video-slices.firebaseapp.com",
  databaseURL: "https://testing-video-slices.firebaseio.com",
  projectId: "testing-video-slices",
  storageBucket: "testing-video-slices.appspot.com",
  messagingSenderId: "751477066988"
 });


const storage = new Storage();

// The following environment variables are set by app.yaml when running on GAE,
// but will need to be manually set when running locally.
const pubsub = new PubSub({projectId: 'testing-video-slices'});
const PUBSUB_VERIFICATION_TOKEN = process.env.PUBSUB_VERIFICATION_TOKEN;
const PUBSUB_TOPIC = process.env.PUBSUB_TOPIC;
const topic = pubsub.topic(PUBSUB_TOPIC)
const pubsubPublisher = topic.publisher()
const databaseLogCollectionName = "encoding-jobs";

async function triggerEncoder (req, res) {
  //thou shalt not pass if no verification token
  if (req.query.token !== PUBSUB_VERIFICATION_TOKEN) return res.status(400).send();

  try {

    const messageData = req.body;
    
    console.info('Encoder method triggered, taks id: ', messageData['newMessageId']);
    const docId = await createLogInDb(messageData.newMessageId, messageData.name)

    const bucket = storage.bucket(messageData.bucket);
    await encodeMediaFile(messageData.name, bucket);

    await updateLogInDb(docId, 'finished')


    const dataToPublish = JSON.stringify({ newMessageId: messageData['newMessageId'], newMessageAckId: messageData['newMessageAckId'], status: "finished"});
    const dataBuffer = Buffer.from(dataToPublish);
    await pubsubPublisher.publish(dataBuffer);

    res.status(200).send();
  } catch(error) {
    await updateLogInDb(docId, 'crashed')
    console.error(error);
    res.status(500).send();
  }
};

async function createLogInDb(id, name) {
  const startTime = new Date().getTime();
  const docRef = await firebaseApp.firestore().collection(databaseLogCollectionName).add({
    taskId: id,
    name: name,
    status: 'encoding',
    startTime: startTime
  });
  
  const docId = docRef.id;

  return docId
}

async function updateLogInDb(docId, status) {
  if(!status) status = "finished";
  // Get the document to get the starttime of the job.
  const docData = await getDocDataFromDb(databaseLogCollectionName, docId);

  const endTime = new Date().getTime();
  const processingDurationInMs = endTime - docData.startTime;

  // merge: true makes sure not to remove keys that aren't set with the call.
  return await firebaseApp.firestore().collection(databaseLogCollectionName).doc(docId).set({
    status: status,
    endTime: endTime,
    processingDuration: processingDurationInMs
  }, {merge: true});
}

async function getDocDataFromDb(collection, docId) {
  if(!collection) collection = databaseLogCollectionName;
  const doc = await firebaseApp.firestore().collection(collection).doc(docId).get();
  return doc.data();
}

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
