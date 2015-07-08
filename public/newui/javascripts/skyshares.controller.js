;
(function() {

	//
	// gradient
	// TODO: move this to utility
	//
	function gradient( stops ) {
		this.stops = stops;
	};
	gradient.prototype.getcolour = function( u ) {
		var position = this.stops.length * u;
		var index = Math.floor( position );
		var blend = position - index;
		if ( index <= 0 ) return this.stops[ 0 ];
		if ( index >= this.stops.length - 1 ) return this.stops[ this.stops.length - 1 ];
		try {
			return { 
				r: Math.round( this.stops[ index ].r * ( 1.0 - blend ) + this.stops[ index + 1 ].r * blend ),
				g: Math.round( this.stops[ index ].g * ( 1.0 - blend ) + this.stops[ index + 1 ].g * blend ),
				b: Math.round( this.stops[ index ].b * ( 1.0 - blend ) + this.stops[ index + 1 ].b * blend )
			};
		} catch( error ) {
			console.log( 'gradient.getcolour( ' + u + ') invalid colour index ' + index );
			return {
				r: 255, g: 0, b : 0
			};
		}
	};

	var self = skyshares.controller = {
		update : function() {
			//
			// get parameters from ui
			//
			var variables = {};
			variables.target_temperature = parseFloat(document.querySelector('#temperature').value);
			variables.risk_scenario = (function( fieldset ) {
				if ( fieldset ) {
					var options = fieldset.querySelectorAll('input[name="risk-scenario"]');
					for ( var i = 0; i < options.length; i++ ) {
						if ( options[ i ].checked ) {
							return i;
						}
					}
				}
				return 0;
			})(document.querySelector('#risk-scenario'));
			variables.mitigation_start = 2015
			variables.convergence_date = parseInt(document.querySelector('#convergencedate').value);
			variables.allocation_rule = (function( fieldset ) {
				if ( fieldset ) {
					var options = fieldset.querySelectorAll('input[name=allocation]');
					for ( var i = 0; i < options.length; i++ ) {
						if ( options[ i ].checked ) {
							switch( options[ i ].value ) {
								case 'Carbon Debt' :
									return 1;
								case 'Percapita' :
									return 0;
								case 'GDP' :
									return 2;
							}
						}
					}
				}
				return 0;
			})(document.querySelector('#allocation'));
			variables.regulated_share = 100.0 - parseFloat(document.querySelector('#percentagetraded').value);
			variables.trading_scenario = variables.regulated_share <= 0 ? 0 /*full trade*/ : 2 /*no trade*/;
			//
			// update worker parameters
			//
			self.model.postMessage( { command: 'setvariables', parameter: variables } );
		},	
		setcountrylist : function( list ) {
			this.countries = list;
			this.updatelists();
		},
		setgrouplist : function( list ) {
			this.groups = list;
			this.groups.sort( function( a, b ) {
				return ( a.name < b.name ? -1 : ( a.name > b.name ? 1 : 0 ) ); 
			});
			this.updatelists();
		},
		setcowlist : function( list ) {
			var self = this;
			//
			// just store ISOs
			//
			self.cow_countries = [];
			list.forEach( function( country ) {
				self.cow_countries.push( country.iso );	
			} );
			self.updatelists();
		},	
		updatelists : function() {
			//
			// TODO: this should be moved to skyshares.ui
			//
			var self = this;
			//
			// update country list
			//
			self.country_select = document.querySelector('#country-list');
			if ( self.country_select ) {
				self.country_select.onclick = function( evt ) {
					var target = evt.target;	
					var iso = target.getAttribute( 'data-iso' );
					if ( iso && iso.length == 3 ) {
						self.model.postMessage( { command: 'toggle_cow_membership', parameter: iso } );
					}
				};
				self.country_search = document.querySelector('#country-search');
				if ( self.country_search ) self.country_search.oninput = function() {
					skyshares.controller.updatelists();
				}
				var filter = ( self.country_search ? self.country_search.value : '' );
				var options = '';
				self.countries.forEach( function( country ) {
					if ( self.cow_countries.indexOf( country.iso ) < 0 && ( filter.length == 0 || country.name.toLowerCase().indexOf( filter ) >= 0 ) ) {
						options += '<span data-iso="' + country.iso + '" class="skyshares-select-list-item" >' + country.name + '</span>';
					}
				} );
				self.country_select.innerHTML = options;
			}
			//
			// update group list
			//
			self.group_select = document.querySelector('#group-list');
			if ( self.group_select ) {
				self.group_select.onclick = function( evt ) {
					var target = evt.target;
					var group_name = target.getAttribute( 'data-group' );	
					if ( group_name && group_name.length > 0 ) {
						self.model.postMessage( { command: 'add_group_to_cow', parameter: group_name } );
					}
				};
				var options = '';
				self.groups.forEach( function( group ) {
					options += '<span data-group="' + group.name + '" class="skyshares-select-list-item" >' + group.name + '</span>';
				} );
				self.group_select.innerHTML = options;
			}
			//
			// update cow list
			//
			self.cow_select = document.querySelector('#coalition-list');
			if ( self.cow_select ) {
				self.cow_select.onclick = function( evt ) {
					var target = evt.target;	
					var iso = target.getAttribute( 'data-iso' );
					if ( iso && iso.length == 3 ) {
						self.model.postMessage( { command: 'toggle_cow_membership', parameter: iso } );
					}
				};
				var options = '';
				self.countries.forEach( function( country ) {
					if ( self.cow_countries.indexOf( country.iso ) >= 0 ) {
						options += '<span data-iso="' + country.iso + '" class="skyshares-deselect-list-item" >' + country.name + '</span>';
					}
				} );
				self.cow_select.innerHTML = options;
			}
		},
		updateranges : function() {
			var self = this;
			var year_index = self.year.current - self.year.min;
			for ( var property in self.range ) {
				self.range[ property ].min = Number.MAX_VALUE;
				self.range[ property ].max = Number.MIN_VALUE;
				self.countries.forEach( function(country) {
					if ( country[ property ][ year_index ] < self.range[ property ].min ) {
						self.range[ property ].min = country[ property ][ year_index ];
					}
					if ( country[ property ][ year_index ] > self.range[ property ].max ) {
						self.range[ property ].max = country[ property ][ year_index ];
					}
				} );
			}
		},
		updatecountry : function(iso) {
			var self = this; 
			var country = self.findcountry(iso);
			if ( country ) {
				//
				// update emissions indication
				//
				var year_index = self.year.current - self.year.min;
				if ( country.emissionscapita && country.emissionscapita.length > year_index ) {
					var factor = ( country.emissionscapita[ year_index ] - self.range.emissionscapita.min ) / ( self.range.emissionscapita.max - self.range.emissionscapita.min );
					var colour = self.emissions_gradient.getcolour( 1.0 - factor );
					skyshares.map.countries[iso].style.fill = sprintf( 'rgb( %d, %d, %d )', colour.r, colour.g, colour.b );
				} else {
					skyshares.map.countries[country.iso].style.fill = 'rgb( 191, 191, 191 )';
				}
				//
				// update flow arrows
				//
				var flow_indicator = skyshares.map.countries[iso].flow_indicator;
				if ( flow_indicator ) {
					if ( country.flow && country.flow.length > year_index ) {
						if ( country.flow[ year_index ] > 0.0 ) {
							var factor = country.flow[ year_index ] / self.range.flow.max;
							var radius = 5 + ( 15.0 * factor );
							flow_indicator.setAttributeNS( null, 'r', radius );
							flow_indicator.style.fill = 'red';	
							flow_indicator.style.visibility = 'inherit';					
						} else if ( country.flow[ year_index ] < 0.0 ) {
							var factor = country.flow[ year_index ] / self.range.flow.min;
							var radius = 5 + ( 15.0 * factor );
							flow_indicator.setAttributeNS( null, 'r', radius );
							flow_indicator.style.fill = 'black';
							flow_indicator.style.visibility = 'inherit';
						} else {
							var radius = 5;
							flow_indicator.setAttributeNS( null, 'r', radius );
							flow_indicator.style.fill = 'none';
							flow_indicator.style.visibility = 'inherit';
						}
					
					} else {
						flow_indicator.style.visibility = 'hidden';
					}
				}
			}
		},
		updatemap : function() {
			var self = this;
			var year_index = self.year.current - self.year.min;
			self.updateranges();
			self.countries.forEach( function(country) {
				self.updatecountry(country.iso);
			} );
		},
		findcountry : function(iso) {
			var count = this.countries.length;
			for ( var i = 0; i < count; i++ ) {
				if ( this.countries[ i ].iso === iso ) {
					return this.countries[ i ];
				}
			}
			return undefined;
		},
		getcountrydata : function( iso ) {
			var country = this.findcountry( iso );
			if ( country ) {
				var year_index = this.year.current - this.year.min;
				var data = {
					iso : iso,
					name : country.name,
					emissions : country.emissions[ year_index ],
					emissionscapita : country.emissionscapita[ year_index ],
					abatement_target : country.abatement_target[ year_index ],
					flow : country.flow[ year_index ],
					decarb_cost : country.decarb_cost[ year_index ],
					total_cost : country.total_cost[ year_index ],
					transf : country.transf[ year_index ],
					allowances : country.allowances[ year_index ],
					percapitaallowances : country.percapitaallowances[ year_index ],
					domabat : country.domabat[ year_index ]
				};
				return data;
			}
			return undefined;
		},
		getcountryinfo : function( iso ) {
			var country = this.findcountry( iso );
			if ( country ) {
				var year_index = this.year.current - this.year.min;
				var text = country.name;
				if ( country.allowances && country.allowances.length > year_index ) {
					text += '<br /><span class="tooltip_light" style="font-size: 90%;" >Allowances</span> <span class="tooltip_bold">' + 
					Math.round( country.allowances[ year_index ] / 1000000 ) + 
					'</span><span class="tooltip_light" style="font-size: 60%;" >MtCO<sub>2</sub></span><span class="tooltip_light" style="font-size: 90%;" > or </span> <span class="tooltip_bold">' + 
					skyshares.utility.formatcurrency( country.allowancescapita[ year_index ],2,",",".","") + 
					'</span><span class="tooltip_light" style="font-size: 90%;" > per capita</span>';
				}
				if ( country.transf && country.transf.length > year_index ) {
					text += '<br /><span class="tooltip_light" style="font-size: 90%;" >Transfers</span><br /><span class="tooltip_bold">' + 
					Math.round( country.transf[ year_index ] / 1000000 ) + 
					'</span><span class="tooltip_light" style="font-size: 60%;" >MtCO<sub>2</sub></span>';
				}                                                             
				if ( country.emissions && country.emissions.length > year_index ) {
					text += '<br /><span class="tooltip_light" style="font-size: 90%;" >Emissions</span><br /><span class="tooltip_bold">' + 
					Math.round( country.emissions[ year_index ] / 1000000 ) + 
					'</span><span class="tooltip_light" style="font-size: 60%;" >MtCO<sub>2</sub></span><span class="tooltip_light" style="font-size: 90%;" > or </span> <span class="tooltip_bold">' + 
					skyshares.utility.formatcurrency( country.emissionscapita[ year_index ],2,",",".","") + 
					'</span><span class="tooltip_light" style="font-size: 90%;" > per capita</span>';
				}                                                             
				if ( country.flow && country.flow.length > year_index ) {
					text += '<br /><span class="tooltip_light" style="font-size: 90%;" >Financial Flows</span><br /><span class="tooltip_bold">' + 
					skyshares.utility.formatcurrency( country.flow[ year_index ],0 ) + 
					'</span><span class="tooltip_light" style="font-size: 90%;" > or </span> <span class="tooltip_bold">' + 
					skyshares.utility.formatpercent( country.flowGDP[ year_index ],2 ) + 
					'</span><span class="tooltip_light" style="font-size: 90%;" > of GDP</span>';
				}                                                             
				if ( country.decarb_cost && country.decarb_cost.length > year_index && 
					country.decarbcostGDP && country.decarbcostGDP.length > year_index ) {
					text += '<br /><span class="tooltip_light" style="font-size: 90%;" >Decarbonisation Costs</span><br /><span class="tooltip_bold">' + 
					skyshares.utility.formatcurrency( country.decarb_cost[ year_index ],0 ) + 
					'</span><span class="tooltip_light" style="font-size: 90%;" > or </span> <span class="tooltip_bold">' + 
					skyshares.utility.formatpercent( country.decarbcostGDP[ year_index ],2 ) + 
					'</span><span class="tooltip_light" style="font-size: 90%;" > of GDP</span>';
				}
				if ( country.total_cost && country.total_cost.length > year_index && 
					country.totalcostGDP &&  country.totalcostGDP.length > year_index ) {
					text += '<br /><span class="tooltip_light" style="font-size: 90%;" >Total Costs</span><br /><span class="tooltip_bold">' + 
					skyshares.utility.formatcurrency( country.total_cost[ year_index ],0 ) + 
					'</span><span class="tooltip_light" style="font-size: 90%;" > or </span> <span class="tooltip_bold">' + 
					skyshares.utility.formatpercent( country.totalcostGDP[ year_index ],2 ) + 
					'</span><span class="tooltip_light" style="font-size: 90%;" > of GDP</span>';
				}
				return text;
			}
			return undefined;
		},
		findgroup : function( name ) {
			if ( name === 'COW' ) {
				return {
					name: 'COW',
					description: 'Coalition',
					members: this.cow_countries
				};
			}
			for ( var i = 0; i < this.groups.length; i++ ) {
				if ( this.groups[ i ].name === name ) {
					return this.groups[ i ];
				}
			}
			return undefined;
		},
		//
		// returns data as array in C3 format : [ groupname, data0, data1, ..., datan ]
		// this only returns data for coalition members
		//
		getgroupdata : function( group_name, data_name, start_date, end_date ) {
			var group = this.findgroup( group_name );
			if ( group ) {
				var start_index = start_date - this.year.min;
				var end_index = end_date - this.year.min;
				var data = [ group_name ];
				var country_data = {};
				for ( var i = start_index; i <= end_index; i++ ) {
					var total = 0;
					for ( var j = 0; j < group.members.length; j++ ) {
						if ( self.cow_countries.indexOf(group.members[j]) >= 0 ) {
							if ( country_data[group.members[j]] === undefined ) {
								country_data[group.members[j]] = this.findcountry(group.members[j])[data_name];	
							}
							total += country_data[group.members[j]][i];
						}
					}
					data.push( total );
				}
				return data;
			}
			return undefined;
		},
		getgroupavgdata : function( group_name, data_name, start_date, end_date ) {
			var group = this.findgroup( group_name );
			if ( group ) {
				var start_index = start_date - this.year.min;
				var end_index = end_date - this.year.min;
				var data = [ group_name ];
				var country_data = {};
				for ( var i = start_index; i <= end_index; i++ ) {
					var total = 0;
					var count = 0;
					for ( var j = 0; j < group.members.length; j++ ) {
						if ( self.cow_countries.indexOf(group.members[j]) >= 0 ) {
							if ( country_data[group.members[j]] === undefined ) {
								country_data[group.members[j]] = this.findcountry(group.members[j])[data_name];	
							}
							total += country_data[group.members[j]][i];
							count++;
						}
					}
					data.push( count > 0 ? total / count : 0 );
				}
				return data;
			}
			return undefined;
		},
		//
		//
		//
		getgroupcountries : function( group ) {
			var self = this;
			var countries = [];
			group.members.forEach( function( iso ) {
				var country = self.findcountry( iso );
				if ( country ) {
					countries.push( country );
				}
			});
			return countries;
		},
		getgroupdatasum : function( group, field, year ) {
			var self = this;
			var year_index = year - self.year.min;
			var sum = 0;
			var groupcountries = self.getgroupcountries( group );
			groupcountries.forEach( function( country ) {
				if ( country[ field ] && country[ field ].length > year_index ) {
					sum += country[ field ][ year_index ];
				}
			});
			return sum;
		},
		//
		//
		//
		generategroupavgbarchart : function( data_name, year_increment ) {
			var self = this;
			year_increment = year_increment || 10;
			//
			//
			//
			var groups = [
				'LIC', 'LMIC', 'UMIC', 'HIC'
			];
			//
			// create x axis
			//
			var x_axis = [ 'region' ];
			groups.forEach( function( group_name ) {
				x_axis.push( group_name );
			});
			//
			// data
			//
			var	data = {
				columns: [], 
				type: 'bar'
			};
			var country_data = {};
			var group_data = {};
			for ( var year = this.year.min; year <= this.year.max; year += year_increment ) {
				var column = [ year ];
				var year_index = year - this.year.min;
				groups.forEach( function( group_name ) {
					if ( group_data[ group_name ] === undefined ) {
						var group = self.findgroup( group_name );
						if ( group ) {
							group_data[ group_name ] = group.members;
						}
					}
					if ( group_data[ group_name ] ) {
						var data = [ group_name ];
						var country_data = {};
						var total = 0;
						var count = 0;
						group_data[ group_name ].forEach( function(iso) {
							if ( self.cow_countries.indexOf(iso) >= 0 ) {
								if ( country_data[iso] === undefined ) {
									var country = self.findcountry(iso); 
									if ( country ) {
										country_data[iso] = country[data_name];
									}	
								}
								if ( country_data[iso] ) {
									for ( var i = 0; i < year_increment; i++ ) {
										total += country_data[iso][year_index+i];
									}
									//count++;
								}
							}
						});
						//column.push( count > 0 ? total / count : 0 );
						column.push( total / year_increment );
					}
				});	
				data.columns.push( column );			
			}
			if ( self.charts[data_name] ) {
				self.charts[data_name].load({ columns: data.columns });
			} else {
				self.charts[data_name] = c3.generate({
					bindto: '#' + data_name + '-chart',
					data: data,
					tooltip: {
						show: false
					},
					color: {
						pattern: [ '#006B77', '#E8112D', '#F95602', '#FFBB36', '#BCAD75' ]
					},
					axis: {
						x: {
							type: 'category',
							categories: groups
						},
						y : {
							tick: {
								format: function (value) { 
									return skyshares.utility.formatcurrency( value / 1000000, 0,",",".","$" );
								}
							}
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
		generategrouplinechart : function( data_name ) {
			var self = this;
			//
			// create x axis
			//
			var x_axis = [ 'year' ];
			for ( var year = this.year.min; year <= this.year.max; year++ ) {
				x_axis.push( year );
			}
			//
			//
			//
			var groups = [
				'LIC', 'LMIC', 'UMIC', 'HIC'
			];
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
			groups.forEach( function( group_name ) {
				data.columns.push(self.getgroupdata( group_name, data_name, self.year.min, self.year.max ));
				data.types[ group_name ] = 'area-spline';
			});
			if ( self.charts[data_name] ) {
				self.charts[data_name].load({ columns: data.columns });
			} else {
				self.charts[data_name] = c3.generate({
					bindto: '#' + data_name + '-chart',
					data: data,
					axis : {
						x : {
							tick: {
								rotate: 90
							}
						},
						y : {
							tick: {
								format : function( value ) {
									if ( value > 1000000 ) {
										return skyshares.utility.formatcurrency( value / 1000000, 2,",",".","" );
									}
									return skyshares.utility.formatcurrency( value, 2,",",".","" );
								}
							}
						}
					},
					tooltip: {
						show: false
					},
					point: {
						show: false
					},
					color: {
						pattern: [ '#006B77', '#E8112D', '#F95602', '#FFBB36', '#BCAD75' ]
					}
				});
			}
		},
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
			function emissions( value ) {
				return skyshares.utility.formatcurrency( value / 1000000, 2,",",".","" );
			};
			function currency( value ) {
				return skyshares.utility.formatcurrency( value / 1000, 0,",",".", "$" );
			};
			var row_source = [
				{
					title: "Allowances",
					field: "allowances",
					format : emissions
				},	
				{
					title: "Domestic Abatement",
					field: "domabat",
					format: emissions
				},		
				{
					title: "Transfers",
					field: "transf",
					format: emissions
				},
				{
					title: "Financial Flows",
					field: "flow",
					format: currency
				},
				{
					title: "Decarbonisation cost",
					field: "decarb_cost",
					format: currency
				},
				{
					title: "Total cost",
					field: "total_cost",
					format: currency
				}
			];
			//
			//
			//
			var container = document.querySelector( '#summary-table' );
			//
			// generate group tables
			//
			var table_count = 0;
			var years = [ 2015, 2020, 2030 ];
			self.groups.forEach( function( group ) {
				var data = {
					title : group.description || group.name,
					columnheaders : years,
					rows : []
				};
				row_source.forEach( function( source ) {
					var row = {
						title : source.title,
						data : []
					};
					years.forEach( function( year ) {
						row.data.push( source.format( self.getgroupdatasum( group, source.field, year ) ) );
					});
					data.rows.push( row );
				});
				container.appendChild( createtable( data ) );
				if ( ++table_count >= 2 ) {
					container.appendChild( document.createElement( 'br' ) );
					table_count = 0;
				}
			});
			//
			// generate country tables
			//
			self.countries.forEach( function( country ) {
				var data = {
					title : country.name + ( self.cow_countries.indexOf(country.iso) < 0 ? '( not in COW )' : '' ),
					columnheaders : years,
					rows : []
				};
				row_source.forEach( function( source ) {
					var row = {
						title : source.title,
						data : []
					};
					years.forEach( function( year ) {
						var year_index = year - self.year.min;
						if ( country[ source.field ].length > year_index ) {
							row.data.push( source.format( country[ source.field ][ year_index ] ) );
						} else {
							row.data.push( 'n/a' );
						}
					});
					data.rows.push( row );
				});
				container.appendChild( createtable( data ) );
				if ( ++table_count >= 2 ) {
					container.appendChild( document.createElement( 'br' ) );
					table_count = 0;
				}
			});
		},
		generateemisionschart : function() { // TODO: this should be generic function
			var self = this;
			//
			// create x axis
			//
			var x_axis = [ 'year' ];
			for ( var year = 1990; year <= 2200; year++ ) {
				x_axis.push( year );
			}
			//
			// data
			//
			var emissions = [ 'emissions' ].concat( self.world_emissions );
			var	data = {
				x : 'year',
				columns: [
					x_axis,
					emissions
				], 
				types: { 
					emissions: 'area-spline' 
				}
			};
			if ( self.charts['emissions'] ) {
				self.charts['emissions'].load({ columns: data.columns });
			} else {
				self.charts['emissions'] = c3.generate({
					bindto: '#emissions-chart',
					data: data,
					axis : {
						x : {
							tick: {
								rotate: 90
							}
						},
						y : {
							tick: {
								format : function( value ) {
									return skyshares.utility.formatcurrency( value / 1000000000, 0,",",".","" );
								}
							},
							label: {
                				text: 'GigaTonnes of CO<tspan baseline-shift="sub">2</tspan>',
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
						pattern: [ '#006B77', '#E8112D', '#F95602', '#FFBB36', '#BCAD75' ]
					}
				});
			}
		},		
		updatecharts : function() {
			var self = this;
			//
			// summary charts TODO: move these to skyshares.chart
			//
			self.generategrouplinechart('allowances');
			self.generategroupavgbarchart('flow');
			self.generategroupavgbarchart('total_cost');
			self.generatesummarytable();
			//
			// detail tables
			//
			var table_groups = [ 'COW', 'LIC', 'LMIC', 'UMIC', 'G8', 'G20', 'G77', 'CHN', 'EU', 'IND', 'USA' ];
			skyshares.chart.table.creategroupsumtable( {
					groups : table_groups,
					field : 'allowances',
					id : 'group-allowances',
					range : {
						min : 2015,
						max : 2100,
						increment : 5
					},
					format : function( value ) {
						return skyshares.utility.formatcurrency( value / 1000000, 2,",",".","" );
					},
					container : 'allowances-table'		
				});
			skyshares.chart.table.creategroupsumtable( {
					groups : table_groups,
					field : 'domabat',
					id : 'group-abatement',
					range : {
						min : 2015,
						max : 2100,
						increment : 5
					},
					format : function( value ) {
						return skyshares.utility.formatcurrency( value / 1000000, 2,",",".","" );
					},
					container : 'domesticabatement-table'		
				});
			skyshares.chart.table.creategroupsumtable( {
					groups : table_groups,
					field : 'flow',
					id : 'group-flow',
					range : {
						min : 2015,
						max : 2100,
						increment : 5
					},
					format : function( value ) {
						return skyshares.utility.formatcurrency( value / 1000, 0,",",".", "$" );
					},
					container : 'financialflows-table'		
				});
			skyshares.chart.table.creategroupsumtable( {
					groups : table_groups,
					field : 'decarb_cost',
					id : 'group-decarbonisation-cost',
					range : {
						min : 2015,
						max : 2100,
						increment : 5
					},
					format : function( value ) {
						return skyshares.utility.formatcurrency( value / 1000, 0,",",".", "$" );
					},
					container : 'decarbonisationcost-table'		
				});
			skyshares.chart.table.creategroupsumtable( {
					groups : table_groups,
					field : 'total_cost',
					id : 'group-total-cost',
					range : {
						min : 2015,
						max : 2100,
						increment : 5
					},
					format : function( value ) {
						return skyshares.utility.formatcurrency( value / 1000, 0,",",".", "$" );
					},
					container : 'totalcost-table'		
				});
			//
			// detail charts
			//
			var chart_groups = [ 'LIC', 'LMIC', 'UMIC', 'G8', 'G20', 'G77', 'CHN', 'EU', 'IND', 'USA' ];
			skyshares.chart.generategrouplinechart( {
					groups : chart_groups,
					field : 'allowances',
					range : {
						min : 2015,
						max : 2100,
						increment : 5
					},
					format : function( value ) {
						return skyshares.utility.formatcurrency( value / 1000000, 2,",",".","" );
					},
					type : 'area-spline',
					stacked : true,
					container : 'allowancesconverge-chart'		
				});
			skyshares.chart.generategrouplinechart( {
					groups : table_groups,
					field : 'allowancescapita',
					range : {
						min : 2015,
						max : 2100,
						increment : 5
					},
					format : function( value ) {
						return skyshares.utility.formatcurrency( value, 2,",",".","" );
					},
					type : 'spline',
					container : 'allowancescapita-chart'		
				});
			skyshares.chart.generategroupbarchart( {
					groups : chart_groups,
					field : 'flow',
					range : {
						min : 2015,
						max : 2100,
						increment : 10
					},
					format : function( value ) {
						return skyshares.utility.formatcurrency( value / 1000000, 0,",",".","" );
					},
					label_y : {
						text: 'Millions',
						position: 'outer-middle'
					},
					container : 'financialflows-chart'		
				});
			skyshares.chart.generategroupbarchart( {
					groups : chart_groups,
					field : 'decarb_cost',
					range : {
						min : 2015,
						max : 2100,
						increment : 10
					},
					format : function( value ) {
						return skyshares.utility.formatcurrency( value / 1000000, 2,",",".","" );
					},
					container : 'decarbonisationcost-chart'		
				});
			skyshares.chart.generategroupbarchart( {
					groups : chart_groups,
					field : 'total_cost',
					range : {
						min : 2015,
						max : 2100,
						increment : 10
					},
					format : function( value ) {
						return skyshares.utility.formatcurrency( value / 1000000, 2,",",".","" );
					},
					container : 'totalcost-chart'		
				});
				
		},
		//
		//
		//
		countries : [],
		groups : [],
		cow_countries : [],
		//
		//
		//
		year : {
			min: 2010, max: 2100, current: 2015
		},
		range : {
			emissions : { min: Number.MAX_VALUE, max: Number.MIN_VALUE },
			emissionscapita : { min: Number.MAX_VALUE, max: Number.MIN_VALUE },
			flow : { min: Number.MAX_VALUE, max: Number.MIN_VALUE }
		},
		//
		//
		//
		variables : [
			'temperature',
			'risk-optimistic', 'risk-cautious', 'risk-pesimistic',
			'convergencedate',
			'allocation-historical', 'allocation-percapita', 'allocation-money',
			'percentagetraded'
		],
		//
		//
		//
		emissions_gradient : new gradient( [
				{ r: 147, g: 138, b: 72 },
				{ r: 198, g: 183, b: 147 },
				{ r: 232, g: 224, b: 163 },
				{ r: 147, g: 244, b: 137 },
				{ r: 113, g: 244, b: 166 },
				{ r: 34, g: 181, b: 115 }
		] ),
		charts : {}


	};
	//
	//
	//

	//
	// start model 
	//
	self.model =  new Worker( 'javascripts/skyshares.model.worker.js' );
	self.model.onmessage = function( evt ) {
		var self = skyshares.controller;
		switch ( evt.data.command ) {
			case 'ready' :
				self.model.postMessage( { command: 'run' } );
				break;
			case 'waiting_for_end_run' :
				self.model.postMessage( { command: 'run' } );
				break;
			case 'start_run' :
				//self.progress_indicator.style.visibility = 'visible';
				break;
			case 'end_run' :
				//self.progress_indicator.style.visibility = 'hidden';
				//self.updatecoalitioncharts();
				self.updatecharts();
				break;
			case 'cancel_run' :
				//self.progress_indicator.style.visibility = 'hidden';
				break;
			case 'update_country' :
				var data = evt.data.parameter;
				if ( data ) { 
					var country = self.findcountry( data.iso );
					if ( country ) {
						//
						// update local data
						//
						for ( var field in data ) {
							country[ field ] = data[ field ];
						}
						//
						//
						//
						self.updateranges();
						self.updatecountry(country.iso);
					}
				}
				break;
			case 'set_country_list' :
				self.setcountrylist( evt.data.parameter );
				break;
			case 'set_group_list' :
				self.setgrouplist( evt.data.parameter );
				break;
			case 'set_cow_list' :
				self.setcowlist( evt.data.parameter );
				break;
			case 'update_world_emissions' :
				self.world_emissions = evt.data.parameter;
				//self.updateemissionschart();
				self.generateemisionschart();
				break;
			case 'update_equilibrium_price' : 
				self.equilibrium_price = evt.data.parameter;
				break;
			case 'debug' :
				console.log( 'model: ' + evt.data.parameter );
				break;
		}
	};
	self.model.onerror = function( evt ) {
		alert( 'Error in model : ' + evt.data );
	};
	//
	// set variable listeners
	//
	skyshares.controller.variables.forEach( function( variable ) {
		skyshares.ui.addinputeventlistner( variable, function(evt) {
			if ( this.type === 'range' && evt.type === 'input' ) return;
			skyshares.controller.update();
		});
	} );
	//
	// add current year listener
	//
	skyshares.ui.addinputeventlistner( 'year', function(evt) {
		skyshares.controller.year.current = parseInt(this.value);
		skyshares.controller.updatemap();
	});
	//
	// add flow toggle listeners
	//
	skyshares.ui.addinputeventlistner( 'flow-country', function(evt) {
		skyshares.controller.updatemap();
		skyshares.map.country_flows.style.visibility = this.checked ? 'visible' : 'hidden';
	});
	skyshares.ui.addinputeventlistner( 'flow-region', function(evt) {
		skyshares.controller.updatemap();
		skyshares.map.region_flows.style.visibility = this.checked ? 'visible' : 'hidden';
	});

})();
