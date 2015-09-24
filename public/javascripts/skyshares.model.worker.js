//
// utilities
//	
function compareyear( a, b ) {
	return ( a.year - b.year );
}
function log( message ) {
	postMessage( { command: 'debug', parameter: message } );
}
function sendprogress( status, total, current ) {
	postMessage( { 
		command: 'update_progress', 
		parameter: { 
			status: status,
			total: total,
			current: current
		}
	} );
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
//
// 
//
function downloadqueue() {
	this.queue = [];
	this.max = 0;
}
downloadqueue.prototype.add = function( name ) {
	//log( 'downloading: ' + name );
	this.queue.push( name );
	this.max++;
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
downloadqueue.prototype.sendprogress = function() {
	sendprogress( "downloading data...", this.max, this.max - this.queue.length );
}
//
//
//
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
		//skyshares.rest.get( 'http://skyshares-soda.rhcloud.com/country', {
		skyshares.rest.get( '../country', {
			onloadend : function(evt) {
				var items = skyshares.rest.parseresponse(evt);
				if ( items ) {
					//
					// set iso index 
					//
					for ( var i = 0; i < items.length; i++ ) {
						items[ i ].iso_index = i;
						self.clearcountrydata(items[ i ]);
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
				if ( self.ready ) {
					postMessage( { command: 'ready' } );
				} else {
					self.download_queue.sendprogress();
				}
			}
		});
		//
		// download groups for multiple selection
		//
		self.download_queue.add( 'group' );
		//skyshares.rest.get('http://skyshares-soda.rhcloud.com/data/group', {
		skyshares.rest.get( '../data/group', {
		        onloadend: function (evt) {
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
					if ( self.ready ) {
						postMessage( { command: 'ready' } );
					} else {
						self.download_queue.sendprogress();
					}
				}
			} );
		//
		// download MAC data
		//
		self.mac_datasets = {};
		try {
			[ 'GCAM', 'MIT', 'McKinsey' ].forEach(function(prefix) {
				self.mac_datasets[ prefix ] = {};
				self.downloadmacdata(prefix);
			});
			self.mac_data = self.mac_datasets[ self.mac_dataset ];
		} catch(e) {
			log( 'ERROR : Downloading Mac : ' + e );
		}
		//
		// download remainder of model
		//
		var data_types = [ "constant", "dataset", "function", "variable" ];
		data_types.forEach( function( data_type ) {
			self.downloaddata( data_type );
		});
		//
		//
		//
		self.download_queue.sendprogress();
	},
	downloadmacdata : function( prefix ) {
		var self = model;
		//
		// download MAC data
		//
		self.mac_datasets[prefix] = {
			name	: 'MAC_' + prefix,
			members : []
		};
		for ( var mac_year = 2010; mac_year <= 2100; mac_year += 5 ) {
			log('downloading ' + prefix + '_' + mac_year);
			self.download_queue.add( 'mac_' + prefix + '_' + mac_year );
			(function(year) {
			    //skyshares.rest.get('http://skyshares-soda.rhcloud.com/mac/' + prefix + '_' + year, {
			    skyshares.rest.get( '../mac/' + prefix + '_' + year, {
			            onloadend: function (evt) {
							var data = skyshares.rest.parseresponse( evt );
							if ( data ) {
								self.mac_datasets[prefix].members.push( data );
								self.mac_datasets[prefix].members.sort(compareyear);
								self.download_queue.remove( 'mac_' + prefix + '_' + year );
								log('downloaded ' + prefix + '_' + year);
							}
							self.ready = self.download_queue.length() == 0;
							if ( self.ready ) {
								postMessage( { command: 'ready' } );
							} else {
								self.download_queue.sendprogress();
							}
						}
				} );
			})(mac_year);
		}
	
	},
	downloaddata : function( type ) {
		var self = model;
		self.download_queue.add( type );
		//skyshares.rest.get('http://skyshares-soda.rhcloud.com/data/' + type, {
		skyshares.rest.get( '../data/' + type, {
		        onloadend: function (evt) {
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
				if ( self.ready ) {
					postMessage( { command: 'ready' } );
				} else {
					self.download_queue.sendprogress();
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
		if ( variables.gdp_dataset && self.gdp_dataset != variables.gdp_dataset ) {
			self.gdp_dataset = variables.gdp_dataset;
			update = true;
		}
		if ( variables.mac_dataset && self.mac_dataset != variables.mac_dataset ) {
			self.mac_dataset = variables.mac_dataset;
			self.mac_data = self.mac_datasets[ self.mac_dataset ];
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
	clearcountrydata: function (country) {
	    country.population = [];
	    country.gdp = [];
		country.emissions = [];
		country.abatement_target = [];
		country.flow = [];
		country.decarb_cost = [];
		country.total_cost = [];
		country.transf = [];
		country.allowances = [];
		country.domabat = [];
		country.decarbcostGDP = [];
		country.decarbcostnotrade = [];
		country.totalcostGDP = [];
		country.flowGDP = [];
		country.emissionscapita = [];
		country.allowancescapita = [];
		country.debtprincipal = [];
		country.debtservice = [];
	},
	//
	//
	//
	run : function() {
		var self = model;
		if ( self.cow_countries.length == 0 ) {
			self.all_countries.forEach( function( country ) {
				self.clearcountrydata( country );
				postMessage( { command: 'update_country', parameter: country } );
			});

			postMessage( { command: 'cancel_run' } );
			return; 
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
			if ( self.stop ) return;
			//
			// calculate world emissions
			//
			log( 'calculating emission curve' );
			var E = self.getfunction( 'E' );
			var emissions = [];
			log( 'tHist=' + self.scope[ 'tHist' ] + ' tM=' + self.scope[ 'tM' ] + ' m=' + self.scope[ 'm' ] );
			//for ( var year = 2010; year <= 2100; year++ ) {
			for ( var year = 1990; year <= 2200; year++ ) {
				var e = E(year);
				emissions.push(e);
			}
			postMessage( { command: 'update_world_emissions', parameter: emissions } );
			//
			// calculate EQ price
			//
			log( 'pre generating wpEQ' );
			var wpEQ = self.getfunction( 'wpEQ' );
			var equilibrium_price = [];
			for ( var year = 2010; year <= 2100; year++ ) {
				var price = wpEQ( year );
				equilibrium_price.push( price );
				log( 'wpEQ( ' + year + ' ) = ' +  price );
			}
			postMessage( { command: 'update_equilibrium_price', parameter: equilibrium_price } );
			//
			// preload functions
			//
			log( 'preloading functions' );
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
			//
			// optimised functions
			//
			var domAbat_opt = self.getfunction( 'domAbat_opt' );
			var decarbcost_opt = self.getfunction( 'decarbcost_opt' );
			//
			// preload data
			//
			log( 'preloading data' );
			var p = self.getdata( 'p' );
			var GDPDataSet = 'GDP_' + self.gdp_dataset; 
			var GDPData = self.getdata( GDPDataSet );
			//var qBAU = self.getdata( 'qBAU' ); 
			var qBAU = self.getdata( 'qBAU_' + self.mac_dataset ); 
			if ( !qBAU ) {
				//
				// fallback onto default
				//
				log( 'Unable to find dataset qBAU_' + self.mac_dataset + ' falling back to default' );
				qBAU = self.getdata( 'qBAU' ); 
			} else {
			    //self.putdata('qBAU', qBAU);
			    self.scope['qBAU'] = qBAU;
			}
			//
			//
			//
			var regulated_share = self.scope[ 'regulated_share' ];
			//
			// process countries
			//
			log( 'generating country data' );
			var country = self.all_countries[ 0 ];
			var progress_total = self.all_countries.length;
			var progress_current = 0;
			function processCountry() {
				self.clearcountrydata( country );
				if ( self.cow_countries.indexOf( country ) >= 0 ) {
					log( "processing country : " + country.iso_index + " : " + country.iso + " : " + country.name );
					sendprogress( "generating data for countries...", progress_total, progress_current );
					for ( var year = 2010; year <= 2100; year++ ) {
						//
						//
						//
						//log("getting country data");
						var population = parseFloat( skyshares.math.getcolumn( p, country.iso_index, year ) );
						var gdp = parseFloat( skyshares.math.getcolumn( GDPData, country.iso_index, year ) );
						var mac = self.getcountrymac('MAC', country.iso_index, year);
					    //
					    //
                        //
						country.gdp.push(gdp);
						country.population.push(population);
						//
						// abatement
						//
						//log("abat");
						var abat_i_t = abat( country.iso_index, year );
						country.abatement_target.push( abat_i_t );					
						//
						// domestic abatement
						//
						//log("domAbat");
						var domabat_i_t = domAbat_opt( year, mac, abat_i_t, regulated_share );
						country.domabat.push( domabat_i_t );	
						//
						// decarbonisation cost
						// 
						//log("decarbcost");
						var decarbcost_i_t = decarbcost_opt( year, mac, domabat_i_t );
						country.decarb_cost.push( decarbcost_i_t );
						country.decarbcostGDP.push( ( decarbcost_i_t / gdp ) * 100.0 );
						//
						// decarbonisation cost, no trade
						//
						var decarbcostnotrade_i_t = decarbcost_opt( year, mac, abat_i_t );
						country.decarbcostnotrade.push( decarbcostnotrade_i_t );
						//
						// flow
						// flow(i,t) =( abat(i,t) - domAbat(i,t)  ) * wpEQ(t)
						//
						//log("flow");
						var flow_i_t = ( abat_i_t - domabat_i_t ) * equilibrium_price[ year - 2010 ];
						country.flow.push( flow_i_t );
						country.flowGDP.push( ( flow_i_t / gdp ) * 100.0 );
						//
						// total cost
						//
						// totalcost( i,t ) = flow( i,t ) + decarbcost( i,t )
						//
						//log("totalcost");
						var totalcost_i_t = flow_i_t + decarbcost_i_t;
						country.total_cost.push( totalcost_i_t );
						country.totalcostGDP.push( ( totalcost_i_t / gdp ) * 100.0 );
						//
						// transfers
						//
						// transf( i,t ) = abat( i,t ) - domAbat( i,t )
						//
						//log("transf");
						var transf_i_t = abat_i_t - domabat_i_t 
						country.transf.push( transf_i_t );
						//
						// allowances
						//
						//log("allowances");
						var allowances_i_t = qBar( country.iso_index, year );
						country.allowances.push( allowances_i_t );
						country.allowancescapita.push( allowances_i_t / population );
						//
						// emissions
						//
						// countryemissions(i,t) = ifElse( trading_scenario == 0,  qBar( i,t ) + transf( i,t  ), ifElse( trading_scenario == 2,  getcolumn( qBAU, i, t )  - ( domAbat( i, t ) + transf( i, t ) ), qBar( i, t ) ) )
						//
						//log("emissions");
						var emissions_i_t = 
							( self.scope[ 'trading_scenario' ] === 0 ? allowances_i_t + transf_i_t : 
								( self.scope[ 'trading_scenario' ] === 2 ? skyshares.math.getcolumn( qBAU, country.iso_index, year ) - ( domabat_i_t + transf_i_t ) :
								allowances_i_t ) );
						country.emissions.push( emissions_i_t );
						country.emissionscapita.push( emissions_i_t / population );
					}
				}
				//
				//
				//
				progress_current++;
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
			//
			//
			//
		} catch( error ) {
			if ( typeof error == 'string' ) {
				log( 'ERROR:' + error );
			} else {
				log( 'ERROR:' + JSON.stringify( error ) );
			}
			self.running = false;
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
		self.scope['MAC'] = self.mac_data;//self.getdata( 'MAC' );	
	    //
	    //
        //
		var qBAU = self.getdata('qBAU_' + self.mac_dataset);
		if (!qBAU) {
		    //
		    // fallback onto default
		    //
		    log('Unable to find dataset qBAU_' + self.mac_dataset + ' falling back to default');
		    qBAU = self.getdata('qBAU');
		} 
		self.scope['qBAU'] = qBAU;
	},
	buildcowmac : function() {
		try {
			var self = model;
			var mac = self.scope[ 'MAC' ];
			//var regul = self.getfunction( 'regul' );
			var trading_scenario = self.scope[ 'trading_scenario' ];
			//
			//
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
			var abat = self.getfunction( 'abat' );
			self.EQPrice = [];
			self.EQPrice_pre = [];
			self.EQPrice_fin = [];
			var regulated_share = (100.0-self.scope[ 'regulated_share' ])/100.0;
			var progress_total = ( 2100 - 2010 ) * self.cow_countries.length;
			var progress_current = 0;
			sendprogress( "building model...", progress_total, progress_current );
			for (var yr=2010; yr <=2100; yr++) {
				//log(yr);
				var mac_bis = self.getmac( 'MAC', yr );
				var cow_mac_iqREDUC_pre = {
					name: 'COW_MAC_' + yr,
					year: yr,
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
						y : i
					};
					cow_mac_iqREDUC_fin.data[ i / mac_value_incr ] = {
						x : 0.0,
						y : i
					};
				}
				//console.log(JSON.stringify( cow_mac_iqREDUC_pre.data));
				//
				// COW abatement target for year yr
				//
				var abatement_target_bis = 0;
				self.cow_countries.forEach( function( country ) { // for each iCOW
					if ( self.stop ) return;
					var country_mac_pre = skyshares.math.getrow( mac_bis.mac_member0, country.iso_index );
					var country_mac_fin = skyshares.math.getrow( mac_bis.mac_member1, country.iso_index );

					for ( var i = 0; i <= mac_value_max; i += mac_value_incr ) {
						var y_pre = skyshares.math.linerinterp(country_mac_pre.data,cow_mac_iqREDUC_pre.data[ i / mac_value_incr ].y);
						var y_fin = skyshares.math.linerinterp(country_mac_fin.data,cow_mac_iqREDUC_fin.data[ i / mac_value_incr ].y);
						cow_mac_iqREDUC_pre.data[ i / mac_value_incr ].x += y_pre;
						cow_mac_iqREDUC_fin.data[ i / mac_value_incr ].x += y_fin;
					}
					var abat_i_t = abat( country.iso_index, yr );
					if ( trading_scenario == self.getdata( 'endogenous_regulation' ).value ) {
						if ( abat_i_t > 0 ) {
							abatement_target_bis += abat_i_t*regulated_share;
						}
					} else {
						abatement_target_bis += abat_i_t;						
					}
					progress_current++;
					sendprogress( "building model...", progress_total, progress_current );
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
			//
			// JONS: should be no need to sort, arrays are fixed order
			//
			//self.EQPrice_pre.sort(compare);
			//self.EQPrice_fin.sort(compare);
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
			postMessage( { command: 'update_eq_price_pre', parameter: self.EQPrice_pre } );
			postMessage( { command: 'update_eq_price_fin', parameter: self.EQPrice_fin } );
			
			sendprogress( "finished building model" );
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
			self.scope['risk_scenario'] = self.risk_scenario;
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
			self.scope[ 'kQCO2' ] = QCO2;
			log( 'SafeBudget=' + Q );		
			log( 'QCO2=' + QCO2 );	
			//
			// find mitigation rate
			//
			var findmitigationrate = self.getfunction( 'findmitigationrate' );
			var m = findmitigationrate();
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
		//
		// functions which are dependant on variable number of MAC curves so can't currently be expressed as mathjs functions
		// to be added to scope used to run model 
		//
		pEQ : function( t ) { 

			var self = model;
			//
			// JONS: override this function with wpEQ for now. TODO: remove all references
			//
			var wpEQ = self.getfunction( 'wpEQ' );
			return wpEQ( t );
		},

		wpEQ : function ( t ) {
			var self = model;
			
			var mac_bis = self.getmac( 'MAC', t );
			var u = Math.max( 0.0, Math.min( 1.0, ( t - mac_bis.mac_member0.year ) / ( mac_bis.mac_member1.year - mac_bis.mac_member0.year ) ) ); // clamp interpolation
			for ( var i = 0; i < self.EQPrice_pre.length; i++ ) {
				if ( self.EQPrice_pre[ i ].year === t ) {
					var value = ( self.EQPrice_fin[ i ].price * u ) + ( self.EQPrice_pre[ i ].price * ( 1.0 - u ) );
					return value;
				}
			}
			return 0;
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
				var price0 = price_pre(t);
				var price1 = price_fin(t); 
				var value0 = skyshares.math.linerinterp( mac.country_mac0.data, price0 );
				var value1 = skyshares.math.linerinterp( mac.country_mac1.data, price1 );
				var value = ( value1 * u ) + ( value0 * ( 1.0 - u ) );
				return value;

			} else if ( trading_scenario == self.getdata( 'endogenous_regulation' ).value ) {
				var regul = self.getfunction( 'regul' );
				if ( abat(i,t) > 0 ) {
					var value = abat(i,t) * ( regul(i,t) / 100 );
				} else {
					return 0;
				}
				return value;

			} else {
				return 0;
			}
		},
		domAbat_opt : function( t, mac, abat, regul ) {
			var self 				= model;
			var trading_scenario 	= self.scope[ 'trading_scenario' ];
			if ( trading_scenario == self.getdata( 'endogenous_notrade' ).value ) {
				return abat;
			} else if ( trading_scenario == self.getdata( 'endogenous_fulltrade' ).value ) {
				var u = Math.max( 0.0, Math.min( 1.0, ( t - mac.mac_member0.year ) / ( mac.mac_member1.year - mac.mac_member0.year ) ) ); // clamp interpolation
				var price0 = self.runtime_functions.price_pre(t);
				var price1 = self.runtime_functions.price_fin(t); 
				var value0 = skyshares.math.linerinterp( mac.country_mac0.data, price0 );
				var value1 = skyshares.math.linerinterp( mac.country_mac1.data, price1 );
				var value = ( value1 * u ) + ( value0 * ( 1.0 - u ) );
				return value;
			} else if ( trading_scenario == self.getdata( 'endogenous_regulation' ).value ) {
				if ( abat > 0 ) {
					var value = abat * ( regul / 100 );
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
				return value;
			};
			var domabat = domAbat( i, t );
			if ( domabat <= 0 ) return 0;
			var cost = skyshares.math.numintegrate_bis( interpolateMAC, 0 , domabat );
			return cost;
		},
		decarbcost_opt : function( t, mac, abatement ) { // cost with trade abatement = domabat, cost with no trade abatement = abat
			if ( abatement <= 0 ) return 0;
			var tu = Math.max( 0.0, Math.min( 1.0, ( t - mac.mac_member0.year ) / ( mac.mac_member1.year - mac.mac_member0.year ) ) );
			function interpolateMAC(u) {
				var v0 = Math.max( 0.01, skyshares.math.linerinterpinv( mac.country_mac0.data, u ) );
				var v1 = Math.max( 0.01, skyshares.math.linerinterpinv( mac.country_mac1.data, u ) );
				var value = ( v0 * ( 1.0 - tu ) ) + ( v1 * tu );
				return value;
			};
			var cost = skyshares.math.numintegrate_bis( interpolateMAC, 0 , abatement );
			return cost;		
		}
	},

	getmac : function( dataset, t ) {
		//
		// returns mac data which straddles time t
		//
		var self 	= model;
		var mac 	= self.scope[ dataset ];
		//
		// select mac data which brackets year t
		//
		var mac_member0, mac_member1;
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
	//reference_date: 2009,
	allocation_rule: 0, // per_capita = 0, carbon_debt = 1, GDP_basis = 2, historical_responsibilities = 3
	mac_dataset: "GCAM",
	gdp_dataset: "CEPII",
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
