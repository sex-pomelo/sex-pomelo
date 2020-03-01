"use strict";

/**
 * Filter for rpc log.
 * Reject rpc request when toobusy
 * @access private
 */
const rpcLogger = require('@sex-pomelo/sex-pomelo-logger').getLogger('rpc-log', __filename);
let toobusy = null;

const DEFAULT_MAXLAG = 70;

module.exports = function(maxLag) {
  return new FilterToobusy(maxLag || DEFAULT_MAXLAG);
};

/**
 * @class
 * @implements {Filter}
 */
let FilterToobusy = function(maxLag) {
  try {
    toobusy = require('toobusy');
  } catch(e) {
  }
  if(!!toobusy) {
    toobusy.maxLag(maxLag);
  }
};

FilterToobusy.prototype.name = 'toobusy';

/**
 * Before filter for rpc
 */
FilterToobusy.prototype.before = function(serverId, msg, opts, next) {
  opts = opts||{};
  if (!!toobusy && toobusy()) {
    rpcLogger.warn('Server too busy for rpc request, serverId:' + serverId + ' msg: ' + msg);
    var err =  new Error('Backend server ' + serverId + ' is too busy now!');
    err.code = 500;
    next(err);
  } else {
    next();
  }
};
