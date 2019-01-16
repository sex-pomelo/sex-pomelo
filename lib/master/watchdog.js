"use strict";

const logger = require('@sex-pomelo/sex-pomelo-logger').getLogger('pomelo', __filename);
const utils = require('../util/utils');
const Constants = require('../util/constants');
const countDownLatch = require('../util/countDownLatch');
const EventEmitter = require('events').EventEmitter;
const util = require('util');

let Watchdog = function(app, service) {
  EventEmitter.call(this);

  this.app = app;
  this.service = service;
  this.isStarted = false;
  this.count = utils.size(app.getServersFromConfig());

  this.servers = {};
  this.listeners = {};
};
util.inherits(Watchdog, EventEmitter);

module.exports = Watchdog;

Watchdog.prototype.addServer = function(server) {
  if(!server) {
    return;
  }
  this.servers[server.id] = server;
  this.notify({action: 'addServer', server: server});
};

Watchdog.prototype.removeServer = function(id) {
  if(!id) {
    return;
  }
  this.unsubscribe(id);
  delete this.servers[id];
  this.notify({action: 'removeServer', id: id});
};

Watchdog.prototype.reconnectServer = function(server) {
  let self = this;
  if(!server) {
    return;
  }
  if(!this.servers[server.id]) {
    this.servers[server.id] = server;
  }
  //replace server in reconnect server
  this.notifyById(server.id, {action: 'replaceServer', servers: self.servers});
  // notify other server to add server
  this.notify({action: 'addServer', server: server});
  // add server in listener
  this.subscribe(server.id);
};

Watchdog.prototype.subscribe = function(id) {
  this.listeners[id] = 1;
};

Watchdog.prototype.unsubscribe = function(id) {
  delete this.listeners[id];
};

Watchdog.prototype.query = function() {
  return this.servers;
};

Watchdog.prototype.record = function(id) {
  if(!this.isStarted && --this.count < 0) {
    let usedTime = Date.now() - this.app.startTime;
    logger.info('all servers startup in %s ms', usedTime);
    this.notify({action: 'startOver'});
    this.isStarted = true;
  }
};

Watchdog.prototype.notifyById = function(id, msg) {
  this.service.agent.request(id, Constants.KEYWORDS.MONITOR_WATCHER, msg, function(signal) {
    if(signal !== Constants.SIGNAL.OK) {
      logger.error('master watchdog fail to notify to monitor, id: %s, msg: %j', id, msg);
    } else {
      logger.debug('master watchdog notify to monitor success, id: %s, msg: %j', id, msg);
    }
  });
};

Watchdog.prototype.notify = function(msg) {
  let listeners = this.listeners;
  let success = true;
  let fails = [];
  let timeouts = [];
  let requests = {};
  let count = utils.size(listeners);
  if(count === 0) {
    logger.warn('master watchdog listeners is none, msg: %j', msg);
    return;
  }
  let latch = countDownLatch.createCountDownLatch(count, {timeout: Constants.TIME.TIME_WAIT_COUNTDOWN}, function(isTimeout) {
    if(!!isTimeout) {
      for(let key in requests) {
        if(!requests[key])  {
          timeouts.push(key);
        }
      }
      logger.error('master watchdog request timeout message: %j, timeouts: %j, fails: %j', msg, timeouts, fails);
    }
    if(!success) {
      logger.error('master watchdog request fail message: %j, fails: %j', msg, fails);
    }
  });

  let moduleRequest = function(self, id) {
    return (function() {
      self.service.agent.request(id, Constants.KEYWORDS.MONITOR_WATCHER, msg, function(signal) {
        if(signal !== Constants.SIGNAL.OK) {
          fails.push(id);
          success = false;
        }
        requests[id] = 1;
        latch.done();
      });
    })();
  };

  for(let id in listeners) {
    requests[id] = 0;
    moduleRequest(this, id);
  }
};