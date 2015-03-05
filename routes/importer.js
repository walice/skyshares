/*
 * GET importmac page
 */

exports.import = function() {
 	return function(req, res){
 		var type = req.params.type;
  		res.render('importer', { title: 'SkyShares ( in development ) - import ', type: type });
	};
};
