"use strict";

const fs = require('fs');
const utils = require('../../util/utils');
const Loader = require('pomelo-loader');
const pathUtil = require('../../util/pathUtil');
const logger = require('@sex-pomelo/sex-pomelo-logger').getLogger('pomelo', __filename);
const forwardLogger = require('@sex-pomelo/sex-pomelo-logger').getLogger('forward-log', __filename);
const Application = require('../../application');


class HandlerService{

  /**
   * Handler service.
   * Dispatch request to the relactive handler.
   *
   * @param {Application} app      current application context
   * @param {object} opts
   */
  constructor(app, opts){
    this.name = 'handler';
    this.app = app;
    this.handlerMap = {};
    if(!!opts.reloadHandlers) {
      watchHandlers(app, this.handlerMap);
    }

    this.enableForwardLog = opts.enableForwardLog || false;

    let autoStart = app.get('yz_autoStartHandler');//lifecycle::beforeStartup yz_autoStartHandler
    if( autoStart ===true){
      loadHandlers(this.app, app.getServerType(),this.handlerMap);
    }
  }

  /**
   * Handler the request.
   */
  handle(routeRecord, msg, session, cb) {
    // the request should be processed by current server
    let handler = this.getHandler(routeRecord);
    if(!handler) {
      logger.error('[handleManager]: fail to find handler for %j', msg.__route__);
      utils.invokeCallback(cb, new Error('fail to find handler for ' + msg.__route__));
      return;
    }
    let start = Date.now();
    let self = this;

    let callback = function(err, resp, opts) {
      if(self.enableForwardLog) {
        let log = {
          route : msg.__route__,
          args : msg,
          time : utils.format(new Date(start)),
          timeUsed : new Date() - start
        };
        forwardLogger.info(JSON.stringify(log));
      }

      // resp = getResp(arguments);
      utils.invokeCallback(cb, err, resp, opts);
    }

    let method = routeRecord.method;

    if(!Array.isArray(msg)) {
      handler[method](msg, session, callback);
    } else {
      msg.push(session);
      msg.push(callback);
      handler[method].apply(handler, msg);
    }
    return;
  }

  /**
   * Get handler instance by routeRecord.
   *
   * @param  {Object} handlers    handler map
   * @param  {Object} routeRecord route record parsed from route string
   * @return {Object}             handler instance if any matchs or null for match fail
   */
  getHandler(routeRecord) {
    let serverType = routeRecord.serverType;
    if(!this.handlerMap[serverType]) {
      loadHandlers(this.app, serverType, this.handlerMap);
    }

    let handlers = this.handlerMap[serverType] || {};
    let handler = handlers[routeRecord.handler];
    if(!handler) {
      logger.warn('could not find handler for routeRecord: %j', routeRecord);
      return null;
    }
    if(typeof handler[routeRecord.method] !== 'function') {
      logger.warn('could not find the method %s in handler: %s', routeRecord.method, routeRecord.handler);
      return null;
    }
    return handler;
  };
}


module.exports = HandlerService;


/**
 * Load handlers from current application
 */
let loadHandlers = function(app, serverType, handlerMap) {
  let p = pathUtil.getHandlerPath(app.getBase(), serverType);
  if(p) {
    handlerMap[serverType] = Loader.load(p, app);
  }
};

let watchHandlers = function(app, handlerMap) {
  let p = pathUtil.getHandlerPath(app.getBase(), app.serverType);
  if (!!p){
    fs.watch(p, function(event, name) {
      if(event === 'change') {
        handlerMap[app.serverType] = Loader.load(p, app);
      }
    });
  }
};

let getResp = function(args) {
  let len = args.length;
  if(len == 1) {
    return [];
  }

  if(len == 2) {
    return [args[1]];
  }

  if(len == 3) {
    return [args[1], args[2]];
  }

  if(len == 4) {
    return [args[1], args[2], args[3]];
  }

  let r = new Array(len);
  for (let i = 1; i < len; i++) {
    r[i] = args[i];
  }

  return r;
}