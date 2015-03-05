//
// db utilities
//
function findmac( db, year, callback ) {
    db.collection('mac').findOne( { name: 'MAC_' + year }, callback);
}
function addmac( db, mac, callback ) {
	db.collection('mac').insert(mac, callback);
}
function updatemac( db, year, mac, callback ) {
	db.collection('mac').update( { name: 'MAC_' + year }, mac, callback);
}
function deletemac( db, name, callback ) {
	db.collection('mac').remove( { name: 'MAC_' + year }, callback);
}
//
// GET / listing methods
//
exports.get = function(db) {
  return function(req, res) {
  	var year = req.params.year;
    findmac( db, year, function (err, mac) {
      	res.json( ( err || !mac ) ? { status: 'ERROR', message: ( err ? err : 'Unable to find MAC_' + year ) } : mac);
    });
  }
};
exports.listall = function(db) {
  return function(req, res) {
    db.collection('mac').find().toArray(function (err, items) {
      	res.json( err ? { status: 'ERROR', message: err } : items );
    });
  }
};
//
// PUT / POST
//
exports.post = function(db) {
	return function(req, res) {
		var year = req.params.year;
		findmac( db, year, function( err, mac ) {
			if ( err || !mac ) {
				addmac( db, req.body, function(err, result) {
					res.json( err ? { status: 'ERROR', message: err } : { status: 'OK', message: 'Added mac entry ' + req.body.name } );
				});
			} else {
				updatemac( db, year, req.body, function(err, result) {
					res.json( err ? { status: 'ERROR', message: err } : { status: 'OK', message: 'Updated mac entry ' + req.body.name } );
				});
			}
		});
	}
};

exports.put = function(db) {
	return function(req, res) {
		var year = req.params.year;
		updatemac( db, year, req.body, function(err, result) {
			res.json( err ? { status: 'ERROR', message: err } : { status: 'OK' } );
		});
	}
};

exports.delete = function(db) {
	return function(req, res) {
		var year = req.params.year;
		deletemac( db, year, req.body, function(err, result) {
			res.json( err ? { status: 'ERROR', message: err } : { status: 'OK' } );
		});
	}
};