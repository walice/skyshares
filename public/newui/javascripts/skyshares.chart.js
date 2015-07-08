;
(function() {

	var self = skyshares.chart = {
		colours : [
			'#006B77',
			'#E8112D',
			'#F95602',
			'#FFBB36',
			'#BCAD75',
			'#D6CEA3',
			'#F4EDD4',
			'#6B5E4F',
			'#A3A8A3'
		],
		charts : {},
		/*
			options = {
				groups : [ array of group names ],
				field : field name,
				range : {
					min : min year,
					max : max year,
					increment : year increment
				},
				format : function( value ) { return formated value },
				type : 'area-spline' | 'spline' | 'line'
				container : #container_div
			}
		*/
		generategrouplinechart : function( options ) {
			var self = skyshares.chart;
			//
			// create x axis
			//
			var x_axis = [ 'year' ];
			for ( var year = options.range.min; year <= options.range.max; year += options.range.increment ) {
				x_axis.push( year );
			}
			//
			// data
			//
			var	data = {
				x : 'year',
				columns: [
					x_axis,
				], 
				types: {}
			};
			if ( options.stacked ) {
				data.groups = [[]];
			}
			options.groups.forEach( function( group_name ) {
				var group = skyshares.controller.findgroup( group_name );
				if ( group ) {
					var row = [ group.description || group.name ];
					for ( var year = options.range.min; year <= options.range.max; year += options.range.increment ) {
						row.push( skyshares.controller.getgroupdatasum( group, options.field, year ) );
					}
					data.columns.push(row);
					data.types[ row[ 0 ] ] = options.type || 'area-spline';
					if ( data.groups ) {
						data.groups[ 0 ].push(row[ 0 ]);
					}
				}
			});
			if ( self.charts[ options.container ] ) {
				self.charts[ options.container ].load({ columns: data.columns });
			} else {
				self.charts[ options.container ] = c3.generate({
					bindto: '#' +  options.container,
					data: data,
					axis : {
						x : {
							tick: {
								rotate: 90
							}
						},
						y : {
							tick: {
								format : options.format
							},
							label: options.label_y
						}
					},
					tooltip: {
						show: false,
					},
					point: {
						show: false
					},
					color: {
						pattern: self.colours
					}
				});
			}
		},
		/*
			options = {
				groups : [ array of group names ],
				field : field name,
				range : {
					min : min year,
					max : max year,
					increment : year increment
				},
				format : function( value ) { return formated value },
				container : #container_div
			}
		*/
		generategroupbarchart : function( options ) {
			var self = skyshares.chart;
			//
			// create x axis
			//
			var categories = [];
			var x_axis = [ 'region' ];
			options.groups.forEach( function( group_name ) {
				var group = skyshares.controller.findgroup( group_name );
				if ( group ) {
					var label = group.description || group.name;
					categories.push( label );
					x_axis.push( label );
				}
			});
			//
			// data
			//
			var	data = {
				columns: [], 
				type: 'bar'
			};
			for ( var year = options.range.min; year <= options.range.max; year += options.range.increment ) {
				var column = [ year ];
				options.groups.forEach( function( group_name ) {
					var group = skyshares.controller.findgroup( group_name );
					if ( group ) {					
						column.push( skyshares.controller.getgroupdatasum( group, options.field, year ) );
					}
				});	
				data.columns.push( column );			
			}
			if ( self.charts[options.container] ) {
				self.charts[options.container].load({ columns: data.columns });
			} else {
				self.charts[options.container] = c3.generate({
					bindto: '#' + options.container,
					data: data,
					tooltip: {
						show: true
					},
					color: {
						pattern: self.colours
					},
					axis: {
						x: {
							type: 'category',
							categories: categories
						},
						y : {
							tick: {
								format: options.format
							},
							label: options.label_y
						}
					},
					grid: {
						y: {
							lines: [{value:0}]
						}
					},
					legend: {
						position: 'right'
					}
				});
			}
		},
		table : {
			createtable : function( options ) {
				function table( options ) {
					this.options = options;
					this.table = document.createElement( 'table' );
					if( options.id ) {
						this.table.id = options.id;
					}
					if ( options.columnheaders ) {
						this.addcolumnheaders( options.columnheaders, options.hasrowheaders  );
					}
					if ( options.rows ) {
						this.addrows( options.rows, options.hasrowheaders ); 
					}
				}
				table.prototype.addcolumnheaders = function( columnheaders, hasrowheaders ) {
					var row = document.createElement( 'tr' );
					for ( var i = ( hasrowheaders ? -1 : 0 ); i < columnheaders.length; i++ ) {
						header = document.createElement( 'th' );
						if ( i >= 0 ) {
							header.innerHTML = columnheaders[ i ];
						}
						row.appendChild( header );
					}
					this.table.appendChild( row );
				}
				
				table.prototype.addrows = function( rows, hasrowheaders ) {
					var row, col;
					for( var i = 0; i < rows.length; i++ ) {
						row = document.createElement('tr');
						if ( hasrowheaders ) {
							//
							// row header
							//
							col = document.createElement( 'th' );
							col.innerHTML = rows[ i ][ 0 ];
							row.appendChild( col );
						}
						//
						//
						//
						for ( var j = ( hasrowheaders ? 1 : 0 ); j < rows[ i ].length; j++ ) {
							col  = document.createElement( 'td' );
							col.innerHTML = rows[ i ][ j ];
							row.appendChild( col );
						}
						this.table.appendChild( row );
					}
				}
				
				table.prototype.loaddata = function( data ) {
					var rows = table.querySelectorAll( 'tr' );
					var row_base = this.options.columnheaders ? 1 : 0;
					for ( var i = 0; i < data.length; i++ ) {
						var cols = rows[ i + row_base ].querySelectorAll( 'td' );
					}
				}
				
				return new table( options );
			},
			/*
				options = {
					groups : [ array of group names ],
					field : field name,
					range : {
						min : min year,
						max : max year,
						increment : year increment
					},
					format : function( value ) { return formated value },
					container : #container_div
				}
			*/
			creategroupsumtable : function( options ) {
				var self = skyshares.chart.table;
				//
				// initialise table options
				//
				var table_options = {
					hasrowheaders : true,
					columnheaders : [],
					rows : [],
					id : options.id
				}
				//
				// generate column headers
				//
				for ( var i = options.range.min; i <= options.range.max; i += options.range.increment ) {
					table_options.columnheaders.push( i );	
				} 
				//
				// generate data
				//
				options.groups.forEach( function( group_name ) {
					var group = skyshares.controller.findgroup( group_name );
					if ( group ) {
						var row = [ group.description || group.name ];
						for ( var i = options.range.min; i <= options.range.max; i += options.range.increment ) {
							row.push( options.format( skyshares.controller.getgroupdatasum( group, options.field, i ) ) );
						} 
						table_options.rows.push( row );
					} else {
						console.log( 'skyshares.chart.table.creategroupsumtable : unable to find group ' + group_name );
					}
				} );
				//
				// create table
				//
				var table = self.createtable( table_options );
				//
				// attach table to container
				//
				if ( options.container ) {
					var container = document.getElementById( options.container );
					if ( container ) {
						container.innerHTML = '';
						container.appendChild( table.table );
					}
				}
				return table;
			},
		},
	}
	
})();

