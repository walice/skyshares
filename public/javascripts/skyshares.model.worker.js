//	
	function numberWithCommas(x) {
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
	}

	var format = numberWithCommas(666666)
	console.log("numbers with commas: " + format);

	var numberArray = [40, 1, 5, 200];
	function compareNumbers(a, b) {
 		return a - b;
	}
	console.log('Sorted with compareNumbers:', numberArray.sort(compareNumbers));
	
	function compare(a,b) {
	  if (a.year < b.year)
	     return -1;
	  if (a.year > b.year)
	    return 1;
	  return 0;
	}
	console.log('Sorted with compare', numberArray.sort(compare));

	function sortMultiDimensional(a,b)
	{
    //this will sort the array using the second element    
    return ((b[1] < a[1]) ? -1 : ((b[1] > a[1]) ? 1 : 0));
	}

	//
function log( message ) {
	postMessage( { command: 'debug', parameter: message } );
}
//
// message dispatcher 
//
onmessage = function (evt) {
	log( 'onmessage : ' + JSON.stringify( evt.data ) );
	switch( evt.data.command ) {
		case 'addtocow' :
			model.addtocow( evt.data.parameter );
			break;
		case 'removefromcow' :
			model.removefromcow( evt.data.parameter );
			break;
		case 'add_group_to_cow' :
			model.addgrouptocow( evt.data.parameter );
			model.run();
			break;
		case 'remove_group_from_cow' :
			model.removefromcow( evt.data.parameter );
			model.run();
			break;
		case 'toggle_cow_membership' : 
			model.togglecowmembership( evt.data.parameter );
			model.run();
			break;
		case 'toggle_group_cow_membership' : 
			model.togglegroupcowmembership( evt.data.parameter );
			model.run();
			break;
		case 'reset_cow' : 
			model.resetcow();
			model.run();
			break;
		case 'setvariables' :
			model.setvariables( evt.data.parameter );
			break;
		case 'reset' : 
			model.reset();
			break;
		case 'run' :
			model.run();
			break;
	}
}
//
// replicate localStorage
//
var localStorage = {
	setItem : function( key, json ) {
		var item = localStorage.findItem( key );
		if ( !item ) {
			//log( 'localStorage.setItem( ' + key + ' ) ' );
			item = { key: key, json: json };
			localStorage.items.push( item );
		} else {
			item.json = json;
		}		
	},
	getItem : function( key ) {
		var item = localStorage.findItem( key );
		if ( item ) {
			//log( 'localStorage.getItem( ' + key + ' )' );
			return item.json;
		}
		log( 'localStorage.getItem( ' + key + ' ) : undefined' );
		return undefined;
	},
	removeItem : function( key ) {
		for ( var i = 0; i < localStorage.items.length; i++ ) {
			if ( localStorage.items[ i ].key === key ) {
				localStorage.items.slice( i, 1 );
				break;
			}
		}
	},
	clear : function() {
		localStorage.items = [];
	},
	findItem : function( key ) {
		for ( var i = 0; i < localStorage.items.length; i++ ) {
			if ( localStorage.items[ i ].key === key ) {
				return localStorage.items[ i ];
			}
		}
		return undefined;
	},
	items : []
};

importScripts('math.js', 'skyshares.js', 'skyshares.rest.js', 'skyshares.math.js', 'skyshares.geometry.js', 'numeric-1.2.6.js' ); 

function downloadqueue() {
	this.queue = [];
}
downloadqueue.prototype.add = function( name ) {
	//log( 'downloading: ' + name );
	this.queue.push( name );
}
downloadqueue.prototype.remove = function( name ) {
	//log( 'downloaded: ' + name );
	var offset = this.queue.indexOf( name );
	if ( offset >= 0 ) {
		this.queue.splice( offset, 1 );
	}
}
downloadqueue.prototype.length = function() {
	return this.queue.length;
}

