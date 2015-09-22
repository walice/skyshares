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
			// update worker parameters
			//
			var variables = self.getvariables();
			self.model.postMessage( { command: 'setvariables', parameter: variables } );
		},	
		getvariables : function() {
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
			variables.mitigation_start = 2015; // TODO: should this be in advanced settings
			variables.convergence_date = parseInt(document.querySelector('#convergencedate').value);
			variables.allocation_rule = (function( fieldset ) {
				if ( fieldset ) {
					var options = fieldset.querySelectorAll('input[name=allocation]');
					for ( var i = 0; i < options.length; i++ ) {
						if ( options[ i ].checked ) {
							switch( options[ i ].value ) {
								case 'Equal Stocks' :
									return 1;
								case 'Per Capita' :
									return 0;
								case 'Per Dollar' :
									return 2;
							}
						}
					}
				}
				return 0;
			})(document.querySelector('#allocation'));
			//
			//
			//
			variables.gdp_dataset = (function( fieldset ) {
				if ( fieldset ) {
					var options = fieldset.querySelectorAll('input[name="gdp"]');
					for ( var i = 0; i < options.length; i++ ) {
						if ( options[ i ].checked ) {
							return options[ i ].value;
						}
					}
				}
				return undefined;
			})(document.querySelector('#gdp'));
			//
			//
			//
			variables.mac_dataset = (function( fieldset ) {
				if ( fieldset ) {
					var options = fieldset.querySelectorAll('input[name="mac"]');
					for ( var i = 0; i < options.length; i++ ) {
						if ( options[ i ].checked ) {
							return options[ i ].value;
						}
					}
				}
				return undefined;
			})(document.querySelector('#mac'));
			//
			// disable convergence date if 'Carbon Debt' selected
			//
			document.querySelector('#convergencedate').disabled = ( variables.allocation_rule === 1 );
			//
			//
			//
			variables.regulated_share = 100.0 - parseFloat(document.querySelector('#percentagetraded').value);
			variables.trading_scenario = variables.regulated_share <= 0 ? 0 /*full trade*/ : 2 /*no trade*/;	
			
			return variables;	
		},
		getoptionshash : function() {
			var hash = '';
			var variables = self.getvariables();
			for ( var variable in variables ) {
				hash += variables[ variable ];
			}
			self.cow_countries.forEach( function( iso ) {
				hash += iso;
			});
			return hash;
		},
		setcountrylist : function( list ) {
			var self = skyshares.controller;
			self.countries = list;
			self.countries_by_emissions = [];
			self.countries.forEach( function( country ) {
				self.countries_by_emissions.push(country.iso);
			});
			self.updatelists();
		},
		setgrouplist : function( list ) {
			var self = skyshares.controller;
			self.groups = list;
			self.groups.sort( function( a, b ) {
				return ( a.name < b.name ? -1 : ( a.name > b.name ? 1 : 0 ) ); 
			});
			self.updatelists();
		},
		setcowlist : function( list ) {
			var self = skyshares.controller;
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
			var self = skyshares.controller;
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
					var label = group.description || group.name;
					if ( label.charAt(0) !== '-' ) {
						options += '<span data-group="' + group.name + '" class="skyshares-select-list-item" >' + label + '</span>';
					}
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
			var self = skyshares.controller;
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
			//
			//
			//
			self.countries_by_emissions.sort( function( iso_a, iso_b ) {
				var country_a = self.findcountry(iso_a);
				var country_b = self.findcountry(iso_b);
				if ( country_a && country_b ) {
					return country_a.emissions[ year_index ] - country_b.emissions[ year_index ];
				}
				return 0;
			} );
		},
		updatecountry : function(iso) {
			var self = skyshares.controller; 
			var country = self.findcountry(iso);
			if ( country ) {
				//
				// update emissions indication
				//
				var year_index = self.year.current - self.year.min;
				if (country.emissions && country.emissions.length > year_index) {
				    var n_stops = self.emissions_gradient.stops.length;
				    var range = self.countries_by_emissions.length / ( n_stops - 1 );
				    var index = self.countries_by_emissions.indexOf(iso);
				    var colour_index = Math.round(index / range);
				    var colour = self.emissions_gradient.stops[(n_stops-1)-colour_index];
					skyshares.map.countries[iso].style.fill = sprintf( 'rgb( %d, %d, %d )', colour.r, colour.g, colour.b );
				} else {
					skyshares.map.countries[iso].style.fill = 'rgb( 191, 191, 191 )';
				}
				/*
				if ( country.emissionscapita && country.emissionscapita.length > year_index ) {
					var factor = self.range.emissionscapita.max - self.range.emissionscapita.min > 0 ? ( country.emissionscapita[ year_index ] - self.range.emissionscapita.min ) / ( self.range.emissionscapita.max - self.range.emissionscapita.min ) : 1.0;
					var colour = self.emissions_gradient.getcolour( 1.0 - factor );
					skyshares.map.countries[iso].style.fill = sprintf( 'rgb( %d, %d, %d )', colour.r, colour.g, colour.b );
				} else {
					skyshares.map.countries[country.iso].style.fill = 'rgb( 191, 191, 191 )';
				}
				*/
				//
				// update flow indicators
				//
				var flow_indicator = skyshares.map.countries[iso].flow_indicator;
				if ( flow_indicator ) {
					if ( country.flow && country.flow.length > year_index ) {
						if ( country.flow[ year_index ] > 0.0 ) {
							var factor = country.flow[ year_index ] / self.range.flow.max;
							var radius = 5 + ( 15.0 * factor );
							flow_indicator.setAttributeNS( null, 'r', radius );
							flow_indicator.style.fill = 'red';	
							flow_indicator.style.stroke = 'none';
							flow_indicator.style.visibility = 'inherit';					
						} else if ( country.flow[ year_index ] < 0.0 ) {
							var factor = country.flow[ year_index ] / self.range.flow.min;
							var radius = 5 + ( 15.0 * factor );
							flow_indicator.setAttributeNS( null, 'r', radius );
							flow_indicator.style.fill = 'black';
							flow_indicator.style.stroke = 'none';
							flow_indicator.style.visibility = 'inherit';
						} else {
							var radius = 5;
							flow_indicator.setAttributeNS( null, 'r', radius );
							flow_indicator.style.fill = 'none';
							flow_indicator.style.stroke = 'white';
							flow_indicator.style.visibility = 'inherit';
						}
					
					} else {
						flow_indicator.style.visibility = 'hidden';
					}
				}
			}
		},
		updateregionflows: function () {
		    var self = skyshares.controller;
		    var year = self.year.current;
		    var regions = ['Africa', 'Americas', 'Asia', 'Europe', 'Oceania'];
		    var region_flows = {};
		    var range = {
		        min: Number.MAX_VALUE,
                max: Number.MIN_VALUE
		    };
		    var size = {
		        min: 20,
                max: 60
		    };
		    regions.forEach(function (region_name) {
		        var region = skyshares.controller.findgroup(region_name);
		        if (region) {
		            var sum = self.getgroupdatasum(region, 'flow', year);
		            if (sum < range.min) range.min = sum;
		            if (sum > range.max) range.max = sum;
		            region_flows[region_name] = sum;
		        }
		    });
		    for (var region_name in region_flows) {
		        var indicator = skyshares.map.region_flows.querySelector( '#map\\.region_flows\\.' + region_name );
		        if (indicator) {
		            if (region_flows[region_name]!==undefined) {
		                if (region_flows[region_name] > 0.0) {
		                    var factor = region_flows[region_name] / range.max;
		                    var radius = size.min + (size.max * factor);
		                    indicator.setAttributeNS(null, 'r', radius);
		                    indicator.style.fill = 'red';
		                    indicator.style.stroke = 'none';
		                    indicator.style.visibility = 'inherit';
		                } else if (region_flows[region_name] < 0.0) {
		                    var factor = region_flows[region_name] / range.min;
		                    var radius = size.min + (size.max * factor);
		                    indicator.setAttributeNS(null, 'r', radius);
		                    indicator.style.fill = 'black';
		                    indicator.style.stroke = 'none';
		                    indicator.style.visibility = 'inherit';
		                } else {
		                    var radius = size.min;
		                    indicator.setAttributeNS(null, 'r', radius);
		                    indicator.style.fill = 'none';
		                    indicator.style.stroke = 'white';
		                    indicator.style.visibility = 'inherit';
		                }
		            } else {
		                indicator.style.visibility = 'hidden';
		            }
		        }
		    }
		},
		updatemap : function() {
			var self = skyshares.controller;
			var year_index = self.year.current - self.year.min;
			self.updateranges();
			self.countries.forEach( function(country) {
				self.updatecountry(country.iso);
			});
			self.updateregionflows();
		    //
		    //
		    //
			var country_details = document.querySelector('#country-details');
			if (country_details && country_details.style.visibility === 'visible') {
			    var iso = country_details.getAttribute('data-iso');
			    if (iso && iso.length > 0) {
			        country_details.innerHTML = skyshares.controller.getcountryinfo(iso);
			        country_details.style.visibility = 'visible';
			    } else {
			        country_details.style.visibility = 'hidden';
			        country_details.innerHTML = '';
			    }
			}
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
		getcountryinfo: function (iso) {
            // TODO: template this
			var country = this.findcountry( iso );
			if ( country ) {
				var year_index = this.year.current - this.year.min;
				var text = '<span class="tooltip_bold">' + country.name.replace(' ', '&nbsp;') + '</span>';
				if (country.population && country.population.length > year_index) {
				    text += '<br />•&nbsp;<span class="tooltip_light" style="font-size: 90%;" >Population&nbsp;</span><span class="tooltip_bold">' +
                    skyshares.utility.formatcurrency(country.population[year_index], 0, ",", ".", "") +
                    '</span>';
				}
				if (country.gdp && country.gdp.length > year_index) {
				    text += '<br />•&nbsp;<span class="tooltip_light" style="font-size: 90%;" >GDP&nbsp;</span><span class="tooltip_bold">' +
                    skyshares.utility.formatcurrency(country.gdp[year_index], 0) +
                    '</span>';
				}
				if (country.allowances && country.allowances.length > year_index) {
				    text += '<br />•&nbsp;<span class="tooltip_light" style="font-size: 90%;" >Allowances&nbsp;</span><span class="tooltip_bold">' +
					Math.round( country.allowances[ year_index ] / 1000000 ) + 
					'</span><span class="tooltip_light" style="font-size: 60%;" >MtCO<sub>2</sub></span><span class="tooltip_light" style="font-size: 90%;" > or&nbsp;</span><span class="tooltip_bold">' + 
					skyshares.utility.formatcurrency( country.allowancescapita[ year_index ],2,",",".","") + 
					'</span><span class="tooltip_light" style="font-size: 90%;" >&nbsp;per&nbsp;capita</span>';
				}
				if ( country.transf && country.transf.length > year_index ) {
				    text += '<br />•&nbsp;<span class="tooltip_light" style="font-size: 90%;" >Transfers&nbsp;</span><span class="tooltip_bold">' +
					Math.round( country.transf[ year_index ] / 1000000 ) + 
					'</span><span class="tooltip_light" style="font-size: 60%;" >MtCO<sub>2</sub></span>';
				}                                                             
				if ( country.emissions && country.emissions.length > year_index ) {
				    text += '<br />•&nbsp;<span class="tooltip_light" style="font-size: 90%;" >Emissions</span>&nbsp;<span class="tooltip_bold">' +
					Math.round( country.emissions[ year_index ] / 1000000 ) + 
					'</span><span class="tooltip_light" style="font-size: 60%;" >MtCO<sub>2</sub></span><span class="tooltip_light" style="font-size: 90%;" > or&nbsp;</span><span class="tooltip_bold">' + 
					skyshares.utility.formatcurrency( country.emissionscapita[ year_index ],2,",",".","") + 
					'</span><span class="tooltip_light" style="font-size: 90%;" >&nbsp;per&nbsp;capita</span>';
				}                                                             
				if ( country.flow && country.flow.length > year_index ) {
				    text += '<br />•&nbsp;<span class="tooltip_light" style="font-size: 90%;" >Financial&nbsp;Flows</span>&nbsp;<span class="tooltip_bold">' +
					skyshares.utility.formatcurrency( country.flow[ year_index ] / 1000000.0, 0, ',', '.', '$', '&nbsp;million' ) + 
					'</span><span class="tooltip_light" style="font-size: 90%;" >&nbsp;or&nbsp;</span><span class="tooltip_bold">' + 
					skyshares.utility.formatpercent( country.flowGDP[ year_index ],2 ) + 
					'</span><span class="tooltip_light" style="font-size: 90%;" >&nbsp;of&nbsp;GDP</span>';
				}                                                             
				if ( country.decarb_cost && country.decarb_cost.length > year_index && 
					country.decarbcostGDP && country.decarbcostGDP.length > year_index ) {
				    text += '<br />•&nbsp;<span class="tooltip_light" style="font-size: 90%;" >Decarbonisation&nbsp;Costs</span>&nbsp;<span class="tooltip_bold">' +
					skyshares.utility.formatcurrency( country.decarb_cost[ year_index ] / 1000000.0, 0, ',', '.', '$', '&nbsp;million' ) + 
					'</span><span class="tooltip_light" style="font-size: 90%;" >&nbsp;or&nbsp;</span><span class="tooltip_bold">' + 
					skyshares.utility.formatpercent( country.decarbcostGDP[ year_index ],2 ) + 
					'</span><span class="tooltip_light" style="font-size: 90%;" >&nbsp;of&nbsp;GDP</span>';
				}
				if ( country.total_cost && country.total_cost.length > year_index && 
					country.totalcostGDP &&  country.totalcostGDP.length > year_index ) {
				    text += '<br />•&nbsp;<span class="tooltip_light" style="font-size: 90%;" >Total&nbsp;Costs</span>&nbsp;<span class="tooltip_bold">' +
					skyshares.utility.formatcurrency( country.total_cost[ year_index ] / 1000000.0, 0, ',', '.', '$', '&nbsp;million' ) + 
					'</span><span class="tooltip_light" style="font-size: 90%;" > or&nbsp;</span><span class="tooltip_bold">' + 
					skyshares.utility.formatpercent( country.totalcostGDP[ year_index ], 2 ) + 
					'</span><span class="tooltip_light" style="font-size: 90%;" >&nbsp;of&nbsp;GDP</span>';
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
		//
		//
		getgroupcountries : function( group ) {
		    var self = skyshares.controller;
			var countries = [];
			group.members.forEach( function( iso ) {
				var country = self.findcountry( iso );
				if ( country ) {
					countries.push( country );
				}
			});
			return countries;
		},
		getgroupdatasum: function (group, field, year) {
		    var self = skyshares.controller;
		    var year_index = year - self.year.min;
		    var sum = 0;
		    var groupcountries = self.getgroupcountries(group);
		    groupcountries.forEach(function (country) {
		        if (country[field] && country[field].length > year_index) {
		            sum += country[field][year_index];
		        }
		    });
		    return sum;
		},
		getgroupdatapercentagegdp: function (group, field, year) {
		    var self = skyshares.controller;
		    var year_index = year - self.year.min;
		    var sum = 0;
		    var gdp_sum = 0;
		    var groupcountries = self.getgroupcountries(group);
		    groupcountries.forEach(function (country) {
		        if (country[field] && country[field].length > year_index) {
		            sum += country[field][year_index];
		            gdp_sum += country.gdp[year_index];
		        }
		    });
		    return sum / gdp_sum;
		},
		getcountrydatapercentagegdp: function (country, field, year) {
			/*
		    var self = skyshares.controller;
		    var year_index = year - self.year.min;
		    if (country[field] && country[field].length > year_index) {
		        return country[field][year_index] / country.gdp[year_index];
		    }
		    */
		    var self = skyshares.controller;
		    var year_index = year - self.year.min;
		    var fieldGDP = field + 'GDP';
		    if (country[fieldGDP] && country[fieldGDP].length > year_index) {
		        return country[fieldGDP][year_index];
		    } else if (country[field] && country[field].length > year_index) {
		    	// JONS: temporary fallback
		        return country[field][year_index] / country.gdp[year_index];
		    }
		    return 0;
		},
		getgroupdatapercapita: function (group, field, year) {
		    var self = skyshares.controller;
		    var year_index = year - self.year.min;
		    var sum = 0;
		    var population_sum = 0;
		    var groupcountries = self.getgroupcountries(group);
		    groupcountries.forEach(function (country) {
		        if (country[field] && country[field].length > year_index) {
		            sum += country[field][year_index];
		            population_sum += country.population[year_index];
		        }
		    });
		    return sum / population_sum;
		},
		getgroupdataavg: function (group, field, year, period) {
		    var self = skyshares.controller;
		    var sum = 0;
		    var groupcountries = self.getgroupcountries(group);
		    for (var i = 0; i < period; i++) {
		        var year_index = (year + i) - self.year.min;
		        groupcountries.forEach(function (country) {
		            if (country[field] && country[field].length > year_index) {
		                sum += country[field][year_index];
		            }
		        });
		    }
		    return sum / period;
		},
		getgroupdataavg: function (group, field, year, period) {
		    var self = skyshares.controller;
		    var sum = 0;
		    var groupcountries = self.getgroupcountries(group);
		    for (var i = 0; i < period; i++) {
		        var year_index = (year + i) - self.year.min;
		        groupcountries.forEach(function (country) {
		            if (country[field] && country[field].length > year_index) {
		                sum += country[field][year_index];
		            }
		        });
		    }
		    return sum / period;
		},
		geteqprice: function (year) {
		    var self = skyshares.controller;
			var year_index = year - self.year.min;
			return self.equilibrium_price[ year_index ];
		},
		//
		//
		//
		rendersummarytable : function(data) {
			var table = document.createElement( 'table' );
			table.style.display = 'inline-block';
			//
			// table header
			//
			var caption = document.createElement( 'caption' );
			caption.innerHTML = data.title;
			table.appendChild( caption );
			//
			// column headers
			//
			var header = document.createElement('thead');
			var row = document.createElement('tr');
			for ( var i = -1; i < data.columnheaders.length; i++ ) {
				var col = document.createElement( 'th' );
				if ( i < 0 ) {
					col = document.createElement( 'td' );
				} else {
					col = document.createElement( 'th' );
					col.innerHTML = data.columnheaders[ i ];
				}
				row.appendChild( col );
			}
			header.appendChild( row );
			table.appendChild( header );
			//
			// rows
			//
			var body = document.createElement('tbody');
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
				body.appendChild( row );
			}
			table.appendChild( body );
			return table;
		},
		summary_table_row_source : undefined,
		rendergroupsummarytables : function(button) {
			var start = button.getAttribute('data-start');
			var end = button.getAttribute('data-end');
			var target = button.getAttribute('data-target');
			//
			//
			//
			var container = document.querySelector(target);
			if ( container ) {
				container.innerHTML = '';
				var years = [ 2015, 2020, 2030, 2050 ];
				self.groups.forEach( function( group ) {
					var title = group.description || group.name;
					var first = title.toLowerCase().charAt(0);
					if ( first !== '-' && first >= start && first <= end ) {
						var data = {
							title : title,
							columnheaders : years,
							rows : []
						};
						self.summary_table_row_source.forEach( function( source ) {
							var row = {
								title : source.title,
								data : []
							};
							if (source.f_group) {
							    years.forEach(function (year) {
							        row.data.push(source.format(source.f_group(group, source.field, year)));
							    });
							} else {
							    years.forEach(function (year) {
							        row.data.push(source.format(self.getgroupdatasum(group, source.field, year)));
							    });
							}
							data.rows.push( row );
						});
						container.appendChild( self.rendersummarytable( data ) );
					}
				});
			}
		},
		rendercountrysummarytables : function(button) {
			var start = button.getAttribute('data-start');
			var end = button.getAttribute('data-end');
			var target = button.getAttribute('data-target');
			//
			//
			//
			var container = document.querySelector(target);
			if ( container ) {
				container.innerHTML = '';
				var years = [ 2015, 2020, 2030, 2050 ];
				self.countries.forEach( function( country ) {
					var title = country.name + ( self.cow_countries.indexOf(country.iso) < 0 ? '( not in COW )' : '' );
					var first = title.toLowerCase().charAt(0);
					if ( first >= start && first <= end ) {
						var data = {
							title : title,
							columnheaders : years,
							rows : []
						};
						self.summary_table_row_source.forEach( function( source ) {
							var row = {
								title : source.title,
								data : []
							};
							years.forEach( function( year ) {
								var year_index = year - self.year.min;
								if (country[source.field].length > year_index) {
								    if (source.f_country) {
								        row.data.push(source.format(source.f_country(country, source.field, year_index)));
								    } else {
								        row.data.push(source.format(country[source.field][year_index]));
								    }
									
								} else {
									row.data.push( 'n/a' );
								}
							});
							data.rows.push( row );
						});
						container.appendChild( self.rendersummarytable( data ) );
					}
				});			
			}
		},
		updatecharts : function() {
			var self = skyshares.controller;
			var groups_including_cow = [ 'COW', 'LIC', 'LMIC', 'UMIC', 'HIC', 'G8', 'G20', 'G77'/*, 'CHN', 'EU', 'IND', 'USA'*/ ];
			var groups_excluding_cow = [ 'LIC', 'LMIC', 'UMIC', 'HIC', 'G8', 'G20', 'G77'/*, 'CHN', 'EU', 'IND', 'USA'*/ ];
			//
			// summary charts
		    //
			skyshares.ui.setprogress({
			    status: 'creating summary charts'
			});
			skyshares.chart.generategrouplinechart( {
					groups : groups_excluding_cow,
					field : 'allowances',
					range : {
						min : 2015,
						max : 2100,
						increment : 5
					},
					format : function( value ) {
						return skyshares.utility.formatcurrency( value / 1000000, 0,",",".","" );
					},
					type : 'area-spline',
					stacked : true,
					average : true,
					container : 'allowances-chart'		
				});
			skyshares.chart.generategroupbarchart( {
					groups : groups_excluding_cow,
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
					average: true,
					container : 'flow-chart'		
				});
			skyshares.chart.generategroupbarchart( {
					groups : groups_excluding_cow,
					field : 'total_cost',
					range : {
						min : 2015,
						max : 2100,
						increment : 10
					},
					format : function( value ) {
						return skyshares.utility.formatcurrency( value / 1000000, 2,",",".","" );
					},
					average: true,
					container : 'total_cost-chart'		
				});
			//
			// default summary tables
			//
			skyshares.ui.setprogress({
			    status: 'creating summary tables'
			});
			var button = document.querySelector('#summary-navigator-groups-default');
			if ( button ) {
				self.rendergroupsummarytables(button);
			}
			button = document.querySelector('#summary-navigator-countries-default');
			if ( button ) {
				self.rendercountrysummarytables(button);
			}			
			//
			// detail tables
			//
			skyshares.ui.setprogress({
			    status: 'creating allowances tables'
			});
			skyshares.chart.table.creategroupsumtable({
					groups : groups_including_cow,
					field : 'allowances',
					id : 'group-allowances',
					range : {
						min : 2015,
						max : 2100,
						increment : 5
					},
                    f : self.getgroupdatasum,
					format : function( value ) {
						return skyshares.utility.formatcurrency( value / 1000000, 0,",",".","" );
					},
					container: 'allowances-table',
                    delay: 10
				});
			skyshares.chart.table.creategroupsumtable( {
					groups : groups_including_cow,
					field : 'allowances',
					id : 'group-allowancescapita',
					range : {
						min : 2015,
						max : 2100,
						increment : 5
					},
					f: self.getgroupdatapercapita,
					format : function( value ) {
						return skyshares.utility.formatcurrency( value, 2,",",".","" );
					},
					container: 'allowancescapita-table',
                    delay: 20
				});
			skyshares.ui.setprogress({
			    status: 'creating abatement tables'
			});
			skyshares.chart.table.creategroupsumtable({
					groups : groups_including_cow,
					field : 'abatement_target',
					id : 'group-abatement',
					range : {
						min : 2015,
						max : 2100,
						increment : 5
					},
					f: self.getgroupdatasum,
					format : function( value ) {
						return skyshares.utility.formatcurrency( value / 1000000, 2,",",".","", "Mt" );
					},
					container: 'abatement-table',
                    delay: 30
				});
			skyshares.chart.table.creategroupsumtable( {
					groups : groups_including_cow,
					field : 'domabat',
					id : 'group-domabatement',
					range : {
						min : 2015,
						max : 2100,
						increment : 5
					},
					f: self.getgroupdatasum,
					format : function( value ) {
						return skyshares.utility.formatcurrency( value / 1000000, 2,",",".","", "Mt" );
					},
					container: 'domesticabatement-table',
                    delay: 40
				});
			skyshares.ui.setprogress({
			    status: 'creating transfers tables'
			});
			skyshares.chart.table.creategroupsumtable({
					groups : groups_including_cow,
					field : 'transf',
					id : 'group-transfers',
					range : {
						min : 2015,
						max : 2100,
						increment : 5
					},
					f: self.getgroupdatasum,
					format : function( value ) {
						return skyshares.utility.formatcurrency( value / 1000000, 2,",",".", "", "Mt" );
					},
					container: 'transfers-table',
                    delay: 50
				});
			skyshares.ui.setprogress({
			    status: 'creating emissions tables'
			});
			skyshares.chart.table.creategroupsumtable({
					groups : groups_including_cow,
					field : 'emissions',
					id : 'group-emissions',
					range : {
						min : 2015,
						max : 2100,
						increment : 5
					},
					f: self.getgroupdatasum,
					format : function( value ) {
						return skyshares.utility.formatcurrency( value / 1000000, 2,",",".", "", "Mt" );
					},
					container: 'emissions-table',
                    delay: 60
				});
			skyshares.chart.table.creategroupsumtable({
					groups : groups_including_cow,
					field : 'emissions',
					id : 'group-emissionspercapita',
					range : {
						min : 2015,
						max : 2100,
						increment : 5
					},
					f: self.getgroupdatapercapita,
					format : function( value ) {
						return skyshares.utility.formatcurrency( value, 2,",",".", "", "");
					},
					container: 'emisionspercapita-table',
                    delay: 70
				});
			skyshares.ui.setprogress({
			    status: 'creating flows tables'
			});
			skyshares.chart.table.creategroupsumtable({
					groups : groups_including_cow,
					field : 'flow',
					id : 'group-flow',
					range : {
						min : 2015,
						max : 2100,
						increment : 5
					},
					f: self.getgroupdatasum,
					format : function( value ) {
						return skyshares.utility.formatcurrency( value / 1000000, 0,",",".", "$", "" );
					},
					container: 'financialflows-table',
                    delay: 80
				});
			skyshares.chart.table.creategroupsumtable( {
					groups : groups_including_cow,
					field : 'flow',
					id : 'group-flowgdp',
					range : {
						min : 2015,
						max : 2100,
						increment : 5
					},
					f: self.getgroupdatapercentagegdp,
					format : function( value ) {
						return skyshares.utility.formatcurrency( value*100, 2,",",".", "", "%" );
					},
					container: 'financialflowsgdp-table',
                    delay: 90
				});
			skyshares.ui.setprogress({
			    status: 'creating decarbonisation costs tables'
			});
			skyshares.chart.table.creategroupsumtable({
					groups : groups_including_cow,
					field : 'decarb_cost',
					id : 'group-decarbonisationcost',
					range : {
						min : 2015,
						max : 2100,
						increment : 5
					},
					f: self.getgroupdatasum,
					format : function( value ) {
						return skyshares.utility.formatcurrency( value / 1000000, 0,",",".", "$" );
					},
					container: 'decarbonisationcost-table',
                    delay: 100
				});
			skyshares.chart.table.creategroupsumtable( {
					groups : groups_including_cow,
					field : 'decarb_cost',
					id : 'group-decarbonisationcostgdp',
					range : {
						min : 2015,
						max : 2100,
						increment : 5
					},
					f: self.getgroupdatapercentagegdp,
					format : function( value ) {
						return skyshares.utility.formatcurrency( value*100, 2,",",".", "", "%" );
					},
					container: 'decarbonisationcostgdp-table',
                    delay: 200
				});
			skyshares.ui.setprogress({
			    status: 'creating total costs tables'
			});
			skyshares.chart.table.creategroupsumtable({
					groups : groups_including_cow,
					field : 'total_cost',
					id : 'group-totalcost',
					range : {
						min : 2015,
						max : 2100,
						increment : 5
					},
					f: self.getgroupdatasum,
					format : function( value ) {
						return skyshares.utility.formatcurrency( value / 1000000, 0,",",".", "$" );
					},
					container: 'totalcost-table',
                    delay: 300
				});
			skyshares.chart.table.creategroupsumtable( {
					groups : groups_including_cow,
					field : 'total_cost',
					id : 'group-totalcostgdp',
					range : {
						min : 2015,
						max : 2100,
						increment : 5
					},
					f: self.getgroupdatapercentagegdp,
					format : function( value ) {
						return skyshares.utility.formatcurrency( value*100, 2,",",".", "", "%" );
					},
					container: 'totalcostgdp-table',
                    delay: 400
				});
			//
			// detail charts
			//
			skyshares.ui.setprogress({
			    status: 'creating allowances charts'
			});
			skyshares.chart.generategrouplinechart({
					groups : groups_excluding_cow,
					field : 'allowances',
					range : {
						min : 2015,
						max : 2100,
						increment : 5
					},
					f: self.getgroupdatasum,
					format : function( value ) {
						return skyshares.utility.formatcurrency( value / 1000000, 0,",",".","" );
					},
					type : 'area-spline',
					stacked : true,
					container: 'allowancesconverge-chart',
                    delay: 500
				});
			skyshares.chart.generategrouplinechart( {
					groups : groups_including_cow,
					field : 'allowances',
					range : {
						min : 2015,
						max : 2100,
						increment : 5
					},
					f: self.getgroupdatapercapita,
					format : function( value ) {
						return skyshares.utility.formatcurrency( value, 0,",",".","" );
					},
					type : 'spline',
					container: 'allowancescapita-chart',
                    delay: 600
				});
			//
			// transfer charts
			//
			skyshares.ui.setprogress({
			    status: 'creating transfers chart'
			});
			var transfer_groups = ['LIC', 'LMIC', 'UMIC', 'HIC'];
			skyshares.chart.generatetransferchart( {
					groups : transfer_groups,
					range : {
						min : 2014,
						max : 2100,
						increment : 1
						},
					type : 'spline',
					container : 'transfers-chart'		
				});
			//
			//
			//
			skyshares.ui.setprogress({
			    status: 'creating flow charts'
			});
			skyshares.chart.generategroupbarchart({
			    groups: groups_excluding_cow,
			    field: 'flow',
			    range: {
			        min: 2015,
			        max: 2100,
			        increment: 10
			    },
			    f: self.getgroupdatasum,
			    format: function (value) {
			        return skyshares.utility.formatcurrency(value / 1000000, 0, ",", ".", "$");
			    },
			    label_y: {
			        text: 'Millions',
			        position: 'outer-middle'
			    },
			    container: 'financialflows-chart',
                delay: 700
			});
			skyshares.chart.generategroupbarchart({
			    groups: groups_excluding_cow,
			    field: 'flow',
			    range: {
			        min: 2015,
			        max: 2100,
			        increment: 10
			    },
			    f: self.getgroupdatapercentagegdp,
			    format: function (value) {
			        return skyshares.utility.formatcurrency(value*100, 2, ",", ".", "", "%");
			    },
			    container: 'financialflowsgdp-chart',
                delay: 800
			});
			skyshares.ui.setprogress({
			    status: 'creating decarbonisation costs charts'
			});
			skyshares.chart.generategroupbarchart({
					groups : groups_including_cow,
					field : 'decarb_cost',
					range : {
						min : 2015,
						max : 2100,
						increment : 10
					},
					f: self.getgroupdatasum,
					label_y: {
					    text: 'Millions',
					    position: 'outer-middle'
					},
					format: function (value) {
						return skyshares.utility.formatcurrency( value / 1000000, 0,",",".","$" );
					},
					container: 'decarbonisationcost-chart',
                    delay: 900
				});
			skyshares.chart.generategroupbarchart( {
			    groups: groups_including_cow,
					field : 'decarb_cost',
					range : {
						min : 2015,
						max : 2100,
						increment : 10
					},
					f: self.getgroupdatapercentagegdp,
					format : function( value ) {
						return skyshares.utility.formatcurrency( value*100, 2,",",".","", "%" );
					},
					container: 'decarbonisationcostgdp-chart',
                    delay: 1000
				});
			skyshares.ui.setprogress({
			    status: 'creating total costs charts'
			});
			skyshares.chart.generategroupbarchart({
			    groups: groups_including_cow,
					field : 'total_cost',
					range : {
						min : 2015,
						max : 2100,
						increment : 10
					},
					label_y: {
					    text: 'Millions',
					    position: 'outer-middle'
					},
					f: self.getgroupdatasum,
					format: function (value) {
						return skyshares.utility.formatcurrency( value / 1000000, 0,",",".","$" );
					},
					container: 'totalcost-chart',
                    delay: 1100
				});
			skyshares.chart.generategroupbarchart( {
					groups : groups_including_cow,
					field : 'total_cost',
					range : {
						min : 2015,
						max : 2100,
						increment : 10
					},
					f: self.getgroupdatapercentagegdp,
					format : function( value ) {
						return skyshares.utility.formatcurrency( value*100, 2,",",".","", "%" );
					},
					container: 'totalcostgdp-chart',
                    delay: 1200
				});
				
		},
		//
		//
		//
		countries : [],
		groups : [],
		cow_countries : [],
		countries_by_emissions : [],
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
			'percentagetraded',
			'gdp-cepii', 'gdp-mit',
			'mac-gcam', 'mac-mit', 'mac-mckinsey'
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
	// start model 
	//
	self.model =  new Worker( 'javascripts/skyshares.model.worker.js' );
	self.model.onmessage = function( evt ) {
		var self = skyshares.controller;
		switch ( evt.data.command ) {
			case 'ready' :
				self.update();
				skyshares.ui.setprogress( {
					status : 'ready'
				});	
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
				skyshares.ui.setprogress( {
					status : 'done'
				});	
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
						// refresh display
						//
						self.updatemap();
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
				skyshares.chart.generateemisionschart();
				break;
			case 'update_equilibrium_price' : 
				self.equilibrium_price = evt.data.parameter;
				break;
			case 'update_eq_price_pre' :
				self.EQPrice_pre = evt.data.parameter;
				break;
			case 'update_eq_price_fin' :
				self.EQPrice_fin = evt.data.parameter;
				break;
			case 'update_progress' : 
				skyshares.ui.setprogress(evt.data.parameter);
				break;
			case 'debug' :
				console.log( 'model: ' + evt.data.parameter );
				break;
		}
	};
    //
    //
    //
	self.summary_table_row_source = [
			{
			    title: "Allowances per capita",
			    field: "allowancescapita",
			    format: function (value) {
			        return skyshares.utility.formatcurrency(value, 2, ",", ".", "");
			    }
			},
			{
			    title: "Domestic Abatement",
			    field: "domabat",
			    format: function (value) {
			        return skyshares.utility.formatcurrency(value / 1000000, 0, ",", ".", "", "Mt");
			    }
			},
			{
			    title: "Transfers",
			    field: "transf",
			    format: function (value) {
			        return skyshares.utility.formatcurrency(value / 1000000, 0, ",", ".", "", "Mt");
			    }
			},
			{
			    title: "Financial Flows (millions)",
			    field: "flow",
			    format: function (value) {
			        return skyshares.utility.formatcurrency(value / 1000000, 0, ",", ".", "$");
			    }
			},
			{
			    title: "Financial Flows (% GDP)",
			    field: "flow",
			    f_group: self.getgroupdatapercentagegdp,
			    f_country: self.getcountrydatapercentagegdp,
			    format: function (value) {
			        return skyshares.utility.formatcurrency(value*100, 2, ",", ".", "", "%");
			    }
			},
			{
			    title: "Decarbonisation Costs (millions)",
			    field: "decarb_cost",
			    format: function (value) {
			        return skyshares.utility.formatcurrency(value / 1000000, 0, ",", ".", "$");
			    }
			},
			{
			    title: "Decarbonisation Costs (% GDP)",
			    field: "decarb_cost",
			    f_group: self.getgroupdatapercentagegdp,
			    f_country: self.getcountrydatapercentagegdp,
			    format: function (value) {
			        return skyshares.utility.formatcurrency(value*100, 2, ",", ".", "", "%");
			    }
			},
			{
			    title: "Total costs (millions)",
			    field: "total_cost",
			    format: function (value) {
			        return skyshares.utility.formatcurrency(value / 1000000, 0, ",", ".", "$");
			    }
			},
			{
			    title: "Total costs without trade",
			    field: "decarbcostnotrade",
			    format: function (value) {
			        return skyshares.utility.formatcurrency(value / 1000000, 0, ",", ".", "$");
			    }
			},
			{
			    title: "Total costs (% GDP)",
			    field: "total_cost",
			    f_group: self.getgroupdatapercentagegdp,
			    f_country: self.getcountrydatapercentagegdp,
			    format: function (value) {
			        return skyshares.utility.formatcurrency(value*100, 2, ",", ".", "", "%");
			    }
			}
	];
    //
    //
    //
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
	skyshares.ui.addinputeventlistner('flow-country', function (evt) {
	    document.querySelector('#flow-regional').checked = false;
	    skyshares.map.region_flows.style.visibility = 'hidden';
		skyshares.controller.updatemap();
		skyshares.map.country_flows.style.visibility = this.checked ? 'visible' : 'hidden';
	});
	skyshares.ui.addinputeventlistner('flow-regional', function (evt) {
	    document.querySelector('#flow-country').checked = false;
	    skyshares.map.country_flows.style.visibility = 'hidden';
		skyshares.controller.updatemap();
		skyshares.map.region_flows.style.visibility = this.checked ? 'visible' : 'hidden';
	});

})();
