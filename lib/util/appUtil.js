"use strict";

const async = require('async');
const log = require('./log');
const utils = require('./utils');
const path = require('path');
const fs = require('fs');
const Constants = require('./constants');
const starter = require('../master/starter');
const logger = require('@sex-pomelo/sex-pomelo-logger').getLogger('pomelo', __filename);

/** 
 *  The APP Utils module
 * @module appUtils
 */

/**
 * Initialize application configuration.
 * @alias module:appUtils.defaultConfiguration
 */
module.exports.defaultConfiguration = function(app) {
  let args = parseArgs(process.argv);
  setupEnv(app, args);
  loadMaster(app);
  loadServers(app);
  processArgs(app, args);
  configLogger(app);
  loadLifecycle(app);
};

/**
 * Start servers by type.
 * @alias module:appUtils.startByType
 */
module.exports.startByType = function(app, cb) {
  if(!!app.startId) {
    if(app.startId === Constants.RESERVED.MASTER) {
      utils.invokeCallback(cb);
    } else {
      starter.runServers(app);
    }
  } else {
    if(!!app.type && app.type !== Constants.RESERVED.ALL && app.type !== Constants.RESERVED.MASTER) {
      starter.runServers(app);
    } else {
      utils.invokeCallback(cb);
    }
  }
};

/**
 * Load default components for application.
 * @alias module:appUtils.loadDefaultComponents
 */
module.exports.loadDefaultComponents = function(app) {
  let pomelo = require('../pomelo');
  // load system default components
  if (app.serverType === Constants.RESERVED.MASTER) {
    app.load(pomelo.master, app.get('masterConfig'));
  } else {
    app.load(pomelo.proxy, app.get('proxyConfig'));
    if (app.getCurServer().port) {
      app.load(pomelo.remote, app.get('remoteConfig'));
    }
    if (app.isFrontend()) {
      app.load(pomelo.connection, app.get('connectionConfig'));
      app.load(pomelo.connector, app.get('connectorConfig'));
      app.load(pomelo.session, app.get('sessionConfig'));
      // compatible for schedulerConfig
      if(app.get('schedulerConfig')) {
        app.load(pomelo.pushScheduler, app.get('schedulerConfig'));
      } else {
        app.load(pomelo.pushScheduler, app.get('pushSchedulerConfig'));
      }
    }
    app.load(pomelo.backendSession, app.get('backendSessionConfig'));
    app.load(pomelo.channel, app.get('channelConfig'));
    app.load(pomelo.server, app.get('serverConfig'));
  }
  app.load(pomelo.monitor, app.get('monitorConfig'));
};

/**
 * Stop components.
 *
 * @alias module:appUtils.stopComps
 * 
 * @param  {Array}  comps component list
 * @param  {Number}   index current component index
 * @param  {Boolean}  force whether stop component immediately
 * @param  {Function} cb
 */
module.exports.stopComps = function(comps, index, force, cb) {
  if (index >= comps.length) {
    utils.invokeCallback(cb);
    return;
  }
  let comp = comps[index];
  if (typeof comp.stop === 'function') {
    comp.stop(force, function() {
      // ignore any error
      module.exports.stopComps(comps, index + 1, force, cb);
    });
  } else {
    module.exports.stopComps(comps, index + 1, force, cb);
  }
};

/**
 * Apply command to loaded components.
 * This method would invoke the component {method} in series.
 * Any component {method} return err, it would return err directly.
 * @alias module:appUtils.optComponents
 *
 * @param {Array} comps loaded component list
 * @param {String} method component lifecycle method name, such as: start, stop
 * @param {Function} cb
 */
module.exports.optComponents = function(comps, method, cb) {
  let i = 0;
  async.forEachSeries(comps, function(comp, done) {
    i++;
    if (typeof comp[method] === 'function') {
      comp[method](done);
    } else {
      done();
    }
  }, function(err) {
    if (err) {
      if(typeof err === 'string') {
        logger.error('fail to operate component, method: %s, err: %j', method, err);
      } else {
        logger.error('fail to operate component, method: %s, err: %j',  method, err.stack);
      }
    }
    utils.invokeCallback(cb, err);
  });
};

/**
 * Load server info from config/servers.json.
 * @access private
 */
