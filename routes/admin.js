
/*
 * GET admin page.
 */

exports.admin = function(req, res){
  res.render( 'admin', { title: 'SkyShares - Admin ( in development )', mode: 'admin' } );
};