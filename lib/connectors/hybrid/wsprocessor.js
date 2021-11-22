"use strict";

const HttpServer = require('http').Server;
const EventEmitter = require('events').EventEmitter;
const util = require('util');
const WebSocketServer = require('ws').Server;

const ST_STARTED = 1;
const ST_CLOSED = 2;

/**
 * websocket protocol processor
 * @class
 * @memberof hybridConnector
 */
let Processor = function() {
  EventEmitter.call(this);
  this.httpServer = new HttpServer();

  let self = this;
  this.wsServer = new WebSocketServer({server: this.httpServer});

  this.wsServer.on('connection', function(socket) {
    // emit socket to outside
    self.emit('connection', socket);
  });

  this.state = ST_STARTED;
};
util.inherits(Processor, EventEmitter);

module.exports = Processor;

Processor.prototype.add = function(socket, data) {
  if(this.state !== ST_STARTED) {
    return;
  }
  this.httpServer.emit('connection', socket);

  // Get client real IP through X-Forwarded-For,Take only one
  if( socket.pomeloIPAddarr !== true){
    socket.pomeloIPAddarr = true;
    const headers = data.toString().split('\r\n');
    const len = headers.length;
    for( let i = 0;i <len;i++  ){
      const it = headers[i];
      if( it.length > 19  ){

        if(it.substring(0,15).toLowerCase() === 'x-forwarded-for')
        {
          const ip = it.substring(16);
          socket.pomeloXffIP = ip.trim();
          break;
        }
      }
    }
  }

  if(typeof socket.ondata === 'function') {
    // compatible with stream2
    socket.ondata(data, 0, data.length);
  } else {
    // compatible with old stream
    socket.emit('data', data);
  }
};

Processor.prototype.close = function() {
  if(this.state !== ST_STARTED) {
    return;
  }
  this.state = ST_CLOSED;
  this.wsServer.close();
  for (const ws of this.wsServer.clients) {
    ws.terminate();
  }
  this.wsServer = null;
  this.httpServer = null;
};
