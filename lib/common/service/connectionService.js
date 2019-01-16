"use strict";

/**
 * connection statistics service
 * record connection, login count and list
 */
let Service = function(app) {
  this.serverId = app.getServerId();
  this.connCount = 0;
  this.loginedCount = 0;
  this.logined = {};
};

module.exports = Service;

let pro = Service.prototype;


/**
 * Add logined user.
 *
 * @param uid {String} user id
 * @param info {Object} record for logined user
 */
pro.addLoginedUser = function(uid, info) {
  if(!this.logined[uid]) {
    this.loginedCount++;
  }
  info.uid = uid;
  this.logined[uid] = info;
};

/**
 * Update user info.
 * @param uid {String} user id
 * @param info {Object} info for update.
 */
pro.updateUserInfo = function(uid, info) {
    let user = this.logined[uid];
    if (!user) {
        return;
    }

    for (let p in info) {
        if (info.hasOwnProperty(p) && typeof info[p] !== 'function') {
            user[p] = info[p];
        }
    }
};

/**
 * Increase connection count
 */
pro.increaseConnectionCount = function() {
  this.connCount++;
};

/**
 * Remote logined user
 *
 * @param uid {String} user id
 */
pro.removeLoginedUser = function(uid) {
  if(!!this.logined[uid]) {
    this.loginedCount--;
  }
  delete this.logined[uid];
};

/**
 * Decrease connection count
 *
 * @param uid {String} uid
 */
pro.decreaseConnectionCount = function(uid) {
  if(this.connCount) {
    this.connCount--;
  }
  if(!!uid) {
    this.removeLoginedUser(uid);
  }
};

/**
 * Get statistics info
 *
 * @return {Object} statistics info
 */
pro.getStatisticsInfo = function() {
  let list = [];
  for(let uid in this.logined) {
    list.push(this.logined[uid]);
  }

  return {serverId: this.serverId, totalConnCount: this.connCount, loginedCount: this.loginedCount, loginedList: list};
};
