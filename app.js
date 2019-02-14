'use strict';

const express = require('express');
// const bodyParser = require('body-parser');

// By default, the client will authenticate using the service account file
// specified by the GOOGLE_APPLICATION_CREDENTIALS environment variable and use
// the project specified by the GOOGLE_CLOUD_PROJECT environment variable. See
// https://github.com/GoogleCloudPlatform/google-cloud-node/blob/master/docs/authentication.md
// These environment variables are set automatically on Google App Engine
// const {PubSub} = require('@google-cloud/pubsub');

// Instantiate a pubsub client
// const pubsub = new PubSub();

const app = express();

// const formBodyParser = bodyParser.urlencoded({extended: false});
// const jsonBodyParser = bodyParser.json();

// The following environment variables are set by app.yaml when running on GAE,
// but will need to be manually set when running locally.
// const PUBSUB_VERIFICATION_TOKEN = 'randomTokenForYouTodayIsSpecial';
// const TOPIC = 'encode-video';

// const publisher = pubsub.topic(TOPIC).publisher();

// [START gae_flex_pubsub_index]
app.get('/', (req, res) => {
  res.status(200).send('Hello, world!').end();
});

// [END gae_flex_pubsub_index]

// [START gae_flex_pubsub_push]
// app.post('/pubsub/push', jsonBodyParser, (req, res) => {
//   if (req.query.token !== PUBSUB_VERIFICATION_TOKEN) {
//     res.status(400).send();
//     return;
//   }

//   // The message is a unicode string encoded in base64.
//   const message = Buffer.from(req.body.message.data, 'base64').toString(
//     'utf-8'
//   );

//   messages.push(message);

//   res.status(200).send();
// });
// [END gae_flex_pubsub_push]

module.exports = app;
