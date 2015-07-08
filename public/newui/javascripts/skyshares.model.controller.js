;
skyshares.controller = {
	init : function() {
		//
		//
		//
		function controller() {
			var self = this;
			//
			// start model 
			// TODO: this should not be in ui
			//
			self.model =  new Worker( 'javascripts/skyshares.model.worker.js' );
			self.model.onmessage = function( evt ) {
				switch ( evt.data.command ) {
					case 'ready' :
						self.model.postMessage( { command: 'run' } );
						break;
					case 'waiting_for_end_run' :
						self.model.postMessage( { command: 'run' } );
						break;
					case 'start_run' :
						self.progress_indicator.style.visibility = 'visible';
						break;
					case 'end_run' :
						self.progress_indicator.style.visibility = 'hidden';
						self.updatecoalitioncharts();
						break;
					case 'cancel_run' :
						self.progress_indicator.style.visibility = 'hidden';
						break;
					case 'update_country' :
						var country = evt.data.parameter;
						if ( country ) { // TODO: encapsulate these properties in skyshares object
							self.map.countries[ country.iso ].emissions 		= country.emissions;
							self.map.countries[ country.iso ].abatement_target 	= country.abatement_target;
							self.map.countries[ country.iso ].flow 				= country.flow;
							self.map.countries[ country.iso ].transf 			= country.transf;
							self.map.countries[ country.iso ].allowances 		= country.allowances;
							self.map.countries[ country.iso ].decarb_cost 		= country.decarb_cost;
							self.map.countries[ country.iso ].total_cost			= country.total_cost;
							self.map.countries[ country.iso ].percapitaallowances 	= country.percapitaallowances;
							self.map.countries[ country.iso ].domabat 				= country.domabat;
							self.updateranges();
							self.updatecountry(country.iso);
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
		};
		controller.prototype.update = function() {
			//
			// get parameters from ui
			//
	
			//
			// update worker parameters
			//
		};
		controller.prototype.setcountrylist = function( list ) {
			this.countries = list;
			this.updatelists();
		};	
		controller.prototype.setgrouplist = function( list ) {
			this.groups = list;
			this.updatelists();
		};	
		controller.prototype.setcowlist = function( list ) {
			var self = this;
			//
			// just store ISOs
			//
			self.cow_countries = [];
			list.forEach( function( country ) {
				self.cow_countries.push( country.iso );	
			} );
			self.updatelists();
		};	
		controller.prototype.updatelists = function() {
			var self = this;
			//
			// update country list
			//
			if ( self.country_select ) {
				self.country_select.onclick = function( evt ) {
					var target = evt.target;	
					var iso = target.getAttribute( 'data-iso' );
					if ( iso && iso.length == 3 ) {
						self.model.postMessage( { command: 'toggle_cow_membership', parameter: iso } );
					}
				};
				var filter = ( self.country_search ? self.country_search.value : '' );
				var options = '';
				self.countries.forEach( function( country ) {
					if ( self.cow_countries.indexOf( country.iso ) < 0 && ( filter.length == 0 || country.name.toLowerCase().indexOf( filter ) >= 0 ) ) {
						options += '<span data-iso="' + country.iso + '" class="selectlistitem" >' + country.name + '&nbsp;+</span><br/>';
					}
				} );
				self.country_select.innerHTML = options;
			}
			//
			// update group list
			//
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
					options += '<span data-group="' + group.name + '" class="selectlistitem" >' + group.name + '&nbsp;+</span><br/>';
				} );
				self.group_select.innerHTML = options;
			}
			//
			// update cow list
			//
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
						options += '<span data-iso="' + country.iso + '" class="selectlistitem" >' + country.name + '&nbsp;-</span><br/>';
					}
				} );
				self.cow_select.innerHTML = options;
			}
		
		};
		//
		//
		//
		return new controller();
	}	
}
