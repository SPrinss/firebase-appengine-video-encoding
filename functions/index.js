/*
Import Dependencies
*/
const functions = require('firebase-functions');
const {PubSub} = require('@google-cloud/pubsub');

/*
Init
*/
const projectId = 'test-video-slices';
const storageBucket = 'testing-video-slices.appspot.com'; // The Storage bucket that contains the file.
const pubsub = new PubSub();
const topicName = 'encode-video-3';

/*
Storage Upload Handler
*/
async function handleFileUpload(object) {
  switch(object.contentType) {
    
    case 'audio/mp3':
    case 'video/mp4':
      const data = JSON.stringify({ name: 'Neo.svg', bucket: storageBucket, projectId: projectId});
      const dataBuffer = Buffer.from(data);
      const messageId = await pubsub.topic(topicName).publish(dataBuffer);
      console.log(`Published ${messageId}, mime type = ${object.contentType}.`);
      break;

    default:
      console.info(`Ignoring file with mime type ${object.contentType}.`);
      break;
  }
}

/*
Export
*/
exports.handleNewStorageFile = functions.storage.object().onFinalize(handleFileUpload);