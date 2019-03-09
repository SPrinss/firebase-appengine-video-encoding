/*
import dependencies
*/
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);
const os = require('os');
const path = require('path');
var STORAGE_BUCKET;

async function encodeMediaFile(filePath, bucket) {
  return new Promise(async (resolve, reject) => {

    STORAGE_BUCKET = bucket;

    //get filedata
    let fileName = path.basename(filePath);
    let fileData = await getFileData(filePath);

    //ignore if file has been encoded before
    if(!!fileData.metadata.encoded) {
      console.info('already encoded!');
      return resolve();
    }

    //download file to tmp storage
    let file = STORAGE_BUCKET.file(filePath);
    let tempFilePath = path.join(os.tmpdir(), 'og' + fileName.replace(/\//, '~2F'));
    console.info('downloading...', tempFilePath);
    await downloadFile(file, tempFilePath);

    let mediaMimeType = '';
    //encode file
    if(fileData.contentType.match('video')) {
      console.info('encoding video');
      mediaMimeType = "video/mp4";
      var outputPath = await encodeVideo(tempFilePath, fileName);
    }
    else if(fileData.contentType.match('audio')) {
      console.info('encoding audio');
      mediaMimeType = "audio/mp3";
      var outputPath = await encodeAudio(tempFilePath, fileName);
    } else {
      console.info('file type not supported for encoding');
      return resolve();
    }

    //re-upload file
    console.info('done encoding, uploading', outputPath, filePath);
    let newMetaData = Object.assign(fileData.metadata || {}, {encoded: true});
    await STORAGE_BUCKET.upload(outputPath, { resumable: false, destination: filePath, metadata: { contentType: mediaMimeType, metadata: newMetaData } });

    //wrapping up
    console.info('done uploading');
    resolve();
  })
  
}

async function downloadFile(file, tempURL) {
  return new Promise((resolve, reject) => {
    file.download({
      destination: tempURL,
    })
    .then(resolve)
  })
}

async function getFileData(fileName) {
  return new Promise(async (resolve, reject) => {
    let file = STORAGE_BUCKET.file(fileName);
    let filesData = await file.getMetadata();
    let fileData = filesData[0];
    return resolve(fileData);
  })
}

async function encodeVideo(inputPath, fileName) {
  return new Promise(async (resolve, reject) => {
    var outputPath = path.join(os.tmpdir(), 'temp.mp4');
    return ffmpeg(inputPath)

      .output(outputPath)
      .outputOptions('-c:v libx264') //video codec
      .outputOptions('-pix_fmt yuv420p') //Quicktime support; Although other pixel formats may be supported, YUV planar color space with 4:2:0 chroma subsampling is a safe pixel format for H.264 video
      .outputOptions('-profile:v baseline') //will limit the output to a specific H.264 profile
      .outputOptions('-level 3.0') //If you want your videos to have highest compatibility with ancient devices
      .outputOptions('-crf 25') //The range of the CRF scale is 0–51, where 0 is lossless, 23 is the default, and 51 is worst quality possible
      .outputOptions('-preset medium') //A preset is a collection of options that will provide a certain encoding speed to compression ratio
      .outputOptions('-vf scale=1280:-2') //scale; -2 will keep it in ratio to the other specified dimension, but, to ensure it is divisible by 2 (a requirement for certain encodings such as yuv420p) the width or height will be adjusted if necessary. 
      .outputOptions('-c:a aac') //audio coded
      .outputOptions('-ar 44100') //Set the audio frequency of the output file (Hertz)
      .outputOptions('-ac 2') //Set the number of audio channels.
      .outputOptions('-ab 128k') //Indicates the audio bitrate.
      .outputOptions('-strict experimental') // obsolete?
      .outputOptions('-movflags +faststart') //You can add -movflags +faststart as an output option if your videos are going to be viewed in a browser. This will move some information to the beginning of your file and allow the video to begin playing before it is completely downloaded by the viewer.
      .outputOptions('-threads 0') //Allow your CPU to use an optimal number of threads.

      .on('start', (cmdLine) => {
        console.log('Started ffmpeg');
      })
      .on('end', () => {
        console.log('Successfully re-encoded video.');
        resolve(outputPath);
      })
      .on('error', (err, stdout, stderr) => {
        console.error('An error occured during encoding', err.message);
        console.error('stdout:', stdout);
        console.error('stderr:', stderr);
        reject(err);
      })
      .run();

  })
}

async function encodeAudio(inputPath, fileName) {
  return new Promise(async (resolve, reject) => {
    var outputPath = path.join(os.tmpdir(), 'temp.mp3');
    return ffmpeg(inputPath)

      .output(outputPath)
      .outputOptions('-vn') //no video
      .outputOptions('-ar 44100') //Set the audio frequency of the output file (Hertz)
      .outputOptions('-ac 2') //Set the number of audio channels.
      .outputOptions('-ab 128k') //Indicates the audio bitrate.
      .outputOptions('-f mp3') //output format

      .on('start', (cmdLine) => {
        console.log('Started ffmpeg');
      })
      .on('end', () => {
        console.log('Successfully re-encoded audio.');
        resolve(outputPath);
      })
      .on('error', (err, stdout, stderr) => {
        console.error('An error occured during encoding', err.message);
        console.error('stdout:', stdout);
        console.error('stderr:', stderr);
        reject(err);
      })
      .run();

  })
}

module.exports = encodeMediaFile;