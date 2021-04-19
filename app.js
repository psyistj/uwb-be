const express = require('express')
const Stream = require('node-rtsp-stream')
const Recorder = require('node-rtsp-recorder').Recorder
const app = express()
const port = 3000
const fs = require('fs');
const util = require('util');
const homedir = require('os').homedir();
const datadir = homedir + '/.config/uwb';
if (!fs.existsSync(datadir)){
  console.log('folder not exist!');
  fs.mkdirSync(datadir, { recursive: true });
}
let log_file = fs.createWriteStream(datadir + '/uwb_local_server.log', { flags: 'w' });
let log_stdout = process.stdout;

console.log = function (d) {
  log_file.write(util.format(d) + '\n');
  log_stdout.write(util.format(d) + '\n');
}

console.error = function (d) {
  log_file.write('[ERROR] ' + util.format(d) + '\n');
  log_stdout.write('[ERROR] ' + util.format(d) + '\n');
}

let filePath = null
let timer = null
let stream = null
let rec = null

if (!stream) {
  try {
    stream = new Stream({
      name: 'camera0',
      streamUrl: 'rtsp://192.168.1.97:554/av0_1',
      wsPort: 9999,
      ffmpegOptions: {
        '-stats': '',
        '-r': 30
      }
    })
    console.log('camera0 created')
  } catch (error) {
    console.log(error)
  }
}

// app.use(express.static('public'))
// app.use(function(req, res, next) {
//   res.header('Access-Control-Allow-Origin', '*')
//   res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-Width, Content-type, Accept')
//   next()
// })

app.get('/', (req, res) => {
  console.log('connected')
  res.send('connected')
})

app.get('/video', (req, res) => {
  console.log(`establishing ws... ${port}`)
  Promise.all([
    new Promise((resolve) => {
      if (!rec) {
        rec = new Recorder({
          url: 'rtsp://192.168.1.97:554/av0_0',
          timeLimit: 3000, // time in seconds for each segmented video file
          folder: `${datadir}/videos/`,
          name: 'cam97',
        })
        // Starts Recording
        rec.startRecording();
  
        timer = setTimeout(() => {
            console.log('Stopping Recording')
            filePath = rec.fileName
            rec.stopRecording()
            rec = null
            // stream.stop()
            // stream = null
        }, 3000000)
      }
      resolve(0)
    })
  ]).then(() => {
    console.log(`established ${port}`)
    res.send(`established ${port}`)
  })
})

app.get('/stop', (req, res) => {
  console.log('Stopping Recording')
  if (rec) {
    filePath = rec.fileName
    rec.stopRecording()
    rec = null
    clearTimeout(timer)
    timer = null
    // if (stream) {
    //   stream.stop()
    //   stream = null
    // }
  }
  console.log(`file save path: ${filePath}`)
  res.send(`${filePath}`)
})

app.listen(port, () => {
  console.log(`listening at http://localhost:${port}`)
})