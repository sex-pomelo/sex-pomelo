"use strict";

const utils = require('../util/utils');
const DEFAULT_FLUSH_INTERVAL = 20;

let Service = function(app, opts) {
  if (!(this instanceof Service)) {
    return new Service(app, opts);
  }

  opts = opts || {};
  this.app = app;
  this.flushInterval = opts.flushInterval || DEFAULT_FLUSH_INTERVAL;
  this.sessions = {};   // sid -> msg queue
  this.tid = null;
};

module.exports = Service;

Service.prototype.start = function(cb) {
  this.tid = setInterval(flush.bind(null, this), this.flushInterval);
  process.nextTick(function() {
    utils.invokeCallback(cb);
  });
};

Service.prototype.stop = function(force, cb) {
  if(this.tid) {
    clearInterval(this.tid);
    this.tid = null;
  }
  process.nextTick(function() {
    utils.invokeCallback(cb);
  });
};

Service.prototype.schedule = function(reqId, route, msg, recvs, opts, cb) {
  opts = opts || {};
  if(opts.type === 'broadcast') {
    doBroadcast(this, msg, opts.userOptions);
  } else {
    doBatchPush(this, msg, recvs);
  }

  process.nextTick(function() {
    utils.invokeCallback(cb);
  });
};

let doBroadcast = function(self, msg, opts) {
  let channelService = self.app.get('channelService');
  let sessionService = self.app.get('sessionService');

  if(opts.binded) {
    sessionService.forEachBindedSession(function(session) {
      if(channelService.broadcastFilter &&
         !channelService.broadcastFilter(session, msg, opts.filterParam)) {
        return;
      }

      enqueue(self, session, msg);
    });
  } else {
    sessionService.forEachSession(function(session) {
      if(channelService.broadcastFilter &&
          !channelService.broadcastFilter(session, msg, opts.filterParam)) {
        return;
      }

      enqueue(self, session, msg);
    });
  }
};

let doBatchPush = function(self, msg, recvs) {
  let sessionService = self.app.get('sessionService');
  let session;
  for(let i=0, l=recvs.length; i<l; i++) {
    session = sessionService.get(recvs[i]);
    if(session) {
      enqueue(self, session, msg);
    }
  }
};

let enqueue = function(self, session, msg) {
  let queue = self.sessions[session.id];
  if(!queue) {
    queue = self.sessions[session.id] = [];
    session.once('closed', onClose.bind(null, self));
  }

  queue.push(msg);
};

let onClose = function(self, session) {
  delete self.sessions[session.id];
};

let flush = function(self) {
  let sessionService = self.app.get('sessionService');
  let queue, session;
  for(let sid in self.sessions) {
    session = sessionService.get(sid);
    if(!session) {
      continue;
    }

    queue = self.sessions[sid];
    if(!queue || queue.length === 0) {
      continue;
    }

    session.sendBatch(queue);
    self.sessions[sid] = [];
  }
};
