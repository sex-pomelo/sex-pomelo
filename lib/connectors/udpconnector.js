"use strict";

const net = require('net');
const util = require('util');
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

let Connector = function(port, host, opts) {
  if (!(this instanceof Connector)) {
    return new Connector(port, host, opts);
  }

  EventEmitter.call(this);
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
};

util.inherits(Connector, EventEmitter);

module.exports = Connector;

Connector.prototype.start = function(cb) {
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
};

Connector.decode = Connector.prototype.decode = coder.decode;

Connector.encode = Connector.prototype.encode = coder.encode;

Connector.prototype.stop = function(force, cb) {
  this.socket.close();
  process.nextTick(cb);
};

let genKey = function(peer) {
  return peer.address + ":" + peer.port;
};