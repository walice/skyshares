//
// db utilities
//
function findcountry( db, name, callback ) {
    db.collection('country').findOne( { name: name }, callback);
}
function addcountry( db, country, callback ) {
	db.collection('country').insert(country, callback);
}
function updatecountry( db, name, country, callback ) {
	db.collection('country').update( { name: name }, country, callback);
}
function deletecountry( db, name, callback ) {
	db.collection('country').remove( { name: name }, country, callback);
}
//
// GET / listing methods
//
exports.get = function(db) {
  return function(req, res) {
  	var name = req.params.name;
    findcountry( db, name, function (err, country) {
      	res.json(country);
    });
  }
};
exports.listall = function(db) {
  return function(req, res) {
    db.collection('country').find().toArray(function (err, items) {
      	res.json(items);
    });
  }
};
//
// PUT / POST
//
exports.put = function(db) {
	return function(req, res) {
		var name = req.params.name;
		findcountry( db, name, function( err, country ) {
			if ( err ) {
				addcountry( db, req.body, function(err, result) {
					res.json( err ? { status: 'ERROR', message: err } : { status: 'OK' } );
				});
			} else {
				updatecountry( db, name, req.body, function(err, result) {
					res.json( err ? { status: 'ERROR', message: err } : { status: 'OK' } );
				});
			}
		});
	}
};

exports.post = function(db) {
	return function(req, res) {
		var name = req.params.name;
		updatecountry( db, name, req.body, function(err, result) {
			res.json( err ? { status: 'ERROR', message: err } : { status: 'OK' } );
		});
	}
};

exports.delete = function(db) {
	return function(req, res) {
		var name = req.params.name;
		deletecountry( db, name, req.body, function(err, result) {
			res.json( err ? { status: 'ERROR', message: err } : { status: 'OK' } );
		});
	}
};