exports.share = function (db) {
    return function (req, res) {
        var type = req.params.type;
        res.render('share', { title: 'Share', type: type });
    };
};