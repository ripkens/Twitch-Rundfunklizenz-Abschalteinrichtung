////////// USAGE (OBS)
// rtmp://<HOST_NAME>/live.
// Use localhost if you run this script on your local computer, use IP or HostName if on remote server!
// Use Stream-Key you have or will set in the CONFIG section

////////// CONFIG
let stream_key = '';
let twitch_stream_key = '';
let bandwidth_test = true; // if true, check you stream here: https://inspector.twitch.tv
let twitch_server = 'live-fra02'; // https://stream.twitch.tv/ingests/
let twitch_channel = '';
let twitch_api_client_id = '';

////////// Webinterface port + login
let webport = 8088;
let username = 'admin';
let password = 'changeme';
let ffmpeg_path = '/opt/stream/ffmpeg/ffmpeg';
let offline_video = '/opt/stream/video.mp4';

////////// DONE. use node.app.js to start the server

// ----------------------------------------------------------------------------------------

const NodeMediaServer = require('node-media-server');
const request = require('request');
const fetchUrl = require("fetch").fetchUrl;

const ingest = 'rtmp://' + twitch_server + '.twitch.tv/app/' + twitch_stream_key + (bandwidth_test ? '?bandwidthtest=true' : '');

const config = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60
  },
  http: {
    port: webport,
    allow_origin: '*'
  },
  auth: {
    play: false,
    publish: false,
    secret: stream_key,
    api : true,
    api_user: username,
    api_pass: password,
  },
  relay: {
    ffmpeg: ffmpeg_path,
    tasks:
    [
        {
            app: 'interuppted',
            mode: 'static',
            edge: offline_video,
            name: 'OFFLINE'
        }
    ]
  },
}

let live = false;
let pushed = false;
let viewers = 0;

var nms = new NodeMediaServer(config)
nms.run();

setInterval(() => {
    if(live) {
        var apiurl = "https://api.twitch.tv/helix/streams?user_login=" + twitch_channel;
        var options = {
            headers:{
                'Client-ID': twitch_api_client_id,
                "User-Agent": twitch_channel + "/1.0"
            }
        }
        fetchUrl(apiurl, options, (error, meta, body)  => {
            var body = JSON.parse(body);
            if(body.data) {
                if(body.data.stream) {
                    body.data.forEach((stream) => {
                        if(stream.type == 'live') {
                            viewers = stream.viewer_count;
                        }
                    });
                }
            }
        });

        if(viewers > 499 && pushed) {
            pushed = false;
            setTimeout(() => {
                nms.nls.onRelayPush(ingest, 'interuppted', 'OFFLINE');
            }, 2000);
        }
        else if(viewers < 500 && !pushed) {
            setTimeout(() => {
                nms.nls.onRelayPush(ingest, 'live', config.auth.secret);
            }, 2000);
            pushed = true;
        }

    }
}, 10000);

nms.on('prePublish', (id, StreamPath, args) => {
  console.log('[NodeEvent on prePublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
  if(StreamPath == '/live/' + config.auth.secret) {
    live = true;
  }
});

nms.on('donePublish', (id, StreamPath, args) => {
  console.log('[NodeEvent on donePublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
  if(StreamPath == '/live/' + config.auth.secret) {
    live = false;
  }
  if(pushed) {
    let session = nms.getSession(id);
    session.end();
    pushed = false;
  }
});
