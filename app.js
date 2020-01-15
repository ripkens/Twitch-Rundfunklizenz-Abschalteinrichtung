/*
                       Twitch Abschalteinrichtung (Rundfunklizenzbestimmungen)
                                     Copyright 2020 Marcus Ripkens
               Frei verwendbar. Verkauf und entfernen des Copyrights sind jedoch untersagt!
*/



////////// USAGE (OBS)
// rtmp://<HOST_NAME>/live.
// Use localhost if you run this script on your local computer, use IP or HostName if on remote server!
// Use Stream-Key you have or will set in the CONFIG section

////////// CONFIG
let stream_key = ''; // Stream Key used when sending stream to this app
let twitch_stream_key = ''; // Stream-Key used when relaying to twitch
let bandwidth_test = true; // if true, stream will not be visible to viewers but here: https://inspector.twitch.tv
let twitch_server = 'live-fra02'; // https://stream.twitch.tv/ingests/
let twitch_channel = ''; // Your Twitch channel name
let twitch_api_client_id = ''; // Client ID of your Twitch app, create one in Twitch Developer Console first.

////////// Webinterface port + login
let webport = 8088; // Admin interface on http://<HOST_NAME>/admin
let username = 'admin';
let password = 'changeme';
let ffmpeg_path = '/opt/stream/ffmpeg/ffmpeg'; // Download here: https://johnvansickle.com/ffmpeg/
let offline_video = '/opt/stream/video.mp4'; // You have to provide your own video!!

////////// DONE. Use "node app.js" or pm2, forever to start streaming

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
            relayVideo();
        }
        else if(viewers < 500 && !pushed) {
            relayLiveStream();
        }

    }
}, 10000);

function relayLiveStream() {
    nms.nls.onRelayPush(ingest, 'live', config.auth.secret);
    pushed = true;
}

function relayVideo() {
    pushed = false;
    nms.nls.onRelayPush(ingest, 'interuppted', 'OFFLINE');
}

nms.on('prePublish', (id, StreamPath, args) => {
  if(StreamPath == '/live/' + config.auth.secret) {
    live = true;
  }
});

nms.on('donePublish', (id, StreamPath, args) => {
  if(StreamPath == '/live/' + config.auth.secret) {
    live = false;
    pushed = false;
  }
});

