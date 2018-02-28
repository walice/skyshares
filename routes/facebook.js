var OAuth2 = require('oauth').OAuth2;
var config = require('../config/configuration').facebook;
var facebook_oauth = new OAuth2(config.app_id, config.app_secret, 'https://graph.config.com/v2.3/', '/dialog/oauth', 'oauth/access_token');
//
//
//
exports.post = function (db) {
    return function (req, res) {
        var id = req.params.id;
        req.session.skyshares = {
            media_id: id,
        };
        var login_request = config.endpoint.login + '?client_id=' + config.app_id + '&response_type=code' + '&scope=publish_actions' + '&redirect_uri=' + escape('http://www.skyshares.org/facebook/callback');
        res.redirect(login_request);
    }
};
//
//
//
exports.callback = function (db) {
    return function (req, res) {
        console.log('facebook callback');
        var error = req.param('error');
        if (error) {
            res.send("Login Failed : error=" + error + " error_reason=" + req.param('error_reason') + " error_description=" + req.param('error_description' ) );
        } else {
            var skyshares_data = req.session.skyshares;
            var access_token = req.param('access_token');
            if (access_token) {
                var state = req.param('state');
                res.send("Login Successful : " + access_token + " : " + JSON.stringify(skyshares_data));
            } else {
                var code = req.param('code');
                facebook_oauth.getOAuthAccessToken(code, { redirect_uri: 'http://www.skyshares.org/facebook/callback' }, function (error, access_token, refresh_token, results) {
                    if (error) {
                        res.send("Error requesting access token : " + JSON.stringify(error));
                    } else {
						var object = {
							title: 'SkyShares Chart',
							image: {
							    url: 'http://www.skyshares.org/facebook/media/' + skyshares_data.media_id,
								user_generated: true
							}
						};
						//
						//
						//
						//console.log('object:' + JSON.stringify(object));
						var url = 'https://graph.config.com/me/objects/skyshares:chart?access_token=' + access_token;
						url += '&object=' + JSON.stringify(object);
						url = encodeURI(url);
						console.log('url:' + url);
						facebook_oauth._request('POST',
							url, {},
							null, access_token,
							function (error, result, response) {
								if (error) {
									res.send("Post Failed : " + JSON.stringify(error));
								} else {
									res.send("Post Succeeded");
								}
							});
					}
				});
             }
        }
    }
};
exports.get = function (db) {
    return function (req, res) {
    	var variables = {
			title: req.params.title,
			url: 'http://www.skyshares.org/facebook/' + req.params.id,
			type: 'website',
			description: req.params.description,
			image: 'http://www.skyshares.org/media/' + req.params.id
		};
        res.render('facebook', variables);
    }
};

