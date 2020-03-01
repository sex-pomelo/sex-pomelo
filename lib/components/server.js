"use strict";

/**
 * @file Component for server starup.
 */
const Server = require('../server/server');
const BaseComp = require('../../base/base_component');

/**
 * @typedef {import('../application').Application} Application
 */

/**
 * Server component class
 * @typedef {ServerComp}
 */


/**
 * @class
 * @implements {Component}
 */
class ServerComp extends BaseComp{
	/**
	 * 
	 * @param {Application} app 
	 * @param {object} opts 
	 */
	constructor(app, opts){
		super(app,opts);
		this.name = '__server__';
		this.server = Server.create(app, opts);
	}

/**
 * Component lifecycle callback
 *
 * @param {Function} cb
 * @return {Void}
 */
	start (cb) {
	this.server.start();
	process.nextTick(cb);
	}

/**
 * Component lifecycle callback
 *
 * @param {Function} cb
 * @return {Void}
 */
	afterStart(cb) {
	this.server.afterStart();
	process.nextTick(cb);
	}

/**
 * Component lifecycle function
 *
 * @param {Boolean}  force whether stop the component immediately
 * @param {Function}  cb
 * @return {Void}
 */
	stop(force, cb) {
	this.server.stop();
	process.nextTick(cb);
	}

/**
 * Proxy server handle
 */
	handle (msg, session, cb) {
	this.server.handle(msg, session, cb);
	}

/**
 * Proxy server global handle
 */
	globalHandle(msg, session, cb) {
	this.server.globalHandle(msg, session, cb);
	}
}

/**
 * Component factory function
 *
 * @param {Application} app  current application context
 * @return {Object}     component instance
 */
module.exports = function(app, opts) {
	return new ServerComp(app, opts);
};





