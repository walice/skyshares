//
// module dependencies.
//
var express = require('express');
var routes = require('./routes');
var data = require('./routes/data');
var country = require('./routes/country');
var admin = require('./routes/admin');
var editor = require('./routes/editor');
var importer = require('./routes/importer'); 
var model = require('./routes/model'); 
var mac = require('./routes/mac'); 
var http = require('http');
var path = require('path');
var mongo = require('mongoskin');

var fs      = require('fs');

/**
 *  Define the skyshares application.
 */
var SkyShares = function() {

    //  Scope.
    var self = this;


    /*  ================================================================  */
    /*  Helper functions.                                                 */
    /*  ================================================================  */

    /**
     *  Set up server IP address and port # using env variables/defaults.
     */
    self.setupVariables = function() {
		//  Set the environment variables we need.
		self.ipaddress = process.env.OPENSHIFT_NODEJS_IP;
		self.port      = process.env.OPENSHIFT_NODEJS_PORT || 80;
	
        if (typeof self.ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the app locally.
            console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
            self.ipaddress = "127.0.0.1";
        };
    };


    /**
     *  Populate the cache.
     */
    self.populateCache = function() {
        if (typeof self.zcache === "undefined") {
            self.zcache = { 'index.html': '' };
        }

        //  Local cache for static content.
        self.zcache['index.html'] = fs.readFileSync('./index.html');
    };


    /**
     *  Retrieve entry (content) from cache.
     *  @param {string} key  Key identifying content to retrieve from cache.
     */
    self.cache_get = function(key) { return self.zcache[key]; };


    /**
     *  terminator === the termination handler
     *  Terminate server on receipt of the specified signal.
     *  @param {string} sig  Signal to terminate on.
     */
    self.terminator = function(sig){
        if (typeof sig === "string") {
           console.log('%s: Received %s - terminating sample app ...',
                       Date(Date.now()), sig);
           process.exit(1);
        }
        console.log('%s: Node server stopped.', Date(Date.now()) );
    };


    /**
     *  Setup termination handlers (for exit and a list of signals).
     */
    self.setupTerminationHandlers = function(){
        //  Process on exit and signals.
        process.on('exit', function() { self.terminator(); });

        // Removed 'SIGPIPE' from the list - bugz 852598.
        ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT',
         'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'
        ].forEach(function(element, index, array) {
            process.on(element, function() { self.terminator(element); });
        });
    };


    /*  ================================================================  */
    /*  App server functions (main app logic here).                       */
    /*  ================================================================  */

    /**
     *  Create the routing table entries + handlers for the application.
     */
    self.createRoutes = function() {
		//
		// routes
		//
		self.app.get('/', routes.index);
		//
		// routes
		//
		self.app.get('/', routes.index);
		self.app.get('/admin', admin.admin);
		//
		// data routes
		//
		//
		// data GET / list
		//
		self.app.get('/data', data.listall(self.db));
		self.app.get('/data/:type', data.listdataoftype(self.db));
		//
		// data GET single entry
		//
		self.app.get('/data/constant/:name', data.getdatabyname(self.db));
		self.app.get('/data/variable/:name', data.getdatabyname(self.db));
		self.app.get('/data/dataset/:name', data.getdatabyname(self.db));
		self.app.get('/data/function/:name', data.getdatabyname(self.db));
		self.app.get('/data/byname/:name', data.getdatabyname(self.db)); // TODO: find correct RESTfull solution to this
		self.app.get('/data/bygroup/:group/:name', data.getdatabygroup(self.db));
		//
		// data POST / add
		//
		self.app.post('/data', data.post(self.db));
		//
		// data PUT / update
		//
		self.app.put('/data/:id', data.put(self.db));
		//
		// data DELETE / update
		//
		self.app.delete('/data/:id', data.delete(self.db));
		//
		// country routes
		//
		//
		// data GET / list
		//
		self.app.get('/country', country.listall(self.db));
		//
		// MAC routes
		//
		//
		// MAC GET / list
		//
		self.app.get('/mac', mac.listall(self.db));
		self.app.get('/mac/:year', mac.get(self.db));
		//
		// MAC POST
		//
		self.app.post( '/mac/:year', mac.post(self.db) );
		//
		// MAC PUT
		//
		self.app.put( '/mac/:year', mac.put(self.db) );
		//
		// MAC DELETE
		//
		self.app.delete( '/mac/:year', mac.delete(self.db) );
		//
		// editor ui
		//
		self.app.get( '/editor/new/:type', editor.new() ); 
		self.app.get( '/editor/edit/:id', editor.edit(self.db) ); 
		//
		// import
		//
		self.app.get( '/import/:type', importer.import() );
		//
		// model
		//
		self.app.get( '/model', model.model() );    
	};
    
    /**
     *  Initialize the server (express) and create the routes and register
     *  the handlers.
     */
    self.initializeServer = function() {
    	//
    	//
    	//
    	var connection_string = '127.0.0.1:27017/skyshares';
		if(process.env.OPENSHIFT_MONGODB_DB_PASSWORD){
			connection_string = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +
			process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" +
			process.env.OPENSHIFT_MONGODB_DB_HOST + ':' +
			process.env.OPENSHIFT_MONGODB_DB_PORT + '/' +
			process.env.OPENSHIFT_APP_NAME;
		}
		console.log( 'mongodb://'+connection_string );
    	self.db = mongo.db('mongodb://'+connection_string, {native_parser:true});
    	//
    	//
    	//
        self.app = express();
		//
		// environment
		//
		self.app.set('port', self.port);
		self.app.set('views', path.join(__dirname, 'views'));
		self.app.set('view engine', 'jade');
		self.app.use(express.favicon());
		self.app.use(express.logger('dev'));
		self.app.use(express.json());
		self.app.use(express.urlencoded());
		self.app.use(express.methodOverride());
		self.app.use(self.app.router);
		self.app.use(express.static(path.join(__dirname, 'public')));
		self.app.use(express.json({limit: '50mb'}));
		//self.app.use(bodyParser.urlencoded({limit: '5m0b'}));		
		//
		// development only
		//
		if ('development' == self.app.get('env')) {
		  self.app.use(express.errorHandler());
		}
		//
		//
		//
        self.createRoutes();
    };


    /**
     *  Initializes the sample application.
     */
    self.initialize = function() {
        self.setupVariables();
        self.populateCache();
        self.setupTerminationHandlers();

        // Create the express server and routes.
        self.initializeServer();
    };


    /**
     *  Start the server (starts up the sample application).
     */
    self.start = function() {
        //  Start the app on the specific interface (and port).
        self.app.listen(self.port, self.ipaddress, function() {
            console.log('%s: Node server started on %s:%d ...',
                        Date(Date.now() ), self.ipaddress, self.port);
        });
    };

};   /*  Sample Application.  */



/**
 *  main():  Main code.
 */
var sapp = new SkyShares();
sapp.initialize();
sapp.start();
