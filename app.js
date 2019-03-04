'use strict';

/*
Import Dependencies
*/
const express = require('express');
const https = require('https');
const process = require('process'); // Required for mocking environment variables
const Buffer = require('safe-buffer').Buffer;
const {PubSub} = require('@google-cloud/pubsub');
const request = require('request');

/*
Init
*/
// Max processing time is two hours.
const MAX_PROCESSING_TIME = 1200000;
const PROJECT_ID = process.env.PROJECT_ID;
const ENCODING_HOST_NAME = process.env.HOSTNAME;
const ENCODING_PATH = process.env.POST_PATH + process.env.PUBSUB_VERIFICATION_TOKEN;
const PUBSUB_TOPIC = process.env.PUBSUB_TOPIC;
const PUBSUB_SUBSCRIPTION = process.env.PUBSUB_SUBSCRIPTION

const messages = new Map(); //A Map is very handy here because we don't like duplicate values

const pubsubListener = new PubSub();
const pubsubWorkerTopic = pubsubListener.topic(PUBSUB_TOPIC || 'worker-topic-encode');
const workerSubscription = pubsubWorkerTopic.subscription(PUBSUB_SUBSCRIPTION || 'worker-encode');

/*
Create & Start Express Web Server
*/
const app = express();
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`App listening on port ${PORT}`));

app.get('/_ah/warmup',_handleServerReboot)

app.get('/_ah/start', function() { workerSubscription.on('message', processMessage) });

async function _handleServerReboot() {
  console.info('_handleServerReboot')
  const client = new PubSub.v1.SubscriberClient();

  const formattedSubscription = client.subscriptionPath(
    PROJECT_ID,
    PUBSUB_SUBSCRIPTION
  );
  const request = {
    subscription: formattedSubscription,
    maxMessages: 50,
  };
  const [response] = await client.pull(request);

  const promises = response.receivedMessages.map( message => {
    return processMessage(message);
  })

  return await Promise.all(promises);
}

/*
Handles incoming message event
*/
async function processMessage(message) {  
  const messageData = parseMessageToJSON(message.data);

  console.info('New message, ' + message.id + ' status: ' + messageData.status, 'messageData', messageData);

  /*
  Pubsub topic receives two statusses of messages, 'new' and 'finished'. 
  The 'new' message is sent to trigger and encoding job, the 'finished' message is sent when an encoding job is succesfully completed.
  This `app.js` is run on an automatic instance App Engine, meaning it's always live (unless the server crashes and reboots).
  
  The flow of messages:
  1. The App Engine instance boots and starts a listener to the PubSub topic.
  2. An external service wants the App engine to encode a video and posts a message to the Pubsub topic.
  3. The App Engine listener receives the 'new' message and adds this message to the messages map. Additionally it starts the encoding job (see 'Encoding job'), the payload includes the orinigal message id.
  4. The encoding server finishes the encoding and publishes a 'finished' message to the PubSub, the payload includes the message id that triggered the encoding job.
  5. The App Engine listener receives the 'finished' message and removes both the 'finished' message and the 'new' message (that triggered the encoding job) from the messages map. Additionally it acknowledges both messages on the PubSub server.
  Note: We use a messages map to handle incoming message events properly (e.g. an ecoding job is still running, the incoming message should be ignored).

  Scenarios:
  1. The App Engine listener receives the 'new' message again: 
    - The encoding job is still running
    - The encoding job has failed
    - The encoding job is finished (this shouldn't happen since the message should've been removed)

    2. The encoding job fails:
    - The server crashes and doesn't send a status code
    - The server sends an error code

    3.  
  */
  
  switch(messageData.status) {

    case 'new':
      const taskInQueue = messages.has(message.id);
      // First time message has been received by server.
      if(taskInQueue) {
        // If the message has been running for too long
        const messageProcessingOverdue = processingOverdue(messages[message.id].data);      
        if(!messageProcessingOverdue) {
          console.info('Still encoding video, message ignored: ' + message.id);
          break;
        };
      }

      // We propagate both the message data as the message. The message is stored in the messages Map, the data is for ease of use (otherwise we'd have to parse the data from the message again).
      await processNewMessage(messageData, message);
      break;

    case 'finished':
      console.info(`Removing messages to queue`, message.id );
      processFinishedMessage(messageData, message, messages);
      break;

    default:
      console.info(`Unknown message type Message finished, deleting from queue: ${messageData.status}`);
      message.ack();
      break;
  }
}

