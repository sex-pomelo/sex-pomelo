/// <reference types="node" />

/**
 * Channel
 */
export interface Channel
{
  /**
   * Add user to channel.
   *
   * @param {Number} uid user id
   * @param {String} sid frontend server id which user has connected to
   */
  add(uid:Number, sid:String);

  /**
   * Remove user from channel.
   *
   * @param {Number} uid user id
   * @param {String} sid frontend server id which user has connected to.
   * @return [Boolean] true if success or false if fail
   */
  leave(uid:Number, sid:String):Boolean;
  /**
   * Get channel UserAmount in a channel.

  *
  * @return {number } channel member amount
  */
  getUserAmount():Number;

  /**
   * Get channel members.
   *
   * <b>Notice:</b> Heavy operation.
   *
   * @return {Array} channel member uid list
   */
  getMembers():Array;

  /**
   * Get Member info.
   *
   * @param  {String} uid user id
   * @return {Object} member info
   */
  getMember(uid:String):Object ;

  /**
   * Destroy channel.
   */
  destroy();

  /**
   * Push message to all the members in the channel
   *
   * @param {String} route message route
   * @param {Object} msg message that would be sent to client
   * @param {Object} opts user-defined push options, optional
   * @param {Function} cb callback function
   */
  pushMessage(route:String, msg:Object, opts:Object, cb:Function);

}

/**
 * ChannelService
 */
export interface ChannelService
{
  /**
   * Create channel with name.
   *
   * @param {String} name channel's name
   */
  createChannel(name:String);


  /**
   * Get channel by name.
   *
   * @param {String} name channel's name
   * @param {Boolean} create if true, create channel
   * @return {Channel}
   * @memberOf ChannelService
   */
  getChannel(name:String, create:Boolean):Channel;



  /**
   * Destroy channel by name.
   *
   * @param {String} name channel name
   * @memberOf ChannelService
   */
  destroyChannel(name:String);

  /**
   * Push message by uids.
   * Group the uids by group. ignore any uid if sid not specified.
   *
   * @param {String} route message route
   * @param {Object} msg message that would be sent to client
   * @param {Array} uids the receiver info list, [{uid: userId, sid: frontendServerId}]
   * @param {Object} opts user-defined push options, optional 
   * @param {Function} cb cb(err)
   * @memberOf ChannelService
   */
  pushMessageByUids(route:String, msg:Object, uids:Array, opts:Object, cb:Function):void;

  /**
   * Broadcast message to all the connected clients.
   *
   * @param  {String}   stype      frontend server type string
   * @param  {String}   route      route string
   * @param  {Object}   msg        message
   * @param  {Object}   opts       user-defined broadcast options, optional
   *                               opts.binded: push to binded sessions or all the sessions
   *                               opts.filterParam: parameters for broadcast filter.
   * @param  {Function} cb         callback
   * @memberOf ChannelService
   */
  broadcast(stype:String, route:String, msg:Object, opts:Object, cb:Function);

}