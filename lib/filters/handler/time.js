"use strict";

/**
 * Filter for statistics.
 * Record used time for each request.
 * @access private
 */
const conLogger = require('@sex-pomelo/sex-pomelo-logger').getLogger('con-log', __filename);
const utils = require('../../util/utils');

module.exports = function() {
  return new FilterHandlerTime();
};

/**
 * The filter is used to record handling time. In beforeFilter, it will record a timestamp,
 *  In afterFilter it will record a timestamp too. 
 * and then subtract two timestamps to get the handling time, and then log it.
 * <br/>
 * 这个filter使用来记录服务器处理时间的，在beforeFilter中会记录一下当前的时间戳，
 * 在afterFilter中再次获取当前的时间戳，然后两个时间戳相减，得到整个处理时间，然后记录日志。
 * 
 * @class
 * @implements {Filter}
 */
let FilterHandlerTime = function() {
};

FilterHandlerTime.prototype.before = function(msg, session, next) {
  session.__startTime__ = Date.now();
  next();
};

FilterHandlerTime.prototype.after = function(err, msg, session, resp, next) {
  let start = session.__startTime__;
  if(typeof start === 'number') {
    let timeUsed = Date.now() - start;
    let log = {
      route : msg.__route__,
      args : msg,
      time : utils.format(new Date(start)),
      timeUsed : timeUsed
    };
    conLogger.info(JSON.stringify(log));
  }
  next(err);
};
