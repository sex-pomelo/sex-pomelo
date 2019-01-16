"use strict";

const logger = require('@sex-pomelo/sex-pomelo-logger').getLogger('pomelo', __filename);
const taskManager = require('../common/manager/taskManager');
const pomelo = require('../pomelo');
const rsa = require("node-bignumber");
const events = require('../util/events');
const utils = require('../util/utils');

module.exports = function(app, opts) {
  return new Component(app, opts);
};

/**
 * Connector component. Receive client requests and attach session with socket.
 *
 * @param {Object} app  current application context
 * @param {Object} opts attach parameters
 *                      opts.connector {Object} provides low level network and protocol details implementation between server and clients.
 */
let Component = function(app, opts) {
  opts = opts || {};
  this.app = app;
  this.connector = getConnector(app, opts);
  this.encode = opts.encode;
  this.decode = opts.decode;
  this.useCrypto = opts.useCrypto;
  this.useHostFilter = opts.useHostFilter;
  this.useAsyncCoder = opts.useAsyncCoder;
  this.blacklistFun = opts.blacklistFun;
  this.keys = {};
  this.blacklist = [];

  if (opts.useDict) {
    app.load(pomelo.dictionary, app.get('dictionaryConfig'));
  }

  if (opts.useProtobuf) {
    app.load(pomelo.protobuf, app.get('protobufConfig'));
  }

  // component dependencies
  this.server = null;
  this.session = null;
  this.connection = null;
};

let pro = Component.prototype;

pro.name = '__connector__';

pro.start = function(cb) {
  this.server = this.app.components.__server__;
  this.session = this.app.components.__session__;
  this.connection = this.app.components.__connection__;

  // check component dependencies
  if (!this.server) {
    process.nextTick(function() {
      utils.invokeCallback(cb, new Error('fail to start connector component for no server component loaded'));
    });
    return;
  }

  if (!this.session) {
    process.nextTick(function() {
      utils.invokeCallback(cb, new Error('fail to start connector component for no session component loaded'));
    });
    return;
  }

  process.nextTick(cb);
};

pro.afterStart = function(cb) {
  this.connector.start(cb);
  this.connector.on('connection', hostFilter.bind(this, bindEvents));
};

pro.stop = function(force, cb) {
  if (this.connector) {
    this.connector.stop(force, cb);
    this.connector = null;
    return;
  } else {
    process.nextTick(cb);
  }
};

pro.send = function(reqId, route, msg, recvs, opts, cb) {
  logger.debug('[%s] send message reqId: %s, route: %s, msg: %j, receivers: %j, opts: %j', this.app.serverId, reqId, route, msg, recvs, opts);
  if (this.useAsyncCoder) {
    return this.sendAsync(reqId, route, msg, recvs, opts, cb);
  }

  let emsg = msg;
  if (this.encode) {
    // use costumized encode
    emsg = this.encode.call(this, reqId, route, msg);
  } else if (this.connector.encode) {
    // use connector default encode
    emsg = this.connector.encode(reqId, route, msg);
  }

  this.doSend(reqId, route, emsg, recvs, opts, cb);
};

pro.sendAsync = function(reqId, route, msg, recvs, opts, cb) {
  let emsg = msg;
  let self = this;

  if (this.encode) {
    // use costumized encode
    this.encode(reqId, route, msg, function(err, encodeMsg) {
      if (err) {
        return cb(err);
      }

      emsg = encodeMsg;
      self.doSend(reqId, route, emsg, recvs, opts, cb);
    });
  } else if (this.connector.encode) {
    // use connector default encode
    this.connector.encode(reqId, route, msg, function(err, encodeMsg) {
      if (err) {
        return cb(err);
      }

      emsg = encodeMsg;
      self.doSend(reqId, route, emsg, recvs, opts, cb);
    });
  }
}

pro.doSend = function(reqId, route, emsg, recvs, opts, cb) {
  if (!emsg) {
    process.nextTick(function() {
      return cb && cb(new Error('fail to send message for encode result is empty.'));
    });
  }

  this.app.components.__pushScheduler__.schedule(reqId, route, emsg,
    recvs, opts, cb);
}

