"use strict";

const logger = require('@sex-pomelo/sex-pomelo-logger').getLogger('pomelo', __filename);
const utils = require('../util/utils');
const Constants = require('../util/constants');
const MasterWatchdog = require('../master/watchdog');

module.exports = function(opts, consoleService) {
  return new Module(opts, consoleService);
};

module.exports.moduleId = Constants.KEYWORDS.MASTER_WATCHER;

let Module = function(opts, consoleService) {
  this.app = opts.app;
  this.service = consoleService;
  this.id = this.app.getServerId();

  this.watchdog = new MasterWatchdog(this.app, this.service);
  this.service.on('register', onServerAdd.bind(null, this));
  this.service.on('disconnect', onServerLeave.bind(null, this));
  this.service.on('reconnect', onServerReconnect.bind(null, this));
};

// ----------------- bind methods -------------------------

let onServerAdd = function(module, record) {
  logger.debug('masterwatcher receive add server event, with server: %j', record);
  if(!record || record.type === 'client' || !record.serverType) {
    return;
  }
  module.watchdog.addServer(record);
};

let onServerReconnect = function(module, record) {
  logger.debug('masterwatcher receive reconnect server event, with server: %j', record);
  if(!record || record.type === 'client' || !record.serverType) {
    logger.warn('onServerReconnect receive wrong message: %j', record);
    return;
  }
  module.watchdog.reconnectServer(record);
};

let onServerLeave = function(module, id, type) {
  logger.debug('masterwatcher receive remove server event, with server: %s, type: %s', id, type);
  if(!id) {
    logger.warn('onServerLeave receive server id is empty.');
    return;
  }
  if(type !== 'client') {
    module.watchdog.removeServer(id);
  }
};

// ----------------- module methods -------------------------

Module.prototype.start = function(cb) {
  utils.invokeCallback(cb);
};

Module.prototype.masterHandler = function(agent, msg, cb) {
  if(!msg) {
    logger.warn('masterwatcher receive empty message.');
    return;
  }
  let func = masterMethods[msg.action];
  if(!func) {
    logger.info('masterwatcher unknown action: %j', msg.action);
    return;
  }
  func(this, agent, msg, cb);
};

// ----------------- monitor request methods -------------------------

let subscribe = function(module, agent, msg, cb) {
  if(!msg) {
    utils.invokeCallback(cb, new Error('masterwatcher subscribe empty message.'));
    return;
  }

  module.watchdog.subscribe(msg.id);
  utils.invokeCallback(cb, null, module.watchdog.query());
};

let unsubscribe = function(module, agent, msg, cb) {
  if(!msg) {
    utils.invokeCallback(cb, new Error('masterwatcher unsubscribe empty message.'));
    return;
  }
  module.watchdog.unsubscribe(msg.id);
  utils.invokeCallback(cb);
};

let query = function(module, agent, msg, cb) {
  utils.invokeCallback(cb, null, module.watchdog.query());
};

let record = function(module, agent, msg) {
  if(!msg) {
    utils.invokeCallback(cb, new Error('masterwatcher record empty message.'));
    return;
  }
  module.watchdog.record(msg.id);
};

let masterMethods = {
  'subscribe': subscribe,
  'unsubscribe': unsubscribe,
  'query': query,
  'record': record
};