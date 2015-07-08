/*
 * GET importmac page
 */

exports.model = function() {
 	return function(req, res){
  		res.render('model', { title: 'SkyShares test alice git' });
	};
};
