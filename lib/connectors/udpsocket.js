"use strict";

const handler = require('./common/handler');
const protocol = require('@sex-pomelo/sex-pomelo-protocol');
const Package = protocol.Package;
const EventEmitter = require('events').EventEmitter;
const logger = require('@sex-pomelo/sex-pomelo-logger').getLogger('pomelo', __filename);

const ST_INITED = 0;
const ST_WAIT_ACK = 1;
const ST_WORKING = 2;
const ST_CLOSED = 3;

/**
 * 
 * @class udpsocket
 * @constructor
 * @memberof UdpConnector
 */
class Socket extends EventEmitter
{
  constructor(id, socket, peer) {
    super();
    
    this.id = id;
    this.socket = socket;
    this.peer = peer;
    this.host = peer.address;
    this.port = peer.port;
    this.remoteAddress = {
      ip: this.host,
      port: this.port
    };
  
    let self = this;
    this.on('package', function(pkg) {
      if(!!pkg) {
        pkg = Package.decode(pkg);
        handler(self, pkg);
      }
    });
  
    this.state = ST_INITED;
  }

  /**
   * Send byte data package to client.
   *
   * @param  {Buffer} msg byte data
   */
  send(msg) {
    if(this.state !== ST_WORKING) {
      return;
    }
    if( typeof(msg) === 'string') {
      msg = Buffer.from(msg);
    } else if(!(msg instanceof Buffer)) {
      msg = Buffer.from(JSON.stringify(msg));
    }
    this.sendRaw(Package.encode(Package.TYPE_DATA, msg));
  }

  sendRaw(msg) {
    this.socket.send(msg, 0, msg.length, this.port, this.host, function(err, bytes) {
      if(!!err)	{
        logger.error('send msg to remote with err: %j', err.stack);
        return;
      }
    });
  }

  sendForce (msg) {
    if(this.state === ST_CLOSED) {
      return;
    }
    this.sendRaw(msg);
  }

  handshakeResponse(resp) {
    if(this.state !== ST_INITED) {
      return;
    }
    this.sendRaw(resp);
    this.state = ST_WAIT_ACK;
  }

  sendBatch(msgs) {
    if(this.state !== ST_WORKING) {
      return;
    }
    let rs = [];
    for(let i=0; i<msgs.length; i++) {
      let src = Package.encode(Package.TYPE_DATA, msgs[i]);
      rs.push(src);
    }
    this.sendRaw(Buffer.concat(rs));
  }

  disconnect() {
    if(this.state === ST_CLOSED) {
      return;
    }
    this.state = ST_CLOSED;
    this.emit('disconnect', 'the connection is disconnected.');
  }

}






module.exports = Socket;
