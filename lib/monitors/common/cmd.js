'use strict';

const logger = require('@sex-pomelo/sex-pomelo-logger').getLogger('pomelo', __filename);
const constants = require('../../util/constants');
let Command = module.exports;
const vm = require('vm');
const util = require('util');
const Process = require('process');
const execT = require('child_process').exec;

Command.init = function(client, data) {
  logger.debug('server: %s receive command, with data: %j', client.app.serverId, data);
  if(!data) {
    logger.warn('server: %s command data is null.', client.app.serverId);
    return;
  }
  data = JSON.parse(data);
  switch(data.command) {
    case 'stop':
      stop(client);
      break;
    case 'kill':
      kill(client);
      break;
    case 'addCron':
      addCron(client, data);
      break;
    case 'removeCron':
      removeCron(client, data);
      break;
    case 'blacklist':
      addBlacklist(client, data);
      break;
    case 'set':
      set(client, data);
      break;
    case 'get':
      get(client, data);
      break;
    case 'enable':
      enable(client, data);
      break;
    case 'disable':
      disable(client, data);
      break;
    case 'run':
      run(client, data);
      break;
    case 'exec':
      exec(client, data);
      break;
    case 'show':
      show(client,data);
      break;
    default:
      logger.debug('server: %s receive unknown command, with data: %j', client.app.serverId, data);
      break;
}
};

let stop = function(client) {
  logger.info('server : %s is stopped', client.app.serverId);
  client.app.set(constants.RESERVED.STOP_FLAG, true);
  client.app.stop();
};

let kill = function(client) {
  logger.info('server: %s is forced killed.', client.app.serverId);
  process.exit(0);
};

let addCron = function(client, msg) {
  logger.info('addCron %s to server %s', msg.cron, client.app.serverId);
  client.app.addCrons([msg.cron]);
};

let removeCron = function(client, msg) {
  logger.info('removeCron %s to server %s', msg.cron, client.app.serverId);
  client.app.removeCrons([msg.cron]);
};

let addBlacklist = function(client, msg) {
  if(client.app.isFrontend()) {
    logger.info('addBlacklist %s to server %s', msg.blacklist, client.app.serverId);
    let connector = client.app.components.__connector__;
    connector.blacklist = connector.blacklist.concat(msg.blacklist);
  }
};

let set = function(client, msg) {
  let key = msg.param['key'];
  let value = msg.param['value'];
  logger.info('set %s to value %s in server %s', key, value, client.app.serverId);
  client.app.set(key, value);
};

let get = function(client, msg) {
  let value = client.app.get(msg.param);
  if (!checkJSON(value)) {
        value = 'object';
  }

  logger.info('get %s the value is %s in server %s', msg.param, value, client.app.serverId);
  if (!value) value = 'undefined';
  client.sendCommandResult(value);
};

let enable = function(client, msg) {
  logger.info('enable %s in server %s', msg.param, client.app.serverId);
  client.app.enable(msg.param);
};

let disable = function(client, msg) {
  logger.info('disable %s in server %s', msg.param, client.app.serverId);
  client.app.disable(msg.param);
};

let run = function(client, msg) {
  let ctx = {
    app: client.app,
    result: null
  };
  try {
    vm.runInNewContext('result = ' + msg.param, ctx, 'myApp.vm');
    logger.info('run %s in server %s with result %s', msg.param, client.app.serverId, util.inspect(ctx.result));
    client.sendCommandResult(util.inspect(ctx.result));
  } catch(e) {
    logger.error('run %s in server %s with err %s', msg.param, client.app.serverId, e.toString());
    client.sendCommandResult(e.toString());
  }
};

let exec = function(client, msg) {
  let context = {
    app: client.app,
    require: require,
    os: require('os'),
    fs: require('fs'),
    process: process,
    util: util
  };
  try {
    vm.runInNewContext(msg.script, context);
    logger.info('exec %s in server %s with result %s', msg.script, client.app.serverId, context.result);
    let result = context.result;
    if (!result) {
      client.sendCommandResult("script result should be assigned to result value to script module context");
    } else {
      client.sendCommandResult(result.toString());
    }
  } catch (e) {
    logger.error('exec %s in server %s with err %s', msg.script, client.app.serverId, e.toString());
    client.sendCommandResult(e.toString());
  }
};

let show = function(client,data) {
  let result = {};

  if( data.param === 'connections' ){
    result.connectionInfo = getConnectionInfo(client);
  }else if( data.param === "proxy" ){
    result.proxyInfo = getProxyInfo(client);
  }else if( data.param === "handler" ){
    result.handlerInfo = getHandlerInfo(client);
  }else if( data.param === "components" ){
    result.componentInfo  = getComponentInfo(client);
  }else if( data.param === "settings" ){
    result.settingInfo = getSettingInfo(client);
  }else if( data.param === "status" ){ 
    getStatus(client,(err,data1)=>{
      if( !!err ){
        let result = { "err":err };
        client.sendCommandResult(JSON.stringify(result)); 
      }else{
        let result = { "statusInfo":data1 };
        client.sendCommandResult(JSON.stringify(result));        
      }
    });
  }

  if( data.param !== "status" ){
    client.sendCommandResult(JSON.stringify(result));
  }
};

let getConnectionInfo = function(client) {
  let connectionInfo = {};
  let connection = client.app.components.__connection__;
  connectionInfo.serverId = client.app.serverId;
  
  if (connection) {
    connectionInfo.connectionInfo = connection.getStatisticsInfo();
  } else {
    connectionInfo.connectionInfo = 'no connection';
  }
  return connectionInfo;
};

