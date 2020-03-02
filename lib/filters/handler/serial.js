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
 * This filter is used to do serialization of user requests, and it can make requestes from 
 * a certain session to be handled one by one in the same order as their being sent. It uses 
 * a serial taskManager, when a request comes in, in the beforeFilter, it will put the request into taskManager with session.id as key,
 * taskManager maintains a map <SessionId, taskQueue> for all session.
 * In the corresponding afterFilter, if there is a pending request in its taskManager,
 * it will be handled. As so, it implements the task serialization.
 * <br/>
 * 这个filter是用来对用户请求做串行化的，可以使得用户的请求只有在第一个请求被处理完后，才会处理第二个请求。
 * serial中使用了一个taskManager，当用户请求到来时，在beforeFilter中，将用户的请求放到taskManager中，
 * taskManager中维护着一个task队列。在对应的afterFilter中，如果taskManager还有未处理的请求，将会处理其请求，
 * 即在一个请求的afterFilter里启动在taskManager中还没处理的下一个请求，这样就实现了请求的序列化。
 * 
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
