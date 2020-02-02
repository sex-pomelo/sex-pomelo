
const GameHandler = require('@sex-pomelo/sex-pomelo/base').GameHandler;


class EntryHandler extends GameHandler{

	/** If you have some init ,you should do it here,
	   rember call super(app) first.
  */
	// constructor(app){
	// 	super(app);
	// }

 /**
 * New client entry.
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next step callback
 * @return {Void}
 */
	entry(msg, session, next) {
		let serID = this.app.serverId;
		next(null, {code: 200, msg: `game server is ok. [${serID}]`});
  }

/**
 * Publish route for mqtt connector.
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next step callback
 * @return {Void}
 */
	publish(msg, session, next) {
		var result = {
			topic: 'publish',
			payload: JSON.stringify({code: 200, msg: 'publish message is ok.'})
		};
		next(null, result);
	}

/**
 * Subscribe route for mqtt connector.
 *
 * @param  {Object}   msg     request message
 * @param  {Object}   session current session object
 * @param  {Function} next    next step callback
 * @return {Void}
 */
	subscribe(msg, session, next) {
		var result = {
			topic: 'subscribe',
			payload: JSON.stringify({code: 200, msg: 'subscribe message is ok.'})
		};
		next(null, result);
	}
}

module.exports = function(app) {
  return new EntryHandler(app);
};


