var express = require('express');
var methodOverride = require('method-override');
var errorhandler = require('errorhandler');
var app = express();

var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cookieSession = require('cookie-session');


app.use(methodOverride('_method'));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieSession({secret: 'app_1'}));

//app.use(app.router);
app.set('view engine', 'jade');
app.set('views', __dirname + '/public');
app.set('view options', {layout: false});
app.set('basepath',__dirname + '/public');

if( app.get('env') === 'development' ){
  app.use(express.static(__dirname + '/public'));
  app.use(errorhandler({ dumpExceptions: true, showStack: true }));
}else{
  var oneYear = 31557600000;
  app.use(express.static(__dirname + '/public', { maxAge: oneYear }));
  app.use(errorhandler());
}




console.info("Web server has started.\nPlease log on http://127.0.0.1:3001/index.html");

app.listen(3001);
