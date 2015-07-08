var OAuth = require('oauth').OAuth;
var twitter_oauth = new OAuth(
      "https://api.twitter.com/oauth/request_token",
      "https://api.twitter.com/oauth/access_token",
      "jmBunSo7KrXa5IqTIpVu107E6",
      "sxWDO0HsftklouBXuvnYpCKifHWoSldXT0LET1MjSY5xk7RwlV",
      "1.0",
      "http://skyshares-walice.rhcloud.com/twitter/callback",
      "HMAC-SHA1"
    );
var twitter_endpoint = {
    media_upload: 'https://upload.twitter.com/1.1/media/upload.json',
    update_statuses: 'https://api.twitter.com/1.1/statuses/update.json'
};
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
			twitter_oauth.getOAuthAccessToken(
				oauth_data.token,
				oauth_data.token_secret,
				oauth_data.verifier,
				function (error, oauth_access_token, oauth_access_token_secret, results) {
					if (error) {
						console.log(error);
						res.send("Authentication Failure : " + JSON.stringify(error));
					} else {
						req.session.oauth.access_token = oauth_access_token;
						req.session.oauth.access_token_secret = oauth_access_token_secret;
						console.log(results, req.session.oauth);
						db.collection('media').findOne( {id:skyshares_data.media_id}, 
							function( err, result ) {
										if ( result ) {
											var image_parts = result.media.split(',');
											//
											// upload media
											//
											twitter_oauth.post(
												twitter_endpoint.media_upload,
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
														twitter_oauth.post(
															twitter_endpoint.update_statuses,
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
