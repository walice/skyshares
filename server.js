//
// module dependencies.
//
const express = require('express')
const routes = require('./routes')
const data = require('./routes/data')
const country = require('./routes/country')
const admin = require('./routes/admin')
const editor = require('./routes/editor')
const importer = require('./routes/importer')
const model = require('./routes/model')
const share = require('./routes/share')
const mac = require('./routes/mac')
const http = require('http')
const path = require('path')
const mongo = require('mongoskin')
const twitter = require('./routes/twitter')
const facebook = require('./routes/facebook')
const googleplus = require('./routes/googleplus')
const media = require('./routes/media')
const fs = require('fs')
const basicAuth = require('express-basic-auth')
const favicon = require('serve-favicon')
const logger = require('morgan')
const methodOverride = require('method-override')
const errorHandler = require('errorhandler')
const cookieParser = require('cookie-parser')
const cookieSession = require('cookie-session')

/**
 *  Define the skyshares application.
 */
const SkyShares = function () {
  //  Scope.
  const self = this

  /*  ================================================================  */
  /*  Helper functions.                                                 */
  /*  ================================================================  */

  /**
   *  Set up server IP address and port # using env variables/defaults.
   */
  self.setupVariables = function () {
    //  Set the environment variables we need.
    self.ipaddress = '0.0.0.0'
    self.port = 8080

    if (typeof self.ipaddress === 'undefined') {
      //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
      //  allows us to run/test the app locally.
      console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1')
      self.ipaddress = '127.0.0.1'
    }
  }

  /**
   *  terminator === the termination handler
   *  Terminate server on receipt of the specified signal.
   *  @param {string} sig  Signal to terminate on.
   */
  self.terminator = function (sig) {
    if (typeof sig === 'string') {
      console.log(
        '%s: Received %s - terminating skyshares ...',
        Date(Date.now()),
        sig
      )
      process.exit(1)
    }
    console.log('%s: skyshares server stopped.', Date(Date.now()))
  }

  /**
   *  Setup termination handlers (for exit and a list of signals).
   */
  self.setupTerminationHandlers = function () {
    //  Process on exit and signals.
    process.on('exit', function () {
      self.terminator()
    })

    // Removed 'SIGPIPE' from the list - bugz 852598.
    ;[
      'SIGHUP',
      'SIGINT',
      'SIGQUIT',
      'SIGILL',
      'SIGTRAP',
      'SIGABRT',
      'SIGBUS',
      'SIGFPE',
      'SIGUSR1',
      'SIGSEGV',
      'SIGUSR2',
      'SIGTERM'
    ].forEach(function (element, index, array) {
      process.on(element, function () {
        self.terminator(element)
      })
    })
  }

  /*  ================================================================  */
  /*  App server functions (main app logic here).                       */
  /*  ================================================================  */

  /**
   *  Create the routing table entries + handlers for the application.
   */
  self.createRoutes = function () {
    //
    // routes
    //
    self.app.get('/', routes.index)
    // JONS: remove admin for now
    // TODO: add authentication
    self.app.get(
      '/admin',
      basicAuth({
        users: { admin: 'letmein101' },
        challenge: true
      }),
      admin.admin
    )
    //
    // data routes
    //
    //
    // data GET / list
    //
    self.app.get('/data', data.listall(self.db))
    self.app.get('/data/:type', data.listdataoftype(self.db))
    //
    // data GET single entry
    //
    self.app.get('/data/constant/:name', data.getdatabyname(self.db))
    self.app.get('/data/variable/:name', data.getdatabyname(self.db))
    self.app.get('/data/dataset/:name', data.getdatabyname(self.db))
    self.app.get('/data/function/:name', data.getdatabyname(self.db))
    self.app.get('/data/byname/:name', data.getdatabyname(self.db)) // TODO: find correct RESTfull solution to this
    self.app.get('/data/bygroup/:group/:name', data.getdatabygroup(self.db))
    //
    // data POST / add
    //
    self.app.post('/data', data.post(self.db))
    //
    // data PUT / update
    //
    self.app.put('/data/:id', data.put(self.db))
    //
    // data DELETE / update
    //
    self.app.delete('/data/:id', data.delete(self.db))
    //
    // country routes
    //
    //
    // data GET / list
    //
    self.app.get('/country', country.listall(self.db))
    //
    // MAC routes
    //
    //
    // MAC GET / list
    //
    self.app.get('/mac', mac.listall(self.db))
    self.app.get('/mac/:name', mac.get(self.db))
    self.app.get('/macnames', mac.listnames(self.db))
    //
    // MAC POST
    //
    self.app.post('/mac/:name', mac.post(self.db))
    //
    // MAC PUT
    //
    self.app.put('/mac/:name', mac.put(self.db))
    //
    // MAC DELETE
    //
    self.app.delete('/mac/:name', mac.delete(self.db))
    //
    // editor ui
    //
    self.app.get('/editor/new/:type', editor.new())
    self.app.get('/editor/edit/:id', editor.edit(self.db))
    //
    // import
    //
    self.app.get('/import/:type', importer.import())
    //
    // model
    //
    self.app.get('/model', model.model())
    //
    //
    //
    self.app.get('/share/:type', share.share())
    //
    // twitter
    //
    self.app.get('/twitter/commitmedia/:id/:text', twitter.commitmedia(self.db))
    self.app.get('/twitter/callback', twitter.callback(self.db))
    //
    // facebook
    // TODO: deprecate all of this
    //
    self.app.get('/facebook/post/:id', facebook.post(self.db))
    self.app.get('/facebook/callback', facebook.callback(self.db))
    self.app.get('/facebook/:id', facebook.get(self.db))
    //
    // google plus
    //
    self.app.get('/googleplus/:id/:title/:description', googleplus.get(self.db))
    //
    // media
    //
    self.app.get('/media/:id', media.get(self.db))
    self.app.post('/media', media.post(self.db))
  }

  /**
   *  Initialize the server (express) and create the routes and register
   *  the handlers.
   */
  self.initializeServer = function () {
    //
    //
    //
    let connection_string = '127.0.0.1:27017/skyshares'
    if (process.env.OPENSHIFT_MONGODB_DB_PASSWORD) {
      connection_string =
        process.env.OPENSHIFT_MONGODB_DB_USERNAME +
        ':' +
        process.env.OPENSHIFT_MONGODB_DB_PASSWORD +
        '@' +
        process.env.OPENSHIFT_MONGODB_DB_HOST +
        ':' +
        process.env.OPENSHIFT_MONGODB_DB_PORT +
        '/' +
        process.env.OPENSHIFT_APP_NAME
    }
    console.log('mongodb://' + connection_string)
    self.db = mongo.db('mongodb://' + connection_string, {
      native_parser: true
    })
    //
    //
    //
    self.app = express()
    //
    // environment
    //
    self.app.set('port', self.port)
    self.app.set('views', path.join(__dirname, 'views'))
    self.app.set('view engine', 'pug')
    self.app.use(
      favicon(path.join(__dirname, 'public', 'images', 'favicon.ico'))
    )
    self.app.use(logger('dev'))
    self.app.use(express.json({ limit: '50mb' }))
    self.app.use(express.urlencoded({ extended: true }))
    self.app.use(methodOverride())
    self.app.use(cookieParser('==5ky5har35=='))
    self.app.use(
      cookieSession({
        name: 'session',
        secret: 'test',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      })
    )
    self.app.use(express.static(path.join(__dirname, 'public')))
    //self.app.use(bodyParser.urlencoded({limit: '5m0b'}));
    //
    // development only
    //
    if ('development' == self.app.get('env')) {
      self.app.use(errorHandler())
    }
    //
    //
    //
    self.createRoutes()
  }

  /**
   *  Initializes the sample application.
   */
  self.initialize = function () {
    self.setupVariables()
    self.setupTerminationHandlers()

    // Create the express server and routes.
    self.initializeServer()
  }

  /**
   *  Start the server (starts up the sample application).
   */
  self.start = function () {
    //  Start the app on the specific interface (and port).
    self.app.listen(self.port, self.ipaddress, function () {
      console.log(
        '%s: Node server started on %s:%d ...',
        Date(Date.now()),
        self.ipaddress,
        self.port
      )
    })
  }
} /*  Sample Application.  */

/**
 *  main():  Main code.
 */
const sapp = new SkyShares()
sapp.initialize()
sapp.start()
