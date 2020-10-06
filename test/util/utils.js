var utils = require('../../lib/util/utils');
var should = require('should');

describe('utils test', function() {
  describe('#invokeCallback', function() {
    it('should invoke the function with the parameters', function() {
      var p1 = 1, p2 = 'str';

      var func = function(arg1, arg2) {
        p1.should.equal(arg1);
        p2.should.equal(arg2);
      };

      utils.invokeCallback(func, p1, p2);
    });

    it('should ok if cb is null', function() {
      var p1 = 1, p2 = 'str';
      (function() {
        utils.invokeCallback(null, p1, p2);
      }).should.not.throw();
    });
  });

  describe('#size', function() {
    it('should return the own property count of the object', function() {
      var obj = {
        p1: 'str',
        p2: 1,
        m1: function() {}
      };

      utils.size(obj).should.equal(2);
    });
  });

  describe('#hasChineseChar', function() {
    it('should return false if the string does not have any Chinese characters', function() {
      var src = 'string without Chinese characters';
      utils.hasChineseChar(src).should.be.false;
    });

    it('should return true if the string has Chinese characters', function() {
      var src = 'string with Chinese characters 你好';
      utils.hasChineseChar(src).should.be.true;
    });
  });

  describe('#unicodeToUtf8', function() {
    it('should return the origin string if the string does not have any Chinese characters', function() {
      var src = 'string without Chinese characters';
      utils.unicodeToUtf8(src).should.equal(src);
    });

    it('should not return the origin string if the string has Chinese characters', function() {
      var src = 'string with Chinese characters 你好';
      utils.unicodeToUtf8(src).should.not.equal(src);
    });
  });

  describe('#isLocal', function() {
    it('should return true if the ip is local', function() {
      var ip = '127.0.0.1';
      var host = 'localhost';
      var other = '192.168.1.1';
      utils.isLocal(ip).should.be.true;
      utils.isLocal(host).should.be.true;
      utils.isLocal(other).should.be.false;
    });
  });

  describe('#loadCluster', function() {
    it('should produce cluster servers', function() {
      var clusterServer = {host: '127.0.0.1', port: '3010++', serverType: 'chat', cluster: true, clusterCount: 2};
      var serverMap = {};
      var app = {clusterSeq:{}};
      utils.loadCluster(app, clusterServer, serverMap);
      utils.size(serverMap).should.equal(2);
    });
  });

  describe('#arrayDiff', function() {
    it('should return the difference of two arrays', function() {
      var array1 = [1, 2, 3, 4, 5];
      var array2 = [1, 2, 3];
      var array = utils.arrayDiff(array1, array2);
      array.should.eql([4, 5]);
    });
  });

  describe('#extends', function() {
    it('should extends opts', function() {
      var opts = {
        test: 123
      };
      var add = {
        aaa: 555
      };
      var result = utils.extends(opts, add);
      result.should.eql({
        test: 123,
        aaa: 555
      });
    });
  });

  describe('#ping', function() {
    it('should ping server', function() {
      utils.ping('127.0.0.1', function(flag) {
        flag.should.be.true;
      });
      utils.ping('111.111.111.111', function(flag) {
        flag.should.be.false;
      });
    });
  });

});