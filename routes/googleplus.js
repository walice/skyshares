exports.get = function (db) {
    return function (req, res) {
    	var variables = {
			title: req.params.title,
			description: req.params.description,
			image: 'http://skyshares.org/media/' + req.params.id
		};
		console.log( 'googleplus : parameters : ' + JSON.stringify(variables) );
        res.render('googleplus', variables);
    }
};

