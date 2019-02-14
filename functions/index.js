const functions = require('firebase-functions');
const {PubSub} = require('@google-cloud/pubsub');

exports.handleNewStorageFile = functions.storage.object().onFinalize(async (object) => {
  const fileBucket = object.bucket; // The Storage bucket that contains the file.
  const filePath = object.name; // File path in the bucket.
  const contentType = object.contentType; // File content type.

  // TODO check video
  // if(contentType )
console.log(PubSub)
  const pubsub = new PubSub();
  const topicName = 'encode-video';
  const data = JSON.stringify({ name: filePath, bucket: fileBucket });

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
