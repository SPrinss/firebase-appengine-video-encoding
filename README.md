# firebase-appengine-video-encoding

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
