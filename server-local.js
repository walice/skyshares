//
// module dependencies.
//
var express = require('express');
var routes = require('./routes');
var data = require('./routes/data');
var country = require('./routes/country');
var mac = require('./routes/mac');
var admin = require('./routes/admin');
var editor = require('./routes/editor');
var importer = require('./routes/importer'); 
var model = require('./routes/model'); 
var http = require('http');
var path = require('path');
var mongo = require('mongoskin');
//
// database
//
//var db = mongo.db("mongodb://localhost:27017/skyshares", {native_parser:true});
/*
   		user: 		"admin",
   		password: 	"r6wWkmkfyItZ",
   		db: 		"skyshares"
*/
var connection_string = "127.0.0.1:27017/skyshares";
var db = mongo.db("mongodb://" + connection_string, {native_parser:true});
//
// app
//
var app = express();
//
// environment
//
app.set('port', process.env.PORT || 4000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
//
// development only
//
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}
//
// routes
//
app.get('/', routes.index);
app.get('/admin', admin.admin);
//
// data routes
//
//
// data GET / list
//
app.get('/data', data.listall(db));
app.get('/data/:type', data.listdataoftype(db));
//
// data GET single entry
//
app.get('/data/byid/:id', data.get(db));
app.get('/data/constant/:name', data.getdatabyname(db));
app.get('/data/variable/:name', data.getdatabyname(db));
app.get('/data/dataset/:name', data.getdatabyname(db));
app.get('/data/function/:name', data.getdatabyname(db));
app.get('/data/byname/:name', data.getdatabyname(db)); // TODO: find correct RESTfull solution to this
app.get('/data/bygroup/:group/:name', data.getdatabygroup(db));
//
// data POST / add
//
app.post('/data', data.post(db));
//
// data PUT / update
//
app.put('/data/:id', data.put(db));
//
// data DELETE / update
//
app.delete('/data/:id', data.delete(db));
//
// country routes
//
//
// country GET / list
//
app.get('/country', country.listall(db));
app.get('/country/:name', country.get(db));
//
// country POST
//
app.post( '/country/:name', country.post(db) );
//
// country PUT
//
app.put( '/country/:name', country.put(db) );
//
// country DELETE
//
app.delete( '/country/:name', country.delete(db) );
//
// MAC routes
//
//
// MAC GET / list
//
app.get('/mac', mac.listall(db));
app.get('/mac/:name', mac.get(db));
app.get('/macnames', mac.listnames(db));
//
// MAC POST
//
app.post( '/mac/:name', mac.post(db) );
//
// MAC PUT
//
app.put( '/mac/:name', mac.put(db) );
//
// MAC DELETE
//
app.delete( '/mac/:name', mac.delete(db) );
//
// editor ui
//
app.get( '/editor/new/:type', editor.new() ); 
app.get( '/editor/edit/:id', editor.edit(db) ); 
//
// import
//
app.get( '/import/:type', importer.import() );
//
// model
//
app.get( '/model', model.model() );
//
// server
//
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
