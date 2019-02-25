
'use strict';

const express = require('express');
const path = require('path');
const process = require('process'); // Required for mocking environment variables
const fs = require('fs'); 
const Buffer = require('safe-buffer').Buffer;
const bodyParser = require('body-parser');

const {Storage} = require('@google-cloud/storage');

const jsonBodyParser = bodyParser.json();

const app = express();
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));



// The following environment variables are set by app.yaml when running on GAE,
// but will need to be manually set when running locally.
const PUBSUB_VERIFICATION_TOKEN = process.env.PUBSUB_VERIFICATION_TOKEN;
const TOPIC = process.env.PUBSUB_TOPIC;


app.post('/testing-post', jsonBodyParser, async (req, res) => {    
  res.status(200).send('Testing');
});

app.post('/encode', jsonBodyParser,  async (req, res) => {
  if (req.query.token !== PUBSUB_VERIFICATION_TOKEN) {
    res.status(400).send();
    return;
  }

  try {
    
    const messageData = Buffer.from(req.body.message.data, 'base64').toString();
    var messageDataObj = JSON.parse(messageData);

    const storage = new Storage({projectId: messageDataObj.projectId});

    const file = await storage
    .bucket(messageDataObj.bucket)
    .file(messageDataObj.name);

    await file.copy('new-copy-buffer-test');
    
    // TODO: add encoding functions
    // On finish, publish to a PubSub topic which gets 'pulled' in the default instance. The default instance removes the original message when it receives a new type=='finished' message
    // TODO: On finish encoding -> pubsub.topic().publish({finishedMessageId: messageDataObj.id, type: 'finished'})
    
    
    
    // OLD STORAGE CODE:

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
    console.error(error);
    res.status(500).send();

  }
});

app.get('/testing', (req, res) => {    
  res.status(200).send('Testing');
});


// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});

module.exports = app;
