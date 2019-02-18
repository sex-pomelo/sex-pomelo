"use strict";

/**
 * Component for proxy.
 * Generate proxies for rpc client.
 */
const utils = require('../util/utils');
const events = require('../util/events');
const Client = require('@sex-pomelo/sex-pomelo-rpc').client;
const pathUtil = require('../util/pathUtil');
const Constants = require('../util/constants');
const logger = require('@sex-pomelo/sex-pomelo-logger').getLogger('pomelo', __filename);

/**
 * Component factory function
 *
 * @param {Object} app  current application context
 * @param {Object} opts construct parameters
 *                      opts.router: (optional) rpc message route function, route(routeParam, msg, cb),
 *                      opts.mailBoxFactory: (optional) mail box factory instance.
 * @return {Object}     component instance
 */
module.exports = function(app, opts) {
  opts = opts || {};
  // proxy default config
  // cacheMsg is deprecated, just for compatibility here.
  opts.bufferMsg = opts.bufferMsg || opts.cacheMsg || false;
  opts.interval = opts.interval || 30;
  opts.router = genRouteFun();
  opts.context = app;
  opts.routeContext = app;
  if (app.enabled('rpcDebugLog')) {
    opts.rpcDebugLog = true;
    opts.rpcLogger = require('@sex-pomelo/sex-pomelo-logger').getLogger('rpc-debug', __filename);
  }

  return new Component(app, opts);
};

/**
 * Proxy component class
 *
 * @param {Object} app  current application context
 * @param {Object} opts construct parameters
 */
let Component = function(app, opts) {
  this.app = app;
  this.opts = opts;
  this.client = genRpcClient(this.app, opts);
  this.app.event.on(events.REPLACE_SERVERS, this.replaceServers.bind(this));
};

let pro = Component.prototype;

pro.name = '__proxy__';

/**
 * Proxy component lifecycle function
 *
 * @param {Function} cb
 * @return {Void}
 */
pro.start = function(cb) {
  if(this.opts.enableRpcLog) {
    logger.warn('enableRpcLog is deprecated in 0.8.0, please use app.rpcFilter(pomelo.rpcFilters.rpcLog())');
  }
  let rpcBefores = this.app.get(Constants.KEYWORDS.RPC_BEFORE_FILTER);
  let rpcAfters = this.app.get(Constants.KEYWORDS.RPC_AFTER_FILTER);
  let rpcErrorHandler = this.app.get(Constants.RESERVED.RPC_ERROR_HANDLER);

  if(!!rpcBefores) {
    this.client.before(rpcBefores);
  } 
  if(!!rpcAfters) {
    this.client.after(rpcAfters);
  }
  if(!!rpcErrorHandler) {
    this.client.setErrorHandler(rpcErrorHandler);
  }
  process.nextTick(cb);
};

/**
 * Component lifecycle callback
 *
 * @param {Function} cb
 * @return {Void}
 */
pro.afterStart = function(cb) {
  let self = this;
  this.app.__defineGetter__('rpc', function() {
    return self.client.proxies.user;
  });
  this.app.__defineGetter__('sysrpc', function() {
    return self.client.proxies.sys;
  });
  this.app.set('rpcInvoke', this.client.rpcInvoke.bind(this.client), true);
  this.client.start(cb);
};



/**
 * Replace remote servers from the rpc client.
 *
 * @param  {Array} ids server id list
 */
pro.replaceServers = function(servers) {
  if (!servers || !servers.length) {
    return;
  }

  // update proxies
  genProxies(this.client, this.app, servers);

  this.client.replaceServers(servers);
};

/**
 * Proxy for rpc client rpcInvoke.
 *
 * @param {String}   serverId remote server id
 * @param {Object}   msg      rpc message: {serverType: serverType, service: serviceName, method: methodName, args: arguments}
 * @param {Function} cb      callback function
 */
pro.rpcInvoke = function(serverId, msg, cb) {
  this.client.rpcInvoke(serverId, msg, cb);
};

/**
 * Generate rpc client
 *
 * @param {Object} app current application context
 * @param {Object} opts contructor parameters for rpc client
 * @return {Object} rpc client
 */
let genRpcClient = function(app, opts) {
  opts.context = app;
  opts.routeContext = app;
  if(!!opts.rpcClient) {
    return opts.rpcClient.create(opts);
  } else {
    return Client.create(opts);
  }
};

/**
 * Generate proxy for the server infos.
 *
 * @param  {Object} client rpc client instance
 * @param  {Object} app    application context
 * @param  {Array} sinfos server info list
 */
let genProxies = function(client, app, sinfos) {
  let item;
  for (let i = 0, l = sinfos.length; i < l; i++) {
    item = sinfos[i];
    if (hasProxy(client, item)) {
      continue;
    }
    client.addProxies(getProxyRecords(app, item));
  }
};

/**
 * Check a server whether has generated proxy before
 *
 * @param  {Object}  client rpc client instance
 * @param  {Object}  sinfo  server info
 * @return {Boolean}        true or false
 */
let hasProxy = function(client, sinfo) {
  let proxy = client.proxies;
  return !!proxy.sys && !! proxy.sys[sinfo.serverType];
};

/**
 * Get proxy path for rpc client.
 * Iterate all the remote service path and create remote path record.
 *
 * @param {Object} app current application context
 * @param {Object} sinfo server info, format: {id, serverType, host, port}
 * @return {Array}     remote path record array
 */
let getProxyRecords = function(app, sinfo) {
  let records = [],
    appBase = app.getBase(),
    record;
  // sys remote service path record
  if (app.isFrontend(sinfo)) {
    record = pathUtil.getSysRemotePath('frontend');
  } else {
    record = pathUtil.getSysRemotePath('backend');
  }
  if (record) {
    records.push(pathUtil.remotePathRecord('sys', sinfo.serverType, record));
  }

  // user remote service path record
  record = pathUtil.getUserRemotePath(appBase, sinfo.serverType);
  if (record) {
    records.push(pathUtil.remotePathRecord('user', sinfo.serverType, record));
  }

  return records;
};

let genRouteFun = function() {
  return function(session, msg, app, cb) {
    let routes = app.get('__routes__');

    if (!routes) {
      defaultRoute(session, msg, app, cb);
      return;
    }

    let type = msg.serverType,
      route = routes[type] || routes['default'];

    if (route) {
      route(session, msg, app, cb);
    } else {
      defaultRoute(session, msg, app, cb);
    }
  };
};

let defaultRoute = function(session, msg, app, cb) {
  let list = app.getServersByType(msg.serverType);
  if (!list || !list.length) {
    cb(new Error('can not find server info for type:' + msg.serverType));
    return;
  }

  let uid = session ? (session.uid || '') : '';

  let index = 0;
  if( typeof(uid) === 'number' ){
		index = Math.abs(uid) % list.length;
	}else{
		index = Math.floor(Math.random()*100000) % list.length;
	}

  utils.invokeCallback(cb, null, list[index].id);
};