pro.setPubKey = function(id, key) {
  let pubKey = new rsa.Key();
  pubKey.n = new rsa.BigInteger(key.rsa_n, 16);
  pubKey.e = key.rsa_e;
  this.keys[id] = pubKey;
};

pro.getPubKey = function(id) {
  return this.keys[id];
};

let getConnector = function(app, opts) {
  let connector = opts.connector;
  if (!connector) {
    return getDefaultConnector(app, opts);
  }

  if (typeof connector !== 'function') {
    return connector;
  }

  let curServer = app.getCurServer();
  let host = curServer.clientHost || curServer.host;
  return connector(curServer.clientPort, host, opts);
};

let getDefaultConnector = function(app, opts) {
  let DefaultConnector = require('../connectors/sioconnector');
  let curServer = app.getCurServer();
  let host = curServer.clientHost || curServer.host;
  return new DefaultConnector(curServer.clientPort, host, opts);
};

let hostFilter = function(cb, socket) {
  if(!this.useHostFilter) {
    return cb(this, socket);
  }

  let ip = socket.remoteAddress.ip;
  let check = function(list) {
    for (let address in list) {
      let exp = new RegExp(list[address]);
      if (exp.test(ip)) {
        socket.disconnect();
        return true;
      }
    }
    return false;
  };
  // dynamical check
  if (this.blacklist.length !== 0 && !!check(this.blacklist)) {
    return;
  }
  // static check
  if (!!this.blacklistFun && typeof this.blacklistFun === 'function') {
    let self = this;
    self.blacklistFun(function(err, list) {
      if (!!err) {
        logger.error('connector blacklist error: %j', err.stack);
        utils.invokeCallback(cb, self, socket);
        return;
      }
      if (!Array.isArray(list)) {
        logger.error('connector blacklist is not array: %j', list);
        utils.invokeCallback(cb, self, socket);
        return;
      }
      if (!!check(list)) {
        return;
      } else {
        utils.invokeCallback(cb, self, socket);
        return;
      }
    });
  } else {
    utils.invokeCallback(cb, this, socket);
  }
};

let bindEvents = function(self, socket) {
  let curServer = self.app.getCurServer();
  let maxConnections = curServer['max-connections'];
  if (self.connection && maxConnections) {
    let statisticInfo = self.connection.getStatisticsInfo();
    if (statisticInfo.totalConnCount > maxConnections) {
      logger.warn('the server %s has reached the max connections %s', curServer.id, maxConnections);
      socket.disconnect();
      return;
    }
    self.connection.increaseConnectionCount();
  }

  //create session for connection
  let session = getSession(self, socket);
  let closed = false;

  socket.on('disconnect', function() {
    if (closed) {
      return;
    }
    closed = true;
    if (self.connection) {
      self.connection.decreaseConnectionCount(session.uid);
    }
  });

  socket.on('error', function() {
    if (closed) {
      return;
    }
    closed = true;
    if (self.connection) {
      self.connection.decreaseConnectionCount(session.uid);
    }
  });

  // new message
  socket.on('message', function(msg) {
    let dmsg = msg;
    if (self.useAsyncCoder) {
      return handleMessageAsync(self, msg, session, socket);
    }

    if (self.decode) {
      dmsg = self.decode(msg, session);
    } else if (self.connector.decode) {
      dmsg = self.connector.decode(msg, socket);
    }
    if (!dmsg) {
      // discard invalid message
      return;
    }

    // use rsa crypto
    if (self.useCrypto) {
      let verified = verifyMessage(self, session, dmsg);
      if (!verified) {
        logger.error('fail to verify the data received from client.');
        return;
      }
    }

    handleMessage(self, session, dmsg);
  }); //on message end
};

let handleMessageAsync = function(self, msg, session, socket) {
  if (self.decode) {
    self.decode(msg, session, function(err, dmsg) {
      if (err) {
        logger.error('fail to decode message from client %s .', err.stack);
        return;
      }

      doHandleMessage(self, dmsg, session);
    });
  } else if (self.connector.decode) {
    self.connector.decode(msg, socket, function(err, dmsg) {
      if (err) {
        logger.error('fail to decode message from client %s .', err.stack);
        return;
      }

      doHandleMessage(self, dmsg, session);
    });
  }
}

