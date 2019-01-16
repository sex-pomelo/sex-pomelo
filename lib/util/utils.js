"use strict";

const os = require('os');
const util = require('util');
const exec = require('child_process').exec;
const logger = require('@sex-pomelo/sex-pomelo-logger').getLogger('pomelo', __filename);
const Constants = require('./constants');
const pomelo = require('../pomelo');

let utils = module.exports;

/**
 * Invoke callback with check
 */
utils.invokeCallback = function(cb) {
  if (typeof cb === 'function') {
    let len = arguments.length;
    if(len == 1) {
      return cb();
    }

    if(len == 2) {
      return cb(arguments[1]);
    }

    if(len == 3) {
      return cb(arguments[1], arguments[2]);
    }

    if(len == 4) {
      return cb(arguments[1], arguments[2], arguments[3]);
    }

    let args = Array(len - 1);
    for (i = 1; i < len; i++)
        args[i - 1] = arguments[i];
    cb.apply(null, args);
    // cb.apply(null, Array.prototype.slice.call(arguments, 1));
  }
};

/**
 * Get the count of elements of object
 */
utils.size = function(obj) {
  let count = 0;
  for (let i in obj) {
    if (obj.hasOwnProperty(i) && typeof obj[i] !== 'function') {
      count++;
    }
  }
  return count;
};

/**
 * Check a string whether ends with another string
 */
utils.endsWith = function(str, suffix) {
  if (typeof str !== 'string' || typeof suffix !== 'string' ||
    suffix.length > str.length) {
    return false;
  }
  return str.indexOf(suffix, str.length - suffix.length) !== -1;
};

/**
 * Check a string whether starts with another string
 */
utils.startsWith = function(str, prefix) {
  if (typeof str !== 'string' || typeof prefix !== 'string' ||
    prefix.length > str.length) {
    return false;
  }

  return str.indexOf(prefix) === 0;
};

/**
 * Compare the two arrays and return the difference.
 */
utils.arrayDiff = function(array1, array2) {
  let o = {};
  for(let i = 0, len = array2.length; i < len; i++) {
    o[array2[i]] = true;
  }

  let result = [];
  for(i = 0, len = array1.length; i < len; i++) {
    let v = array1[i];
    if(o[v]) continue;
    result.push(v);
  }
  return result;
};

/*
 * Date format
 */
utils.format = function(date, format) {
  format = format || 'MMddhhmm';
  let o = {
    "M+": date.getMonth() + 1, //month
    "d+": date.getDate(), //day
    "h+": date.getHours(), //hour
    "m+": date.getMinutes(), //minute
    "s+": date.getSeconds(), //second
    "q+": Math.floor((date.getMonth() + 3) / 3), //quarter
    "S": date.getMilliseconds() //millisecond
  };

  if (/(y+)/.test(format)) {
    format = format.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
  }

  for (let k in o) {
    if (new RegExp("(" + k + ")").test(format)) {
      format = format.replace(RegExp.$1, RegExp.$1.length === 1 ? o[k] :
        ("00" + o[k]).substr(("" + o[k]).length));
    }
  }
  return format;
};

/**
 * check if has Chinese characters.
 */
utils.hasChineseChar = function(str) {
  if (/.*[\u4e00-\u9fa5]+.*$/.test(str)) {
    return true;
  } else {
    return false;
  }
};

/**
 * transform unicode to utf8
 */
utils.unicodeToUtf8 = function(str) {
  let i, len, ch;
  let utf8Str = "";
  len = str.length;
  for (i = 0; i < len; i++) {
    ch = str.charCodeAt(i);

    if ((ch >= 0x0) && (ch <= 0x7F)) {
      utf8Str += str.charAt(i);

    } else if ((ch >= 0x80) && (ch <= 0x7FF)) {
      utf8Str += String.fromCharCode(0xc0 | ((ch >> 6) & 0x1F));
      utf8Str += String.fromCharCode(0x80 | (ch & 0x3F));

    } else if ((ch >= 0x800) && (ch <= 0xFFFF)) {
      utf8Str += String.fromCharCode(0xe0 | ((ch >> 12) & 0xF));
      utf8Str += String.fromCharCode(0x80 | ((ch >> 6) & 0x3F));
      utf8Str += String.fromCharCode(0x80 | (ch & 0x3F));

    } else if ((ch >= 0x10000) && (ch <= 0x1FFFFF)) {
      utf8Str += String.fromCharCode(0xF0 | ((ch >> 18) & 0x7));
      utf8Str += String.fromCharCode(0x80 | ((ch >> 12) & 0x3F));
      utf8Str += String.fromCharCode(0x80 | ((ch >> 6) & 0x3F));
      utf8Str += String.fromCharCode(0x80 | (ch & 0x3F));

    } else if ((ch >= 0x200000) && (ch <= 0x3FFFFFF)) {
      utf8Str += String.fromCharCode(0xF8 | ((ch >> 24) & 0x3));
      utf8Str += String.fromCharCode(0x80 | ((ch >> 18) & 0x3F));
      utf8Str += String.fromCharCode(0x80 | ((ch >> 12) & 0x3F));
      utf8Str += String.fromCharCode(0x80 | ((ch >> 6) & 0x3F));
      utf8Str += String.fromCharCode(0x80 | (ch & 0x3F));

    } else if ((ch >= 0x4000000) && (ch <= 0x7FFFFFFF)) {
      utf8Str += String.fromCharCode(0xFC | ((ch >> 30) & 0x1));
      utf8Str += String.fromCharCode(0x80 | ((ch >> 24) & 0x3F));
      utf8Str += String.fromCharCode(0x80 | ((ch >> 18) & 0x3F));
      utf8Str += String.fromCharCode(0x80 | ((ch >> 12) & 0x3F));
      utf8Str += String.fromCharCode(0x80 | ((ch >> 6) & 0x3F));
      utf8Str += String.fromCharCode(0x80 | (ch & 0x3F));

    }

  }
  return utf8Str;
};

