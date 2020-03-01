"use strict";

/**
 * Filter to keep request sequence.
 * @access private
 */
const logger = require('@sex-pomelo/sex-pomelo-logger').getLogger('pomelo', __filename);
const taskManager = require('../../common/manager/taskManager');

module.exports = function(timeout) {
  return new FilterHandlerSerial(timeout);
};

/**
 * @class
 * @implements {Filter}
 */
let FilterHandlerSerial = function(timeout) {
  this.timeout = timeout;
};

/**
 * request serialization after filter
 */
FilterHandlerSerial.prototype.before = function(msg, session, next) {
  taskManager.addTask(session.id, function(task) {
    session.__serialTask__ = task;
    next();
  }, function() {
    logger.error('[serial filter] msg timeout, msg:' + JSON.stringify(msg));
  }, this.timeout);
};

/**
 * request serialization after filter
 */
FilterHandlerSerial.prototype.after = function(err, msg, session, resp, next) {
  let task = session.__serialTask__;
  if(task) {
    if(!task.done() && !err) {
      err = new Error('task time out. msg:' + JSON.stringify(msg));
    }
  }
  next(err);
};
