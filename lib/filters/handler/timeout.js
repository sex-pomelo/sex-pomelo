"use strict";

/**
 * Filter for timeout.
 * Print a warn information when request timeout.
 * @access private
 */
const logger = require('@sex-pomelo/sex-pomelo-logger').getLogger('pomelo', __filename);
const utils = require('../../util/utils');

const DEFAULT_TIMEOUT = 3000;
const DEFAULT_SIZE = 500;

module.exports = function(timeout, maxSize) {
  return new FilterHandlerTimeout(timeout || DEFAULT_TIMEOUT, maxSize || DEFAULT_SIZE);
};

/** This filter is used for warning there is a timeout in handling a request. 
 * It will start a timer in its beforeFilter and clear it in its afterFilter. 
 * If afterFilter is called before the timer expiring, that means no timout occurs, 
 * the timer will be cleared in afterFilter. If the timer expires, but afterFilter is not yet called, 
 * that means a timeout occurs and a warning is thrown out and logged. The default timeout is 3 seconds, 
 * but you can configure it while loading it.
 * <br/>
 * 这个filter是用来对服务端处理超时进行警告的，在beforeFilter中会启动一个定时器，在afterFilter中清除。
 * 如果在其定时器时间内，afterFilter被调用，定时器将会被清除，因此不会出现超时警告。
 * 如果定时器超时时，afterFilter还没有执行到，则会引发超时警告,并记录日志。
 * 默认的处理超时是3秒，可以在加载timeout的时候作为参数传入。
 * 
 * 
 * @class
 * @implements {Filter}
 */
let FilterHandlerTimeout = function(timeout, maxSize) {
  this.timeout = timeout;
  this.maxSize = maxSize;
  this.timeouts = {};
  this.curId = 0;
};

FilterHandlerTimeout.prototype.before = function(msg, session, next) {
  let count = utils.size(this.timeouts);
  if(count > this.maxSize) {
    logger.warn('timeout filter is out of range, current size is %s, max size is %s', count, this.maxSize);
    next();
    return;
  }
  this.curId++;
  this.timeouts[this.curId] = setTimeout(function() {
    logger.error('request %j timeout.', msg.__route__);
  }, this.timeout);
  session.__timeout__ = this.curId;
  next();
};

FilterHandlerTimeout.prototype.after = function(err, msg, session, resp, next) {
  let timeout = this.timeouts[session.__timeout__];
  if(timeout) {
    clearTimeout(timeout);
    delete this.timeouts[session.__timeout__];
  }
  next(err);
};
