//
// db utilities
//
function findmac( db, name, callback ) {
    db.collection('mac').findOne( { name: name }, callback);
}
function addmac( db, mac, callback ) {
	db.collection('mac').insert(mac, callback);
}
function updatemac( db, name, mac, callback ) {
	db.collection('mac').update( { name: name }, mac, callback);
}
function deletemac( db, name, callback ) {
	db.collection('mac').remove( { name: name }, callback);
}
function validateorigin( origin ) {
	var authorised = [ "www.skyshares.org", "skyshares-soda.rhcloud.com" ];
	return authorised.indexOf( origin ) >= 0;
}
//
// GET / listing methods
//
exports.get = function(db) {
  return function(req, res) {
	var host = req.host;
	if ( !( req.xhr && validateorigin( host ) ) ) {
		res.json({ status: 'ERROR', message: origin + ' forbidden' });
		return;
	}
  	var name = req.params.name;
    findmac( db, name, function (err, mac) {
      	res.json( ( err || !mac ) ? { status: 'ERROR', message: ( err ? err : 'Unable to find ' + name ) } : mac);
    });
  }
};
exports.listall = function(db) {
  return function(req, res) {
	var host = req.host;
	if ( !( req.xhr && validateorigin( host ) ) ) {
		res.json({ status: 'ERROR', message: origin + ' forbidden' });
		return;
	}
    db.collection('mac').find().toArray(function (err, items) {
      	res.json( err ? { status: 'ERROR', message: err } : items );
    });
  }
};
exports.listnames = function(db) {
  return function(req, res) {
	var host = req.host;
	if ( !( req.xhr && validateorigin( host ) ) ) {
		res.json({ status: 'ERROR', message: origin + ' forbidden' });
		return;
	}
    db.collection('mac').find({},{name: 1, _id: 1}).toArray(function (err, items) {
      	res.json( err ? { status: 'ERROR', message: err } : items );
    });
  }
};
//
// PUT / POST
//
exports.post = function(db) {
	return function(req, res) {
  		var host = req.host;
		if ( !( req.xhr && validateorigin( host ) ) ) {
			res.json({ status: 'ERROR', message: origin + ' forbidden' });
  			return;
		}
		var name = req.params.name;
		findmac( db, name, function( err, mac ) {
			if ( err || !mac ) {
				addmac( db, req.body, function(err, result) {
					res.json( err ? { status: 'ERROR', message: err } : { status: 'OK', message: 'Added mac entry ' + req.body.name } );
				});
			} else {
				updatemac( db, name, req.body, function(err, result) {
					res.json( err ? { status: 'ERROR', message: err } : { status: 'OK', message: 'Updated mac entry ' + req.body.name } );
				});
			}
		});
	}
};

exports.put = function(db) {
	return function(req, res) {
  		var host = req.host;
		if ( !( req.xhr && validateorigin( host ) ) ) {
			res.json({ status: 'ERROR', message: origin + ' forbidden' });
  			return;
		}
		var name = req.params.name;
		updatemac( db, name, req.body, function(err, result) {
			res.json( err ? { status: 'ERROR', message: err } : { status: 'OK' } );
		});
	}
};

exports.delete = function(db) {
	return function(req, res) {
  		var host = req.host;
		if ( !( req.xhr && validateorigin( host ) ) ) {
			res.json({ status: 'ERROR', message: origin + ' forbidden' });
  			return;
		}
		var name = req.params.name;
		deletemac( db, name, function(err, result) {
			res.json( err ? { status: 'ERROR', message: err } : { status: 'OK' } );
		});
	}
};