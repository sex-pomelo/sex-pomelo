'use strict';
const Redis = require('ioredis');
const commander = require('./common/cmd');
const constants = require('../util/constants');
const utils = require('../util/utils');
const logger = require('@sex-pomelo/sex-pomelo-logger').getLogger('pomelo', __filename);
const Process = require('process');

let g_preReg = constants.RESERVED.REDIS_REG_PREFIX;
let g_preRegRes = constants.RESERVED.REDIS_REG_RES_PREFIX;
let g_preRegSer = constants.RESERVED.REDIS_REG_SERVER_PREFIX;
let g_showMemInfo = false;
let Monitor = function(app, opts) {
  if(!(this instanceof Monitor)) {
    return new Monitor(app, opts);
  }

  this.tip = '[redisMonitor]'+ app.getServerId();
  this.app = app;
  this.name = opts.redisNodes.name || null;
  this.redisNodes = opts.redisNodes || [];
  this.period = opts.period || constants.TIME.DEFAULT_REDIS_REG;
  this.updateInfoPeriod = opts.updateInfoPeriod || constants.TIME.DEFAULT_REDIS_REG_UPDATE_INFO;
  this.updateInfoExpire = (opts.updateInfoExpire || 3.0*constants.TIME.DEFAULT_REDIS_REG_UPDATE_INFO)/1000;
  this.maxServerInfoBatch = opts.maxServerInfoBatch;
  this.expire = opts.expire || constants.TIME.DEFAULT_REDIS_EXPIRE;
  this.password = opts.password || null;
  this.redisOpts = opts.redisOpts || {};
  this.lastResults = {};
  this.rPre = opts.keyPre || 'sexp';

  this.stopState = {
      upTime:0,
      isStoping:false    
  };

  g_showMemInfo = opts.memInfo || false;
  g_preReg = this.rPre + "-reg:";
  g_preRegRes = this.rPre +"-reg-res:";
  g_preRegSer = this.rPre + "-ser:";
};

module.exports = Monitor;

Monitor.prototype.start = function(cb) {
  let self = this;
  self.started = false;
  if(this.redisNodes.nodes.length === 1) {
    let redisCfg = this.redisNodes.nodes[0];
    this.client = new Redis(redisCfg.port, redisCfg.host, this.redisOpts);
  } else {
    this.client = new Redis({
      sentinels: this.redisNodes.nodes,
      password: this.password,
      name: this.name,
    }, this.redisOpts);
  }

  this.client.on('connect', function() {
    logger.info(`${self.tip} connected to redis successfully !`);
    if(self.password) {
      self.client.auth(self.password);
    }

    // clear command
    let key = g_preReg + self.app.env + ':' + self.app.getServerId();
    self.client.del(key);

    // Initial registration and fetch other servers
    watcherUpdateServerInfo.call(self);
    watcherCluster2Command.call(self);

    if(!self.started) {
      self.started = true;
      self.updateInfoTimer = setInterval(watcherUpdateServerInfo.bind(self), self.updateInfoPeriod);
      self.timer = setInterval(watcherCluster2Command.bind(self), self.period);
      utils.invokeCallback(cb);
    }
  });

  this.client.on('error', function(error) {
      logger.error(`${self.tip} has errors with redis server, with error: ${error}`);
  });

  this.client.on('close', function() {
    logger.warn(`${self.tip} has been closed with redis server.`);
  });

  this.client.on('end', function() {
     logger.warn(`${self.tip} is over and without reconnection.`);
  });
};

Monitor.prototype.stop = function() {
  this.client.end();
  clearInterval(this.timer);
};

Monitor.prototype.sendCommandResult = function(result, type) {
  let key;
  if(!type){
    //send result to redis, key:
    key = g_preRegRes + this.app.env + ':' + this.app.getCurServer().id;
  } else {
    //send show info to redis, key:
    key = g_preRegRes + this.app.env + ':' + this.app.getCurServer().id + ':' + type;
  }

  this.client.set(key, result, function(err){
    if(err){
      logger.error('set %j err: %j', key, err);
    }
  });
};

let watcherUpdateServerInfo = function() {
  updateServerInfo(this, this.app, this.client, this.app.getCurServer());
};