let loadServers = function(app) {
  app.loadConfigBaseApp(Constants.RESERVED.SERVERS, Constants.FILEPATH.SERVER);
  let servers = app.get(Constants.RESERVED.SERVERS);
  let serverMap = {}, slist, i, l, server;
  for (let serverType in servers) {
    slist = servers[serverType];
    for (i = 0, l = slist.length; i < l; i++) {
      server = slist[i];
      server.serverType = serverType;
      if(server[Constants.RESERVED.CLUSTER_COUNT]) {
        utils.loadCluster(app, server, serverMap);
        continue;
      }
      serverMap[server.id] = server;
      if (server.wsPort) {
        logger.warn('wsPort is deprecated, use clientPort in frontend server instead, server: %j', server);
      }
    }
  }
  app.set(Constants.KEYWORDS.SERVER_MAP, serverMap);
};

/**
 * Load master info from config/master.json.
 * @access private
 */
let loadMaster = function(app) {
  app.loadConfigBaseApp(Constants.RESERVED.MASTER, Constants.FILEPATH.MASTER);
  app.master = app.get(Constants.RESERVED.MASTER);
};

/**
 * Process server start command
 * @access private
 */
let processArgs = function(app, args) {
  let serverType = args.serverType || Constants.RESERVED.MASTER;
  let serverId = args.id || app.getMaster().id;
  let mode = args.mode || Constants.RESERVED.CLUSTER;
  let masterha = args.masterha || 'false';
  let type = args.type || Constants.RESERVED.ALL;
  let startId = args.startId;

  app.set(Constants.RESERVED.MAIN, args.main, true);
  app.set(Constants.RESERVED.SERVER_TYPE, serverType, true);
  app.set(Constants.RESERVED.SERVER_ID, serverId, true);
  app.set(Constants.RESERVED.MODE, mode, true);
  app.set(Constants.RESERVED.TYPE, type, true);
  if(!!startId) {
    app.set(Constants.RESERVED.STARTID, startId, true);
  }

  if (masterha === 'true') {
    app.master = args;
    app.set(Constants.RESERVED.CURRENT_SERVER, args, true);
  } else if (serverType !== Constants.RESERVED.MASTER) {
    app.set(Constants.RESERVED.CURRENT_SERVER, args, true);
  } else {
    app.set(Constants.RESERVED.CURRENT_SERVER, app.getMaster(), true);
  }
};

/**
 * Setup enviroment.
 * @access private
 */
let setupEnv = function(app, args) {
  app.set(Constants.RESERVED.ENV, args.env || process.env.NODE_ENV || Constants.RESERVED.ENV_DEV, true);
};

/**
 * Configure custom logger.
 * @access private
 */
let configLogger = function(app) {
  if (process.env.POMELO_LOGGER !== 'off') {
    let env = app.get(Constants.RESERVED.ENV);
    let originPath = path.join(app.getBase(), Constants.FILEPATH.LOG);
    let presentPath = path.join(app.getBase(), Constants.FILEPATH.CONFIG_DIR, env, path.basename(Constants.FILEPATH.LOG));
    if(fs.existsSync(originPath)) {
      log.configure(app, originPath);
    } else if(fs.existsSync(presentPath)) {
      log.configure(app, presentPath);
    } else {
      logger.error('logger file path configuration is error.');
    }
  }
};

/**
 * Parse command line arguments.
 * @access private
 *
 * @param args command line arguments
 *
 * @return Object argsMap map of arguments
 */
let parseArgs = function(args) {
  let argsMap = {};
  let mainPos = 1;

  while (args[mainPos].indexOf('--') > 0) {
    mainPos++;
  }
  argsMap.main = args[mainPos];

  for (let i = (mainPos + 1); i < args.length; i++) {
    let arg = args[i];
    let sep = arg.indexOf('=');
    let key = arg.slice(0, sep);
    let value = arg.slice(sep + 1);
    if (!isNaN(Number(value)) && (value.indexOf('.') < 0)) {
      value = Number(value);
    }
    argsMap[key] = value;
  }

  return argsMap;
};

/**
 * Load lifecycle file.
 * @access private
 *
 */
let loadLifecycle = function(app) {
  let filePath = path.join(app.getBase(), Constants.FILEPATH.SERVER_DIR, app.serverType, Constants.FILEPATH.LIFECYCLE);
  if(!fs.existsSync(filePath)) {
    return;
  }
  let lifecycle = require(filePath);
  for(let key in lifecycle) {
    if(typeof lifecycle[key] === 'function') {
      app.lifecycleCbs[key] = lifecycle[key];
    } else {
      logger.warn('lifecycle.js in %s is error format.', filePath);
    }
  }
};
