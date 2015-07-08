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
		generategrouplinechart: function (options) {
		    setTimeout(function () {
		        var self = skyshares.chart;
		        //
		        // create x axis
		        //
		        var x_axis = ['year'];
		        for (var year = options.range.min; year <= options.range.max; year += options.range.increment) {
		            x_axis.push(year);
		        }
		        //
		        // data
		        //
		        var data = {
		            x: 'year',
		            columns: [
                        x_axis,
		            ],
		            types: {}
		        };
		        if (options.stacked) {
		            data.groups = [[]];
		        }
		        options.groups.forEach(function (group_name) {
		            var group = skyshares.controller.findgroup(group_name);
		            if (group) {
		                var row = [group.description || group.name];
		                for (var year = options.range.min; year <= options.range.max; year += options.range.increment) {
		                    if (options.f) {
		                        row.push(options.f(group, options.field, year, options.range.increment));
		                    } else {
		                        if (options.average) {
		                            row.push(skyshares.controller.getgroupdataavg(group, options.field, year, options.range.increment));
		                        } else {
		                            row.push(skyshares.controller.getgroupdatasum(group, options.field, year));
		                        }
		                    }
		                }
		                data.columns.push(row);
		                data.types[row[0]] = options.type || 'area-spline';
		                if (data.groups) {
		                    data.groups[0].push(row[0]);
		                }
		            }
		        });
		        if (self.charts[options.container]) {
		            self.charts[options.container].load({ columns: data.columns });
		        } else {
		            self.charts[options.container] = c3.generate({
		                bindto: '#' + options.container,
		                data: data,
		                axis: {
		                    x: {
		                        tick: {
		                            rotate: 90
		                        }
		                    },
		                    y: {
		                        tick: {
		                            format: options.format
		                        },
		                        label: options.label_y
		                    }
		                },
		                tooltip: {
		                    show: true,
		                },
		                point: {
		                    show: false
		                },
		                color: {
		                    pattern: self.colours
		                }
		            });
		        }
		    }, options.delay || 10 );
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
		generategroupbarchart: function (options) {
		    setTimeout(function () {
		        var self = skyshares.chart;
		        //
		        // create x axis
		        //
		        var categories = [];
		        var x_axis = ['region'];
		        options.groups.forEach(function (group_name) {
		            var group = skyshares.controller.findgroup(group_name);
		            if (group) {
		                var label = group.description || group.name;
		                categories.push(label);
		                x_axis.push(label);
		            }
		        });
		        //
		        // data
		        //
		        var data = {
		            columns: [],
		            type: 'bar'
		        };
		        for (var year = options.range.min; year <= options.range.max; year += options.range.increment) {
		            var column = [year];
		            options.groups.forEach(function (group_name) {
		                var group = skyshares.controller.findgroup(group_name);
		                if (group) {
		                    if (options.f) {
		                        column.push(options.f(group, options.field, year, options.range.increment));
		                    } else {
                                if (options.average) {
                                    column.push(skyshares.controller.getgroupdataavg(group, options.field, year, options.range.increment));
                                } else {
                                    column.push(skyshares.controller.getgroupdatasum(group, options.field, year));
                                }
		                    }
		                }
		            });
		            data.columns.push(column);
		        }
		        if (self.charts[options.container]) {
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
		                    y: {
		                        tick: {
		                            format: options.format
		                        },
		                        label: options.label_y
		                    }
		                },
		                grid: {
		                    y: {
		                        lines: [{ value: 0 }]
		                    }
		                },
		                legend: {
		                    position: 'right'
		                }
		            });
		        }
		    }, options.delay || 10);
		},
		generateemisionschart: function () {
		    setTimeout(function () {
		        var self = skyshares.chart;
		        //
		        // create x axis
		        //
		        var x_axis = ['year'];
		        for (var year = 1990; year <= 2200; year++) {
		            x_axis.push(year);
		        }
		        //
		        // data
		        //
		        var emissions = ['emissions'].concat(skyshares.controller.world_emissions);
		        var data = {
		            x: 'year',
		            columns: [
                        x_axis,
                        emissions
		            ],
		            types: {
		                emissions: 'area-spline'
		            }
		        };
		        if (self.charts['emissions']) {
		            self.charts['emissions'].load({ columns: data.columns });
		        } else {
		            self.charts['emissions'] = c3.generate({
		                bindto: '#emissions-chart',
		                data: data,
		                axis: {
		                    x: {
		                        tick: {
		                            rotate: 90
		                        }
		                    },
		                    y: {
		                        tick: {
		                            format: function (value) {
		                                return skyshares.utility.formatcurrency(value / 1000000000, 0, ",", ".", "");
		                            }
		                        },
		                        label: {
		                            text: 'GigaTonnes of CO₂',
		                            position: 'outer-middle'
		                        }
		                    }
		                },
		                tooltip: {
		                    show: true
		                },
		                point: {
		                    show: false
		                },
		                legend: {
		                    show: false
		                },
		                color: {
		                    pattern: self.colours
		                }
		            });
		        }
		    }, options.delay || 10);
		},
		//
		//
		//
		generatetransferchart: function (options) {
		    setTimeout(function () {
		        var self = skyshares.chart;
		        //
		        // create x axis and price columns
		        //
		        var x_axis = ['year'];
		        var price = ['price'];
		        for (var year = options.range.min; year <= options.range.max; year += options.range.increment) {
		            x_axis.push(year);
		            price.push(skyshares.controller.geteqprice(year));
		        }
		        //
		        // data
		        //
		        var data = {
		            x: 'year',
		            columns: [
                        x_axis,
		            ],
		            axes: {},
		            names: {},
		            types: {}
		        };
		        //
		        // generate flow columns
		        //
		        options.groups.forEach(function (group_name) {
		            var group = skyshares.controller.findgroup(group_name);
		            if (group) {
		                //
		                // create x axis
		                //
		                //var col = [ group.description || group.name ];
		                var col = [group.name];
		                for (var year = options.range.min; year <= options.range.max; year += options.range.increment) {
		                    col.push(skyshares.controller.getgroupdatasum(group, 'flow', year));
		                }
		                var label = group.description || group.name;
		                data.columns.push(col);
		                data.axes[col[0]] = 'y';
		                data.names[col[0]] = label;
		                data.types[col[0]] = 'spline';
		            }
		        });
		        //
		        // add price column
		        //
		        data.columns.push(price);
		        data.axes[price[0]] = 'y2';
		        data.names[price[0]] = 'Price';
		        data.types[price[0]] = 'spline';
		        //
		        // generate chart
		        //
		        if (self.charts[options.container]) {
		            self.charts[options.container].load({ columns: data.columns });
		        } else {
		            self.charts[options.container] = c3.generate({
		                bindto: '#' + options.container,
		                data: data,
		                axis: {
		                    x: {
		                        tick: {
		                            rotate: 90
		                        }
		                    },
		                    y: {
		                        tick: {
		                            format: function (value) {
		                                return skyshares.utility.formatcurrency(value / 1000000000, 0, ",", ".", "");
		                            }
		                        },
		                        show: true
		                    },
		                    y2: {
		                        tick: {
		                            format: function (value) {
		                                return skyshares.utility.formatcurrency(value, 0, ",", ".", "$");
		                            }
		                        },
		                        show: true
		                    }
		                },
		                tooltip: {
		                    show: true
		                },
		                point: {
		                    show: false
		                },
		                legend: {
		                    show: true
		                },
		                color: {
		                    pattern: self.colours
		                }
		            });
		        }

		    }, options.delay || 10);
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
						var column_header;
						if ( i < 0 ) {
							column_header = document.createElement( 'td' );
						} else {
							column_header = document.createElement( 'th' );
							column_header.setAttribute( 'scope', 'column' );
							column_header.innerHTML = columnheaders[ i ];
						}
						row.appendChild( column_header );
					}
					var header = document.createElement( 'thead' );
					header.appendChild( row );
					this.table.appendChild( header );
					
				}
				
				table.prototype.addrows = function( rows, hasrowheaders ) {
					var body = document.createElement( 'tbody' );
					var row, col;
					for( var i = 0; i < rows.length; i++ ) {
						row = document.createElement('tr');
						if ( hasrowheaders ) {
							//
							// row header
							//
							col = document.createElement( 'th' );
							col.setAttribute( 'scope', 'row' );
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
						body.appendChild( row );
					}
					this.table.appendChild( body );
				}
				
				table.prototype.loaddata = function( data ) {
					/* TODO
					var body = this.table.querySelector( 'tbody' );
					var rows = body.querySelectorAll( 'tr' );
					for ( var i = 0; i < rows.length; i++ ) {
						var cols = rows[ i ].querySelectorAll( 'td' );
						for ( var j = 0; j < cols.length; j++ ) {
							cols[ j ].innerHTML = data[ i ][ j ];
						}
					}
					*/
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
			creategroupsumtable: function (options) {
			    setTimeout(function () {
			        var self = skyshares.chart.table;
			        //
			        // initialise table options
			        //
			        var table_options = {
			            hasrowheaders: true,
			            columnheaders: [],
			            rows: [],
			            id: options.id
			        }
			        //
			        // generate column headers
			        //
			        for (var i = options.range.min; i <= options.range.max; i += options.range.increment) {
			            table_options.columnheaders.push(i);
			        }
			        //
			        // generate data
			        //
			        options.groups.forEach(function (group_name) {
			            var group = skyshares.controller.findgroup(group_name);
			            if (group) {
			                var row = [group.description || group.name];
			                for (var i = options.range.min; i <= options.range.max; i += options.range.increment) {
			                    if (options.f) {
			                        row.push(options.format(options.f(group, options.field, i)));
			                    } else {
			                        row.push(options.format(skyshares.controller.getgroupdatasum(group, options.field, i)));
			                    }
			                }
			                table_options.rows.push(row);
			            } else {
			                console.log('skyshares.chart.table.creategroupsumtable : unable to find group ' + group_name);
			            }
			        });
			        //
			        // create table
			        //
			        var table = self.createtable(table_options);
			        //
			        // attach table to container
			        //
			        if (options.container) {
			            var container = document.getElementById(options.container);
			            if (container) {
			                container.innerHTML = '';
			                container.appendChild(table.table);
			            }
			        }
			    }, options.delay || 10);
			},
		},
	}
	
})();
