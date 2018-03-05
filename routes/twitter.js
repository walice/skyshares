var config = require('../config/configuration').twitter;
var OAuth = require('oauth').OAuth;
var twitter_oauth = new OAuth(config.requestUrl, config.accessUrl, config.consumerKey, config.consumerSecret, config.version, config.authorizeCallback, config.signatureMethod);

exports.commitmedia = function (db) {
    return function (req, res) {
        var id = req.params.id;
        var text = req.params.text;
        twitter_oauth.getOAuthRequestToken(function (error, oauth_token, oauth_token_secret, results) {
            if (error) {
                console.log(error);
                res.send("Authentication Failed : " + JSON.stringify(error));
            } else {
                req.session.oauth = {
                    token: oauth_token,
                    token_secret: oauth_token_secret
                };
                req.session.skyshares = {
                    media_id: id,
                    text: text
                };
                console.log(req.session.oauth);
                res.redirect('https://twitter.com/oauth/authenticate?oauth_token=' + oauth_token)
            }
        });
    }
};
//
//
//
exports.callback = function (db) {
	return function (req, res) {
		if (req.session.oauth) {
			req.session.oauth.verifier = req.query.oauth_verifier;
			var oauth_data = req.session.oauth;
			var skyshares_data = req.session.skyshares;
			console.log( 'twitter oauth session data : ' + JSON.stringify(req.session) );
			twitter_oauth.getOAuthAccessToken(
				oauth_data.token,
				oauth_data.token_secret,
				oauth_data.verifier,
				function (error, oauth_access_token, oauth_access_token_secret, results) {
					if (error) {
						console.log(error);
						res.send("Authentication Failure : " + JSON.stringify(error));
					} else {
						req.session.access_token = oauth_access_token;
						req.session.access_token_secret = oauth_access_token_secret;
						console.log(results, req.session.oauth);
						db.collection('media').findOne( {id:skyshares_data.media_id}, 
							function( err, result ) {
										if ( result ) {
											var image_parts = result.media.split(',');
											//
											// upload media
											//
											twitter_post(
												twitter.endpoint.media_upload,
												oauth_access_token,
												oauth_access_token_secret,
												{ media: image_parts[ 1 ] },
												"application/octet-stream",
												function (error, data, response) {
													var post_text = skyshares_data.text || '#skyshares';
													if (error) {
														res.send("Media Upload Failure : " + JSON.stringify(error));
													} else {
														//
														// post tweet
														//
														var image_data = JSON.parse(data);
														twitter_post(
															twitter.endpoint.update_statuses,
															oauth_access_token,
															oauth_access_token_secret,
															{ status: post_text, media_ids: [image_data.media_id_string] },
															null,
															function (error, data, response) {
															if (error) {
																res.send("Post Failure : " + JSON.stringify(error) + " : " + JSON.stringify(image_data));
															} else {
																res.send("Post Successful");
															}
														});
													}
												});
								} else {
									res.send("Authentication Successful : " + JSON.stringify(req.session));							
								}
							});
					// res.redirect('/'); // You might actually want to redirect!
				}
			});
		} else {
			res.send("Authentication Failed");
			// res.redirect('/'); // Redirect to login page
		}
	}
};
