const pomelo = require('@sex-pomelo/sex-pomelo');

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
});

// start app
app.start();

process.on('uncaughtException', function (err) {
  console.error(' Caught exception: ' + err.stack);
});
