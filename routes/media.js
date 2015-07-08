//
//
//
function genuid() {
    return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
//
//
//
exports.post= function (db) {
    return function (req, res) {
        var hash = req.body.hash;
        db.collection('media').findOne( {hash:hash}, function( err, result ) {
			if ( !result ) {
				var media = req.body;
				media.id = genuid();
				db.collection('media').insert(req.body, function(err, result){
					if ( err ) {
						res.json( 500, { status: 'ERROR', message: 'Server error ' + err } );
					} else {
						res.json( 200, { status: 'OK', message: 'Media added ' + media.id, id: media.id } );
					}
				});	
			} else {
				res.json( 200, { status: 'OK', message: 'Media added ' + result.id, id: result.id } );
			}
		});
    };
}
//
//
//
exports.get = function (db) {
    return function (req, res) {
        var id = req.params.id;
        db.collection('media').findOne( {id:id}, function( err, result ) {
			if ( result ) {
				var image_parts = result.media.split(',');
				var base_64_image_data = new Buffer(image_parts[1], 'base64');
				var img = new Buffer(base_64_image_data, 'base64');
				res.writeHead(200, {
					'Content-Type': 'image/png',
					'Content-Length': img.length
				});
				res.end(img);
			} else {
				var error = '<html><head><title>Image no longer available</title></head><body>Nothing here</body></html>';
				res.writeHead(404, {
					'Content-Type': 'text/html',
					'Content-Length': error.length
				});
				res.end(error);
			}
		});
    }
}

