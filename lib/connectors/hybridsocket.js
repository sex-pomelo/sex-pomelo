"use strict";

const util = require('util');
const EventEmitter = require('events').EventEmitter;
const handler = require('./common/handler');
const protocol = require('@sex-pomelo/sex-pomelo-protocol');
const logger = require('@sex-pomelo/sex-pomelo-logger').getLogger('pomelo', __filename);
const Package = protocol.Package;

const ST_INITED = 0;
const ST_WAIT_ACK = 1;
const ST_WORKING = 2;
const ST_CLOSED = 3;

/**
 * Socket class that wraps socket and websocket to provide unified interface for up level.
 */
let Socket = function(id, socket) {
  EventEmitter.call(this);
  this.id = id;
  this.socket = socket;

  if(!socket._socket) {
    this.remoteAddress = {
      ip: socket.address().address,
      port: socket.address().port
    };
  } else {
    this.remoteAddress = {
      ip: socket._socket.remoteAddress,
      port: socket._socket.remotePort
    };
  }

  let self = this;

  socket.once('close', this.emit.bind(this, 'disconnect'));
  socket.on('error', this.emit.bind(this, 'error'));

  socket.on('message', function(msg) {
    if(msg) {
      msg = Package.decode(msg);
      handler(self, msg);
    }
  });

  this.state = ST_INITED;

  // TODO: any other events?
};

util.inherits(Socket, EventEmitter);

module.exports = Socket;

/**
 * Send raw byte data.
 *
 * @api private
 */
Socket.prototype.sendRaw = function(msg) {
  if(this.state !== ST_WORKING) {
    return;
  }
  let self = this;

  this.socket.send(msg, {binary: true}, function(err) {
    if(!!err) {
      logger.error('websocket send binary data failed: %j', err.stack);
      return;
    }
  });
};

/**
 * Send byte data package to client.
 *
 * @param  {Buffer} msg byte data
 */
Socket.prototype.send = function(msg) {
  if(msg instanceof String) {
    msg = new Buffer(msg);
  } else if(!(msg instanceof Buffer)) {
    msg = new Buffer(JSON.stringify(msg));
  }
  this.sendRaw(Package.encode(Package.TYPE_DATA, msg));
};

/**
 * Send byte data packages to client in batch.
 *
 * @param  {Buffer} msgs byte data
 */
Socket.prototype.sendBatch = function(msgs) {
  let rs = [];
  for(let i=0; i<msgs.length; i++) {
    let src = Package.encode(Package.TYPE_DATA, msgs[i]);
    rs.push(src);
  }
  this.sendRaw(Buffer.concat(rs));
};

/**
 * Send message to client no matter whether handshake.
 *
 * @api private
 */
Socket.prototype.sendForce = function(msg) {
  if(this.state === ST_CLOSED) {
    return;
  }
  this.socket.send(msg, {binary: true});
};

/**
 * Response handshake request
 *
 * @api private
 */
Socket.prototype.handshakeResponse = function(resp) {
  if(this.state !== ST_INITED) {
    return;
  }

  this.socket.send(resp, {binary: true});
  this.state = ST_WAIT_ACK;
};

/**
 * Close the connection.
 *
 * @api private
 */
Socket.prototype.disconnect = function() {
  if(this.state === ST_CLOSED) {
    return;
  }

  this.state = ST_CLOSED;
  this.socket.emit('close');
  this.socket.close();
};