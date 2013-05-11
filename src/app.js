
/**
 * Module dependencies.
 */

var express = require('express'),
    http = require('http'),
    path = require('path'),
    lessMiddleware = require('less-middleware'),
    controllerRegistry = require('./controllers/controllerRegistry') ,
    nconf = require('nconf');

var app = express();


app.configure(function(){
    app.set('port', nconf.get('port') ||   3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(lessMiddleware({
        src: __dirname + '/public',
        compress: true
    }));
    app.use(express.compress());
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});

//require('./core/sideTasks')(app);


app.configure('development', function(){
    app.use(express.errorHandler());
});

var server = http.createServer(app);
controllerRegistry.register(app);


server.listen(app.get('port'), function(){
    console.log(__dirname);
    console.log("Express server listening on port " + app.get('port'));
});