var model = {
	//
	// 
	//
	init : function() {
		var self = model;
		self.ready = false;
		//
		// download countries 
		//
		self.download_queue.add( 'country' );
		skyshares.rest.get( '../country', {
			onloadend : function(evt) {
				var items = skyshares.rest.parseresponse(evt);
				if ( items ) {
					//
					// set iso index 
					//
					for ( var i = 0; i < items.length; i++ ) {
						items[ i ].iso_index = i;
						items[ i ].emissions = [];
						items[ i ].abatement_target = [];
						items[ i ].flow = [];
					}
					self.all_countries = items;
					self.non_cow_countries = items.slice(0);
					self.cow_countries = [];
					//
					// 
					//
					postMessage( { command: 'set_country_list', parameter: items } );
				}
				self.download_queue.remove( 'country' );
				self.ready = self.download_queue.length() == 0;
				if ( self.ready ) postMessage( { command: 'ready' } );
			}
		});
		//
		// download groups for multiple selection
		//
		self.download_queue.add( 'group' );
		skyshares.rest.get( '../data/group', {
				onloadend : function(evt) {
					var items = skyshares.rest.parseresponse( evt );
					if ( items ) {
						for ( var item in items ) {
							//
							// add item to local storage
							//
							localStorage.setItem( items[ item ].name, JSON.stringify( items[ item ] ) );
						}
						//
						//
						//
						postMessage( { command: 'set_group_list', parameter: items } );
					}
					self.download_queue.remove( 'group' );
					self.ready = self.download_queue.length() == 0;
					if ( self.ready ) postMessage( { command: 'ready' } );
				}
			} );
		//
		// download MAC data
		//
		self.mac_data = {
			name	: 'MAC',
			members : []
		};
		for ( var mac_year = 2010; mac_year <= 2100; mac_year += 5 ) {
			self.download_queue.add( 'mac_' + mac_year );
			skyshares.rest.get( '../mac/' + mac_year, {
					onloadend : function(evt) {
						var data = skyshares.rest.parseresponse( evt );
						if ( data ) {
							self.mac_data.members.push( data );
							self.download_queue.remove( 'mac_' + data.year );
						}
						self.ready = self.download_queue.length() == 0;
						if ( self.ready ) postMessage( { command: 'ready' } );
					}
				} );
		}
		//
		// download remainder of model
		//
		var data_types = [ "constant", "dataset", "function", "variable" ];
		data_types.forEach( function( data_type ) {
			self.downloaddata( data_type );
		});
		
	},
	downloaddata : function( type ) {
		var self = model;
		self.download_queue.add( type );
		skyshares.rest.get( '../data/' + type, {
			onloadend : function(evt) {
				var items = skyshares.rest.parseresponse( evt );
				if ( items ) {
					items.forEach( function( item ) {
						//
						// add item to local storage
						//
						localStorage.setItem( item.name, JSON.stringify( item ) );
					});
				}
				self.download_queue.remove( type );
				self.ready = self.download_queue.length() == 0;
				if ( self.ready ) postMessage( { command: 'ready' } );
			}
		} );
	},
	getcountrybyiso : function( countries, iso ) {
		for ( var i = 0; i < countries.length; i++ ) {
			if ( countries[ i ].iso === iso ) return countries[ i ];
		}
		return null;
	},
	//
	//
	//
	addtocow : function( country_iso ) {
		var self =  model;
		var country = self.getcountrybyiso( self.all_countries, country_iso );
		if ( country ) {
			//
			// remove from non cow list
			//
			var index = self.non_cow_countries.indexOf( country );
			if ( index >= 0 ) self.non_cow_countries.splice( index, 1 );
			//
			// add to cow list
			//
			index = self.cow_countries.indexOf( country );
			if ( index < 0 ) self.cow_countries.push( country );
			//
			//
			//
		} else {
			log( 'unable to find country: ' + country_iso );
		}
	},
	removefromcow : function( country_iso ) {
		var self =  model;
		var country = self.getcountrybyiso( self.all_countries, country_iso );
		if ( country ) {
			//
			// remove from cow list
			//
			var index = self.cow_countries.indexOf( country );
			if ( index >= 0 ) self.cow_countries.splice( index, 1 );
			//
			// add to non cow list
			//
			index = self.non_cow_countries.indexOf( country );
			if ( index < 0 ) self.non_cow_countries.push( country );
			//
			//
			//
		} else {
			log( 'unable to find country: ' + country_iso );
		}
	},
	togglecowmembership : function( country_iso ) {
		var self = model;
		if ( self.getcountrybyiso( self.cow_countries, country_iso ) ) {
			//log( 'removing: ' + country_iso );
			self.removefromcow( country_iso );
		} else {
			//log( 'adding: ' + country_iso );
			self.addtocow( country_iso );
		}
		var cow_list = 'COW: ';
		self.cow_countries.forEach( function( country ) {
			cow_list += country.iso + ',';
		});
		log( cow_list );
		var non_cow_list = 'NON_COW: ';
		self.non_cow_countries.forEach( function( country ) {
			non_cow_list += country.iso + ',';
		});
		log( non_cow_list );
		postMessage( { command: 'set_cow_list', parameter: self.cow_countries } ); 
	},
	togglegroupcowmembership : function( group_name ) {
		var self = model;
		var group = self.getdata( group_name );
		if ( group ) {
			group.members.forEach( function( country_iso ) {
				if ( self.getcountrybyiso( self.cow_countries, country_iso ) ) {
					log( 'removing: ' + country_iso );
					self.removefromcow( country_iso );
				} else {
					log( 'adding: ' + country_iso );
					self.addtocow( country_iso );
				}
			});
			postMessage( { command: 'set_cow_list', parameter: self.cow_countries } ); 
		}
	},
	addgrouptocow : function( group_name ) {
		var self = model;
		var group = self.getdata( group_name );
		if ( group ) {
			group.members.forEach( function( country_iso ) {
				if ( !self.getcountrybyiso( self.cow_countries, country_iso ) ) {
					//log( 'adding: ' + country_iso );
					self.addtocow( country_iso );
				}
			});
			postMessage( { command: 'set_cow_list', parameter: self.cow_countries } ); 
		}
	},
	removegroupfromcow : function( group_name ) {
		var self = model;
		var group = self.getdata( group_name );
		if ( group ) {
			group.members.forEach( function( country_iso ) {
				if ( self.getcountrybyiso( self.cow_countries, country_iso ) ) {
					log( 'removing: ' + country_iso );
					self.removefromcow( country_iso );
				}
			});
			postMessage( { command: 'set_cow_list', parameter: self.cow_countries } ); 
		}
	},
	resetcow : function() {
		log( 'resetcow' );
		var self = model;
		self.reset();
		postMessage( { command: 'set_cow_list', parameter: self.cow_countries } ); 
	},
	setvariables : function( variables ) {
		var self = model;
		//
		// TODO: work out how this gets into the model
		//
		var update = variables.force_run;
		if ( self.target_temperature != variables.target_temperature ) {
			self.target_temperature = variables.target_temperature;
			update = true;
		}
		if ( self.risk_scenario != variables.risk_scenario ) {
			self.risk_scenario = variables.risk_scenario;
			update = true;
			switch (variables.risk_scenario) {
				case 0 : // optimistic
					self.setvariable( 'tpsens_gamma',  self.getvariable( 'tpsens_gamma_lo' ) );
					self.setvariable( 'tpsens_lambda',  self.getvariable( 'tpsens_lambda_lo' ) );
					self.setvariable( 'tpsens_Ap',  self.getvariable( 'tpsens_Ap_lo' ) );
					break
				case 1 : // cautious
					self.setvariable( 'tpsens_gamma',  self.getvariable( 'tpsens_gamma_mid' ) );
					self.setvariable( 'tpsens_lambda',  self.getvariable( 'tpsens_lambda_mid' ) );
					self.setvariable( 'tpsens_Ap',  self.getvariable( 'tpsens_Ap_mid' ) );
					break
				case 2 : // pessimistic
					self.setvariable( 'tpsens_gamma',  self.getvariable( 'tpsens_gamma_hi' ) );
					self.setvariable( 'tpsens_lambda',  self.getvariable( 'tpsens_lambda_hi' ) );
					self.setvariable( 'tpsens_Ap',  self.getvariable( 'tpsens_Ap_hi' ) );
					break
			}
		}
		if ( self.convergence_date != variables.convergence_date ) {
			self.convergence_date = variables.convergence_date;
			update = true;
		}
		if ( self.mitigation_start != variables.mitigation_start ) {
			self.mitigation_start = variables.mitigation_start;
			update = true;
		}
		if ( self.trading_scenario != variables.trading_scenario ) {
			self.trading_scenario = variables.trading_scenario;
			update = true;
		}
		if ( self.regulated_share != variables.regulated_share ) {
			self.regulated_share = variables.regulated_share;
			update = true;
		}
		if ( self.allocation_rule != variables.allocation_rule ) {
		self.allocation_rule = variables.allocation_rule;
		update = true;
		}
		
		if ( update ) {
			self.run();
		}
	},
	save : function( name ) {
	
	},
	load : function( name ) {
	
	},
	//
	//
	//
	run : function() {
		var self = model;
		/*
		//
		// test interpolation
		//
		var raw = [ 
			{ x: 0.22, y: 158.05 }, 
			{ x: 0.22, y: 689.38 }, 
			{ x: 0.22, y: 1353.54 }, 
			{ x: 12.95, y: 2680.17 }, 
			{ x: 16.35, y: 4008.31 }, 
			{ x: 49.79, y: 5335.18 },
			{ x: 70.40, y: 6662.85 }
		];
		log( 'linerinterp' );
		[ 0.22, 1, 13, 17, 43, 55, 100 ].forEach( function( x ) {
			log( 'x=' + x + ' y=' + skyshares.math.linerinterp( raw, x ) );
		} );
		log( 'linerinterpinv' );
		[ 1214.273, 1434.787, 2697.782, 4033.966, 5670.7, 5065.628, 8570.484 ].forEach( function( y ) {
			log( 'x=' + skyshares.math.linerinterpinv( raw, y ) + ' y=' + y );
		} );
		*/
		if ( self.cow_countries.length == 0 ) {
			self.all_countries.forEach( function( country ) {
				country.emissions = [];
				country.abatement_target = [];
				country.flow = [];
				country.decarb_cost = [];
				country.total_cost = [];
				country.transf = [];
				country.allowances = [];
				country.percapitaallowances = [];
				country.domabat = [];
				country.decarbcostGDP = [];
				country.totalcostGDP = [];
				country.flowGDP = [];
				country.emissionscapita = [];
				country.allowancescapita = [];
				country.decarbcostnotrade = [];
				country.qBar = [];
				postMessage( { command: 'update_country', parameter: country } );
			});

			postMessage( { command: 'cancel_run' } );
			return; // TODO: need to ensure all countries are cleared
		}
		try {
			//
			//
			//
			if ( self.running ) {
				postMessage( { command: 'waiting_for_end_run' } );
				self.stop = true;
				return;
			}
			self.stop = false;
			self.running = true;
			postMessage( { command: 'start_run' } );
			//
			// initialise scope
			//
			log( 'initialising scope' );
			self.initscope();
			//self.setvariable( 'tM', self.mitigation_start );
			//self.setvariable( 'tC', self.convergence_date );
			log( 'setting mitigation and convergence dates' );
			self.scope[ 'tM' ] = parseInt(self.mitigation_start);
			self.scope[ 'tC' ] = parseInt(self.convergence_date);
			self.scope[ 'trading_scenario' ] = parseInt( self.trading_scenario );
			self.scope[ 'regulated_share' ] = parseFloat( self.regulated_share );
			self.scope[ 'allocation_rule' ] = parseFloat( self.allocation_rule );
			//
			// find mitigation rate
			//
			log( 'finding mitigation rate' );
			self.findmitigationrate();	
			//
			// build data groups from COW members
			//
			log( 'building COW mac' );
			self.buildcowmac();

			//
			// calculate world emissions
			//
			log( 'calculating emission curve' );
			var E = self.getfunction( 'E' );
			var emissions = [];
			log( 'tHist=' + self.scope[ 'tHist' ] + ' tM=' + self.scope[ 'tM' ] + ' m=' + self.scope[ 'm' ] );
			for ( var year = 2010; year <= 2100; year++ ) {
				var e = E(year);
				emissions.push(e);
			}
			postMessage( { command: 'update_world_emissions', parameter: emissions } );
			//
			// calculate EQ price
			//
			var pEQ = self.getfunction( 'pEQ' );
			var equilibrium_price = [];
			for ( var year = 2010; year <= 2100; year++ ) {
				var eq = pEQ(year);
				equilibrium_price.push(eq);
			}
			postMessage( { command: 'update_equilibrium_price', parameter: equilibrium_price } );
			//
			//
			//
			/*
			log( 'testing pEQ' );
			var pEQ = self.getfunction( 'pEQ' );
			for ( var year = 2010; year <= 2100; year += 1 ) {
				log( 'pEQ( ' + year + ' ) = ' +  pEQ( year ) );
			}
			*/			
			log( 'testing wpEQ' );
			var wpEQ = self.getfunction( 'wpEQ' );
			for ( var year = 2010; year <= 2100; year += 1 ) {
				log( 'wpEQ( ' + year + ' ) = ' +  wpEQ( year ) );
			}
			
			//This is OK even if sometimes what is outputted to UI is different ==> display issue?
			
			//postMessage( { command: 'cancel_run' } );
			//return;
			//self.printscope();
			//
			// calculate emissions for COW member countries
			// TODO: this should happen on timer
			//
			log( 'generating country data' );
			var countryemissions = self.getfunction( 'countryemissions' );
			var abat = self.getfunction( 'abat' );
			var flow = self.getfunction( 'flow' );
			var decarbcost = self.getfunction( 'decarbcost' );
			var totalcost = self.getfunction( 'totalcost' );
			var transf = self.getfunction( 'transf' );
			var qBar = self.getfunction( 'qBar' );
			var domAbat = self.getfunction( 'domAbat' );
			var decarbcostGDP = self.getfunction( 'decarbcostGDP' );
			var totalcostGDP = self.getfunction( 'totalcostGDP' );
			var flowGDP = self.getfunction( 'flowGDP' );			
			var regul = self.getfunction( 'regul' );
			var emissionscapita = self.getfunction( 'emissionscapita' );
			var allowancescapita = self.getfunction( 'allowancescapita' );
			var decarbcostnotrade = self.getfunction( 'decarbcostnotrade' );



			var p = self.getdata( 'p' );
			
			var country = self.all_countries[ 0 ];
			function processCountry() {
				country.emissions = [];
				country.abatement_target = [];
				country.flow = [];
				country.decarb_cost = [];
				country.total_cost = [];
				country.transf = [];
				country.allowances = [];
				country.percapitaallowances = [];
				country.domabat = [];
				country.decarbcostGDP = [];
				country.totalcostGDP = [];
				country.flowGDP = [];
				country.emissionscapita = [];
				country.allowancescapita = [];
				country.debtprincipal = [];
				country.debtservice = [];
				country.decarbcostnotrade = [];
				if ( self.cow_countries.indexOf( country ) >= 0 ) {
					//log( "processing country : " + country.iso_index + " : " + country.iso + " : " + country.name );
					for ( var year = 2010; year <= 2100; year++ ) {
						country.emissions.push( countryemissions( country.iso_index, year ) );
						country.abatement_target.push( abat( country.iso_index, year ) );
						country.flow.push( flow( country.iso_index, year ) );
						country.decarb_cost.push( decarbcost( country.iso_index, year ) );
						country.total_cost.push( totalcost( country.iso_index, year ) );
						country.transf.push( transf( country.iso_index, year ) );
						country.decarbcostGDP.push( decarbcostGDP( country.iso_index, year ) );
						country.totalcostGDP.push( totalcostGDP( country.iso_index, year ) );
						country.flowGDP.push( flowGDP( country.iso_index, year ) );
						country.emissionscapita.push( emissionscapita( country.iso_index, year ) );
						country.allowancescapita.push( allowancescapita( country.iso_index, year ) );
						country.decarbcostnotrade.push( decarbcostnotrade(country.iso_index, year ) );
						//country.transf.push( transf( country.iso_index, year ) );
						//country.qBar.push( qBar( country.iso_index, year ) );
						var allowances = qBar( country.iso_index, year );
						country.allowances.push( allowances );
						var population = parseFloat( skyshares.math.getcolumn( p, country.iso_index, year ) );
						country.percapitaallowances.push( allowances / population );
						//log( 'allowances: ' + allowances + ' p:' + population ); 
						country.domabat.push( domAbat( country.iso_index, year ) );
						
						if ( country.iso_index === 0 ) {
							//log( "qBar( " + country.iso + ", " + year + " ) = " + allowances );
						}
					}
				}
				//
				//
				//
				postMessage( { command: 'update_country', parameter: country } );
				//
				// schedule next country
				//
				if ( !self.stop ) {
					var index = self.all_countries.indexOf( country );
					if ( index < self.all_countries.length - 1 ) {
						country = self.all_countries[ index + 1 ];
						setTimeout( processCountry, 1 );
						return;
					} else {
						postMessage( { command: 'end_run' } );
					}
				} else {
					postMessage( { command: 'cancel_run' } );
				}
				
				self.running = false;
			};
			processCountry();
			/*
			try {
				self.all_countries.every( function( country ) {
				
					country.emissions = [];
					country.abatement_target = [];
					country.flow = [];
					country.decarb_cost = [];
					country.total_cost = [];
					country.transf = [];
					country.allowances = [];
					country.domabat = [];
					if ( self.cow_countries.indexOf( country ) >= 0 ) {
						for ( var year = 2010; year <= 2100; year++ ) {
							country.emissions.push( countryemissions( country.iso_index, year ) );
							country.abatement_target.push( abat( country.iso_index, year ) );
							country.flow.push( flow( country.iso_index, year ) );
							country.decarb_cost.push( decarbcost( country.iso_index, year ) );
							country.total_cost.push( totalcost( country.iso_index, year ) );
							country.transf.push( transf( country.iso_index, year ) );
							country.allowances.push( qBar( country.iso_index, year ) );
							country.domabat.push( domAbat( country.iso_index, year ) );
						}
					}
					//
					//
					//
					postMessage( { command: 'update_country', parameter: country } );

					return self.stop != true;
				});
			} catch( error ) {
				log( 'error:' + error );
			}
			*/
			//
			//
			//
		} catch( error ) {
			if ( typeof error == 'string' ) {
				log( 'ERROR:' + error );
			} else {
				log( JSON.stringify( error ) );
			}
		}
	},
	reset : function() {
		log( 'reset' );
		var self = model;
		self.non_cow_countries = self.all_countries.slice(0);
		self.cow_countries = [];
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
				log( "model.getdata : error parsing getdata : " + key + " : " + error + " : " + data_json );
				//throw { message: "model.getdata : error parsing getdata : " + key + " : " + error + " : " + data_json };
			}
		} else {
			log( "model.getdata : invalid key : " + key );
			//throw { message: "model.getdata : invalid key : " + key };
		}
		return undefined;
	},
	putdata : function( key, data ) {
		try {
			localStorage.setItem( key, JSON.stringify( data ) );
		} catch( error ) {
			throw { message: "model.putdata : error saving : " + key + " : " + error };
		}
	},
	setvariable : function( key, value ) {
		var data = model.getdata( key );
		data.value = value;
		model.scope[ key ] = value;
		model.putdata( key, data );
	},
	getvariable : function( key ) {
		var self = model;
		if ( self.scope && self.scope[ key ] ) return self.scope[ key ];
		var data = model.getdata( key );
		self.scope[ key ] = parseFloat( data.value );
		return self.scope[ key ];
	},
	getfunction : function( key ) {
		var self = model;
		if ( self.scope[ key ] ) return self.scope[ key ];
		var data = model.getdata( key );
		var mathjsfunction = skyshares.math.evaluatefunction( data.source, self.scope );
		self.scope[ key ] = mathjsfunction.bindfunction();
		return self.scope[ key ];
	},
	printscope : function() {
		var self = model;
		for ( var key in self.scope ) {
			log( key + ' isa ' + ( typeof self.scope[ key ] ) + ' value ' + self.scope[ key ] );
		}
	},
	//
	//
	//
	initscope : function() {
		var self = model;
		//
		// get default scope from math
		//
		self.scope = skyshares.math.getdefaultscope();
		//
		// add model runtime functions
		//
		for ( var function_name in self.runtime_functions ) {
			self.scope[ function_name ] = self.runtime_functions[ function_name ];
		}
		//
		// add runtime variables
		//
		self.scope[ 'MAC' ] = self.mac_data;//self.getdata( 'MAC' );	
	},
	buildcowmac : function() {
		try {
		var self = model;
		var mac = self.scope[ 'MAC' ];
		var trading_scenario = self.scope[ 'trading_scenario' ];
		//
		var cow_mac = {
			name: 'COW_MAC',
			description: 'COW MAC data interpolated',
			type: 'dataset',
			index: {
				type : 'DATE'
			},
			members: []
		};
		//
		// interpolate mac reduct to calculate COWqREDUC[t][i][MAC]
		//
		var mac_value_max 	= 1000;
		var mac_value_incr 	= 5;
		function COWpMAC( i ) {
			return i == 0 ? 0 : i;
			//Not sure this works see Evernote
		};
		var abat = self.getfunction( 'abat' );
		self.EQPrice = [];
		self.EQPrice_pre = [];
		self.EQPrice_fin = [];
		
		for (var yr=2010; yr <=2100; yr++) {
			if (yr%5 == 0) {
				mac.members.forEach( function( mac_member ) { // for each t
					var cow_mac_iqREDUC = {
						name: 'COW_' + mac_member.name,
						year: mac_member.year,
						description: mac_member.name + ' data interpolated',
						type: 'dataset',
						index: {
							type : 'INT'
						},
						data: []
					};
					//log( "Processing year: " + mac_member.year );
					//
					// generate prices from 0 to mac_value_max
					//
					for ( var i = 0; i <= mac_value_max; i += mac_value_incr ) {
						cow_mac_iqREDUC.data[ i / mac_value_incr ] = {
						x : 0.0,
						y : COWpMAC( i )
						};
					}
					//
					// interpolate each countries mac data
					//
					var abatement_target = 0;
					self.cow_countries.forEach( function( country ) { // for each iCOW
						//
						//
						//
						var country_mac = skyshares.math.getrow( mac_member, country.iso_index );
						//log( country.iso + ' : MAC : ' + JSON.stringify(country_mac.data) );
						for ( var i = 0; i <= mac_value_max; i += mac_value_incr ) {
							//var x = COWpMAC( i );
							//
							// get amount of reduction y for cost x
							//
							var y = skyshares.math.linerinterp(country_mac.data,cow_mac_iqREDUC.data[ i / mac_value_incr ].y);
							if ( isNaN(y) ) {
								log( 'buildcowmac : NaN');
								//log( country.iso + ' : MAC : ' + JSON.stringify(country_mac.data) );
							} else {
								//
								// store cumulative reduction in the x axis with cost in the y axis
								//
								cow_mac_iqREDUC.data[ i / mac_value_incr ].x += y;
								if ( !isFinite( cow_mac_iqREDUC.data[ i / mac_value_incr ].x ) ) {
									//log( "cow_mac_iqREDUC.data [" + ( i / mac_value_incr ) + "] is Infinite" );
								}
							}
							if ( ( country.iso === "USA" || country.iso === "CHN" ) && mac_member.year === 2020 ) {
								//log( country.iso + ' : cow_mac_iqREDUC.data [' + ( i / mac_value_incr ) + '] : ' + JSON.stringify(cow_mac_iqREDUC.data[ i / mac_value_incr ]) );
							}
						}
						//
						//
						//

					if ( trading_scenario == self.getdata( 'endogenous_regulation' ).value ) {
						var regul = self.getfunction( 'regul' );
						var regul = regul( country.iso_index, cow_mac_iqREDUC.year );
						//log(regul/100);
						if ( abat( country.iso_index, cow_mac_iqREDUC.year ) > 0 ) {
							abatement_target += abat( country.iso_index, cow_mac_iqREDUC.year )* ((100-regul)/100);
						}
						//abatement_target += abat( country.iso_index, cow_mac_iqREDUC.year )*(60/100);
						//abatement_target += abat( country.iso_index, cow_mac_iqREDUC.year );
						//abatement_target = abatement_target * ((100-regul)/100);
						for ( var y = 2015; y <= 2100; y++ ) {
							if( y == cow_mac_iqREDUC.year ){
								//log(cow_mac_iqREDUC.year + ": " + numberWithCommas(abatement_target) );
								//log((100-regul)/100);
							}
						};
						
					} else {
						abatement_target += abat( country.iso_index, cow_mac_iqREDUC.year );						
					}

					});
					//
					// store COW_MAC for year
					//
					cow_mac.members.push(cow_mac_iqREDUC);
					postMessage( { command: 'update_cow_mac', parameter: cow_mac_iqREDUC } );
					//
					// calculate Equilibrium Price for year
					//
					var EQyear = {
						year	: cow_mac_iqREDUC.year,
						//price	: skyshares.math.linerinterp(cow_mac_iqREDUC.data,abatement_target)
						price	: Math.max( 0, skyshares.math.linerinterp(cow_mac_iqREDUC.data,abatement_target) )
					};

					if ( isNaN( EQyear.price ) ) {
						//log( "EQyear.price isNaN" );
					}
					if ( abatement_target < cow_mac_iqREDUC.data[ 0 ].x ) {
						//log( cow_mac_iqREDUC.year + ' abatement_target=' + abatement_target + ' is less than min REDUC ' + cow_mac_iqREDUC.data[ 0 ].x );
					} else if ( abatement_target > cow_mac_iqREDUC.data[ cow_mac_iqREDUC.data.length - 1 ].x ) {
						//log( cow_mac_iqREDUC.year + ' abatement_target= ' + abatement_target + ' is greater than REDUC ' + cow_mac_iqREDUC.data[ cow_mac_iqREDUC.data.length - 1 ].x );
					}
					//log( "abatement_target=" + abatement_target + " EQyear: " + JSON.stringify(EQyear) );
					self.EQPrice.push( EQyear );
					//console.log(JSON.stringify(self.EQPrice));
				});


			} else if (yr%5 !=0) {
				//log(yr);
				var mac_bis 	= self.getmac( 'MAC', yr );
				//console.log(mac_bis.mac_member0);
				//console.log(mac_bis);
				var cow_mac_iqREDUC_pre = {
					name: 'COW_MAC_' + yr,
					year: yr,
					//name: 'COW_' + mac_bis.mac_member0, //this is correct syntax but dunno if works
					//year: mac_bis.mac_member0.year, //this is correct syntax but dunno if works
					description: ' data interpolated',
					type: 'dataset',
					index: {
						type : 'INT'
					},
					data: []
				};
				//console.log(JSON.stringify( cow_mac_iqREDUC_pre ));
				var cow_mac_iqREDUC_fin = {
					name: 'COW_MAC_' + yr,
					year: yr,
					description: ' data interpolated',
					type: 'dataset',
					index: {
						type : 'INT'
					},
					data: []
				};
				
				for ( var i = 0; i <= mac_value_max; i += mac_value_incr ) {
					cow_mac_iqREDUC_pre.data[ i / mac_value_incr ] = {
						x : 0.0,
						y : COWpMAC( i )
					};
					cow_mac_iqREDUC_fin.data[ i / mac_value_incr ] = {
						x : 0.0,
						y : COWpMAC( i )
					};
				}
				//console.log(JSON.stringify( cow_mac_iqREDUC_pre.data));
				
				var abatement_target_bis = 0;
				self.cow_countries.forEach( function( country ) { // for each iCOW
					var country_mac_pre = skyshares.math.getrow( mac_bis.mac_member0, country.iso_index );
					var country_mac_fin = skyshares.math.getrow( mac_bis.mac_member1, country.iso_index );

					for ( var i = 0; i <= mac_value_max; i += mac_value_incr ) {
						var y_pre = skyshares.math.linerinterp(country_mac_pre.data,cow_mac_iqREDUC_pre.data[ i / mac_value_incr ].y);
						var y_fin = skyshares.math.linerinterp(country_mac_fin.data,cow_mac_iqREDUC_fin.data[ i / mac_value_incr ].y);
						cow_mac_iqREDUC_pre.data[ i / mac_value_incr ].x += y_pre;
						cow_mac_iqREDUC_fin.data[ i / mac_value_incr ].x += y_fin;
					}
					if ( trading_scenario == self.getdata( 'endogenous_regulation' ).value ) {
						var regul = self.getfunction( 'regul' );
						var regul = regul( country.iso_index, yr );
						//log(regul/100);
						if ( abat( country.iso_index, yr ) > 0 ) {
							abatement_target_bis += abat( country.iso_index, yr )*((100-regul)/100)
						}
						//abatement_target += abat( country.iso_index, cow_mac_iqREDUC.year )*(60/100);
						//abatement_target_bis += abat( country.iso_index, yr )*((100-regul)/100);
						for ( var y = 2015; y <= 2100; y++ ) {
							if( y == yr ){
								//log(yr + ": " + numberWithCommas(abatement_target_bis) );
							}
						};
						
					} else {
						abatement_target_bis += abat( country.iso_index, yr );						
					}
				});

				cow_mac.members.push(cow_mac_iqREDUC_pre);
				cow_mac.members.push(cow_mac_iqREDUC_fin);

				var EQyear_pre = {
					year	: cow_mac_iqREDUC_pre.year,
					price	: Math.max( 0, skyshares.math.linerinterp(cow_mac_iqREDUC_pre.data,abatement_target_bis) )
				};
				var EQyear_fin = {
					year	: cow_mac_iqREDUC_fin.year,
					price	: Math.max( 0, skyshares.math.linerinterp(cow_mac_iqREDUC_fin.data,abatement_target_bis) )
				};
				self.EQPrice_pre.push( EQyear_pre );
				self.EQPrice_fin.push( EQyear_fin );
			}		
		}
		
		self.EQPrice.sort(compare);
		self.EQPrice_pre.sort(compare);
		self.EQPrice_fin.sort(compare);
		//console.log('EQPrice= ' + JSON.stringify(self.EQPrice));
		//console.log('EQPrice_pre= ' + JSON.stringify(self.EQPrice_pre));
		//console.log('EQPrice_fin= ' + JSON.stringify(self.EQPrice_fin)); //BOOOOOOM THIS WORKS


		//
		// store COW_MAC
		//
		self.putdata( cow_mac.name, cow_mac );
		self.scope[ cow_mac.name ] = cow_mac;
		//console.log(JSON.stringify(cow_mac));
		//
		//
		//
		postMessage( { command: 'update_eq_price', parameter: self.EQPrice } );
		postMessage( { command: 'update_eq_price_pre', parameter: self.EQPrice_pre } );
		postMessage( { command: 'update_eq_price_fin', parameter: self.EQPrice_fin } );
		} catch( error ) {
			log( 'error creating COWMac : ' + error );
		}
	},


	findmitigationrate : function() {
		try {
			var self = model;
			//
			// calculate QTPreM
			//
			/*
			var tHist = self.getvariable( 'tHist' );
			var tM = self.getvariable( 'tM' );
			var E = self.getfunction( 'E' );
			log( 'tHist:' + tHist + ' tM:' + tM + ' E:' + E );
			*/
			log( 'calculating QtFutPreM' );
			var calculateQtPreM = self.getfunction( 'calculateQtPreM' );
			var QtFutPreM = calculateQtPreM();
			self.scope[ 'QtFutPreM' ] = QtFutPreM;
			log( 'QtFutPreM=' + QtFutPreM );
		
			//
			// find safe carbon budget
			//
			log( 'calculating Safe CO2 budget' );
			var safebudget = self.getfunction( 'SafeCarbonBudget' );
			var Q = safebudget( self.target_temperature );	
			//
			// convert to CO2
			//
			var QtoCO2 = self.getfunction( 'QtoCO2' );
			var QCO2 = QtoCO2( Q );
			//self.setvariable( 'kQCO2', QCO2 );
			self.scope[ 'kQCO2' ] = QCO2;
			log( 'SafeBudget=' + Q );		
			log( 'QCO2=' + QCO2 );	
			//
			// find mitigation rate
			//
			var findmitigationrate = self.getfunction( 'findmitigationrate' );
			var m = findmitigationrate();
			//self.setvariable( 'm', m );
			self.scope[ 'm' ] = parseFloat(m);
			log( 'm=' + m );
		} catch( error ) {
			log( 'error:' + error );
		}
	},

	//
	//
	//
	runtime_functions : {
		// functions which are dependant on variable number of MAC curves so can't currently be expressed as mathjs functions
		// to be added to scope used to run model 
		//
		pEQ : function( t ) { 

			var self = model;
			self.EQPrice.sort(compare);

			if ( t <= self.EQPrice[ 0 ].year ) { // extrapolate back from first point
				var dt = self.EQPrice[ 0 ].year - self.EQPrice[ 1 ].year;
				var dp = self.EQPrice[ 0 ].price - self.EQPrice[ 1 ].price;
				var l = Math.sqrt( dt * dt + dp * dp );
				dt /= l;
				dp /= l;
				//log( self.EQPrice[ 0 ].price + ( ( self.EQPrice[ 0 ].year - t ) * dp ) );
				return self.EQPrice[ 0 ].price + ( ( self.EQPrice[ 0 ].year - t ) * dp )
			} else if ( t >= self.EQPrice[ self.EQPrice.length - 1 ].year ) { // extrapolate forwards from last point
				var dt = self.EQPrice[ self.EQPrice.length - 1 ].year - self.EQPrice[ self.EQPrice.length - 2 ].year;
				var dp = self.EQPrice[ self.EQPrice.length - 1 ].price - self.EQPrice[ self.EQPrice.length - 2 ].price;
				/*
				var l = Math.sqrt( dt * dt + dp * dp );
				dt /= l;
				dp /= l;
				return self.EQPrice[ self.EQPrice.length - 1 ].price + ( ( t - self.EQPrice[ self.EQPrice.length - 1 ].year ) * dp );
				*/
				//log( self.EQPrice[ self.EQPrice.length - 1 ].price + ( dp / dt ) * ( t - self.EQPrice[ self.EQPrice.length - 1 ].year ) );
				return self.EQPrice[ self.EQPrice.length - 1 ].price + ( dp / dt ) * ( t - self.EQPrice[ self.EQPrice.length - 1 ].year );
			} else {
				//
				// interpolate
				//
				for ( var i = 0; i <= self.EQPrice.length - 1; i++ ) {
					if ( self.EQPrice[ i ].year <= t && self.EQPrice[ i + 1 ].year >= t ) {
						var u = ( self.EQPrice[ i + 1 ].year - t ) / ( self.EQPrice[ i + 1 ].year - self.EQPrice[ i ].year );
						return ( u * self.EQPrice[ i ].price ) + ( ( 1.0 - u ) * self.EQPrice[ i + 1 ].price );
					}
				}

				return self.EQPrice[ self.EQPrice.length - 1 ].price;
			}
		},

		wpEQ : function ( t ) {
			var self = model;
			self.EQPrice_pre.sort(compare);
			self.EQPrice_fin.sort(compare);
			var mac_bis 	= self.getmac( 'MAC', t );
			var u = Math.max( 0.0, Math.min( 1.0, ( t - mac_bis.mac_member0.year ) / ( mac_bis.mac_member1.year - mac_bis.mac_member0.year ) ) ); // clamp interpolation
			
			for ( var i = 0; i <= self.EQPrice.length - 1; i++ ) {
				if ( self.EQPrice[ i ].year == t ) {
					return self.EQPrice[ i ].price;
				}
			}
			for ( var i = 0; i <= self.EQPrice_pre.length - 1; i++ ) {
				if ( self.EQPrice_pre[ i ].year == t ) {
					var value = ( self.EQPrice_fin[ i ].price * u ) + ( self.EQPrice_pre[ i ].price * ( 1.0 - u ) );
					return value;
				}
			}
		},

		price_pre : function( t ) {
			var self = model;
			for ( var i = 0; i <= self.EQPrice_pre.length - 1; i++ ) {
				if ( self.EQPrice_pre[ i ].year == t ) {
					//log(self.EQPrice_pre[ i ].year + ' ' + self.EQPrice_pre[ i ].price);
					return self.EQPrice_pre[ i ].price;
				}
			}
		},

		price_fin : function( t ) {
			var self = model;
			for ( var i = 0; i <= self.EQPrice_fin.length - 1; i++ ) {
				if ( self.EQPrice_fin[ i ].year == t ) {
					return self.EQPrice_fin[ i ].price;
				}
			}
		},

		domAbat : function( i, t ) {
			var self 	= model;
			var abat 	= self.getfunction( 'abat' );				
			var wpEQ 	= self.getfunction( 'wpEQ' );
			var mac 	= self.getcountrymac( 'MAC', i, t );
			var price_pre = self.getfunction( 'price_pre' );
			var price_fin = self.getfunction( 'price_fin' );
			var trading_scenario = self.scope[ 'trading_scenario' ];

			if ( trading_scenario == self.getdata( 'endogenous_notrade' ).value ) {
				var value = abat(i,t);
				//log( "domAbat : " + trading_scenario + " : value=" + value );
				return value;
			} else if ( trading_scenario == self.getdata( 'endogenous_fulltrade' ).value ) {
				var u = Math.max( 0.0, Math.min( 1.0, ( t - mac.mac_member0.year ) / ( mac.mac_member1.year - mac.mac_member0.year ) ) ); // clamp interpolation
				var price = wpEQ(t);
				var price0 = price_pre(t);
				var price1 = price_fin(t); 

					if (t%5 != 0) {
						var value0 = skyshares.math.linerinterp( mac.country_mac0.data, price0 );
					} else {
						var value0 = skyshares.math.linerinterp( mac.country_mac0.data, price );
					}
					if (t%5 != 0) {
					var value1 = skyshares.math.linerinterp( mac.country_mac1.data, price1 );
					} else {
					var value1 = skyshares.math.linerinterp( mac.country_mac1.data, price );
					}

				var value = ( value1 * u ) + ( value0 * ( 1.0 - u ) );
				//log('price0: ' + price0);
				//log( "domAbat : " + trading_scenario + " : pEQ(" + t + ")=" + price + " : iso=" + mac.country_mac0.iso + " : interpolating between : " + value0 + " and " + value1 + " by " + u + " value=" + value );
				return value;

			} else if ( trading_scenario == self.getdata( 'endogenous_regulation' ).value ) {
				var regul = self.getfunction( 'regul' );
				if ( abat(i,t) > 0 ) {
					var value = abat(i,t) * ( regul(i,t) / 100 );
					//var test = ( regul(i,t) / 100 );
					//log( test );
					//log( "domAbat : " + trading_scenario + " : value=" + numberWithCommas(value) );
				} else {
					return 0;
				}
				return value;

			} else {
				return 0;
			}
		},
		decarbcost : function( i, t ) {
			//This has been changed and now error 0.26% as opposed to 2.96% but still weird pre2021
			var self 	= model;
			var domAbat = self.scope[ 'domAbat' ];
			var mac 	= self.getcountrymac( 'MAC', i, t );
			var tu 		= Math.max( 0.0, Math.min( 1.0, ( t - mac.mac_member0.year ) / ( mac.mac_member1.year - mac.mac_member0.year ) ) );
			function interpolateMAC(u) {
				var v0 = Math.max( 0.01, skyshares.math.linerinterpinv( mac.country_mac0.data, u ) );
				var v1 = Math.max( 0.01, skyshares.math.linerinterpinv( mac.country_mac1.data, u ) );
				var value = ( v0 * ( 1.0 - tu ) ) + ( v1 * tu );
				if ( i == 9 ) {
					//log('v0: ' + v0);
					//log('v1: ' + v1);
					//log('value: ' + value);
				}				
				return value;
			};
			var domabat = domAbat( i, t );

			if ( domabat <= 0 ) return 0;
			var cost = skyshares.math.numintegrate_bis( interpolateMAC, 0 , domabat );
			

			//if ( i == 9 ) {
			//	log(interpolateMAC);
				//log( 'AUS MAC 0 : ' + mac.mac_member0.year + ' : ' + JSON.stringify( mac.country_mac0.data ) );
				//log( 'AUS MAC 1 : ' + mac.mac_member1.year + ' : ' + JSON.stringify( mac.country_mac1.data ) );
			//	log('year: ' + t + ' domabat : ' + numberWithCommas(domabat) );
			//	log( 'cost : ' + numberWithCommas(cost) );
			//}
			
			return cost;
		},
		decarbcostnotrade : function( i, t ) {
			//Calculating what the total costs would be without trade
			var self 	= model;
			var Abat = self.scope[ 'abat' ];
			var mac 	= self.getcountrymac( 'MAC', i, t );
			var tu 		= Math.max( 0.0, Math.min( 1.0, ( t - mac.mac_member0.year ) / ( mac.mac_member1.year - mac.mac_member0.year ) ) );
			function interpolateMAC(u) {
				var v0 = Math.max( 0.01, skyshares.math.linerinterpinv( mac.country_mac0.data, u ) );
				var v1 = Math.max( 0.01, skyshares.math.linerinterpinv( mac.country_mac1.data, u ) );
				var value = ( v0 * ( 1.0 - tu ) ) + ( v1 * tu );	
				return value;
			};
			var abat = Abat( i, t );

			if ( abat <= 0 ) return 0;
			var cost = skyshares.math.numintegrate_bis( interpolateMAC, 0 , abat );
			
			return cost;
		},
		//
		// this is a very inefficient recursive function
		//
		calculateQBAU : function( i, t ) {
			var self = model;
			var tHist = self.scope[ 'tHist' ];
			if ( t <= tHist ) {
				var qCO2 = self.scope[ 'qCO2' ];
				return skyshares.math.getcolumn( qCO2, i, tHist );
			} else {
				var GDPReal = self.scope[ 'GDPReal' ];
				return calculateQBAU( i, t - 1 ) * ( skyshares.math.getcolumn( GDPReal, i, t ) / skyshares.math.getcolumn( GDPReal, i, t - 1 ) );
			}
		}
	},

	getmac : function( dataset, t ) {
		//
		// returns mac data which straddles time t
		//
		var self 	= model;
		var mac 	= self.scope[ dataset ];
		//console.log('Sorted with compareNumbers:', mac.members.sort(compareNumbers));
		//
		// select mac data which brackets year t
		//
		//console.log(mac.members.length);

		var mac_member0, mac_member1;
		mac.members.sort(compare);
		if ( t <= mac.members[ 0 ].year ) {
			mac_member0 = mac.members[ 0 ];
			mac_member1 = mac.members[ 1 ];
		} else if ( t >= mac.members[ mac.members.length - 1 ].year ) {
			mac_member0 = mac.members[ mac.members.length - 2 ];
			mac_member1 = mac.members[ mac.members.length - 1 ];
		} else {
			for ( var i = 0; i < mac.members.length - 1; i++ ) {
				//console.log( mac.members[i].year );
				if ( t >= mac.members[ i ].year ) {
					mac_member0 = mac.members[ i ];
					mac_member1 = mac.members[ i + 1 ];
				}
			}
		}
		return {
			mac_member0 : mac_member0,
			mac_member1 : mac_member1

		};
		
	},
	getcountrymac : function( dataset, i, t ) {
		var self 	= model;
		//
		//
		//
		mac = self.getmac( dataset, t );
		//self.mac.sort(compare);
		
		//
		// get country mac
		//
		mac.country_mac0 = skyshares.math.getrow( mac.mac_member0, i );
		mac.country_mac1 = skyshares.math.getrow( mac.mac_member1, i );

		return mac;
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
	risk_scenario : -1, // optimistic = 0, cautious = 1, pessimistic = 2
	target_temperature : -1,
	mitigation_start: 2015,
	convergence_date: 2030,
	trading_scenario: 0, // endogenous.fulltrade = 0, endogenous.notrade = 1, endogenous.regulation = 2
	regulated_share: 1, // endogenous = 0 to infinity, exogenous = 1
	reference_date: 2009,
	allocation_rule: 0, // per_capita = 0, carbon_debt = 1, GDP_basis = 2, historical_responsibilities = 3
	download_queue : new downloadqueue(),
	ready: false,
	running: false,
	stop: false,
	//
	//
	//
	scope : {}
};
//
// initialise model
//
model.init();
