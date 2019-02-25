
Firebase test project: `testing-video-slices`, 
For a firebase-to-appengine scaffold see https://github.com/SPrinss/firebase-functions-to-appengine (or use this repo).

## If you use this repo:

1. Clone repo
2. `npm i` in main and functions folder
3. `firebase use testing-video-slices` and `gcloud config set project testing-video-slices`
4. Set env variables: 
```
    export PUBSUB_VERIFICATION_TOKEN=YOUR_TOKEN
    export PUBSUB_TOPIC=YOUR_TOPIC_NAME
```
5. To run locally: In one terminal window `npm start`, in the other 
`
curl -H "Content-Type: application/json" -i --data @sample_message.json "http://localhost:8080/encode/video?token=randomTokenForYouTodayIsSpecial"
`
6. To test on server: `gcloud app deploy app.standard.yaml` (make sure you selected the correct project!), `firebase functions:shell` -> `handleNewStorageFile()`. You can check the [server's logs](https://console.cloud.google.com/logs/viewer) and [errors](https://console.cloud.google.com/errors).

*FYI: The script currently copies the image `Neo.svg` in Storage to `new-copy-buffer-test` in Storage.*


## To do
1. Setup worker instance with a long timeout based on route (dispatch.yaml) > See App engine instances
2. Implement encoder
3. Create Firebase functions based on Storage write triggers.

# Day 1

FYI: Google heeft een [pagina](https://cloud.google.com/solutions/media-entertainment/use-cases/video-encoding-transcoding/) speciaal voor video encoding/transcoding maar staat ‘contact sales’.


[Google computation stack](https://medium.com/google-cloud/gcp-the-google-cloud-platform-compute-stack-explained-c4ebdccd299b):
*App engine hoef je niet zelf servers te schalen en met instellingen te kloten. Waarschijnlijk wel wat duurder.*

Bij een [vraag](https://stackoverflow.com/questions/44469537/cloud-functions-for-firebase-completing-long-processes-without-touching-maximum/44472980#44472980) over ‘long-processes’ op Fb-functions zegt de Firebase guru of app-engine of compute-engine: 

Lijkt me dat we voor nu app engine kiezen. [NodeJs docs](https://cloud.google.com/appengine/docs/standard/nodejs/an-overview-of-app-engine)

(Oude) [uitleg](https://medium.com/google-cloud/scalable-video-transcoding-with-app-engine-flexible-621f6e7fdf56) van video transcoding met [app engine](https://github.com/waprin/appengine-transcoder)
*Note: This is done using Python which might work differently from NodeJs*

Als ik zelf een script probeer te draaien op de App engine:
- Twee opties: [Standard of Flexible](https://cloud.google.com/appengine/docs/nodejs/)
(Ik heb standard gekozen)

FYI: Je kan [daily limits](https://cloud.google.com/appengine/docs/standard/nodejs/console/) etc instellen.

# Pubsub

Communicatie methode waarbij je [pull en push](https://cloud.google.com/pubsub/docs/subscriber) methodes hebt. Ik kies voor [push](https://cloud.google.com/pubsub/docs/push) omdat een server hierbij endpoints automatisch called.

Examples:
[Writing and responding docs](https://cloud.google.com/appengine/docs/standard/nodejs/writing-and-responding-to-pub-sub-messages)
[NodeJs](https://github.com/GoogleCloudPlatform/nodejs-docs-samples/tree/master/appengine/pubsub)

Npm packages:
- npm install --save @google-cloud/pubsub
- npm install --save @google-cloud/storage

# Day 2

## PubSub
Je hebt een topic waar je een pubsub message heen stuurt.
Een topic kan meerdere subscribers hebben. Subscribers kunnen zelf pullen, of de pubsub kan naar ze pushen. 

Als je voor push kiest kan je een subscriber aannaken met een endpoint. De pubsub server zal dan een POST request maken naar dat endpoint totdat de endpoint server een HTTP success status code terugstuurt of de deadline verstreken is. 

### Terminal commands
Select gcloud project id:
`gcloud config set project [projectId]`

Deploy app:
`gcloud app deploy app.standard.yaml` (or app.yaml)

Om een nieuw topic aan te maken:
`gcloud pubsub topics create YOUR_TOPIC_NAME`

Om een nieuwe subscription aan te maken
```
gcloud pubsub subscriptions create YOUR_SUBSCRIPTION_NAME \
    --topic YOUR_TOPIC_NAME \
    --push-endpoint \
    https://YOUR_PROJECT_ID.appspot.com/pubsub/push?token=YOUR_TOKEN \
    --ack-deadline 10
```
*Waarbij Pubsub/push een voorbeeld is.*

### Health inspection via console

[Logs](https://console.cloud.google.com/logs/viewer)
appEngine -> Stackdriver -> logs viewer see calls to app and the http response

[Errors](https://console.cloud.google.com/errors)
App-engine -> stack driver -> error reporting -> see errors within app

[PubSub](console.cloud.google.com/cloudpubsub/)
See topics. Delete subscriptions. etc.

# Day 3

Might be [good](https://cloud.google.com/pubsub/docs/push) to use the endpoint `_ah/push-handlers/myhandler` (see App Engine Standard Endpoints).

Pubsub publishes using `Buffer` data. 

I.e. 
```
const data = JSON.stringify({ name: filePath, bucket: fileBucket });

const dataBuffer = Buffer.from(data);

const messageId = await pubsub.topic(topicName).publish(dataBuffer);
```

If the pubsub subscriber uses the push method, the endpoint will receive a POST request.

## Running more than one service

[Medium article](https://medium.com/this-dot-labs/node-js-microservices-on-google-app-engine-b1193497fb4b)

[Instances can have different scaling (and timeouts)](https://cloud.google.com/appengine/docs/standard/python/how-instances-are-managed#instance_scaling).

The idea now is to respond quickly to the original PubSub call and 'start up a worker instance'.

## Storage 

Documentation on NodeJs Storage [storage.bucket().file()](https://cloud.google.com/nodejs/docs/reference/storage/2.3.x/File)

App engine file system, only '/tmp' is [writable](https://cloud.google.com/appengine/docs/standard/nodejs/runtime?hl=en&refresh=1)

[App engine & storage example](https://cloud.google.com/appengine/docs/standard/nodejs/using-cloud-storage)

**Important: Bucket name is including .appspot.com**

# Day 4

### Created a sample repo

https://github.com/SPrinss/firebase-functions-to-appengine
*This is a stripped down version of this repo's code. We can expand on it and publish it together with a Medium article*

### App engine instances

Instances are resident or dynamic. A dynamic instance starts up and shuts down automatically based on the current needs. A resident instance runs all the time, which can improve your application's performance

    Auto scaling services use dynamic instances.
    Manual scaling services use resident instances.
    Basic scaling services use dynamic instances.

Each service that you deploy to App Engine behaves like a microservice that independently scales based on how you configured it.

https://cloud.google.com/appengine/docs/standard/nodejs/runtime
To support Node.js packages that require native extensions, the runtime includes system packages enabling you to use tools such as ImageMagick, FFmpeg, and Chrome headless. See the full list of packages at Included System Packages. To request a package, file an issue in the issue tracker.

The runtime includes a full filesystem. The filesystem is read-only except for the location /tmp, which is a virtual disk storing data in your App Engine instance's RAM. 

https://cloud.google.com/appengine/docs/standard/nodejs/how-requests-are-routed
With a dispatch file, you can send incoming requests to a specific service based on the path or host name in the request URL.

For example:
```
  # Send all work to the one static backend.
  - url: "*/encode/*"
    service: static-backend
```

# Day 5

How to deploy [multiple instances](https://medium.com/this-dot-labs/node-js-microservices-on-google-app-engine-b1193497fb4b) with NodeJs.

The [instance](https://cloud.google.com/appengine/docs/standard/nodejs/how-instances-are-managed) [class type](https://cloud.google.com/appengine/docs/standard/#instance_classes) can be set in [app.yaml](https://cloud.google.com/appengine/docs/standard/nodejs/config/appref).

So, we create a new basic service in `/encode`.

```
Each service instance is created in response to a start request, which is an empty HTTP GET request to /_ah/start. App Engine sends this request to bring an instance into existence; users cannot send a request to /_ah/start.
The start request can be used for two purposes:

    To start a program that runs indefinitely, without accepting further requests.
    To initialize an instance before it receives additional traffic.

When you start an instance of a basic scaling service, App Engine allows it to accept traffic, but the /_ah/start request is not sent to an instance until it receives its first user request    
```

So, we don't have to do anything with the `/_ah/start` endpoint and can create our own endpoints.

 ### So...
 
We create a seperate instance in `/encode` which is an automatically scaling basic service (B2).  
Firebase functions calls are handled in the default service which makes a POST to `/encode/video`. In the dispatch.yaml file we reroute `/encode/video/*` to the `encode` service.

Since this is a basic service, there is a 24h timeout. 

Questions:
- Max instances enough for X amount of video's?
- How to call the basic service (`encode`) from the default service? -> [PubSub for long running tasks](https://cloud.google.com/solutions/using-cloud-pub-sub-long-running-tasks)
- 
