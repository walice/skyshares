/*
 * GET editor page.
 */

exports.new = function() {
 	return function(req, res){
 		var type = req.params.type;
  		res.render('editor', { title: 'SkyShares ( in development )', type: type });
	};
};

exports.edit = function(db) {
 	return function(req, res){
 		db.collection('data').findById(req.params.id, function(err,result) {
			console.log( 'Found data ( ' + err + ' ) : ' + result );
			if ( !err ) {
				res.render('editor', { title: 'SkyShares ( in development )', type: result.type, data: result });
			}
  		});
	};
};