let watcherCluster2Command = function() {
  getClusterInfo(this, this.app, this.client, this.app.getCurServer());
  getCommand(this, this.app, this.client, this.app.getCurServer());
};

let getClusterInfo = function(self, app, redis, serverInfo) {
  let results = {};
  let key = g_preReg + app.env;
  serverInfo.pid = process.pid;
  if( self.stopState.isStoping === false ){
    self.stopState.upTime = Date.now();
  }
  let args = [key, self.stopState.upTime+self.expire, serverInfo.id];

  (async ()=>{
    try{
      if( self.stopState.isStoping === false ){
        await redis.zadd(args);
      }
        
      let query_args = [key, Date.now(), '+inf','withscores'];
      ///////////
      let resSers = await redis.zrangebyscore(query_args);

      let missingServersKeys = [];
      for (let i = resSers.length - 1; i >= 0; i-=2) {
        // fetch any missing server
        let serverId = resSers[i-1];
        let lastServerInfo = self.lastResults[serverId]
        if (lastServerInfo) {
          results[serverId] = lastServerInfo;
        }
        else {
          missingServersKeys.push(g_preRegSer + app.env + ":" +serverId);
        }
      }
      if (missingServersKeys.length > 0) {
        // fetch missing servers info first
        if (self.maxServerInfoBatch) {
          missingServersKeys = missingServersKeys.slice(0, self.maxServerInfoBatch);
        }

        let missSers = await redis.mget(missingServersKeys);

        for (let i = missSers.length - 1; i >= 0; i--) {
          if (missSers[i]) {
            let server = JSON.parse(missSers[i]);
            results[server.id] = server;
          }
        }
        logger.debug('cluster servers info: %j',results);
        self.lastResults = results;
        app.replaceServers(results);
      }
      else {
        logger.debug('cluster servers info: %j',results);
        self.lastResults = results;
        app.replaceServers(results);
      }

      // check if,all server timer > self.expire *2,stop servers
      if( self.stopState.isStoping === true ){
          let canStop = true;
          let checkTime = self.expire * 2;
          let mySerID = self.app.getServerId();

          for (let i = resSers.length - 1; i >= 0; i-=2) {
            // fetch any missing server
            let serverId = resSers[i-1];
            let heartTime = resSers[i];
            if( serverId === mySerID ){
               continue;
            }

            if( (heartTime - self.stopState.upTime) < checkTime  ){
              canStop = false;
              break;
            }
          }

          if( (canStop === true) || (resSers.length === 0) ){
            commander.init(self,'{"command":"stop"}'); 
            let key = g_preReg + app.env + ':' + mySerID;
            await redis.del(key);
          }
      }

    }catch( err ){
      logger.error( `${self.tip} ${err}` );
    }

  })();
};

let updateServerInfo = function(self, app, redis, serverInfo) {
  let key = g_preRegSer + app.env + ":" +serverInfo.id;
  serverInfo.pid = process.pid;
  serverInfo.uptime = (process.uptime()/60).toFixed(2);
  if( g_showMemInfo === true ){
    let memUsage = Process.memoryUsage();
    let m1Size = 1024 * 1024;
    serverInfo.rss = parseFloat(memUsage.rss/m1Size).toFixed(2);
    serverInfo.heapTotal = parseFloat(memUsage.heapTotal/m1Size).toFixed(2);
    serverInfo.heapUsed = parseFloat(memUsage.heapUsed/m1Size).toFixed(2);
  }

  let args = [key, self.updateInfoExpire, JSON.stringify(serverInfo)];
  redis.setex(args, function(err, res) {
    if(err) {
      logger.error('setex %j err: %j', args, err);
      return;
    }
    //logger.debug('updated server info');
  });
}

let getCommand = function(self, app, redis, serverInfo) {
  let key = g_preReg + app.env + ':' + serverInfo.id;

  (async ()=>{
      try{
        let res = await redis.get(key);

        if( res ){
          logger.debug('get cmd: ', res);
          
          let cmd = JSON.parse( res );
          if( cmd.command === 'stop' ){
              self.stopState.isStoping = true;
          }else{
            await redis.del(key);
            commander.init(self, res); 
          }       
        }
      }catch(err){
        logger.error( `${self.tip} getCommand: ${err}` );
      }
  })();
};



