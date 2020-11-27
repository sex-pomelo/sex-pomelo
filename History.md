2.2.27 / 2020-11-27
=================
* Use clifflite replace cliff( node14 cliff has (**`warning`** ).
* connector add cfg `useAsyncSend`, if true async send data package.
* `new Buffer` change to `Buffer.from`,`Buffer.alloc` 
* update deps
  - sex-pomelo-protocol, Message encode performance improvement(Opt-in for performance and spec compliance `npm install --save @sex-pomelo/pomelo-coderx`)
* hybrifsocket/tcpsocket Performance improvement( packageHeadBuffer )


2.2.26 / 2020-09-28
=================
 **New features**
 * app.configure(...) add exclude type. If the server type string starts with ! At first, this configuration is used by all servers except type
	``` js
	app.configure('development', '!connector|gate', function(){
		// executed for development env and not connector，not gate server type
	});
	```
* Implement [App helper class](https://github.com/sex-pomelo/sex-pomelo/wiki/App-helper-Class). You can simplify the writing of app.js in a configuration way.
  - Configuration control load `plugin`,`configs`,`components`,`filters`,`route`.
  - Reduce unnecessary JS requires.
  - More developer-friendly.
  - Routing dynamic loading, [ **only load new serverType and route function** ].
``` js
const pomelo = require('@sex-pomelo/sex-pomelo');
const BaseApp = require('@sex-pomelo/sex-pomelo/base').BaseApp;


class MyApp extends BaseApp{
	constructor(){
		super( pomelo );
	}

	preLoadCfg(){
	}

	preStart(){
		const { app } = this;

		// app configure
		app.configure('production|development', function() {
			app.enable('systemMonitor');
		});
	}

	postStart() {

	}

};

new MyApp();
```
--- 
**Other Change**
 * fix test script error.
	- remove grunt dep, Direct use mocha command run test.
	- change `npm run test`, use `test.sh`, run all test script.
 * remove third library `async` dependence, use ES6 async replace
 * fix Distributed startup failure [#778](https://github.com/NetEase/pomelo/issues/778). `TypeError: Cannot read property 'get' of undefined`

2.2.25 / 2020-09-28
=================
 * log4js config file, first read it by env folder;
 * Add script to package.json( can run ```npm start``` )
	- npm start
	- npm stop
	- npm run dev


2.2.24 / 2020-09-24
=================
 * Application add function **getCfgPath** using,get config file by run env.
   ``` js
    let robPath = app.getCfgPath('robot.json');
    console.log( robPath);
     
    // output:
    // <app root>/config/robot.json             -- for production env
    // <app root>/config/development/robot.json -- for development env
   ```
 * Remove mkdirp dep.  use fs.mkdir replace
 * modify the Pomelo read configuration file, first read it by folder
 * Start Env non (development and production) , console process without exiting

2.2.18 / 2020-02-20
=================
 * Fix sshrun bug;

2.2.17 / 2020-02-15
=================
 * Fix connector.js loadInit err. 

2.2.16 / 2020-02-16
=================
 * use sex-pomelo-admin 1.0.5, now windows can enable systemInfo module

2.2.15 / 2020-01-29
=================
 * Increased development experience, more IntelliSense;
 * Can use es6 class write handler,remote,filter,component...
``` javascript
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
	};

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
	};
}

module.exports = function(app) {
  return new EntryHandler(app);
};
```


2.2.14 / 2020-01-25
=================
 * [#1150](https://github.com/NetEase/pomelo/pull/1150)

2.2.13 / 2019-12-23
=================
 * support node12



2.2.12 / 2019-08-22
=================
  * upgrade ws, sex-pomelo-admin
  * add IntelliSense ( pomelo.SexPomeloApplication )
```
const pomelo = require('@sex-pomelo/sex-pomelo');  ///// <----- add

module.exports = function(app) {
    return new Handler(app);
};

/**
 * 
 * @param {pomelo.SexPomeloApplication} app       ///// <----- add
 */
let Handler = function(app) {
  ....
}

```

2.2.11 / 2019-08-16
=================
  * upgrade log4js to 5.0.0 ( sex-pomelo-logger dep it)


2.2.10 / 2019-07-16
=================
  * Fix template error 


2.2.9 / 2018-12-09
=================
  * Suggest use **nodejs > 8.x**,maybe can use 4.x,6.x;
  * use sex-pomelo-logger(0.1.9) replace pomelo-logger
  * ***notice:*** The log4js.json format has change( see [log4js Configuration Change](https://log4js-node.github.io/log4js-node/migration-guide.html) ) . Because log4js issue, the appenders more than 12, there will be a warning.


2.2.7 / 2018-12-09
=================
  * Suggest use **nodejs > 8.x**,maybe can use 4.x,6.x;
  * use sex-pomelo-protocol(0.1.7) replace pomelo-protocol( message,package encode/decode 性能提升至少1倍)

2.2.6 / 2018-11-15
=================
  * mqtt update to 2.18.8
  * 使用 sex-pomelo-admin 替换 pomelo-admin ( mqtt-connection update to 4.0.0)
  * 使用 sex-pomelo-rpc 替换 pomelo-rpc ( mqtt-connection update to 4.0.0)
