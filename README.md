# Status 15-02-19
*See learnings in # Day 2*

- Deleting a file from the storage by firing a Firebase function (locally) works. 

To test:
1. upload a Neo.svg to https://console.firebase.google.com/project/testing-video-slices/storage/testing-video-slices.appspot.com/files

2. In terminal, navigate to this repo. Run `firebase functions:shell` and execute `handleNewStorageFile()`.

3. The 'Neo.svg' is no longer in the storage.

## To do

### Firebase function
- Send File name with PubSub call
- Modify/update meta information changed function

### Appengine endpoint
- Parse req.body to get the correct file path
- Download Storage file to filesystem (only 'tmp' is writable)
- Run encoder
- Store/overwrite encoded file 
- Somehow update slices story db information. (for example by updating meta information of storage file)


# firebase-appengine-video-encoding
Firebase test project: 
testing-video-slices

FYI: Google heeft een pagina speciaal voor video encoding/transcoding maar staat ‘contact sales’.
https://cloud.google.com/solutions/media-entertainment/use-cases/video-encoding-transcoding/

—— Zoektocht

https://medium.com/google-cloud/gcp-the-google-cloud-platform-compute-stack-explained-c4ebdccd299b

App engine hoef je niet zelf servers te schalen en met instellingen te kloten. Waarschijnlijk wel wat duurder.

Bij een vraag over ‘long-processes’ op Fb-functions zegt de Firebase guru of app-engine of compute-engine: 
https://stackoverflow.com/questions/44469537/cloud-functions-for-firebase-completing-long-processes-without-touching-maximum/44472980#44472980

Lijkt me dat we voor nu app engine kiezen.

(Oude) uitleg van video transcoding met app engine:
https://medium.com/google-cloud/scalable-video-transcoding-with-app-engine-flexible-621f6e7fdf56
https://github.com/waprin/appengine-transcoder

Als ik zelf een script probeer te draaien op de App engine:  - Twee opties: Standard of Flexible https://cloud.google.com/appengine/docs/nodejs/
(Ik heb standard gekozen)

FYI: Je kan daily limits etc instellen. Documentatie: https://cloud.google.com/appengine/docs/standard/nodejs/console/

App engine uitleg:
https://cloud.google.com/appengine/docs/standard/nodejs/an-overview-of-app-engine

De python versie lijkt speciale workers te hebben, de NodeJs versie niet?

Upload video example: https://cloud.google.com/appengine/docs/standard/nodejs/using-cloud-storage
https://github.com/GoogleCloudPlatform/nodejs-docs-samples/tree/master/appengine/storage

# Pubsub

Waarbij je https://cloud.google.com/pubsub/docs/subscriber pull en push methodes hebt. Ik kies voor push.
Push documentatie: https://cloud.google.com/pubsub/docs/push

Examples: https://cloud.google.com/appengine/docs/standard/nodejs/writing-and-responding-to-pub-sub-messages
https://github.com/GoogleCloudPlatform/nodejs-docs-samples/tree/master/appengine/pubsub

Firebase: 
npm install --save @google-cloud/pubsub
npm install --save @google-cloud/storage


# Day 2

## PubSub
Je hebt een topic waar je een pubsub message heen stuurt.
Een topic kan meerdere subscribers hebben. Subscribers kunnen zelf pullen, of de pubsub kan naar ze pushen. 

Als je voor push kiest kan je een subscriber aannaken met een endpoint. De pubsub server zal dan een post request maken naar dat endpoint totdat de endpoint server een HTTP success status code terugstuurt of de deadline verstreken is. 

Select gcloud project id: gcloud config set project [projectId]

Deploy app:
- gcloud app deploy app.standard.yaml (or app.yaml)

Om een nieuw topic aan te maken:
gcloud pubsub topics create YOUR_TOPIC_NAME

Om een nieuwe subscription aan te maken
gcloud pubsub subscriptions create YOUR_SUBSCRIPTION_NAME \
    --topic YOUR_TOPIC_NAME \
    --push-endpoint \
    https://YOUR_PROJECT_ID.appspot.com/pubsub/push?token=YOUR_TOKEN \
    --ack-deadline 10
*Pubsub/push is just an example.*

## Consoles

https://console.cloud.google.com/logs/viewer
appEngine -> Stackdriver -> logs viewer see calls to app and the http response

https://console.cloud.google.com/errors
App-engine -> stack driver -> error reporting -> see errors within app

console.cloud.google.com/cloudpubsub/
See topics. Delete subscriptions. etc.

## Note about NodeJs Storage

Bucket name is including .appspot.com

# Day 3

Might be good to use the endpoint `_ah/push-handlers/myhandler`.
https://cloud.google.com/pubsub/docs/push ->  App Engine Standard Endpoints

Pubsub publishes using `Buffer` data. 

I.e. 
```
const data = JSON.stringify({ name: filePath, bucket: fileBucket });

const dataBuffer = Buffer.from(data);

const messageId = await pubsub.topic(topicName).publish(dataBuffer);
```

If the pubsub subscriber uses the push method, the endpoint will receive a POST request.
I don't know how to get the JSON from the req.body Buffer data.


## Running more than one service

See article: 
https://medium.com/this-dot-labs/node-js-microservices-on-google-app-engine-b1193497fb4b

Instances can have different scaling (and timeouts).
https://cloud.google.com/appengine/docs/standard/python/how-instances-are-managed#instance_scaling

For the 'worker' we'll probably need a longer timeout. 
```How will we respond quickly to the pubsub, but remain the long timeout of the 'worker'?```

## Storage 

Information on NodeJs Storage storage.bucket().file() https://cloud.google.com/nodejs/docs/reference/storage/2.3.x/File
