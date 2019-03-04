/*
Import Dependencies
*/
const functions = require('firebase-functions');
const {PubSub} = require('@google-cloud/pubsub');

/*
Init
*/
const projectId = 'testing-video-slices';
const pubsub = new PubSub();
const topicName = 'worker-topic-encode';

/*
Storage Upload Handler
*/
async function handleFileUpload(object) {
  switch(object.contentType) {
    
    // TODO other media types?
    case 'audio/mp3':
    case 'video/mp4':
      // Must add `type: "new"` the status to the message in order for it to be processed correctly
      const data = JSON.stringify({ name: object.name, bucket: object.bucket, projectId: projectId, status: "new"});
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