let getProxyInfo = function(client) {
  let proxyInfo = {};
  let __proxy__ = client.app.components.__proxy__;
  if (__proxy__ && __proxy__.client && __proxy__.client.proxies.user) {
    let proxies = __proxy__.client.proxies.user;
    let server = client.app.getServerById(client.app.serverId);
    if (!server) {
      logger.error('no server with this id ' + client.app.serverId);
    } else {
      let type = server['serverType'];
      let tmp = proxies[type];
      proxyInfo[type] = {};
      for (let _proxy in tmp) {
        let r = tmp[_proxy];
        proxyInfo[type][_proxy] = {};
        for (let _rpc in r) {
          if (typeof r[_rpc] === 'function') {
            proxyInfo[type][_proxy][_rpc] = 'function';
          }
        }
      }
    }
  } else {
    proxyInfo = 'no proxy loaded';
  }
  return proxyInfo;
};

let getHandlerInfo = function(client) {
  let handlerInfo = {};
  let __server__ = client.app.components.__server__;
  if (__server__ && __server__.server && __server__.server.handlerService.handlerMap) {
    let handles = __server__.server.handlerService.handlerMap;
    let server = client.app.getServerById(client.app.serverId);
    if (!server) {
      logger.error('no server with this id ' + client.app.serverId);
    } else {
      let type = server['serverType'];
      let tmp = handles;
      handlerInfo[type] = {};
      for (let _p in tmp) {
        let r = tmp[_p];
        handlerInfo[type][_p] = {};
        for (let _r in r) {
          let g = r[_r];
          for(let _g in g) {
            if (typeof g[_g] === 'function') {
              handlerInfo[type][_p][_g] = 'function';
            }
          }
        }
      }
    }
  } else {
    handlerInfo = 'no handler loaded';
  }
  return handlerInfo;
};

let getComponentInfo = function(client) {
  let _components = client.app.components;
  let res = {};
  for (let key in _components) {
    let name = getComponentName(key);
    res[name] = clone(name, client.app.get(name + 'Config'));
  }
  return res;
};

let getSettingInfo = function(client) {
  let _settings = client.app.settings;
  let res = {};
  for (let key in _settings) {
    if (key.match(/^__\w+__$/) || key.match(/\w+Config$/)) {
      continue;
    }
    if (!checkJSON(_settings[key])) {
      res[key] = 'Object';
      continue;
    }
    res[key] = _settings[key];
  }
  return res;
};

let getStatus = function(client,callback) {
  if (process.platform === 'win32') {
    cb( "not support win32",null );
    return;
  }
  let pid = Process.pid;
  let param = {
    serverId: client.app.serverId,
    serverType:client.app.serverType,
    pid: pid
  };
  let cmd = "ps auxw | grep " + pid + " | grep -v 'grep'";
	//let cmd = "ps auxw | grep -E '.+?\\s+" + pid + "\\s+'"  ;
	execT(cmd, function(err, output) {
		if (!!err) {
			if (err.code === 1) {
				console.log('the content is null!');
			} else {
				console.error('getPsInfo failed! ' + err.stack);
			}
			callback(err, null);
			return;
		} 
    format(param, output, callback);
	});
};

function clone(param, obj) {
  let result = {};
  let flag = 1;
  for (let key in obj) {
    if (typeof obj[key] === 'function' || typeof obj[key] === 'object') {
      continue;
    }
    flag = 0;
    result[key] = obj[key];
  }
  if (flag) {
    // return 'no ' + param + 'Config info';
  }
  return result;
};

function getComponentName(c) {
  let t = c.match(/^__(\w+)__$/);
  if (t) {
    t = t[1];
  }
  return t;
};

function checkJSON(obj) {
  if (!obj) {
    return true;
  }
  try {
    JSON.stringify(obj);
  } catch (e) {
    return false;
  }
  return true;
};

function formatTime(date) {
	let n = date.getFullYear(); 
	let y = date.getMonth() + 1;
	let r = date.getDate(); 
	let mytime = date.toLocaleTimeString(); 
	let mytimes = n+ "-" + y + "-" + r + " " + mytime;
  return mytimes;
}

/**
 * convert serverInfo to required format, and the callback will handle the serverInfo 
 *
 * @param {Object} param, contains serverId etc
 * @param {String} data, the output if the command 'ps'
 * @param {Function} cb
 * @api private
 */

function format(param, data, cb) {
	let time = formatTime(new Date());
	let outArray = data.toString().replace(/^\s+|\s+$/g,"").split(/\s+/);
	let outValueArray = [];
	for (let i = 0; i < outArray.length; i++) {
		if ((!isNaN(outArray[i]))) {
			outValueArray.push(outArray[i]);
		}
  }
	let ps = {};
	ps.time = time;
	ps.serverId = param.serverId;
	ps.serverType = param.serverType;
	let pid = ps.pid = param.pid;
	ps.cpuAvg = outValueArray[1];
	ps.memAvg = outValueArray[2];
	ps.vsz = outValueArray[3];
	ps.rss = outValueArray[4];
	outValueArray = [];
	if (process.platform === 'darwin') {
		ps.usr = 0;
		ps.sys = 0;
		ps.gue = 0;
		cb(null, ps);
		return;
	}
	execT('pidstat -p ' + pid, function(err, output) {
		if (!!err) {
			console.error('the command pidstat failed! ', err.stack);
			return;
		}
		let outArray = output.toString().replace(/^\s+|\s+$/g,"").split(/\s+/);
		for (let i = 0; i < outArray.length; i++) {
		  if ((!isNaN(outArray[i]))) {
				outValueArray.push(outArray[i]);
			}
		}
		ps.usr = outValueArray[1];
		ps.sys = outValueArray[2];
		ps.gue = outValueArray[3];

		cb(null, ps);
	});
};