"use strict";

/**
 * Filter for toobusy.
 * if the process is toobusy, just skip the new request
 * @access private
 */
const conLogger = require('@sex-pomelo/sex-pomelo-logger').getLogger('con-log', __filename);
let toobusy = null;
const DEFAULT_MAXLAG = 70;


module.exports = function(maxLag) {
  return new FilterHandlerTooBusy(maxLag || DEFAULT_MAXLAG);
};

/**
 * This filter is used to detected whether node.js event loop is busy or not. 
 * Once toobusy is triggered, then the filter toobusy will refuse sequential requests, 
 * and call next(err, resp) to pass err to error handler, indicating that server is too busy.
 * <br/>
 * 这个filter中，一旦检测到node.js中事件循环的请求等待队列过长，超过一个阀值时，就会触发toobusy。
 * 一旦触发了toobusy，那么toobusy的filter中将终止此请求处理链，并在next调用中，传递错误参数
 * 
 * @class
 * @implements {Filter}
 */
let FilterHandlerTooBusy = function(maxLag) {
  try {
    toobusy = require('toobusy');
  } catch(e) {
  }
  if(!!toobusy) {
    toobusy.maxLag(maxLag);
  }
};

FilterHandlerTooBusy.prototype.before = function(msg, session, next) {
  if (!!toobusy && toobusy()) {
    conLogger.warn('[toobusy] reject request msg: ' + msg);
    let err = new Error('Server toobusy!');
    err.code = 500;
    next(err);
  } else {
    next();
  }
};