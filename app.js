
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path');

// ejs set-up
var ejs = require('ejs');
ejs.open = '<$';
ejs.close = '$>';

var app = express();

// all environments
app.set('port', process.env.PORT || 4000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.methodOverride());
//app.use(express.bodyParser()); set-off to enable http-proxy
app.use(app.router);
app.use(require('less-middleware')({ src: __dirname + '/less', dest: __dirname + '/public' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(errorHandler);

function errorHandler(err, req, res, next){
	console.error(err.stack);
	res.send(500);	
}

//back-end server requests are proxied
var httpProxy = require('http-proxy');
var target = 'http://localhost:7070';
var proxy = new httpProxy.createProxyServer({});
proxy.on('error', function(err){
	console.error(err.stack);
});

// for POS
app.all('/ws/*', function(req, res) {
	proxy.web(req, res, {target: target});
});

app.all('/webapps/*', function(req, res) {
	proxy.web(req, res, {target: target});
});

// for DW
app.all('/dispatcher/*', function(req, res) {
	proxy.web(req, res, {target: target});
});

app.all('/webfile', function(req, res) {	
	proxy.web(req, res, {target: target});
});

app.all('/Image', function(req, res) {
	proxy.web(req, res, {target: target});
});

app.all('/Login', function(req, res) {	
	proxy.web(req, res, {target: target});
});

app.all('/', function(req, res){
	res.render('index', {title: 'ggel'});
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
