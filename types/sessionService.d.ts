/// <reference types="node" />

export interface FrontendSession{
  bind(uid, cb);
  
  unbind(uid, cb);
  
  set(key, value);
  
  get(key);
  
  push(key, cb);
  
  pushAll(cb);
  
  on(event, listener);
  
  /**
   * Export the key/values for serialization.
   *
   * @api private
   */
  export();
}


export interface Session
{
  /*
  * Export current session as frontend session.
  */
  toFrontendSession():FrontendSession;

  /**
   * Bind the session with the the uid.
   *
   * @param {Number} uid User id
   * @api public
   */
  bind(uid:Number);

  /**
   * Unbind the session with the the uid.
   *
   * @param {Number} uid User id
   * @api private
   */
  unbind(uid:Number);

  /**
   * Set values (one or many) for the session.
   *
   * @param {String|Object} key session key
   * @param {Object} value session value
   * @api public
   */
  set(key:String|Object, value:Object);

  /**
   * Remove value from the session.
   *
   * @param {String} key session key
   * @api public
   */
  remove(key:String);

  /**
   * Get value from the session.
   *
   * @param {String} key session key
   * @return {Object} value associated with session key
   * @api public
   */
  get(key:String):Object;

  /**
   * Send message to the session.
   *
   * @param  {Object} msg final message sent to client
   */
  send(msg:Object);

  /**
   * Send message to the session in batch.
   *
   * @param  {Array} msgs list of message
   */
  sendBatch(msgs:Array);

  /**
   * Closed callback for the session which would disconnect client in next tick.
   *
   * @api public
   */
  closed(reason);
}

export interface SessionService
{
  /**
   * Create and return internal session.
   *
   * @param {Integer} sid uniqe id for the internal session 
   * @param {String} frontendId frontend server in which the internal session is created 
   * @param {Object} socket the underlying socket would be held by the internal session  
   *
   * @return {Session}
   *
   * @memberOf SessionService
   * @api private
   */
  create(sid:Integer, frontendId:String, socket:Object):Session;

  /**
   * Bind the session with a user id.
   *
   * @param {Integer} sid uniqe id for the internal session 
   * @param {Integer} uid uid 
   * @param {Function} cb callback 
   * @memberOf SessionService
   * @api private
   */
  bind(sid:Integer, uid:Integer, cb:Function);

  /**
   * Unbind a session with the user id.
   * @param {Integer} sid uniqe id for the internal session 
   * @param {Integer} uid uid 
   * @param {Function} cb callback 
   * @memberOf SessionService
   * @api private
   */
  unbind(sid, uid, cb);

  /**
   * Get session by id.
   *
   * @param {Integer} sid uniqe id for the internal session 
   * @return {Session}
   *
   * @memberOf SessionService
   * @api private
   */
  get(sid:Number):Session;


  /**
   * Get sessions by userId.
   *
   * @param {Number} uid User id associated with the session
   * @return {Array} list of session binded with the uid

  */
  getByUid(uid:Number):Array;


  /**
   * Remove session by key.
   *
   * @param {Number} sid The session id
   *
   * @memberOf SessionService
   * @api private
   */
  remove(sid:Number);

  /**
   * Import the key/value into session.
   *
   * @api private
   */
  import(sid, key, value, cb);

  /**
   * Import new value for the existed session.
   *
   * @memberOf SessionService
   * @api private
   */
  importAll(sid, settings, cb);

  /**
   * Kick all the session offline under the user id.
   *
   * @param {Number}   uid user id asscociated with the session
   * @param {Function} cb  callback function
   *
   * @memberOf SessionService
   */
  kick(uid:Number, reason?:Object, cb:Function);

  /**
   * Kick a user offline by session id.
   *
   * @param {Number}   sid session id
   * @param {Function} cb  callback function
   *
   * @memberOf SessionService
   */
  kickBySessionId(uid:Number, reason?:Object, cb:Function);

  /**
   * Get client remote address by session id.
   *
   * @param {Number}   sid session id
   * @return {Object} remote address of client
   *
   * @memberOf SessionService
   */
    getClientAddressBySessionId(sid:Number):Object;

  /**
   * Send message to the client by session id.
   *
   * @param {String} sid session id
   * @param {Object} msg message to send
   *
   * @memberOf SessionService
   * @api private
   */
  sendMessage(sid:String, msg:Object);

  /**
   * Send message to the client by user id.
   *
   * @param {String} uid userId
   * @param {Object} msg message to send
   *
   * @memberOf SessionService
   * @api private
   */
  sendMessageByUid(uid:String, msg:Object);

  /**
   * Iterate all the session in the session service.
   *
   * @param  {Function} cb callback function to fetch session
   * @api private
   */
  forEachSession(cb:Function);

  /**
   * Iterate all the binded session in the session service.
   *
   * @param  {Function} cb callback function to fetch session
   * @api private
   */
  forEachBindedSession(cb:Function);

  /**
   * Get sessions' quantity in specified server.
   *
   */
  getSessionsCount():Number;
}