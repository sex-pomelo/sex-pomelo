"use strict";

/**
 * Filter for rpc log.
 * Record used time for remote process call.
 * @access private
 */
const rpcLogger = require('@sex-pomelo/sex-pomelo-logger').getLogger('rpc-log', __filename);
const utils = require('../../util/utils');

module.exports = function() {
  return new FilterRpcLog();
};

/**
 * @class
 * @implements {Filter}
 */
let FilterRpcLog = function () {
}; 

FilterRpcLog.prototype.name = 'rpcLog';

/**
 * Before filter for rpc
 */

FilterRpcLog.prototype.before = function(serverId, msg, opts, next) {
  opts = opts||{};
  opts.__start_time__ = Date.now();
  next();
};

/**
 * After filter for rpc
 */
FilterRpcLog.prototype.after = function(serverId, msg, opts, next) {
  if(!!opts && !!opts.__start_time__) {
    let start = opts.__start_time__;
    let end = Date.now();
    let timeUsed = end - start;
    let log = {
      route: msg.service,
      args: msg.args,
      time: utils.format(new Date(start)),
      timeUsed: timeUsed
    };
    rpcLogger.info(JSON.stringify(log));
  }
  next();
};
