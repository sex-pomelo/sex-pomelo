"use strict";

/**
 * Component for monitor.
 * Load and start monitor client.
 */
const logger = require('@sex-pomelo/sex-pomelo-logger').getLogger('pomelo', __filename);
const admin = require('@sex-pomelo/sex-pomelo-admin');
const moduleUtil = require('../util/moduleUtil');
const utils = require('../util/utils');
const Constants = require('../util/constants');

let Monitor = function(app, opts) {
  opts = opts || {};
  this.app = app;
  this.serverInfo = app.getCurServer();
  this.masterInfo = app.getMaster();
  this.modules = [];
  this.closeWatcher = opts.closeWatcher;

  this.monitorConsole = admin.createMonitorConsole({
    id: this.serverInfo.id,
    type: this.app.getServerType(),
    host: this.masterInfo.host,
    port: this.masterInfo.port,
    info: this.serverInfo,
    env: this.app.get(Constants.RESERVED.ENV),
    authServer: app.get('adminAuthServerMonitor') // auth server function
  });
};

module.exports = Monitor;

Monitor.prototype.start = function(cb) {
  moduleUtil.registerDefaultModules(false, this.app, this.closeWatcher);
  this.startConsole(cb);
};

Monitor.prototype.startConsole = function(cb) {
  moduleUtil.loadModules(this, this.monitorConsole);

  let self = this;
  this.monitorConsole.start(function(err) {
    if (err) {
      utils.invokeCallback(cb, err);
      return;
    }
    moduleUtil.startModules(self.modules, function(err) {
      utils.invokeCallback(cb, err);
      return;
    });
  });

  this.monitorConsole.on('error', function(err) {
    if(!!err) {
      logger.error('monitorConsole encounters with error: %j', err.stack);
      return;
    }
  });
};

Monitor.prototype.stop = function(cb) {
  this.monitorConsole.stop();
  this.modules = [];
  process.nextTick(function() {
    utils.invokeCallback(cb);
  });
};

// monitor reconnect to master
Monitor.prototype.reconnect = function(masterInfo) {
  let self = this;
  this.stop(function() {
    self.monitorConsole = admin.createMonitorConsole({
      id: self.serverInfo.id,
      type: self.app.getServerType(),
      host: masterInfo.host,
      port: masterInfo.port,
      info: self.serverInfo,
      env: self.app.get(Constants.RESERVED.ENV)
    });
    self.startConsole(function() {
      logger.info('restart modules for server : %j finish.', self.app.serverId);
    });
  });
};