function processingOverdue(storedMessageDataObj) {
  // The encoding job is still running and the message shouldn't be processed further.
  // TODO you don't want to run it 5+ times
  if(storedMessageDataObj.status == "running" && storedMessageDataObj['processingStartTime'] < new Date().getTime() - MAX_PROCESSING_TIME) return true;
  return false;
}

async function processNewMessage(messageDataObj, message) {
  console.info(`Adding to or modifying message in queue `, messageDataObj.name);
  messageDataObj['processingStartTime'] = new Date().getTime();
  messageDataObj['status'] = "running";
  // taskId & notificationId
  messageDataObj['newMessageId'] = message.id;
  messageDataObj['newMessageAckId'] = message.ackId;

  messages.set(message.id, {data: messageDataObj, message: message});
  await makePostRequest(ENCODING_HOST_NAME, ENCODING_PATH, messageDataObj);
}

/* 
  If message type is finished, the message is sent from the worker (basic instance: encoding).
  In the payload of the message, the id of the message that triggered the POST call to the worker is added.
  We use this id to acknowledge the message (removing it from the pubsub).
  We also acknowledge the message that is sent from the worker. 
*/
async function processFinishedMessage(messageDataObj, message, messagesMap) {
  console.info('Proccessing finished message: ' + message.id + ', taks id: ' + messageDataObj.newMessageId)
  // Acknowledge 'new' message, the message that started the processing

  console.log('messages', messages, messageDataObj.newMessageId)
  const taskMessage = messages.get(messageDataObj.newMessageId);
  if(taskMessage) {
    await taskMessage.message.ack();
    messages.delete(messageDataObj.newMessageId);
  } else {
    console.info('Original taks message not in queue, id: ', messageDataObj.newMessageId)
  }

  // Acknowledge 'finished' message, the message that indicates that the processing has been completed
  await message.ack();

  console.info("Finished processing " + messageDataObj.name + ". Messages remaining: " + messagesMap.size)
}

async function makePostRequest(hostname, path, dataObj) {
  console.log('\n\n', 'dataObj', dataObj, '\n\n')

  console.log('\n\n', 'makePostRequest', hostname, "PATH", path, '\n\n')
  const stringifiedData = JSON.stringify(dataObj);
  console.info('Making POST request: ' + stringifiedData)

  request.post('https://' + hostname + path, {
    json: dataObj
  }, (error, res, body) => {
    if (error) {
      console.error(error)
      return
    }
    console.log(`statusCode: ${res.statusCode}`)
    console.log(body)
  })
  
  
  // const options = {
  //   hostname: hostname,
  //   method: 'POST',
  //   path: path,
  //   headers: {
  //     'Content-Type': "'Content-Type': 'application/json'",
  //     'Content-Length': stringifiedData.length
  //   }
  // }
  
  // const req = https.request(options, (res) => {
  //   console.log('statusCode:', res.statusCode);
  //   console.log('headers:', res.headers);

  //   res.on('data', (d) => {
  //     console.log('data: ' + d)
  //   });
  // });

  // req.on('error', (e) => {
  //   console.error(e);
  // });

  // req.write(stringifiedData);
  // req.end();
}

/*
Parses raw message data to JSON object
*/
function parseMessageToJSON(messageData) {
  var data = Buffer.from(messageData, 'base64').toString();
  var json = JSON.parse(data);
  return json;
}

/*
Export
*/
module.exports = app;