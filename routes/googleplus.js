exports.get = function (db) {
    return function (req, res) {
    	var variables = {
			title: req.params.title,
			description: req.params.description,
			image: 'http://skyshares.org/media/' + req.params.id
		};
		console.log( 'googleplus : parameters : ' + JSON.stringify(varables) );
        res.render('googleplus', variables);
    }
};

