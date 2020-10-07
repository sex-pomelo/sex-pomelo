var should = require('should');
var rpcLogFilter = require('../../../lib/filters/rpc/rpcLog');

var mockData = {
  serverId : "connector-server-1",
  msg : "hello",
  opts : {}
};

describe('#rpcLogFilter',function(){
  it("should do after filter by before filter",function(done){
    let filter = rpcLogFilter();
    filter.before(mockData.serverId,mockData.msg,mockData.opts,function(serverId,msg,opts){
      should.exist(mockData.opts.__start_time__);
      filter.after(mockData.serverId,mockData.msg,mockData.opts,function(serverId,msg,opts){
        should.exist(mockData.opts.__start_time__);
        done();
      });
    });
  });
});