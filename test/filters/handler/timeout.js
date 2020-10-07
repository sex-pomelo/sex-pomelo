var should = require('should');
var timeoutFilter = require('../../../lib/filters/handler/timeout');
var FilterService = require('../../../lib/common/service/filterService');
var util = require('util');
var mockSession = {
  key : "123"
};
let msg = {__route__: 'mockTest'};

var WAIT_TIME = 1500;
describe("#timeoutFilter",function(){
  it("should do before filter ok",function(done){
    var service = new FilterService();
    var filter = timeoutFilter(1000);
    service.before(filter);

    service.beforeFilter(msg,mockSession,function(){
      should.exist(mockSession);

      should.exist(mockSession.__timeout__);
      done();
    });
  });

  it("should do after filter by doing before filter ok",function(done){
    var service = new FilterService();
    var filter = timeoutFilter(1000);
    var _session ;
    service.before(filter);
    service.after(filter);
    

    service.beforeFilter(msg,mockSession,function(){
      should.exist(mockSession);
      should.exist(mockSession.__timeout__);
      _session = mockSession;

      service.afterFilter(null,msg,mockSession,null,function(){
        should.exist(mockSession);
        should.strictEqual(mockSession,_session);
        done();
      });
    });
  });
});