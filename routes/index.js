
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'SkyShares ( in development )', mode: 'index' } );
};