;
skyshares.model = {
	//
	// 
	//
	init : function() {
		var self = skyshares.model;
		//
		// download countries 
		//
		skyshares.rest.get( '/country', {
			onloadend : function(evt) {
				var items = skyshares.rest.parseresponse(evt);
				if ( items ) {
					//
					// set iso index 
					//
					for ( var i = 0; i < items.length; i++ ) {
						items[ i ].iso_index = i;
					}
					self.all_countries = items;
					self.non_cow_countries = items.slice(0);
					self.cow_countries = [];
					self.ui.refreshcowlists();
				}
			
			}
		});
		//
		// download groups for multiple selection
		//
		skyshares.rest.get( 'data/group', {
				onloadend : function(e) {
					var request = e.target;
					var response = request.response === undefined ? request.responseText : request.response;
					var items = JSON.parse( response );
					if ( items ) {
						var group_container = document.getElementById( 'groups' );
						for ( var item in items ) {
							//
							//
							//
							if ( group_container ) {
								var name = items[ item ].name;
								var button = document.createElement( 'a' );
								button.className = 'button';
								button.innerHTML = items[ item ].name;
								button.skyshares = {
									group: items[ item ]
								};
								button.onclick  = function( evt ) {
									//
									// add group members to COW list
									//
									self.ui.addgrouptocow( evt.target.skyshares.group );
								};
								group_container.appendChild(button);
							}
							//
							// add item to local storage
							//
							localStorage.setItem( items[ item ].name, JSON.stringify( items[ item ] ) );
						}
						
					}
				
				}
			} );
		//
		// download remainder of model
		//
		var data_types = [ "constant", "dataset", "function", "variable" ];
		data_types.forEach( function( data_type ) {
			self.downloaddata( data_type );
		});
		//
		// initialise ui
		//
		self.results = document.getElementById( 'results' );
		self.results.innerHTML = '';
		self.progress = document.getElementById( 'model_progress' );
		self.progress.style.visibility = 'hidden';
		
		self.ui.setriskscenario();
		self.ui.settradingscenario();
		//
		//
		//
		self.worker =  new Worker( 'javascripts/skyshares.model.worker.js' );
		self.worker.onmessage = function( evt ) {
			switch ( evt.data.command ) {
				case 'ready' :
					//
					// enable UI
					//
					break;
				case 'update_country' :
					var country = evt.data.parameter;
					if ( country ) {
						var local_country = self.getcountrybyiso( self.all_countries, country.iso );
						if ( local_country ) {
							//console.log( 'updating country: ' + local_country.iso );
							/*
							  Abatement targets
								·         Future emissions
								·         Decarbonisation
								·         Transfers
								·         Flows
								·         Decarbonisation Costs
								·         Total Costs
								·         Equilibrium price.

							*/
							local_country.emissions 		= country.emissions;
							local_country.abatement_target 	= country.abatement_target;
							local_country.flow 				= country.flow;
							local_country.transfer 			= country.transf;
							local_country.decarb_cost		= country.decarb_cost;
							local_country.total_cost		= country.total_cost;
							local_country.allowances		= country.allowances;
							local_country.percapitaallowances 	= country.percapitaallowances;
							local_country.domabat			= country.domabat;
							local_country.decarbcostGDP		= country.decarbcostGDP;
							local_country.totalcostGDP		= country.totalcostGDP;
							
							self.countries_to_process--;
							self.countries_processsed++;
							if ( self.countries_to_process > 0 ) {
								self.progress.value = Math.round( ( self.countries_processsed / self.countries_to_process ) * 100 );
							}
						}
					}
					break;
				case 'update_cow_mac' :
					if ( !self.cow_mac ) {
						self.cow_mac = {};
					}
					self.cow_mac[ evt.data.parameter.year.toString() ] = evt.data.parameter;
					break;
				case 'update_eq_price' :
					console.log( 'updating eq price' );
					self.EQPrice = evt.data.parameter;
					break;
				case 'update_world_emissions' : 
					self.world_emissions = evt.data.parameter;
					break;
				case 'start_run' :
					console.log( 'starting run' );
					self.progress.value = 0;
					self.countries_to_process = self.all_countries.length;
					self.countries_processsed = 0;
					self.progress.style.visibility = 'visible';
					self.results.innerHTML = '';
					break;
				case 'end_run' :
					console.log( 'ending run' );
					//
					// generate tables and charts
					//
					self.generatetables();
					self.generatecharts();
					//
					// enable ui
					//
					self.progress.style.visibility = 'hidden';
					self.progress.value = 0;
					break;
				case 'cancel_run' :
					console.log( 'cancel_run' );
					self.progress.style.visibility = 'hidden';
					self.progress.value = 0;
					break;
				case 'waiting_for_end_run' :
					console.log( 'waiting_for_end_run' );
					self.worker.postMessage( { command: 'run' } );
					break;
				case 'debug' :
					console.log( 'model: ' + evt.data.parameter );
					break;
			}
		};
		self.worker.onerror = function( evt ) {
			alert( 'Error in model : ' + evt.data );
		};
	},
	downloaddata : function( type ) {
		skyshares.rest.get( "data/" + type, {
			onloadend : function(e) {
				var request = e.target;
				var response = request.response === undefined ? request.responseText : request.response;
				var items = JSON.parse( response );
				if ( items ) {
					items.forEach( function( item ) {
						//
						// add item to local storage
						//
						localStorage.setItem( item.name, JSON.stringify( item ) );
					});
				}
			
			}
		} );
	},
	getcountrybyiso : function( countries, iso ) {
		for ( var i = 0; i < countries.length; i++ ) {
			if ( countries[ i ].iso === iso ) return countries[ i ];
		}
		return null;
	},
	ui : {
		//
		// ui
		//
		refreshcowlists : function() {
			//
			//
			//
			function populatelist( container, countries, action ) {
					function createlistitem( country ) {
						var listitem = document.createElement( "div" );
						listitem.className = "listitem";
						var edit = document.createElement( "a" );
						edit.className = "listleftbutton";
						edit.onclick = function(e) {
							//skyshares.editData( item );
						};
						edit.innerHTML = country.name;
						listitem.appendChild( edit );
						
						var action_button = document.createElement( "a" );
						action_button.className = "listrightbutton";
						action_button.onclick = action.onclick;
						action_button.innerHTML = action.icon;
						action_button.skyshares = {
							country : country
						};
						listitem.appendChild( action_button );
						
						container.appendChild(listitem);
					}
					container.innerHTML = "";
					countries.forEach( createlistitem );
			};
			//
			// ensure lists are alphabetic
			//
			function byname( a, b ) {
				return a.name.localeCompare( b.name );
			};
			skyshares.model.non_cow_countries.sort( byname );
			skyshares.model.cow_countries.sort( byname );			 
			//
			// populate counties
			//
			populatelist( document.getElementById( 'country_list' ), skyshares.model.non_cow_countries, {
				onclick : function( evt ) {
					skyshares.model.ui.addtocow(evt.target.skyshares.country);
				},
				icon : '>'
			} );
			populatelist( document.getElementById( 'cow_list' ), skyshares.model.cow_countries, {
				onclick : function( evt ) {
					skyshares.model.ui.removefromcow(evt.target.skyshares.country);
				},
				icon : '<'
			} );

			
		},
		setriskscenario : function() {
			var risk_scenario = parseInt( document.getElementById( 'risk_scenario' ).value );			
		},
		settradingscenario : function() {
			self.trading_scenario = parseInt( document.getElementById( 'trading_scenario' ).value );
			//var show_price_block = skyshares.model.getvariable( 'trading_scenario' ) == 4;
			//document.getElementById( 'exogenous_price_block' ).style.visibility = show_price_block ? 'visible' : 'hidden';
			//document.getElementById( 'exogenous_price_block' ).style.display = show_price_block ? 'block' : 'none';
		},
		setallocationrule : function() {
			self.allocation_rule = parseFloat( document.getElementById( 'allocation_rule' ).value );
		},
		addtocow : function( country ) {
			//
			// remove from non cow list
			//
			var index = skyshares.model.non_cow_countries.indexOf( country );
			skyshares.model.non_cow_countries.splice( index, 1 );
			//
			// add to cow list
			//
			skyshares.model.cow_countries.push( country );
			//
			//
			//
			skyshares.model.ui.refreshcowlists();
			
		},
		removefromcow : function( country ) {
			//
			// remove from cow list
			//
			var index = skyshares.model.cow_countries.indexOf( country );
			skyshares.model.cow_countries.splice( index, 1 );
			//
			// add to non cow list
			//
			skyshares.model.non_cow_countries.push( country );
			//
			//
			//
			skyshares.model.ui.refreshcowlists();
		},
		addgrouptocow : function( group ) {
			var self = skyshares.model;
			//
			// get countries in group but not in cow  
			//
			group.members.forEach( function( iso ) {
				var country = self.getcountrybyiso( self.non_cow_countries, iso );
				if ( country ) {
					self.ui.addtocow( country );
				}
			});
		},
	},
	//
	//
	//
	run : function() {
		function numberWithCommas(x) {
	    var parts = x.toString().split(".");
	    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	    return parts.join(".");
		};

		var self = skyshares.model;
		//
		// test linterpv
		//
		var AFG_MAC_0 = [{"x":0,"y":195538.64143993525},{"x":0.02,"y":910965.1178961993},{"x":0.17,"y":1806304.0376643694},{"x":8.58,"y":3601064.397432357},{"x":36.22,"y":5397866.017316168},{"x":47.3,"y":7195793.849677675},{"x":72.39,"y":8992806.634401055}];
		var AFG_MAC_1 = [{"x":0,"y":329487.53800588084},{"x":0.01,"y":1555721.7613770515},{"x":0.23,"y":3091171.698155578},{"x":12.55,"y":6167773.022380968},{"x":31.68,"y":9247893.760599155},{"x":59.98,"y":12328084.8870972},{"x":69.1,"y":15408205.625315389}];
		/*
		for ( var test_abat = 0; test_abat < 15408205.625315389 + 1000.0; test_abat += 500 ) {
			console.log( 'abat=' + test_abat + ' cost=' + skyshares.math.linerinterpinv( AFG_MAC_1, test_abat ) );
		} 
		*/
		function testintegration( u ) {
			return Math.max( 0.01, skyshares.math.linerinterpinv( AFG_MAC_1, u ) );
		}
		var testabat = 15408205.625315389 + 1000.0;
		var numintegrate_testcost = skyshares.math.numintegrate( testintegration, 0, 15408205.625315389 + 1000.0 );
		var numintegrateint_testcost = skyshares.math.numintegrateint( testintegration, 0, 15408205.625315389 + 1000.0 );
		console.log( 'numintegrate : abat= ' + testabat + ' cost= ' + numintegrate_testcost );
		console.log( 'numintegrateint : abat= ' + testabat + ' cost= ' + numintegrateint_testcost );
		//
		// clear results
		//
		self.countries_to_process = self.all_countries.length;
		self.countries_processsed = 0;
		self.progress.style.visibility = 'visible';
		self.results.innerHTML = '';
		//
		// reset model
		//
		self.worker.postMessage( { command: 'reset' } );
		//
		// add COW countries
		//
		self.cow_countries.forEach( function( country ) {
			self.worker.postMessage( { command: 'addtocow', parameter: country.iso } );
		} );
		//
		// set variables 
		//
		var variables = {
			risk_scenario : parseInt( document.getElementById( 'risk_scenario' ).selectedIndex ), // optimistic = 0, cautious = 1, pessimistic = 2
			target_temperature : parseFloat(document.getElementById( 'target_temperature' ).value),
			mitigation_start: parseInt(document.getElementById( 'mitigation_start' ).value),
			convergence_date: parseInt(document.getElementById( 'convergence_date' ).value),
			trading_scenario: parseInt( document.getElementById( 'trading_scenario' ).selectedIndex ), // endogenous.fulltrade = 0, endogenous.notrade = 1, endogenous.regulation = 2, endogenous.BAU = 3,  exogenous = 4
			regulated_share: parseInt(document.getElementById( 'regulated_share' ).value), // endogenous = 0 to infinity, exogenous = 1
			reference_date: parseInt(document.getElementById( 'reference_date' ).value),
			allocation_rule: parseInt(document.getElementById( 'allocation_rule' ).value),
			force_run: true // invoke run
		};
		self.worker.postMessage( { command: 'setvariables', parameter: variables } );
		/*
		//
		//
		//
		self.generatetable( {
			title : 'Abatement Targets',
			range : {
				min : 2010,
				max : 2100,
				step : 1
			},
			f : self.getfunction( 'abat' )
		} );
		//
		//
		//
		self.generatetable( {
			title : 'Decarbonisation',
			range : {
				min : 2010,
				max : 2100,
				step : 1
			},
			f : self.getfunction( 'domAbat' )
		} );
		//
		//
		//
		self.generatetable( {
			title : 'Transfers',
			range : {
				min : 2010,
				max : 2100,
				step : 1
			},
			f : self.getfunction( 'transf' )
		} );
		//
		//
		//
		self.generatetable( {
			title : 'Flows',
			range : {
				min : 2010,
				max : 2100,
				step : 1
			},
			f : self.getfunction( 'flow' )
		} );
		//
		//
		//
		self.generatetable( {
			title : 'Cost to Polluters',
			range : {
				min : 2010,
				max : 2100,
				step : 1
			},
			f : self.getfunction( 'decarbcost' )
		} );
		//
		//
		//
		self.generatetable( {
			title : 'Total Costs',
			range : {
				min : 2010,
				max : 2100,
				step : 1
			},
			f : self.getfunction( 'totalcost' )
		} );
		//
		// Emissions Trajectory
		//
		var E = self.getfunction( 'E' );
		var header = document.createElement('h2');
		header.innerHTML = 'Emissions Trajectory';
		self.results.appendChild(header);
		var chart = self.createsvg( 'E_CHART', 1024, 512 );
		self.results.appendChild( chart );
		skyshares.chart.linechart(  
			chart,
			{
				axis : {
					x : {
						min : 2010, max : 2200, step : 20
					},
					y : {
						min : 0, max : 50000000000 , step : 10000000000 
					}
				}, 
				resolution : 512.0,
				lines : [
					{
						f : {
							f : E,
							range : {
								min : 2010,
								max : 2100,
								step :  1
							}
						},
						stroke : {
							colour:'#000',
							width: 1
						},
						fill : {
						},
						control_points : {
							stroke : {
								colour:'#F00',
								width: 1
							},
							fill : {
							},
						}
					}
				]
			} );
		//
		// Cumulative Emissions
		//		
		header = document.createElement('h2');
		header.innerHTML = 'Cumulative Emissions';
		self.results.appendChild(header);
		chart = self.createsvg( 'CE_CHART', 1024, 512 );
		self.results.appendChild( chart );
		skyshares.chart.linechart(  
			chart,
			{
				axis : {
					x : {
						min : 2010, max : 2100, step : 5
					},
					y : {
						min : 0, max : 3000000000000 , step : 750000000000
					}
				}, 
				resolution : 512.0,
				lines : [
					{
						f : {
							f : self.getfunction( 'cumulativeemissions' ),
							range : {
								min : 2010,
								max : 2100,
								step :  1
							}
						},
						stroke : {
							colour:'#000',
							width: 1
						},
						fill : {
						},
						control_points : {
							stroke : {
								colour:'#F00',
								width: 1
							},
							fill : {
							},
						}
					}
				]
			} );
		//
		//
		//
		var mac_chart = {
			axis : {
				x : {
					min : 0, max : -50000000, step : 10000000
				},
				y : {
					min : 0, max : 160 , step : 20
				}
			}, 
			resolution : 512.0,
			lines : []
		};
		var colour_index = 0;
		var colour = [ 'red', 'green', 'blue', 'maroon', 'teal' ];
		self.scope[ 'COW_MAC' ].members.forEach( function( cow_mac_member ) {
			mac_chart.lines.push( {
					data : cow_mac_member.data,
					stroke : {
						colour:colour[colour_index++],
						width: 1
					},
					fill : {
					
					}
			});
			if ( cow_mac_member.data[ 0 ].x < mac_chart.axis.x.min ) {
				mac_chart.axis.x.min = cow_mac_member.data[ 0 ].x;
			}
			if ( cow_mac_member.data[ cow_mac_member.data.length - 1 ].x > mac_chart.axis.x.max ) {
				mac_chart.axis.x.max = cow_mac_member.data[ cow_mac_member.data.length - 1 ].x;
			}
		}); 
		mac_chart.axis.x.step = ( mac_chart.axis.x.max - mac_chart.axis.x.min ) / 4;
		header = document.createElement('h2');
		header.innerHTML = 'Global MAC Curves';
		self.results.appendChild(header);
		chart = self.createsvg( 'MAC_CHART', 1024, 512 );
		self.results.appendChild( chart );
		skyshares.chart.linechart( chart, mac_chart );
		//
		// Per capita Allowances
		//		
		header = document.createElement('h2');
		header.innerHTML = 'Convergence of Percapita Allowances';
		self.results.appendChild(header);
		chart = self.createsvg( 'CPCA_CHART', 1024, 512 );
		self.results.appendChild( chart );
		var groups = [ self.getdata( 'LIC' ), self.getdata( 'LMIC' ), self.getdata( 'UMIC' ), self.getdata( 'HIC' ) ];
		var percapitaallowances = {
				axis : {
					x : {
						min : 2010, max : 2100, step : 20
					},
					y : {
						min : 0, max : 800000000000 , step : 200000000000
					}
				}, 
				resolution : 512.0,
				lines : []
			};
		var p = self.getdata( 'p' );
		var qBar = self.getfunction( 'qBar' );
		var CPCA_min_max = {
			min : 30000000,
			max : -30000000
		};
		colour_index = 0;
		groups.forEach( function( group ) {
			function GroupPCA( group ) {
				this.name = group.name;
				this.groupcountries = [];
				for ( var i = 0; i < group.members.length; i++ ) {
					this.groupcountries.push( self.getcountrybyiso( self.all_countries , group.members[ i ] ) );
				}
				this.range = {
					min : 2010,
					max : 2100,
					step :  1
				};
			};
			GroupPCA.prototype.f =  function( t ) {
				//var total_population = skyshares.math.sumcolumn( p, t );
				var total_allowances = 0;
				this.groupcountries.forEach( function( country ) {
					total_allowances += qBar( country.iso_index, t );
				});
				if ( total_allowances < CPCA_min_max.min ) CPCA_min_max.min = total_allowances;
				if ( total_allowances > CPCA_min_max.max ) CPCA_min_max.max = total_allowances;
				return total_allowances; 
			};
			
			percapitaallowances.lines.push( {
						f : new GroupPCA( group ),
						stroke : {
							colour: colour[ colour_index++ ],
							width: 1
						},
						fill : {
						}
			} );

		});
		skyshares.chart.linechart( chart, percapitaallowances);
		*/
	},
	reset : function() {
	
	},

	generatetables : function() {

	Number.prototype.formatMoney = function(c, d, t){
		var n = this, 
	    c = isNaN(c = Math.abs(c)) ? 2 : c, 
	    d = d == undefined ? "." : d, 
	    t = t == undefined ? "," : t, 
	    s = n < 0 ? "-" : "", 
	    i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", 
	    j = (j = i.length) > 3 ? j % 3 : 0;
	   	return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
 	};

		var self = skyshares.model;
		//
		// world emissions
		//
		if ( self.world_emissions ) {
			var title = document.createElement( 'h2' );
			title.innerHTML = 'World Emissions';
			self.results.appendChild(title);
			var table = document.createElement( 'table' );
			self.results.appendChild(self.createtabledownloadlinks(table,'World Emissions'));
			for ( var t = 2010; t <= 2100; t += 1 ) {
				header = document.createElement('th');
				header.innerHTML = t;
				table.appendChild(header);
			}
			var row = document.createElement( 'tr' );
			for ( var t = 2010; t <= 2100; t += 1 ) {
				var col = document.createElement( 'td' );
				col.innerHTML = self.world_emissions[t-2010];
				row.appendChild( col );
			}
			table.appendChild(row);
			self.results.appendChild(table);
		}
		//
		//
		//
		//
		// summary tables
		//
		
		self.generatesummarygroupstable( {
			title : 'Group decarbonisation costs as a share of GDP',
			range : {
				min : 2010,
				max : 2100,
				step : 10
			},
			f : function( i, t ) {
				return self.all_countries[ i ].decarbcostGDP[ t - 2010 ];	
			}
		} );
		self.generatesummarygroupstable( {
			title : 'Group total costs as a share of GDP',
			range : {
				min : 2010,
				max : 2100,
				step : 10
			},
			f : function( i, t ) {
				return self.all_countries[ i ].totalcostGDP[ t - 2010 ];	
			}
		} );
		self.generatesummarygroupstable( {
			title : 'Group Summary Flows',
			range : {
				min : 2010,
				max : 2100,
				step : 10
			},
			f : function( i, t ) {
				return Math.round( self.all_countries[ i ].flow[ t - 2010 ] );	
			}
		} );
		self.generatesummarygroupstable( {
			title : 'Costs to the polluter',
			range : {
				min : 2010,
				max : 2100,
				step : 10
			},
			f : function( i, t ) {
				return Math.round( self.all_countries[ i ].decarb_cost[ t - 2010 ] );	
			}
		} );
		self.generatesummarygroupstable( {
			title : 'Total costs',
			range : {
				min : 2010,
				max : 2100,
				step : 10
			},
			f : function( i, t ) {
				return Math.round( self.all_countries[ i ].total_cost[ t - 2010 ] );	
			}
		} );
		//
		// alowances
		//
		self.generatetable( {
			title : 'Summary Country Allowances',
			range : {
				min : 2010,
				max : 2100,
				step : 1
			},
			f : function( i, t ) {
				return Math.round( self.all_countries[ i ].allowances[ t - 2010 ] );	
			}
		} );
		//
		// abat
		//
		self.generatetable( {
			title : 'Summary Country Abatement',
			range : {
				min : 2010,
				max : 2100,
				step : 10
			},
			f : function( i, t ) {
				return Math.round( self.all_countries[ i ].abatement_target[ t - 2010 ] );	
			}
		} );
		//
		// flows
		//
		self.generatetable( {
			title : 'Summary Country Flows',
			range : {
				min : 2010,
				max : 2100,
				step : 10
			},
			f : function( i, t ) {
				return Math.round( self.all_countries[ i ].flow[ t - 2010 ] );	
			}
		} );
		//
		// decarb cost
		//
		self.generatetable( {
			title : 'Summary Decarb Costs',
			range : {
				min : 2010,
				max : 2100,
				step : 10
			},
			f : function( i, t ) {
				return Math.round( self.all_countries[ i ].decarb_cost[ t - 2010 ] );	
			}
		} );
		//
		// total cost
		//
		self.generatetable( {
			title : 'Summary Total Costs',
			range : {
				min : 2010,
				max : 2100,
				step : 10
			},
			f : function( i, t ) {
				return Math.round( self.all_countries[ i ].total_cost[ t - 2010 ] );	
			}
		} );
		//
		// total cost
		//
		self.generatetable( {
			title : 'Domestic Abatement',
			range : {
				min : 2010,
				max : 2100,
				step : 1
			},
			f : function( i, t ) {
				return Math.round( self.all_countries[ i ].domabat[ t - 2010 ] );	
			}
		} );
		//
		// all data
		//
		/*
		  				Abatement targets
			·         Future emissions
			·         Decarbonisation
			·         Transfers
			·         Flows
			·         Decarbonisation Costs
			·         Total Costs
			·         Equilibrium price.

		
		country.emissions
		country.abatement_target
		country.flow 				= country.flow;
		country.transfer 			= country.transf;
		country.decarb_cost		= country.decarb_cost;
		country.total_cost		= country.total_cost;
		country.allowances		= country.allowances;
		country.percapitaallowances 	= country.percapitaallowances;
		local_country.domabat			= country.domabat;
		*/
		self.generatetable( {
			title : 'Abatement Targets',
			range : {
				min : 2010,
				max : 2100,
				step : 1
			},
			f : function( i, t ) {
				return Math.round( self.all_countries[ i ].abatement_target[ t - 2010 ] );	
			}
		} );
		self.generatetable( {
			title : 'Emissions',
			range : {
				min : 2010,
				max : 2100,
				step : 1
			},
			f : function( i, t ) {
				return Math.round( self.all_countries[ i ].emissions[ t - 2010 ] );	
			}
		} );
		/*
		self.generatetable( {
			title : 'Decarbonisation',
			range : {
				min : 2010,
				max : 2100,
				step : 1
			},
			f : function( i, t ) {
				return Math.round( self.all_countries[ i ].emissions[ t - 2010 ] );	
			}
		} );
		*/
		self.generatetable( {
			title : 'Transfers',
			range : {
				min : 2010,
				max : 2100,
				step : 1
			},
			f : function( i, t ) {
				return Math.round( self.all_countries[ i ].transfer[ t - 2010 ] );	
			}
		} );
		self.generatetable( {
			title : 'Flows',
			range : {
				min : 2010,
				max : 2100,
				step : 1
			},
			f : function( i, t ) {
				return Math.round( self.all_countries[ i ].flow[ t - 2010 ] );	
			}
		} );
		self.generatetable( {
			title : 'Decarbonisation Costs',
			range : {
				min : 2010,
				max : 2100,
				step : 1
			},
			f : function( i, t ) {
				return Math.round( self.all_countries[ i ].decarb_cost[ t - 2010 ] );	
			}
		} );
		self.generatetable( {
			title : 'Total Costs',
			range : {
				min : 2010,
				max : 2100,
				step : 1
			},
			f : function( i, t ) {
				return Math.round( self.all_countries[ i ].total_cost[ t - 2010 ] );	
			}
		} );
		self.generatetable( {
			title : 'Decarbonisation Costs as a share of GDP',
			range : {
				min : 2010,
				max : 2100,
				step : 1
			},
			f : function( i, t ) {
				return self.all_countries[ i ].decarbcostGDP[ t - 2010 ].toFixed(2);	
			}
		} );
		self.generatetable( {
			title : 'Total Costs as a share of GDP',
			range : {
				min : 2010,
				max : 2100,
				step : 1
			},
			f : function( i, t ) {
				return self.all_countries[ i ].totalcostGDP[ t - 2010 ].toFixed(2);	
			}
		} );	
		if ( self.EQPrice ) {
			function pEQ( t ) { 
				if ( t <= self.EQPrice[ 0 ].year ) { // extrapolate back from first point
					var dt = self.EQPrice[ 0 ].year - self.EQPrice[ 1 ].year;
					var dp = self.EQPrice[ 0 ].price - self.EQPrice[ 1 ].price;
					var l = Math.sqrt( dt * dt + dp * dp );
					dt /= l;
					dp /= l;
					return self.EQPrice[ 0 ].price + ( ( self.EQPrice[ 0 ].year - t ) * dp )
				} else if ( t >= self.EQPrice[ self.EQPrice.length - 1 ].year ) {
					var dt = self.EQPrice[ self.EQPrice.length - 1 ].year - self.EQPrice[ self.EQPrice.length - 2 ].year;
					var dp = self.EQPrice[ self.EQPrice.length - 1 ].price - self.EQPrice[ self.EQPrice.length - 2 ].price;
					var l = Math.sqrt( dt * dt + dp * dp );
					dt /= l;
					dp /= l;
					return self.EQPrice[ self.EQPrice.length - 1 ].price + ( ( t - self.EQPrice[ self.EQPrice.length - 1 ].year ) * dp );
				} else {
					//
					// interpolate
					//
					for ( var i = 0; i < self.EQPrice.length - 1; i++ ) {
						if ( self.EQPrice[ i ].year <= t && self.EQPrice[ i + 1 ].year >= t ) {
							var u = ( self.EQPrice[ i + 1 ].year - t ) / ( self.EQPrice[ i + 1 ].year - self.EQPrice[ i ].year );
							return ( u * self.EQPrice[ i ].price ) + ( ( 1.0 - u ) * self.EQPrice[ i + 1 ].price );
						}
					}
					return self.EQPrice[ self.EQPrice.length - 1 ].price;
				}
			};

			var table = document.createElement('table');
			var header = document.createElement('h2');
			header.innerHTML = "Equilibrium Price";
			self.results.appendChild(header);
			self.results.appendChild(self.createtabledownloadlinks(table,"Equilibrium Price"));
			for ( var t = 2010; t <= 2100; t++ ) {
				header = document.createElement('th');
				header.innerHTML = t;
				table.appendChild(header);
			}
			var row = document.createElement( 'tr' );
			for ( var t = 2010; t <= 2100; t++ ) {
				var col = document.createElement( 'td' );
				col.innerHTML = pEQ( t );
				row.appendChild( col );
			}
			table.appendChild(row);
			self.results.appendChild(table);
		}
		
	},
	generatesummarygroupstable : function( config ) {
		var self = skyshares.model;
		//
		// build income groups
		//
		var groups = [ self.getdata( 'LIC' ), self.getdata( 'LMIC' ), self.getdata( 'UMIC' ), self.getdata( 'HIC' )  ];
		var regions = [ self.getdata( 'Africa' ), self.getdata( 'Americas' ), self.getdata( 'Asia' ), self.getdata( 'Europe' ), self.getdata( 'Oceania' ) ];
		var income_groups = [];
		for( var i = 0; i < groups.length; i++ ) {
			var group_regions = { name: groups[ i ].name, regions: {} };
			for( var j = 0; j < regions.length; j++ ) {
				for ( var k = 0; k < groups[ i ].members.length; k++ ) {
					if ( regions[ j ].members.indexOf( groups[ i ].members[ k ] ) >= 0 ) {
						var country = self.getcountrybyiso( self.cow_countries, groups[ i ].members[ k ] );
						if ( country ) {
							if ( group_regions.regions[ regions[ j ].name ] == undefined ) {
								group_regions.regions[ regions[ j ].name ] = [];
							}
							group_regions.regions[ regions[ j ].name ].push( country );
						}
					}
				}
			}
			income_groups.push( group_regions );
		}
		//
		// render table
		//
		try {
			var table = document.createElement('table');
			var header = document.createElement('h2');
			header.innerHTML = config.title;
			self.results.appendChild(header);
			table.appendChild(document.createElement('th'));
			for ( var t = config.range.min; t <= config.range.max; t += config.range.step ) {
				header = document.createElement('th');
				header.innerHTML = t;
				table.appendChild(header);
			}
			//
			//
			//
			for ( var i = 0; i < income_groups.length; i++ ) {
				//
				// income group header
				//
				var row = document.createElement('tr');
				var name = document.createElement('th');
				name.style.textAlign = 'left';
				name.innerHTML = income_groups[ i ].name;			
				row.appendChild( name );
				table.appendChild(row);
				//
				// regional summaries
				//
				for( var region in income_groups[ i ].regions ) {
					row = document.createElement('tr');
					name = document.createElement('th');
					name.style.textAlign = 'right';
					name.innerHTML = region;			
					row.appendChild( name );
					
					for ( var t = config.range.min; t <= config.range.max; t += config.range.step ) {
						var column = document.createElement('td');
						try {
							var value = 0;
							for ( var k = 0; k < income_groups[ i ].regions[ region ].length; k++ ) {
								value += config.f( income_groups[ i ].regions[ region ][ k ].iso_index, t );
							}
							column.innerHTML = Math.round( value );
						} catch( error ) {
							//console.log( 'Error generating table ' +  config.title + ' problem with country ' +  self.cow_countries[ i ].name + ' : ' + error.message );
							//console.log( error.stack );
							console.log( 'Error generating table ' +  config.title + ' : ' + error.message + ' : ' + error.stack );
							column.innerHTML = 'error';
					
						}
						row.appendChild( column );
					}
					table.appendChild(row);
				}
			}
			self.results.appendChild(table);
		} catch( err ) {
			alert( "Unable to table : " + err.message );
		}
	},
	generatecharts : function() {
		var self = skyshares.model;
		//
		// World Emissions
		//		
		var header = document.createElement('h2');
		header.innerHTML = 'World Emissions';
		self.results.appendChild(header);
		var chart = document.createElement( 'div' );
		chart.id = 'world_emissions';
		self.results.appendChild(chart);
		skyshares.chart.linechart(  
			'#' + chart.id,
			{
				axis : {
					x : {
						min : 2010, max : 2100, step : 10, name: 'year', type: 'date'
					},
					y : {
						name : 'emissions'
					}
				}, 
				lines : [
					{
						name: 'world emissions',
						f : function( t ) {
							return self.world_emissions[ t - 2010 ]; 
						},
					}
				]
			} );
		//
		// COW MAC
		//
		if ( self.cow_mac ) {
			for ( var year in self.cow_mac ) {
				header = document.createElement('h2');
				header.innerHTML = 'COW MAC Curve ' + year;
				self.results.appendChild(header);
				chart = document.createElement( 'div' );
				chart.id = 'COW_MAC_' + year;
				self.results.appendChild(chart);
				skyshares.chart.linechart(  
					'#' + chart.id,
					{
						axis : {
							x : {
								min : 0, max : self.cow_mac[ year ].data.length - 1, step : 10, name: 'reduction', type: 'number', ticks: 4
							},
							y : {
								name : 'cost',
								ticks: 10
							}
						}, 
						lines : [
							{
								name: 'COW MAC ' + year,
								data: self.cow_mac[ year ].data
							}
						]
					} );
				}
		}
	},
	createsvg : function( id, width, height ) {
		var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		svg.setAttribute('id', id);
		//svg.setAttribute('style', 'border: 1px solid black');
		svg.setAttribute('width', width);
		svg.setAttribute('height', height);
		svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
		return svg;
	},
	createtabledownloadlinks : function( table, title ) {
		var filename = title.replace( ' ', '_' );
		table.id = filename;
		var download = document.createElement( 'div' );
		var excel = '<a download=' + filename + '.xls" href="#" onclick="return ExcellentExport.excel(this, \'' + filename + '\', \'' + title + '\');">Export to Excel</a>';
    	var csv = '<a download=' + filename + '.csv" href="#" onclick="return ExcellentExport.csv(this, \'' + filename + '\');">Export to CSV</a>';
    	download.innerHTML = excel + '&nbsp;' + csv;
    	return download;
	},
	generatetable : function( config ) {
		var self = skyshares.model;
		try {
			var table = document.createElement('table');
			var header = document.createElement('h2');
			header.innerHTML = config.title;
			self.results.appendChild(header);
			self.results.appendChild(self.createtabledownloadlinks(table,config.title));
			table.appendChild(document.createElement('th'));
			for ( var t = config.range.min; t <= config.range.max; t += config.range.step ) {
				header = document.createElement('th');
				header.innerHTML = t;
				table.appendChild(header);
			}
			for ( var i = 0; i < self.cow_countries.length; i++ ) {
				var row = document.createElement('tr');
				var name = document.createElement('th');
				name.style.textAlign = 'left';
				name.innerHTML = self.cow_countries[ i ].name;
				row.appendChild( name );
				for ( var t = config.range.min; t <= config.range.max; t += config.range.step ) {
					var column = document.createElement('td');
					try {
						column.innerHTML = config.f( self.cow_countries[ i ].iso_index, t );
					} catch( error ) {
						//console.log( 'Error generating table ' +  config.title + ' problem with country ' +  self.cow_countries[ i ].name + ' : ' + error.message );
						//console.log( error.stack );
						console.log( 'Error generating table ' +  config.title + ' : ' + error.message + ' : ' + error.stack );
						column.innerHTML = 'error';
						
					}
					row.appendChild( column );
				}
				table.appendChild(row);
			}
			self.results.appendChild(table);
		} catch( err ) {
			alert( "Unable to table : " + err.message );
		}
	},
	//
	// local storage data manipulation
	//
	getdata : function( key ) {
		var data_json = localStorage.getItem( key );
		if ( data_json && data_json.length > 0 ) {
			try {
				return JSON.parse( data_json );
			} catch( error ) {
				throw { message: "skyshares.model.getdata : error parsing getdata : " + key + " : " + error + " : " + data_json };
			}
		} else {
			throw { message: "skyshares.model.getdata : invalid key : " + key };
		}
	},
	putdata : function( key, data ) {
		try {
			localStorage.setItem( key, JSON.stringify( data ) );
		} catch( error ) {
			throw { message: "skyshares.model.putdata : error saving : " + key + " : " + error };
		}
	},
	setvariable : function( key, value ) {
		var data = skyshares.model.getdata( key );
		data.value = value;
		skyshares.model.putdata( key, data );
	},
	getvariable : function( key ) {
		var self = skyshares.model;
		if ( self.scope && self.scope[ key ] ) return self.scope[ key ];
		var data = skyshares.model.getdata( key );
		self.scope[ key ] = data.value;
		return self.scope[ key ];
	},
	getfunction : function( key ) {
		var self = skyshares.model;
		if ( self.scope[ key ] ) return self.scope[ key ];
		var data = skyshares.model.getdata( key );
		var mathjsfunction = skyshares.math.evaluatefunction( data.source, self.scope );
		self.scope[ key ] = mathjsfunction.bindfunction();
		return self.scope[ key ];
	},
	//
	//
	//
	all_countries : [],
	//
	// working variables
	//
	non_cow_countries : [],
	cow_countries : [],
	risk_scenario : 1, // optimistic = 0, cautious = 1, pessimistic = 2
	target_temperature : 2,
	mitigation_start: 2015,
	convergence_date: 2030,
	trading_scenario: 0, // endogenous.fulltrade = 0, endogenous.notrade = 1, endogenous.regulation = 2
	regulated_share: 100, // endogenous = 0 to infinity, exogenous = 1
	reference_date: 2009,
	allocation_rule: 0, // per_capita = 0, carbon_debt = 1, GDP_basis = 2, historical_responsibilities = 3
	//
	//
	//
	scope : {}
};
