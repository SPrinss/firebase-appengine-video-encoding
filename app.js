
'use strict';

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const process = require('process'); // Required for mocking environment variables
const fs = require('fs'); 
const Buffer = require('safe-buffer').Buffer;
const {Storage} = require('@google-cloud/storage');
const projectId = 'testing-video-slices';
const storage = new Storage({projectId: projectId});
const bucketName = 'testing-video-slices.appspot.com';
const jsonBodyParser = bodyParser.json();

const app = express();
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));


app.get('/', (req, res) => {
  res.render('index', {messages: messages});
});

app.post('/encode/video', jsonBodyParser,  async (req, res) => {
  // if (req.query.token !== PUBSUB_VERIFICATION_TOKEN) {
  //   res.status(400).send();
  //   return;
  // }

  try {
    const message = Buffer.from(req.body.message.data, 'base64').toString(
      'utf-8'
    );

    var messageObj = JSON.parse(message);

    const file = await storage
    .bucket(bucketName)
    .file(messageObj.name);

    await file.copy('new-copy-buffer-test');

    // // Array response with 0 The File metadata, 1 The full API response.
    // const [metaData] = await file.getMetadata();
    // if(metaData.encoded == true) return res.status(200).send();

    // const newFile = await storage
    // .bucket(bucketName)
    // .file('Neo-copy-2.svg');    
    
    // await file.download({destination: '/tmp/tempFile'})
   
    // await newFile.save('tmp/tempFile', {
    //   metadata: {
    //     contentType: 'image/jpeg',
    //     metadata: {
    //       custom: 'metadata',
    //       encoded: true
    //     }
    //   },
    //     resumable: false
    //   });

    res.status(200).send();
  
  } catch(error) {
    res.status(505).send({error: error});

  }
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});

module.exports = app;
