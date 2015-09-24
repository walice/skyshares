
/*
 * GET admin page.
 */

exports.admin = function(req, res){
  res.render( 'admin', { title: 'SkyShares Admin (Note: changing variables here will change the way the model works)', mode: 'admin' } );
};