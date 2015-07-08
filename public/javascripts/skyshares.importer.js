//
//
//
;
skyshares.importer = {
	//
	//
	//
	init : function( type ) {
		var self = skyshares.importer;
		self[ 'init' + type ]();
	},
	initcountries : function() {
		//
		//
		//
		var countries = [];
		//
		// groups
		//
		var groups = [];
		var group_column = [ 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13 ];
		var addtogroup = function( name, iso ) {
			var group = undefined;
			groups.every( function( current ) { // TODO: more convincing find
				if ( current.name === name ) {
					group = current;
					return false;
				}
				return true;
			} );
			if ( group === undefined ) {
				group = {
					name: name,
					description: '',
					type: 'group',
					members: []
				};
				groups.push(group);
			}
			group.members.push( iso );
		};
		//
		//
		//
		var categories = document.getElementById( 'categories' );
		if ( categories ) {
			var output = document.getElementById( 'output' );
			var upload = document.getElementById( 'upload' );
			upload.onclick = function( evt ) {
				//
				// upload countries
				//
				countries.forEach( function( country ) {
					skyshares.rest.post( '/country/' + country.name, country, {
						onloadend : function( evt ) {
							if ( skyshares.rest.iserror(evt) ) {
								alert( 'error uploading : ' + country.name + ' : ' + skyshares.rest.formaterror(evt) );
							}
						},
						onerror :  function( evt ) {
							alert( 'error uploading : ' + country.name + ' : ' + skyshares.rest.formaterror(evt) );
						}
					});
				});
				//
				// upload groups
				//
				groups.forEach( function( group ) {
					skyshares.rest.post( '/data', group, {
						onloadend : function( evt ) {
							if ( skyshares.rest.iserror(evt) ) {
								alert( 'error uploading : ' + group.name + ' : ' + skyshares.rest.formaterror(evt) );
							}
						},
						onerror :  function( evt ) {
							alert( 'error uploading : ' + country.name );
						}
					});
				});
			};
			categories.onchange = function(evt) {
				output.innerHTML = '';
				upload.style.visibility = 'hidden';
				var types = [ 'text.*' ];
				skyshares.filereader.readfile( categories, types, {
					onload : function( evt ) {
						//
						// process category data
						//
						var csv = evt.target.result;
						countries = [];
						groups = [];
						//
						//
						//
						skyshares.importer.processcsv( csv, {
							onrow : function( row, columns ) {
								if ( row > 9 ) {
									//
									// 
									//								
									var country = {
										iso : columns[ 1 ], // iso
										name: columns[ 0 ], // name
										GNI	: columns[ 3 ]
									};
									countries.push(country);
									
									for ( var i = 0; i < group_column.length; i++ ) {
										var group = columns[ group_column[ i ] ];
										if ( group.length > 0 ) {
											addtogroup( group, country.iso );
										}
									}
								}
							}
						} );
						//
						//
						//
						output.innerHTML += '<h1>Countries</h1>';
						countries.forEach( function( country ) {
							output.innerHTML += country.iso + ' : ' + country.name + ' : ' + country.GNI + '<br/>';
						} );
						output.innerHTML += '<h1>Groups</h1>';
						groups.forEach( function( group ) {
							output.innerHTML += group.name + ' : ' + group.members.join() + '<br/>';
						} );
						upload.style.visibility = 'visible';
						
					},
					onerror : function( evt ) {
						alert( 'Error reading Categories : ' + skyshares.filereader.errordescription( evt.target.error ) );
					}
				} );
				
			};
		}
	},
	//
	//
	//
	initmac : function() {
		//
		// private utility functions
		//
		var raw_mac = [];
		var countries = [];
		var getmacgroup = function( id ) {
			for ( var i = 0; i < raw_mac.length; i++ ) {
				if ( raw_mac[ i ].id == id ) {
					return raw_mac[ i ];
				}
			}
			return null;
		};
		var getcountrymacgroup = function( iso ) {
			for ( var i = 0; i < raw_mac.length; i++ ) {
				for ( var j = 0; j < raw_mac[ i ].members.length; j++ ) {
					if ( raw_mac[ i ].members[ j ].iso == iso ) {
						return raw_mac[ i ];
					}
				}
			}
			return null;
		};
		var getcountry = function( iso ) {
			for ( var i = 0; i < countries.length; i++ ) {
				if ( countries[ i ].iso == iso ) {
					return countries[ i ];
				}
			}
			return null;
		};
		//
		// hook file inputs
		//
		var mac = document.getElementById( 'mac' );
		if ( mac ) {
			mac.onchange = function(evt) {
				var types = [ 'text.*' ];
				skyshares.filereader.readfile( mac, types, {
					onload : function( evt ) {
						//
						// process mac data
						//
						var csv = evt.target.result;
						//
						//
						//
						var entry_count 		= 0;
						var rows_per_entry 		= 0;
						var columns_per_entry 	= 0;
						skyshares.importer.processcsv( csv, {
							onrow : function( row, columns ) {
								/*
								if ( row == 0 ) {
									//
									// get region mac codes
									//
									for ( var i = 0; i < columns.length; i += 7 ) {
										raw_mac.push( {
											id 			: columns[ i ],
											year		: [],
											mac 		: [ [], [], [], [], [], [], [] ],
											qreduc 		: [ [], [], [], [], [], [], [] ],
											members 	: [],
											emissions 	: 0
										} );
										//
										// download mac members
										//	
										skyshares.rest.get( '/data/byname/' + columns[ i ], {
												onloadend : function(e) {
													var request = e.target;
													var response = request.response === undefined ? request.responseText : request.response;
													var group = JSON.parse( response );
													if ( group ) {
														//
														// store members
														//
														var mac_group = getmacgroup(group.name);
														for ( var i = 0; i < group.members.length; i++ ) {
															var country = {
																iso: group.members[ i ],
																mac: group.name,
																emissions: 0.0, // get these from BAU later
																share: 0.0
															};
															countries.push( country );
															mac_group.members.push( country );	
														}
													}
				
												}
											} );
										
									}
								} else if ( row == 1 ) {
									for ( var i = 0; i < raw_mac.length; i++ ) {
										for ( var j = 1; j < 7; j += 2 ) {
											raw_mac[ i ].year.push( parseInt( columns[ ( i * 7 ) + j ] ) );
										}
									}	
								} else if ( row > 2 ) { // skip headers
									var level = row - 3;
									for ( var i = 0; i < raw_mac.length; i++ ) {
										var base_index = ( i * 7 ) + 1;
										for ( j = 0; j < 6; j += 2 ) {
											raw_mac[ i ].mac[ level ].push(parseFloat(columns[base_index+j]));
											raw_mac[ i ].qreduc[ level ].push(parseFloat(columns[base_index+j+1])*1000000.0); // convert to tonnes from 1,000,000 tonnes
										}
									}
								}
								
							}
							*/
								if ( row == 0 ) {
									//
									// get data spec
									//
									entry_count 		= parseInt( columns[ 1 ] );
									rows_per_entry 		= parseInt( columns[ 3 ] );
									columns_per_entry 	= parseInt( columns[ 4 ] );
								} else if ( row == 1 ) {
									//
									// get region mac codes
									//
									for ( var i = 0; i < columns.length; i += ( columns_per_entry + 1 ) ) {
										var mac_entry = {
											id 			: columns[ i ],
											year		: [],
											mac 		: [],
											qreduc 		: [],
											members 	: [],
											emissions 	: 0
										};
										//
										// initialise entry
										//
										for ( var row = 0; row < rows_per_entry; row++ ) {
											mac_entry.mac.push( [] );	
											mac_entry.qreduc.push( [] );	
										}
										for ( var col = 1; col < columns_per_entry + 1; col++ ) {
											mac_entry.year.push( parseInt( columns[ i + col ] ) );
										}
										raw_mac.push( mac_entry );
										//
										// download mac members
										//
										var group_url = '/data/byname/' + columns[ i ];
										console.log( 'downloading : ' + group_url );	
										skyshares.rest.get( '/data/byname/' + columns[ i ], {
												onloadend : function(e) {
													var request = e.target;
													var response = request.response === undefined ? request.responseText : request.response;
													var group = JSON.parse( response );
													if ( !group || !( group.name && group.members ) ) {
														console.log( 'invalid group at : ' +  request.responseURL );
													} else {
														//
														// store members
														//
														var mac_group = getmacgroup(group.name);
														for ( var i = 0; i < group.members.length; i++ ) {
															var country = getcountry(group.members[ i ]);
															if ( !country ) {
																country = {
																	iso: group.members[ i ],
																	mac: group.name,
																	name: "", // get these from BAU later
																	emissions: 0.0, 
																	share: 0.0
																};
																countries.push( country );
															}
															mac_group.members.push( country );	
														}
													}
			
												}
											} );
									}
								} else {
									var level = row - 2;
									if ( level < rows_per_entry ) {
										for ( var i = 0; i < raw_mac.length; i++ ) {
											var base_index = ( i * columns_per_entry ) + 1;
											for ( j = 1; j < columns_per_entry + 1; j++ ) {
												raw_mac[ i ].mac[ level ].push(parseFloat(columns[base_index]));
												raw_mac[ i ].qreduc[ level ].push(parseFloat(columns[base_index+j])*1000000.0); // convert to tonnes from 1,000,000 tonnes
											}
										}
									}
								}
							}
						});
						//
						// display results
						//
						var output = document.getElementById( 'mac_output' );
						if ( output ) {
							output.innerHTML = '';
							raw_mac.forEach( function( entry ) {
								var table = '<table class="data" style="display: inline-table; margin: 8px;">';
								//
								// header
								//
								table += '<tr class="data">';
								table += '<td class="data"><strong>' + entry.id + '</strong></td>';
								for ( var i = 0; i < ( entry.mac[ 0 ].length * 2 ) - 1; i++ ) {
									table += '<td> </td>';
								}
								table += '</tr>';
								table += '<tr class="data">';
								for ( var i = 0; i < entry.year.length; i++ ) {
									table += '<td><strong>' + entry.year[ i ] + '</strong></td>';
									table += '<td></strong></td>';
								}
								table += '</tr>';
								table += '<tr class="data">';
								for ( var i = 0; i < entry.mac[ 0 ].length; i++ ) {
									table += '<td><strong>mac</strong></td>';
									table += '<td><strong>qreduc</strong></td>';
								}
								table += '</tr>';
								for ( var i = 0; i < entry.mac.length; i++ ) {
									if ( i % 2 ) {
										table += '<tr class="data odd">';
									} else {
										table += '<tr class="data even">';
									}
									for ( var j = 0; j < entry.mac[ i ].length; j++ ) {
										table += '<td class="data" style="width: 64px">' + entry.mac[ i ][ j ] + '</td>';
										table += '<td class="data" style="width: 64px">' + entry.qreduc[ i ][ j ] + '</td>';
									}
									table += '</tr>';
								}
								table += '</table>';
								output.innerHTML += table;
							});
						}
						//
						// enable bau
						//
						var bau = document.getElementById( 'bau' );
						if ( bau ) {
							bau.style.visibility = 'visible';
						}
						
					},
					onerror : function( evt ) {

						alert( 'Error reading MAC : ' + skyshares.filereader.errordescription( evt.target.error ) );
					}
				} );
				mac.value = '';
			}	
		}
		var bau_data = [];
		var bau = document.getElementById( 'bau' );
		if ( bau ) {
			bau.onchange = function(evt) {
				var types = [ 'text.*' ];
				skyshares.filereader.readfile( bau, types, {
					onload : function( evt ) {
						//
						// process bau data
						//
						var csv = evt.target.result;
						//
						// import country emissions
						//
						skyshares.importer.processcsv( csv, {
							onrow : function( row, columns ) {
								if ( row > 1 ) { // skip headers
									var country = getcountry( columns[ 0 ] );
									
									if ( country ) {
										country.name = columns[ 1 ];
										country.emissions = parseFloat( columns[ 3 ] );
										var mac_group = getmacgroup( country.mac );
										if ( mac_group ) {
											mac_group.emissions += country.emissions;
										}
									}	
									console.log( 'in [' + columns.join() + ']' );								
									console.log( 'out [' + country.iso + ':' + country.name + ':' + country.emissions + ']' );								
								}
							}
						});
						//
						// calculate country shares
						//
						for ( var i = 0; i < countries.length; i++ ) {
							var mac_group = getmacgroup( countries[ i ].mac );
							if ( mac_group ) {
								countries[ i ].share = countries[ i ].emissions / mac_group.emissions;
								console.log( '[' + countries[ i ].iso + ':' + countries[ i ].mac + '] emissions:' + countries[ i ].emissions + ' group emissions:' + mac_group.emissions + ' share:' + countries[ i ].share );	
							}
						}
						//
						//
						//
						countries.sort( function( a, b ) {
							return a.name.localeCompare(b.name);
						});					
						//
						// output results
						//
						var output = document.getElementById( 'bau_output' );
						if ( output ) {
							output.innerHTML = '';
							var filename = "baushare";
							var excel = '<a download="' + filename + '.xls" href="#" onclick="return ExcellentExport.excel(this, \'' + filename + '\', \'' + filename + '\');">Export to Excel</a>';
							var csv = '<a download="' + filename + '.csv" href="#" onclick="return ExcellentExport.csv(this, \'' + filename + '\');">Export to CSV</a>';
							output.innerHTML += '<div>' + excel + '&nbsp;' + csv;
							var table = '<table class="data" style="display: inline-table; margin: 8px;">';
							table += '<tr class="data">';
							table += '<td><strong>name</strong></td>';
							table += '<td><strong>iso</strong></td>';
							table += '<td><strong>mac</strong></td>';
							table += '<td><strong>emissions</strong></td>';
							table += '<td><strong>share</strong></td>';
							table += '</tr>';
							var odd = true;
							countries.forEach( function( country ) {
								table += odd ? '<tr class="data odd">' : '<tr class="data even">';
								table += '<td class="data">' + country.name + '</td>';
								table += '<td class="data">' + country.iso + '</td>';
								table += '<td class="data">' + country.mac + '</td>';
								table += '<td class="data">' + country.emissions + '</td>';
								table += '<td class="data">' + country.share + '</td>';
								table += '</tr>';
							});
							table += '</table>';
							output.innerHTML += table;
						}
					},
					onerror : function( evt ) {
						alert( 'Error reading BAU : ' + skyshares.filereader.errordescription( evt.target.error ) );
					}
				} );
				bau.value = '';
			}	
		}
		//
		// process raw MAC and qREDUC data into country shares
		//
		var process = document.getElementById( 'process' );
		if ( process ) {
			process.onclick = function(e ) {
				//
				//
				//
				var results = document.getElementById( 'results' );
				results.innerHTML = '';
				//
				// create MAC datasets 
				//
				var mac_datasets = [];
				var mac_prefix = document.getElementById( 'mac_prefix' ).value;
				for ( var i = 0; i < raw_mac[ 0 ].year.length; i++ ) {
					var year = raw_mac[ 0 ].year[ i ];
					var mac_entry = {
						name: mac_prefix + '_' + year,
						description: year + ' MAC data',
						year: year,
						type: 'dataset',
						index: {
							type : 'ISO'
						},
						members: []
					};
					mac_datasets.push(mac_entry);
				}
				//	
				// process country MAC data
				//
				countries.forEach( function( country ) {
					var mac_group = getcountrymacgroup( country.iso );
					//
					// 
					//
					for ( var year = 0; year < mac_datasets.length; year++ ) {
						var mac_dataset = mac_datasets[ year ];
						var member = {
							iso 	: country.iso,
							name	: country.name,
							index 	: {
								type: 		'INT',
								min_index: 	0,
								max_index: 	mac_group.mac.length
							},
							dimension: 2,
							data	: []
						};
						//
						// factor by country share
						//
						for ( var level = 0; level < mac_group.mac.length; level++ ) {
							var data_point = {
								x : mac_group.mac[level][year],
								y : mac_group.qreduc[level][year]*country.share // quantity of abated emissions proxied by share of total
							};
							member.data.push( data_point );
						}
						mac_dataset.members.push( member );
					}
				});
				//
				// save
				//
				var output = document.getElementById( 'process_output' );
				output.innerHTML = '';
				mac_datasets.forEach( function( dataset ) {
					//
					// sort by name
					//
					dataset.members.sort( function( a, b ) {
						return a.name.localeCompare(b.name);
					});					
					//
					// post
					//
					console.log( 'posting: ' + dataset.name );
					skyshares.rest.post( '/mac/' + dataset.name, dataset, {
						onloadend : function( e ) {
							var request = e.target;
							if ( request.status === 200 ) {
								alert( dataset.name + ' added to database!' );
							} else {
								alert( 'Failed to add ' + dataset.name + ' : ' + request.status + ' : ' + request.statusText );
							}
						},
						onerror : function( e ) {
							var request = e.target;
							alert( 'Failed to add ' + dataset.name + ' : ' + request.status + ' : ' + request.statusText );
						}
					});
					//
					// output results
					//
					if ( output ) {
						output.innerHTML += '<h3>' + dataset.name + '</h3>';
						var filename = dataset.name;
						var excel = '<a download="' + filename + '.xls" href="#" onclick="return ExcellentExport.excel(this, \'' + filename + '\', \'' + filename + '\');">Export to Excel</a>';
						var csv = '<a download="' + filename + '.csv" href="#" onclick="return ExcellentExport.csv(this, \'' + filename + '\');">Export to CSV</a>';
						output.innerHTML += '<div>' + excel + '&nbsp;' + csv;
						var table = '<table id="macdata" class="data" style="display: inline-table; margin: 8px;">';
						table += '<tr class="data">';
						table += '<td><strong>name</strong></td>';
						table += '<td><strong>iso</strong></td>';
						for ( var i = 0; i < dataset.members[ 0 ].data.length; i++ ) {
							table += '<td><strong>mac</strong></td>';
							table += '<td><strong>qreduc</strong></td>';
						}
						table += '</tr>';
						var odd = true;
						dataset.members.forEach( function( country ) {
							table += odd ? '<tr class="data odd">' : '<tr class="data even">';
							table += '<td class="data">' + country.name + '</td>';
							table += '<td class="data">' + country.iso + '</td>';
							for ( var i = 0; i < country.data.length; i++ ) {
								table += '<td class="data">' + country.data[ i ].x + '</td>';
								table += '<td class="data">' + country.data[ i ].y + '</td>';
							}
							table += '</tr>';
						});
						table += '</table>';
						output.innerHTML += table;
					}
				});
				//
				//
				//
				var mac = {
					name: 'MAC',
					description: 'MAC data',
					type: 'dataset',
					index: {
						type : 'INT'
					},
					members: mac_datasets
				};
				/*
				skyshares.rest.post( '/data', mac, {
					onloadend : function( e ) {
						var request = e.target;
						if ( request.status === 200 ) {
							alert( mac.name + ' added to database!' );
						} else {
							alert( 'Failed to add ' + dataset.name + ' : ' + request.status + ' : ' + request.statusText );
						}
					},
					onerror : function( e ) {
						var request = e.target;
						alert( 'Failed to add ' + dataset.name + ' : ' + request.status + ' : ' + request.statusText );
					}
				});
				*/
			}
		}
	},
	initbau : function() {
		//
		//
		//
		var process = document.getElementById( 'process' );
		if ( process ) {
			process.onclick = function( evt ) {
				//
				// download qCO2
				//
				skyshares.rest.get( '/data/dataset/qCO2', {
					onloadend : function( evt ) {
						var request = evt.target;
						if ( request.status === 200 ) {
							//
							//
							//
							var response = request.response === undefined ? request.responseText : request.response;
							var qCO2 = JSON.parse( response );
							if ( qCO2 ) {
								//
								// download GDPReal
								// 
								skyshares.rest.get( '/data/dataset/GDPReal', {
									onloadend : function( evt ) {
										var request = evt.target;
										if ( request.status === 200 ) {
											//
											//
											//
											var response = request.response === undefined ? request.responseText : request.response;
											var GDPReal = JSON.parse( response );
											if ( GDPReal ) {
												//
												// generate BAU
												//
												var qBAU = {
													name: 'qBAU',
													description: 'Business as usual emissions',
													type: 'dataset',
													index : {
														type : 'ISO'
													},
													members : []
												};
												var member_index = {
													type : 'DATE',
													min_index : 2009,
													max_index : 2100
												};
												for ( var i = 0; i < qCO2.members.length; i++ ) {
													var country_qCO2 = qCO2.members[ i ];
													var bau = skyshares.math.getcolumn(qCO2,i,2009);
													var member = {
														iso 	: country_qCO2.iso,
														index 	: member_index,
														dimension : 1,
														data 	: []
													};
													member.data.push( bau );
													for ( var t = member_index.min_index + 1; t <= member_index.max_index; t++ ) {
														bau = bau * ( skyshares.math.getcolumn(GDPReal,i,t) / skyshares.math.getcolumn(GDPReal,i, t-1 ) );
														member.data.push( bau );
													} 
													qBAU.members.push( member );
												} 
												//
												// post
												//
												skyshares.rest.post( '/data', qBAU, {
													onloadend : function( evt ) {
														var request = evt.target;
														if ( request.status === 200 ) {
															alert( qBAU.name + ' added to database!' );
														} else {
															alert( 'Failed to add ' + qBAU.name + ' : ' + request.status + ' : ' + request.statusText );
														}
													},
													onerror : function( evt ) {
														var request = evt.target;
														alert( 'Failed to add ' + qBAU.name + ' : ' + request.status + ' : ' + request.statusText );
													}
												});
											}
										} else {
											alert( 'Failed to load GDPReal : ' + request.status + ' : ' + request.statusText );
										}
									},
									onerror : function( evt ) {
										var request = evt.target;
										alert( 'Failed to load GDPReal : ' + request.status + ' : ' + request.statusText );
									}
								}); 
							}
						} else {
							alert( 'Failed to load qCO2 : ' + request.status + ' : ' + request.statusText );
						}
					},
					onerror : function( evt ) {
						var request = evt.target;
						alert( 'Failed to load qCO2 : ' + request.status + ' : ' + request.statusText );
					}
				}); 
			};
		}
	},
	initmap : function() {
		var self = skyshares.importer;
		//
		// download countries
		//
		var countries = [];
		skyshares.rest.get( '/country', {
			onloadend : function(evt) {
				var items = skyshares.rest.parseresponse(evt);
				if ( items ) {
					countries = items;
				}
			}
		});
		//
		// hook svg button
		//
		var map = null;
		var svg = document.getElementById( 'svg' );
		svg.onchange = function(evt) {
			var types = [ 'image/*' ];
			skyshares.filereader.readfile( svg, types, {
				onload : function( evt ) {
					//
					// process svg
					//
					map = paper.project.importSVG(evt.target.result);
					//
					// get all path points
					//
					var points = [];
					var polygons = [];
					function getpointindex( x, y ) {
						var index = -1;
						for ( var i = 0; i < points.length; i++ ) {
							//if ( points[ i ].distance( x, y ) < 0.01 ) {
							if ( points[ i ].distance( x, y ) < 0.5 ) {
								index = i;
								break;
							}
						}
						if ( index == -1 ) {
							index = points.length;
							points.push( new point( x, y ) );
						}
						return index;
					};
					
					function point( x, y ) {
						this.x = x;
						this.y = y;
						this.paths = [];
					};
					point.prototype.distance = function( x, y ) {
						var dx = x - this.x;
						var dy = y - this.y;
						
						return Math.sqrt( dx * dx + dy * dy );
					};
					function path( id ) {
						this.id = id;
						this.points = [];
					};
					path.prototype.addpoint = function( x, y ) {
						var point_index = getpointindex( x, y );
						if ( points[ point_index ].paths.indexOf( this.id ) < 0 ) {
							points[ point_index ].paths.push(this.id);
						}
						//console.log( 'point_index: ' + point_index + ' x:' + x + ' y:' + y );
						this.points.push( point_index );
						
					}
					function polygon( iso ) {
						this.iso = iso;
						this.paths = [];
					};
					polygon.prototype.addpath = function( path ) {
						this.paths.push( path );
					};
					//
					// extract points
					//
					var currentGroup = null;
					var currentPolygon = null;
					function extractpoints( item ) {
						if ( currentPolygon != null && item.className === 'Path' ) {
							var currentPath = new path( item.name );
							item.segments.forEach( function( segment ) {
								currentPath.addpoint( segment.point.x, segment.point.y );
							});
							currentPolygon.addpath( currentPath );
						} else if ( item.className === 'Group' ) {
							currentGroup = item;
							var iso = "";
							try {
								iso = currentGroup.name.substr( 1 );
							} catch( error ) {
							
							}
							if ( iso.length == 3 ) {
								currentPolygon = new polygon( iso );
								polygons.push(currentPolygon);
							} else {
								currentPolygon = null;
							}
						}
						if ( item.children ) {
							item.children.forEach( function( child ) {
								extractpoints( child );
							} );
						}
					}
					extractpoints( map );
					paper.project.activeLayer.removeChildren();
					//
					// generate compound paths
					//
					var min_area = Number.MAX_VALUE;
					var max_area = Number.MIN_VALUE;
					polygons.forEach( function( _polygon ) {
						var _paperGroup = new paper.Group();
						_paperGroup.name = _polygon.iso;
						_polygon.paths.forEach( function( _path ) {
							var _paperPath = new paper.Path();
							_paperPath.name = _path.name;
							_path.points.forEach( function( point_index ) {
								var p = points[ point_index ];
								_paperPath.add( new paper.Segment( new paper.Point( p.x, p.y ) ) );
							});
							_paperPath.closed = true;
							_paperPath.style = {
    							fillColor: '#777777',
    							strokeColor: '#FFFFFF',
    							strokeWidth: 1
    						};
    						var area = _paperPath.area;
    						if ( area < min_area ) min_area = area;
    						if ( area > max_area ) max_area = area;
    						if ( area > 24.0 || _paperGroup.children.length == 0 ) {
								_paperGroup.addChild( _paperPath );
								_paperPath.onClick = function() {
									console.log( 'area: ' + this.area );
								};
							}
						});
						paper.project.activeLayer.addChild(_paperGroup);
					});
					console.log( 'min_area: ' + min_area + ' max_area: ' + max_area );
					/*
					var output = document.getElementById( 'output' );
					if ( output ) {
						output.value = map.exportSVG( { asString: true } );
					}
					*/
					document.body.appendChild( paper.project.exportSVG() );
					paper.view.draw();
				},
				onerror : function( evt ) {
					alert( 'Error reading SVG : ' + skyshares.filereader.errordescription( evt.target.error ) );
				}
			} );
			svg.value = '';
		};
		//
		//
		//
		var canvas = document.getElementById( 'map' );
		paper.setup( canvas );
		
	},
	//
	// common utilities
	//
	processcsv : function( csv, delegate ) {
		//
		//
		//
		var processrow = function( row ) {
			//
			//
			//
			var quote_start = null;
			var column = "";
			var columns = [];
			for ( var i = 0; i < row.length; i++ ) {
				if ( row[ i ] == '"' ) {
					if ( quote_start ) {
						quote_start = null;
					} else {
						quote_start = row[ i ];
					}
				} else if ( row[ i ] == ',' ) {
					if ( quote_start == null ) {
						columns.push( column );
						column = "";
					}
				} else {
					column += row[ i ];
				}
			}
			if ( column.length > 0 ) columns.push( column );
			return columns;
		}
		//
		// split data into lines
		//
		var processrows = function( data ) {
			var row = 0
			var end = 0;
			var start = 0;
			while(true) {
				var offset = data.indexOf( '\n', start );
				if ( offset == -1 ) {
					if ( start < data.length ) {
						//
						// last line
						//
						end = data.length - 1;
						var columns = processrow( csv.substr( start, ( end - start ) ) );
						delegate.onrow( row, columns );
					}
					break;
				}
				end = offset;
				var columns = processrow( csv.substr( start, ( end - start ) ) );
				delegate.onrow( row, columns );
				row++;
				start = offset + 1;
			}
			if ( end < data.length ) {
			
			}
		}
		processrows( csv );
	}
};