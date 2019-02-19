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
let g_uptime = (new Date()).valueOf();
let g_showMemInfo = false;
let Monitor = function(app, opts) {
  if(!(this instanceof Monitor)) {
    return new Monitor(app, opts);
  }

  this.app = app;
  this.name = opts.name || null;
  this.redisNodes = opts.redisNodes || [];
  this.period = opts.period || constants.TIME.DEFAULT_REDIS_REG;
  this.updateInfoPeriod = opts.updateInfoPeriod || constants.TIME.DEFAULT_REDIS_REG_UPDATE_INFO;
  this.updateInfoExpire = (opts.updateInfoExpire || 3.0*constants.TIME.DEFAULT_REDIS_REG_UPDATE_INFO)/1000;
  this.maxServerInfoBatch = opts.maxServerInfoBatch;
  this.expire = opts.expire || constants.TIME.DEFAULT_REDIS_EXPIRE;
  this.password = opts.password || null;
  this.redisOpts = opts.redisOpts || {};
  this.lastResults = {};
  this.rPre = opts.keyPre || 'pomelo';
  g_showMemInfo = opts.memInfo || false;
  g_preReg = this.rPre + "-reg:";
  g_preRegRes = this.rPre +"-reg-res:";
  g_preRegSer = this.rPre + "-ser:";
};

module.exports = Monitor;

Monitor.prototype.start = function(cb) {
  let self = this;
  self.started = false;
  if(this.redisNodes.redis.length === 1) {
    let redisCfg = this.redisNodes.redis[0];
    this.client = new Redis(redisCfg.port, redisCfg.host, this.redisOpts);
  } else {
    this.client = new Redis({
      sentinels: this.redisNodes.redis,
      password: this.password,
      name: this.name,
    }, this.redisOpts);
  }

  this.client.on('connect', function() {
    logger.info('[redisMonitor] %s connected to redis successfully !', self.app.serverId);
    if(self.password) {
      self.client.auth(self.password);
    }
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
      logger.error("[redisMonitor] %s has errors with redis server, with error: %j",self.app.getServerId(), error);
  });

  this.client.on('close', function() {
    logger.warn(`[redisMonitor] ${self.app.getServerId()} has been closed with redis server.`);
  });

  this.client.on('end', function() {
     logger.warn(`[redisMonitor] ${self.app.getServerId()} is over and without reconnection.`);
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
  let args = [key, Date.now() + self.expire, serverInfo.id];

  redis.zadd(args, function(err, res) {
    if(err) {
      logger.error('zadd %j err: %j', args, err);
      return;
    }

    let query_args = [key, Date.now(), '+inf'];
    redis.zrangebyscore(query_args, function(err, res) {
      if(err) {
        logger.error('zrangebyscore %j err: %j', query_args, err);
        return;
      }
      let missingServersKeys = [];
      for (let i = res.length - 1; i >= 0; i--) {
        // fetch any missing server
        let serverId = res[i];
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
        redis.mget(missingServersKeys, function(err, res) {
          if(err) {
            logger.error('mget %j err: %j', query_args, err);
            return;
          }
          for (let i = res.length - 1; i >= 0; i--) {
            if (res[i]) {
              let server = JSON.parse(res[i]);
              results[server.id] = server;
            }
          }
          logger.debug('cluster servers info: %j',results);
          self.lastResults = results;
          app.replaceServers(results);
        });
      }
      else {
        logger.debug('cluster servers info: %j',results);
        self.lastResults = results;
        app.replaceServers(results);
      }
    });
  });
};

let updateServerInfo = function(self, app, redis, serverInfo) {
  let key = g_preRegSer + app.env + ":" +serverInfo.id;
  serverInfo.pid = process.pid;
  serverInfo.uptime = g_uptime;
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
    logger.debug('updated server info');
  });
}

let getCommand = function(self, app, redis, serverInfo) {
  let key = g_preReg + app.env + ':' + serverInfo.id;
  redis.get(key, function(err, res) {
    if(err) {
      logger.error('get pomelo-regist cmd err %j', err);
      return;
    }

    if(res) {
      logger.debug('get cmd: ', res);
      redis.del(key, function(err) {
        if(err) {
          logger.error('del command err %j', err);
        }else {
          commander.init(self, res);
        }
      });
    }
  });
};



