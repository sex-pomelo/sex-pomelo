const pomelo = require('pomelo');

/**
 * Init app for client.
 */
let app = pomelo.createApp();
app.set('name', '$');

// app configuration
app.configure('production|development', 'connector', function(){
  app.set('connectorConfig',
    {
      connector : pomelo.connectors.hybridconnector,
      heartbeat : 3,
      useDict : true,
      useProtobuf : true
    });
});


// app configure
app.configure('production|development', function() {
  app.set('connectorConfig',
  {
      connector : pomelo.connectors.hybridconnector,
      disconnectOnTimeout:true,
  });

  app.set('monitorConfig',
  {
    monitor : pomelo.monitors.redismonitor,
    redisNodes:{
      ///////// sentinels mode
      //// redis config( if length>1,using sentinels mode,you must set master name )
      // redis:[{host: "127.0.0.1",port: 26379},{host: "127.0.0.1",port: 26380},{host:"127.0.0.1",port: 26381}]
      //// sentinels mode name
      //name:"mymaster",
      ///////// signel mode
      nodes:[{host: "127.0.0.1",port: 6479}],
    },
    period: 5*1000, // period to fetch updated server list
    expire: 20*1000, // time a server is considered alive after ping
    maxServerInfoBatch: 1000, // do not fetch more than 1000 servers from redis per ping
    keyPre:"pomelo",     // redis key pre string,default "pomelo"
    memInfo:false      // show memInfo
  });
});

// start app
app.start();

process.on('uncaughtException', function (err) {
  console.error(' Caught exception: ' + err.stack);
});