let doHandleMessage = function(self, dmsg, session) {
  if (!dmsg) {
    // discard invalid message
    return;
  }

  // use rsa crypto
  if (self.useCrypto) {
    let verified = verifyMessage(self, session, dmsg);
    if (!verified) {
      logger.error('fail to verify the data received from client.');
      return;
    }
  }

  handleMessage(self, session, dmsg);
}

/**
 * get session for current connection
 */
let getSession = function(self, socket) {
  let app = self.app,
    sid = socket.id;
  let session = self.session.get(sid);
  if (session) {
    return session;
  }

  session = self.session.create(sid, app.getServerId(), socket);
  logger.debug('[%s] getSession session is created with session id: %s', app.getServerId(), sid);

  // bind events for session
  socket.on('disconnect', session.closed.bind(session));
  socket.on('error', session.closed.bind(session));
  session.on('closed', onSessionClose.bind(null, app));
  session.on('bind', function(uid) {
    logger.debug('session on [%s] bind with uid: %s', self.app.serverId, uid);
    // update connection statistics if necessary
    if (self.connection) {
      self.connection.addLoginedUser(uid, {
        loginTime: Date.now(),
        uid: uid,
        address: socket.remoteAddress.ip + ':' + socket.remoteAddress.port
      });
    }
    self.app.event.emit(events.BIND_SESSION, session);
  });

  session.on('unbind', function(uid) {
    if (self.connection) {
      self.connection.removeLoginedUser(uid);
    }
    self.app.event.emit(events.UNBIND_SESSION, session);
  });

  return session;
};

let onSessionClose = function(app, session, reason) {
  taskManager.closeQueue(session.id, true);
  app.event.emit(events.CLOSE_SESSION, session);
};

let handleMessage = function(self, session, msg) {
  logger.debug('[%s] handleMessage session id: %s, msg: %j', self.app.serverId, session.id, msg);
  let type = checkServerType(msg.route);
  if (!type) {
    logger.error('invalid route string. route : %j', msg.route);
    return;
  }
  self.server.globalHandle(msg, session.toFrontendSession(), function(err, resp, opts) {
    if (resp && !msg.id) {
      logger.warn('try to response to a notify: %j', msg.route);
      return;
    }
    if (!msg.id && !resp) return;
    if (!resp) resp = {};
    if (!!err && !resp.code) {
      resp.code = 500;
    }
    opts = {
      type: 'response',
      userOptions: opts || {}
    };
    // for compatiablity
    opts.isResponse = true;

    self.send(msg.id, msg.route, resp, [session.id], opts,
      function() {});
  });
};

/**
 * Get server type form request message.
 */
let checkServerType = function(route) {
  if (!route) {
    return null;
  }
  let idx = route.indexOf('.');
  if (idx < 0) {
    return null;
  }
  return route.substring(0, idx);
};

let verifyMessage = function(self, session, msg) {
  let sig = msg.body.__crypto__;
  if (!sig) {
    logger.error('receive data from client has no signature [%s]', self.app.serverId);
    return false;
  }

  let pubKey;

  if (!session) {
    logger.error('could not find session.');
    return false;
  }

  if (!session.get('pubKey')) {
    pubKey = self.getPubKey(session.id);
    if (!!pubKey) {
      delete self.keys[session.id];
      session.set('pubKey', pubKey);
    } else {
      logger.error('could not get public key, session id is %s', session.id);
      return false;
    }
  } else {
    pubKey = session.get('pubKey');
  }

  if (!pubKey.n || !pubKey.e) {
    logger.error('could not verify message without public key [%s]', self.app.serverId);
    return false;
  }

  delete msg.body.__crypto__;

  let message = JSON.stringify(msg.body);
  if (utils.hasChineseChar(message))
    message = utils.unicodeToUtf8(message);

  return pubKey.verifyString(message, sig);
};
