"use strict";

const net = require('net');
const tls = require('tls');
const EventEmitter = require('events').EventEmitter;

const HybridSocket = require('./hybridsocket');
const Switcher = require('./hybrid/switcher');

const Handshake = require('./commands/handshake');
const Heartbeat = require('./commands/heartbeat');
const Kick = require('./commands/kick');
const coder = require('./common/coder');

let curId = 1;
let gConn = null;

/**
 * @namespace hybridConnector
 */


/**
 * Connector that manager low level connection and protocol bewteen server and client.
 * Develper can provide their own connector to switch the low level prototol, such as tcp or probuf.
 * @class
 * @constructor
 * @memberof hybridConnector
 */
class hybridConnector extends EventEmitter
{
  constructor(port, host, opts) {
    super();
  
    this.opts = opts || {};
    this.port = port;
    this.host = host;
    this.useDict = opts.useDict;
    this.useProtobuf = opts.useProtobuf;
    this.handshake = new Handshake(opts);
    this.heartbeat = new Heartbeat(opts);
    this.distinctHost = opts.distinctHost;
    this.ssl = opts.ssl;
  
    this.switcher = null;

    this.decode = coder.decode;
    this.encode = coder.encode;
  }


  /**
   * Start connector to listen the specified port
   */
  start(cb) {
    let app = require('../pomelo').app;
    let self = this;

    let gensocket = function(socket) {
      let hybridsocket = new HybridSocket(curId++, socket);
      hybridsocket.on('handshake', self.handshake.handle.bind(self.handshake, hybridsocket));
      hybridsocket.on('heartbeat', self.heartbeat.handle.bind(self.heartbeat, hybridsocket));
      hybridsocket.on('disconnect', self.heartbeat.clear.bind(self.heartbeat, hybridsocket.id));
      hybridsocket.on('closing', Kick.handle.bind(null, hybridsocket));
      self.emit('connection', hybridsocket);
    };

    this.connector = app.components.__connector__.connector;
    this.dictionary = app.components.__dictionary__;
    this.protobuf = app.components.__protobuf__;
    this.decodeIO_protobuf = app.components.__decodeIO__protobuf__;

    if(!this.ssl) {
      this.listeningServer = net.createServer();
    } else {
      this.listeningServer = tls.createServer(this.ssl);
    }
    this.switcher = new Switcher(this.listeningServer, self.opts);

    this.switcher.on('connection', function(socket) {
      gensocket(socket);
    });

    if(!!this.distinctHost) {
      this.listeningServer.listen(this.port, this.host);
    } else {
      this.listeningServer.listen(this.port);
    }

    process.nextTick(cb);
  }

  stop(force, cb) {
    this.switcher.close();
    this.listeningServer.close();

    process.nextTick(cb);
  }

}


module.exports = function(port, host, opts) {
  if (gConn === null) {
    gConn = new hybridConnector(port, host, opts)

    return gConn;
  }

  // TODO: should remove this output
  console.log( `--- r hybridConnector ${host}:${port}` );
  return gConn;
};

