"use strict";

const net = require('net');
const dgram = require("dgram");
const utils = require('../util/utils');
const Constants = require('../util/constants');
const UdpSocket = require('./udpsocket');
const Kick = require('./commands/kick');
const Handshake = require('./commands/handshake');
const Heartbeat = require('./commands/heartbeat');
const protocol = require('@sex-pomelo/sex-pomelo-protocol');
let Package = protocol.Package;
var Message = protocol.Message;
const coder = require('./common/coder');
const EventEmitter = require('events').EventEmitter;

let curId = 1;

let gConn = null;

/**
 * @namespace UdpConnector
 */


/** UDP connector
 * 
 * @class
 * @constructor
 * @memberof UdpConnector
 */
class Connector extends EventEmitter{
  constructor(port, host, opts) {
    super();
  
    this.opts = opts || {};
    this.type = opts.udpType || 'udp4';
    this.handshake = new Handshake(opts);
    if(!opts.heartbeat) {
      opts.heartbeat = Constants.TIME.DEFAULT_UDP_HEARTBEAT_TIME;
      opts.timeout = Constants.TIME.DEFAULT_UDP_HEARTBEAT_TIMEOUT;
    }
    this.heartbeat = new Heartbeat(utils.extends(opts, {disconnectOnTimeout: true}));
    this.clients = {};
    this.host = host;
    this.port = port;

    this.decode = coder.decode;
    this.encode = coder.encode;
  }

  
  start (cb) {
    let self = this;
    this.tcpServer = net.createServer();
    this.socket = dgram.createSocket(this.type, function(msg, peer) {
      let key = genKey(peer);
      if(!self.clients[key]) {
        let udpsocket = new UdpSocket(curId++, self.socket, peer);
        self.clients[key] = udpsocket;

        udpsocket.on('handshake',
        self.handshake.handle.bind(self.handshake, udpsocket));

        udpsocket.on('heartbeat',
        self.heartbeat.handle.bind(self.heartbeat, udpsocket));

        udpsocket.on('disconnect',
        self.heartbeat.clear.bind(self.heartbeat, udpsocket.id));

        udpsocket.on('disconnect', function() {
          delete self.clients[genKey(udpsocket.peer)];
        });

        udpsocket.on('closing', Kick.handle.bind(null, udpsocket));

        self.emit('connection', udpsocket);
      }
    });

    this.socket.on('message', function(data, peer) {
      let socket = self.clients[genKey(peer)];
      if(!!socket) {
        socket.emit('package', data);
      }
    });

    this.socket.on('error', function(err) {
      logger.error('udp socket encounters with error: %j', err.stack);
      return;
    });

    this.socket.bind(this.port, this.host);
    this.tcpServer.listen(this.port);
    process.nextTick(cb);
  }

  stop (force, cb) {
    this.socket.close();
    process.nextTick(cb);
  }
  
}


module.exports = function(port, host, opts) {
  if (gConn === null) {
    gConn = new Connector(port, host, opts);
  }

  return gConn;
};


let genKey = function(peer) {
  return peer.address + ":" + peer.port;
};