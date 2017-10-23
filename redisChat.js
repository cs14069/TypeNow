var redis = require('redis');
var redisClient = redis.createClient();
var https = require("https");
var http = require('http');
var fs = require('fs');
var url = require('url');
var ws = require("ws");
var util = require('util');

var socketList = [];
var pathList = [];

const LOG_DIR = '/private/log/';
var logDir = LOG_DIR + getToday();
setInterval(function() {
  logdir = LOG_DIR + getToday();
}, 60*60*24);

const TEST_DB =  1;
const PRODUCTION_DB = 2;

const MAX_MSG_LENGTH = 30;

const PORT_HTTP = 80;
const PORT_HTTPS = 443;
const PORT_WSS = 8081;

console.log('init');

var plainServer = http.createServer(function(req, res) {
  var location = 'https://typenow.xyz'+url.parse(decodeURI(req.url)).pathname;
  res.writeHead(301, {'Location': location});
  res.end('');
}).listen(PORT_HTTP);


redisClient.on('ready', function() {
  redisClient.select(TEST_DB, function() {
    var server = https.createServer({
      key: fs.readFileSync('/etc/letsencrypt/live/typenow.xyz/privkey.pem'),
      cert: fs.readFileSync('/etc/letsencrypt/live/typenow.xyz/cert.pem')
    }, function(req, res) {
      var html = '';
      if(req.method === 'GET') {
        var path = url.parse(decodeURI(req.url)).pathname;
        if(path === '/') {
          res.writeHead(200, {'Content-type': 'text/html', 'Charset': 'utf-8'});
          html += fs.readFileSync('/var/www/node/chat/redisChatTop.html');
          res.end(html);
        }else if(path === '/tos.html') {
          res.writeHead(200, {'Content-type': 'text/html', 'Charset': 'utf-8'});
          html += fs.readFileSync('/var/www/node/chat/tos.html');
          res.end(html);
        }else if(path === '/robots.txt') {
          res.writeHead(200, {'Content-type': 'text/html', 'Charset': 'utf-8'});
          html += fs.readFileSync('/var/www/node/chat/robots.txt');
          res.end(html);
        }else if(path === '/sitemap.xml') {
          res.writeHead(200, {'Content-type': 'text/html', 'Charset': 'utf-8'});
          html += fs.readFileSync('/var/www/node/chat/sitemap.xml');
          res.end(html);
        }else if(path === '/favicon.ico') {
          res.writeHead(200, {'Content-type': 'type="image/x-icon'});
          res.end(fs.readFileSync('/var/www/node/chat/favicon.ico'));
        }else if(path === '/main.css') {
          res.writeHead(200, {'Content-type': 'text/css', 'Charset': 'utf-8'});
          res.end(fs.readFileSync('/var/www/node/chat/main.css'));
        }else if(path.indexOf('/private') === 0) {
          res.writeHead(200, {'Content-type': 'text/html', 'Charset': 'utf-8'});
          res.end('Sorry. This content is not public.');
        } else {
          res.writeHead(200, {'Content-type': 'text/html', 'Charset': 'utf-8'});
          var ipAddress = getIpAddress(req);
          var roomName = path.replace(/^\//, '');
          redisClient.zcard(path, function(err, len) {

            html += '<html><head><script type="text/javascript">';
            html += 'var roomName = "' + roomName + '";</script>';
            html += '<title>' + roomName + '|TypeNow.xyz</title>';
            // html += "<script async \nsrc=\"//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js\"></script> \n<script>\n  (adsbygoogle = window.adsbygoogle || []).push({\n    google_ad_client: \"ca-pub-4360677629222666\",\n    enable_page_level_ads: true\n  });\n</script>";
            html += fs.readFileSync('/var/www/node/chat/redisChatRoom.html');
            res.end(html);              
          });

        }

      }else if(req.method === 'POST') {
        req.on('data', function(chunk) {
        }).on('end', function() {
          res.writeHead(200, {'Content-type': 'text/html'});      
          res.end('POST method is not accepted.');
        });
      }
    }).listen(PORT_HTTPS);
    var server = https.createServer({

