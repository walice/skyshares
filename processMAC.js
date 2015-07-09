#!node

var csv = require('csv');
var fs = require('fs');

// Retrieve
var MongoClient = require('mongodb').MongoClient;

// Connect to the db
MongoClient.connect("mongodb://localhost:27017/skyshares", function(err, db) {
	  if(!err) {
	  		//
	  		//
	  		//
			console.log("We are connected");
			//
			// base groups
			//
			var groups = {
				EU : {
					name: 'EU',
					description: '',
					type: 'group',
					members: []
				},
				G8 : {
					name: 'G8',
					description: '',
					type: 'group',
					members: []
				},
				G20 : {
					name: 'G20',
					description: '',
					type: 'group',
					members: []
				}
			};
			var group_column = [ 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14 ];
			var addtogroup = function( group, iso ) {
				var group_tag = group.replace(/[\s-]/g, '_');
				if ( groups[ group_tag ] === undefined ) {
					groups[ group_tag ] = {
						name: group,
						description: '',
						type: 'group',
						members: []
					};
				}
				groups[ group_tag ].members.push( iso );
			};
			//
			//
			//
			db.createCollection('country', function(err, collection) {
				if ( !err ) {
					console.log("We created collection");
					collection.drop();
					
					csv()
					.from.stream(fs.createReadStream('./csvs/Categories.csv'))
					.transform( function(row){
					  row.unshift(row.pop());
					  return row;
					})
					.on('record', function(row,index){
						if ( index > 9 ) {
							console.log('#'+( index - 9 )+' '+row[ 2 ]);
							var entry = {
								ISO : row[ 2 ], // ISO
								name: row[ 1 ], // name
								GNI: row[ 4 ]
								};
								for ( var i = 0; i < group_column.length; i++ ) {
									var group = row[ group_column[ i ] ];
									if ( group.length > 0 ) {
										addtogroup( group, entry.ISO );
									}
								}
							collection.insert(entry, function( err, result ) {
								if ( !err ) {
									console.log( "Inserted entry : " + result );
								} else {
									console.log( "Error inserting : " + err );
								}
							});
						}
					})
					.on('end', function(count){
						//
						// process groups
						//
						var data_collection = db.collection("data");
						data_collection.remove( { type: "group" }, function( err, result ) {
							if ( err ) {
								console.log('Error deleting groups: ' + err);	
							} else {
								console.log('Adding groups: ' + result);
								for ( var group in groups ) {
									console.log( JSON.stringify( groups[ group ] ) );
									data_collection.insert(groups[ group ], function(err, result) {
										if ( !err ) {
											console.log( "Inserted group : " + group );
										} else {
											console.log( "Error inserting group : " + group + " : " + err );
										}
									});
								}
							}
							process.exit();
						} );
					})
					.on('error', function(error){
					  console.log('Error : ' + error.message);
					  process.exit();
					}); 
					
					
					
				}
			});
		}
});
