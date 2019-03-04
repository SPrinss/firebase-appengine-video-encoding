## What?

We want to encode a video on an Google Cloud App engine service since the Firebase functions have a short timeout (~540s). 

Our flow is the following:
1. A media object is uploaded to the [Firebase Storage](https://console.firebase.google.com/project/testing-video-slices/storage/testing-video-slices.appspot.com/files).
2. A Firebase function is triggered by the media upload.
3. The function publishes a message on a PubSub server with `status: new`, the name and the bucket of the file in the payload.
4. An App Engine server is listening for new messages published to the same PubSub server.
5. When a new message is obtained, it stores the message in a local Messages JS Map and proceeds with processing the message further. When the message already has been obtained, it's already in the Message Map and therefore ignore (unless it was added to the Messages Map more than 2 hours ago).
6. The encoding of the media will be done on another App Engine service (the 'media-encoding service'). This service has higher processing power and easily scales on a larger load. We start the service by making a POST request to /encode (we also add a token for security purposes).
7. The media-encoding service logs the start of the encoding to a file in our [Firestore database](https://console.firebase.google.com/project/testing-video-slices/database/firestore/data~2Fencoding-jobs)
8. The service processes the encodes the files and overwrites the status in the log in the database.
9. The service then publishes a message to the same PubSub server we used at the start but the payload has the status 'finished'.
10. The default service receives the message and removes both the 'new message' and the 'finished message' from the PubSub server and from the messages Map.


## How to test

Upload a file in [Firebase storage](https://console.firebase.google.com/project/testing-video-slices/storage/testing-video-slices.appspot.com/files) and wait. Check the metadata of the uploaded file after a while. You can inspect whether the encoding has finished by watching [the Firestore messages](https://console.firebase.google.com/project/testing-video-slices/database/firestore/data~2Fencoding-jobs), although you'd have to guess the message for now (the name of the file is written to the message document). 

## How to check for errors/logs

To see the [logs](https://console.cloud.google.com/appengine/services?project=testing-video-slices) of the App Engine services, click `diagnose -> tools -> logs`.

For [errors](https://console.cloud.google.com/errors?project=testing-video-slices).

## How to test locally

Make sure you've selected the correct gcloud project and firebase project.  
`gcloud config set project [PROJECT_ID]`
`firebase use [PROJECT_ID]`

Create processing environment variables by running `export [variable_name]=[value]` in the directory of the app you want to run.

Run `npm start` to start the server. You can make POST calls by running a curl like:

```
curl -H "Content-Type: application/json" -i --data @sample_message.json "http://localhost:8080/encode?token=[THE_TOKEN_IN_YOUR_ENVIRONMENT_VARIABLES]"
```

You can alter the `sample_message.json` file to change the POST data.

OR you can visit the url provided in the console for GET requests.

## How to create new Pubsub topics / subscriptions

*Make sure you have the correct project selected* 

To create a topic:
`gcloud pubsub topics create YOUR_TOPIC_NAME`

To create a (pull) subscription:
`gcloud pubsub subscriptions create YOUR_SUBSCRIPTION_NAME --topic YOUR_TOPIC_NAME`

## How to deploy

Run:
`gcloud app deploy app.standard.yaml media-encoder/media-encoder.yaml dispatch.yaml`
*We deploy two instances and a dispatch with this command* 

If you already deployed a service and haven't changed the files of it, don't incorporate it in the deploy call. 
*Note: The App engine takes up to a few minutes to disable the old services and start the new ones*


## How to incorporate into my existing Firebase app?

Just add the files that don't exist in your app and update (be smart about it) the files that do (such as package.json and the functions/index.js files). Select your Gcloud project and deploy the files (see the steps above).
