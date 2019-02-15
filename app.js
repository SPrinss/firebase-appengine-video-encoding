
'use strict';

const express = require('express');
const path = require('path');
const process = require('process'); // Required for mocking environment variables

const {Storage} = require('@google-cloud/storage');
const projectId = 'testing-video-slices';
const storage = new Storage({projectId: projectId});
const bucketName = 'testing-video-slices.appspot.com';

const app = express();
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));


app.get('/', (req, res) => {
  res.render('index', {messages: messages});
});

app.post('/encode/video', async (req, res) => {
  // if (req.query.token !== PUBSUB_VERIFICATION_TOKEN) {
  //   res.status(400).send();
  //   return;
  // }

  try {

    await storage
    .bucket(bucketName)
    .file('Neo.svg')
    .delete();
    
    res.status(200).send();
  } catch(error) {
    res.status(505).send(error);

  }
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});

module.exports = app;
