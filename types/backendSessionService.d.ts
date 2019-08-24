/// <reference types="node" />


export interface BackendSession{
  /**
   * Bind current session with the user id. It would push the uid to frontend
   * server and bind  uid to the frontend internal session.
   *
   * @param  {Number|String}   uid user id
   * @param  {Function} cb  callback function
   *
   * @memberOf BackendSession
   */
  bind(uid:String|Number, cb:Function);

  /**
   * Unbind current session with the user id. It would push the uid to frontend
   * server and unbind uid from the frontend internal session.
   *
   * @param  {Number|String}   uid user id
   * @param  {Function} cb  callback function
   *
   * @memberOf BackendSession
   */
  unbind(uid:String|Number, cb:Function);

  /**
   * Set the key/value into backend session.
   *
   * @param {String} key   key
   * @param {Object} value value
   */
  set(key:String, value:Object);

  /**
   * Get the value from backend session by key.
   *
   * @param  {String} key key
   * @return {Object}     value
   */
  get(key:String):Object;

  /**
   * Push the key/value in backend session to the front internal session.
   *
   * @param  {String}   key key
   * @param  {Function} cb  callback function
   */
  push(key:String, cb:Function);

  /**
   * Push all the key/values in backend session to the frontend internal session.
   *
   * @param  {Function} cb callback function
   */
  pushAll(cb:Function);

  /**
   * Export the key/values for serialization.
   *
   * @api private
   */
  export();
}



export interface BackendSessionService{

  /**
   * Get backend session by frontend server id and session id.
   *
   * @param  {String}   frontendId frontend server id that session attached
   * @param  {String}   sid        session id
   * @param  {Function} cb         callback function. args: cb(err, BackendSession)
   *
   * @memberOf BackendSessionService
   */
  get(frontendId:String, sid:String, cb:Function):void;
  
  /**
   * Get backend sessions by frontend server id and user id.
   *
   * @param  {String}   frontendId frontend server id that session attached
   * @param  {String}   uid        user id binded with the session
   * @param  {Function} cb         callback function. args: cb(err, BackendSessions)
   *
   * @memberOf BackendSessionService
   */
  getByUid(frontendId:String, uid:String, cb:Function):void;
  
  /**
   * Kick a session by session id.
   *
   * @param  {String}   frontendId cooperating frontend server id
   * @param  {Number}   sid        session id
   * @param  {Function} cb         callback function
   *
   * @memberOf BackendSessionService
   */
  kickBySid(frontendId:String, sid:Number, reason:String, cb:Function);
  
  /**
   * Kick sessions by user id.
   *
   * @param  {String}          frontendId cooperating frontend server id
   * @param  {Number|String}   uid        user id
   * @param  {String}          reason     kick reason
   * @param  {Function}        cb         callback function
   *
   * @memberOf BackendSessionService
   */
  kickByUid(frontendId:String, uid:Number|String, reason:String, cb:Function);
  
  /**
   * Bind the session with the specified user id. It would finally invoke the
   * the sessionService.bind in the cooperating frontend server.
   *
   * @param  {String}   frontendId cooperating frontend server id
   * @param  {Number}   sid        session id
   * @param  {String}   uid        user id
   * @param  {Function} cb         callback function
   *
   * @memberOf BackendSessionService
   * @api private
   */
  bind(frontendId:String, sid:Number, uid:String, cb:Function);
  
  /**
   * Unbind the session with the specified user id. It would finally invoke the
   * the sessionService.unbind in the cooperating frontend server.
   *
   * @param  {String}   frontendId cooperating frontend server id
   * @param  {Number}   sid        session id
   * @param  {String}   uid        user id
   * @param  {Function} cb         callback function
   *
   * @memberOf BackendSessionService
   * @api private
   */
  unbind(frontendId:String, sid:Number, uid:String, cb:Function);
  
  /**
   * Push the specified customized change to the frontend internal session.
   *
   * @param  {String}   frontendId cooperating frontend server id
   * @param  {Number}   sid        session id
   * @param  {String}   key        key in session that should be push
   * @param  {Object}   value      value in session, primitive js object
   * @param  {Function} cb         callback function
   *
   * @memberOf BackendSessionService
   * @api private
   */
  push(frontendId:String, sid:Number, key:String, value:Object, cb:Function);
  
  /**
   * Push all the customized changes to the frontend internal session.
   *
   * @param  {String}   frontendId cooperating frontend server id
   * @param  {Number}   sid        session id
   * @param  {Object}   settings   key/values in session that should be push
   * @param  {Function} cb         callback function
   *
   * @memberOf BackendSessionService
   * @api private
   */
  pushAll(frontendId:String, sid:Number, settings:Object, cb:Function);
}