/*

		generatesummarytable : function() {
			var self = this;
			function createtable( data ) {
				var table = document.createElement( 'table' );
				//
				// table header
				//
				var header = document.createElement( 'th' );
				header.setAttribute( 'colspan', data.columnheaders.length + 1 );
				header.innerHTML = data.title;
				var row = document.createElement('tr');
				row.appendChild( header );
				table.appendChild( row );
				//
				// column headers
				//
				row = document.createElement('tr');
				for ( var i = -1; i < data.columnheaders.length; i++ ) {
					header = document.createElement( 'th' );
					if ( i >= 0 ) {
						header.innerHTML = data.columnheaders[ i ];
					}
					row.appendChild( header );
				}
				table.appendChild( row );
				//
				// rows
				//
				for( var i = 0; i < data.rows.length; i++ ) {
					row = document.createElement('tr');
					//
					// row header
					//
					var col = document.createElement( 'th' );
					col.innerHTML = data.rows[ i ].title;
					row.appendChild( col );
					//
					//
					//
					for ( var j = 0; j < data.rows[ i ].data.length; j++ ) {
						col  = document.createElement( 'td' );
						col.innerHTML = data.rows[ i ].data[ j ];
						row.appendChild( col );
					}
					table.appendChild( row );
				}
				return table;
			};

*/