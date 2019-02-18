const functions = require('firebase-functions');
const {PubSub} = require('@google-cloud/pubsub');

const projectId = 'test-video-slices'

exports.handleNewStorageFile = functions.storage.object().onFinalize(async (object) => {
  const fileBucket = 'testing-video-slices.appspot.com'; // The Storage bucket that contains the file.
  const filePath = 'Neo.svg'; // File path in the bucket.
  const contentType = object.contentType; // File content type.

  // TODO check video
  // if(contentType )
  const pubsub = new PubSub();
  const topicName = 'encode-video-2';
  const data = JSON.stringify({ name: filePath, bucket: fileBucket, projectId: projectId});

  const dataBuffer = Buffer.from(data);

  const messageId = await pubsub.topic(topicName).publish(dataBuffer);
  console.log(`Message ${messageId} published.`);
  
})

// exports.handleMetaUpdateStorageFile = functions.storage.object().onMetadataUpdate((object) => {
//   console.log('meta update')
// })

// exports.handleVideoEncoded = functions.pubsub.topic('video-encoded').onPublish((message, context) => {
//   console.log('video encoded', message.json['whateverObjPath'], context['timestamp'] + ' might exist')
// });