/**
 * Ping server to check if network is available
 *
 */
utils.ping = function(host, cb) {
  if(!module.exports.isLocal(host)) {
    let cmd = 'ping -w 15 ' + host;
    exec(cmd, function(err, stdout, stderr) {
      if(!!err) {
        cb(false);
        return;
      }
      cb(true);
    });
  } else {
    cb(true);
  }
};

/**
 * Check if server is exsit. 
 *
 */
utils.checkPort = function(server, cb) {
  if (!server.port && !server.clientPort) {
    this.invokeCallback(cb, 'leisure');
    return;
  }
  let self = this;
  let port = server.port || server.clientPort;
  let host = server.host;
  let generateCommand = function(self, host, port) {
    let cmd;
    let ssh_params = pomelo.app.get(Constants.RESERVED.SSH_CONFIG_PARAMS);
    if(!!ssh_params && Array.isArray(ssh_params)) {
      ssh_params = ssh_params.join(' ');
    }
    else {
      ssh_params = "";
    }
    if (!self.isLocal(host)) {
      cmd = util.format('ssh %s %s "netstat -an|awk \'{print $4}\'|grep %s|wc -l"', host, ssh_params, port);
    } else {
      cmd = util.format('netstat -an|awk \'{print $4}\'|grep %s|wc -l', port);
    }
    return cmd;
  };
  let cmd1 = generateCommand(self, host, port);
  let child = exec(cmd1, function(err, stdout, stderr) {
    if(err) {
      logger.error('command %s execute with error: %j', cmd1, err.stack);
      self.invokeCallback(cb, 'error');
    } else if(stdout.trim() !== '0') {
      self.invokeCallback(cb, 'busy');
    } else {
      port = server.clientPort;
      let cmd2 = generateCommand(self, host, port);
      exec(cmd2, function(err, stdout, stderr) {
        if(err) {
          logger.error('command %s execute with error: %j', cmd2, err.stack);
          self.invokeCallback(cb, 'error');
        } else if (stdout.trim() !== '0') {
          self.invokeCallback(cb, 'busy');
        } else {
          self.invokeCallback(cb, 'leisure');
        }
      });
    }
  });
};

utils.isLocal = function(host) {
  let app = require('../pomelo').app;
  if(!app) {
    return host === '127.0.0.1' || host === 'localhost' || host === '0.0.0.0' || inLocal(host);
  } else {
    return host === '127.0.0.1' || host === 'localhost' || host === '0.0.0.0' || inLocal(host) || host === app.master.host;
  }
};

/**
 * Load cluster server.
 *
 */
utils.loadCluster = function(app, server, serverMap) {
  let increaseFields = {};
  let host = server.host;
  let count = parseInt(server[Constants.RESERVED.CLUSTER_COUNT]);
  let seq = app.clusterSeq[server.serverType];
  if(!seq) {
    seq = 0;
    app.clusterSeq[server.serverType] = count;
  } else {
    app.clusterSeq[server.serverType] = seq + count;
  }

  for(let key in server) {
    let value = server[key].toString();
    if(value.indexOf(Constants.RESERVED.CLUSTER_SIGNAL) > 0) {
      let base = server[key].slice(0, -2);
      increaseFields[key] = base;
    }
  }

  let clone = function(src) {
    let rs = {};
    for(let key in src) {
      rs[key] = src[key];
    }
    return rs;
  };
  for(let i=0, l=seq; i<count; i++,l++) {
    let cserver = clone(server);
    cserver.id = Constants.RESERVED.CLUSTER_PREFIX + server.serverType + '-' + l;
    for(let k in increaseFields) {
      let v = parseInt(increaseFields[k]);
      cserver[k] = v + i;
    }
    serverMap[cserver.id] = cserver;
  }
};

utils.extends = function(origin, add) {
  if (!add || !this.isObject(add)) return origin;

  let keys = Object.keys(add);
  let i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

utils.headHandler = function(headBuffer) {
  let len = 0;
  for(let i=1; i<4; i++) {
    if(i > 1) {
      len <<= 8;
    }
    len += headBuffer.readUInt8(i);
  }
  return len;
};

let inLocal = function(host) {
  for (let index in localIps) {
    if (host === localIps[index]) {
      return true;
    }
  }
  return false;
};

let localIps = function() {
  let ifaces = os.networkInterfaces();
  let ips = [];
  let func = function(details) {
    if (details.family === 'IPv4') {
      ips.push(details.address);
    }
  };
  for (let dev in ifaces) {
    ifaces[dev].forEach(func);
  }
  return ips;
}();

utils.isObject = function(arg) {
  return typeof arg === 'object' && arg !== null;
};
