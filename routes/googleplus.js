exports.get = function (db) {
    return function (req, res) {
    	var variables = {
			title: req.params.title,
			description: req.params.description,
			image: 'http://skyshares-soda.rhcloud.com/media/' + req.params.id
		};
        res.render('googleplus', variables);
    }
};

