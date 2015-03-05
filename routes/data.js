//
//
//
var mongo = require('mongoskin');
//
//
//
function finddata( db, search, callback ) {
    db.collection('data').findOne( search, callback );
}
function adddata( db, data, callback ) {

}
function updatedata( db, search, data, callback ) {

}
function deletedata( db, search, callback ) {

}
//
// GET / listing methods
//
exports.listall = function(db) {
  return function(req, res) {
    db.collection('data').find().toArray(function (err, items) {
		res.json(items);
    });
  }
};

exports.get = function( db ) {
  return function(req, res) {
  	var data_id = req.params.id;
    finddata( db, { _id: mongo.helper.toObjectID(data_id) }, function (err, data) {
		res.json(data);
    });
  }
};

exports.getdatabyname = function( db ) {
  return function(req, res) {
  	var name = req.params.name;
    finddata( db, { name: name }, function (err, data) {
      	res.json(data?data:{});
    });
  }
};

exports.getdatabygroup = function( db ) {
  return function(req, res) {
  	var group_name 	= req.params.group;
  	var data_name 	= req.params.name;
  	//
  	// find group
  	//
    db.collection('data').findOne({ name: group_name }, function (err, group) {
    	//
    	// find data
    	//
    	db.collection('data').findOne({ name: data_name }, function (err, data) {
    		//
    		//
    		//
    		var grouped_data = {
				name		: data_name + '.' + group_name,
				description : data.description + ', for ' + group_name,
				type		: 'set',
				members		: []
    		};
			//
			// get data members with iso in group members
			//
			var count = data.members.length;
			for( var i = 0; i < count; i++ ) {
				if ( group.members.indexOf( data.members[ i ].iso ) >= 0 ) {
					grouped_data.members.push( data.members[ i ] );
				}
			} 
			res.json(grouped_data);
    	});
    });
  }
};

exports.listdataoftype = function( db ) {
  return function(req, res) {
  	var type = req.params.type;
    db.collection('data').find( { "type" : type } ).toArray(function (err, items) {
      	res.json(items);
    });
  }
};
//
// POST / add methods
//
exports.post = function( db ) {
  return function(req, res) {
  	//
  	// check for duplicate with name
  	//
  	var data = req.body;
  	finddata( db, { name: data.name }, function( err, result ) {
		if ( !result ) {
			db.collection('data').insert(data, function(err, result){
				if ( err ) {
					res.json( 500, { status: 'ERROR', message: 'Server error ' + err } );
				} else {
					res.json( 200, { status: 'ERROR', message: 'Data added ' + data.name } );
				}
			});
		} else {
			res.json(409, { status: 'ERROR', message: 'Duplicate entry ' + data.name } );
		}
	});
  }
};
//
// PUT / update methods
//
exports.put = function( db ) {
  return function(req, res) {
    var data_id = req.params.id;
    var data = req.body;
    db.collection('data').updateById(data_id, data, function(err, result) {
      res.send((result === 1) ? { status: 'OK', message: 'Data updated ' + data.name } : { status:'ERROR', message:'Error updating data ' + data.name + ' : ' + err });
    });
  }
};
//
// DELETE / add methods
//
exports.delete = function( db ) {
  return function(req, res) {
    var data_id = req.params.id;
    db.collection('data').removeById(data_id, function(err, result) {
      res.send((result === 1) ? { status: 'OK', message: 'Data deleted' } : { status:'ERROR', message:'Error: ' + err });
    });
  }
};