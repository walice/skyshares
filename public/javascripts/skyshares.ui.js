;
skyshares.ui = {
	init : function() {
		//
		// IE is the only browser which doesn't support CSS transformation on SVG
		//
		var browser = {
			IE9 : /MSIE 9/i.test(navigator.userAgent),
			IE10 : /MSIE 10/i.test(navigator.userAgent),
			IE11 : /rv:11.0/i.test(navigator.userAgent)
		};
		browser.isIE = browser.IE9 || browser.IE10 || browser.IE11;
		//
		// controls 
		//
		function control() {
			this.listeners = {};
		};
		//
		//
		//
		control.prototype.getValue = function() {
			return this.value;
		};
		control.prototype.setValue = function( value ) {
			var clamped = Math.min( this.max, Math.max( this.min, value ) );
			var new_value = clamped;
			if ( this.steps > 0 ) {
				var unit = ( this.max - this.min ) / ( this.steps - 1 );
				var quantised = Math.round( new_value / unit ) * unit; 
				new_value = quantised;
			}
			if ( clamped != this.value ) {
				this.value = new_value;
				if ( this.updateUI ) {	
					this.updateUI();
				}
				//
				//
				//
				this.fire( 'change' );
			}
		};
		//
		//
		//
		control.prototype.addEventListener = function(type, listener) {
			if ( !this.listeners[ type ] ) {
				this.listeners[ type ] = [];
			}
			this.listeners[ type ].push( listener );
		};
		control.prototype.removeEventListener = function(type, listener) {
			if ( this.listeners[ type ] ) {
				var offset = this.listeners[ type ].indexOf( listener );
				if ( offset >= 0 ) {
					this.listeners[ type ].splice( offset, 1, 0 );
				}
			}
		};
		control.prototype.informListeners = function(event) {
			var listeners = this.listeners[ event.type ];
			if ( this.listeners[ event.type ] ) {
				var cancelled = false;
				listeners.every( function( listener ) {
					listener( event );
					return true;//event.isCancelled();
				} );
				return cancelled;
			}
		};
		control.prototype.fire = function(event) {
			if ( event instanceof Event ) {
				this.informListeners( event );
			} else {
				try {
					this.informListeners( new Event(event) );
				} catch( error ) {
					var evt = document.createEvent( 'Event' );
					evt.initEvent( event, true, true );
					this.informListeners( evt );
				}
			}
		};
		control.prototype.attach = function( element, name ) {
			var self = this;
			if ( !element.skyshares ) {
				element.skyshares = {};
			}
			element.skyshares[ name ] = self;
			for ( var i = 0; i < element.childNodes.length; i++ ) {
				self.attach( element.childNodes[ i ], name );
			}
		};
		//
		// slider control
		//		
		function slider( prefix, options ) {
			control.call(this);
			//
			// find components
			//
			this.control 	= document.getElementById( prefix );
			this.slider 	= document.getElementById( prefix + '.slider' );
			this.thumb 		= document.getElementById( prefix + '.thumb' );
			this.indicator	= document.getElementById( prefix + '.indicator' );
			this.value_display = document.getElementById( prefix + '.value_display' );
			//
			//
			//
			this.dragging = false;
			this.attach( this.control, 'slider' );
			skyshares.ui.hookmouseevents( this.control, this );
			skyshares.ui.hooktouchevents( this.control, this );
			//
			//
			//
			if ( options ) {
				this.orientation = options.orientation || 'horizontal';
				this.steps = options.steps || 0;
				this.value = options.value || 0;
				this.min = options.min || 0;
				this.max = options.max || 0;
				this.value_display_precision 	= options.value_display_precision || 0;
				this.value_display_prefix 		= options.value_display_prefix || '';
				this.value_display_suffix 		= options.value_display_suffix || '';
			} else { // defaults
				this.orientation = 'horizontal';
				this.steps = 0;
				this.value = 0;
				this.min = 0.0;
				this.max = 1.0;
				this.value_display_precision = 0;
			}
			//
			//
			//
			var slider_bounds = this.slider.getBBox();
			var thumb_bounds = this.thumb.getBBox();
			if ( this.orientation === 'horizontal' ) {
				this.thumb_offset = { x: ( thumb_bounds.x + thumb_bounds.width / 2.0 ), y: thumb_bounds.y };
			} else {
				this.thumb_offset = { x: thumb_bounds.x, y: ( thumb_bounds.y + thumb_bounds.height / 2.0 ) };			
			}
			this.updateUI();
		};
		//
		//
		//
		slider.prototype = Object.create( control.prototype );
		slider.prototype.constructor = slider;	
		//
		//
		//	
		slider.prototype.getValue =  function() {
			return this.value;
		};
		slider.prototype.setValueToPoint =  function( point ) {
			var slider_rect = this.slider.getBoundingClientRect();
			var factor = 0;
			if ( this.orientation === 'vertical' ) {
				factor = ( ( slider_rect.top + slider_rect.height ) - point.y ) / slider_rect.height;
			} else {
				factor = ( point.x - slider_rect.left ) / slider_rect.width;
			}
			var value = this.min + ( this.max - this.min ) * factor;
			this.setValue( value );
			
		};
		slider.prototype.click = function( evt ) {
			var self = evt.target.skyshares.slider;
			self.setValueToPoint( { x: evt.clientX, y : evt.clientY } );
			self.fire( 'change_end' );
		};
		slider.prototype.mousedown = function( evt ) {
			var self = evt.target.skyshares.slider;
			self.dragging = true;
			self.setValueToPoint( { x: evt.clientX, y : evt.clientY } );
		};
		slider.prototype.mousemove = function( evt ) {
			var self = evt.target.skyshares.slider;
			if ( self.dragging ) {
				self.setValueToPoint( { x: evt.clientX, y : evt.clientY } );
			}
		};
		slider.prototype.mouseup = function( evt ) {
			var self = evt.target.skyshares.slider;
			if ( self.dragging ) {
				self.dragging = false;
				self.setValueToPoint( { x: evt.clientX, y : evt.clientY } );
				self.fire( 'change_end' );
			}
		};
		slider.prototype.touchstart = function( evt ) {
			var self = evt.target.skyshares.slider;
			var touch = evt.changedTouches[0];
			self.dragging = touch;
			self.setValueToPoint( { x: touch.clientX, y : touch.clientY } );
			evt.preventDefault();
		};
		slider.prototype.touchmove = function( evt ) {
			var self = evt.target.skyshares.slider;
			var touch = evt.changedTouches[0];
			if ( touch == self.dragging ) {
				self.setValueToPoint( { x: touch.clientX, y : touch.clientY } );
			}
			evt.preventDefault();
		};
		slider.prototype.touchend = function( evt ) {
			var self = evt.target.skyshares.slider;
			var touch = evt.changedTouches[0];
			if ( touch == self.dragging ) {
				self.dragging = false;
				self.setValueToPoint( { x: touch.clientX, y : touch.clientY } );
				evt.preventDefault();
				self.fire( 'change_end' );
			}
		};
		slider.prototype.updateUI = function() {
			var slider_bounds = this.slider.getBBox();
			var thumb_bounds = this.thumb.getBBox();
			var factor = ( this.value - this.min ) / ( this.max - this.min );
			var translate,dx, dy;
			if ( this.orientation === 'horizontal' ) {
				dx = ( slider_bounds.x + ( factor * slider_bounds.width )/* + ( thumb_bounds.width / 2.0 )*/ ) - this.thumb_offset.x;
				dy = ( slider_bounds.y + slider_bounds.height ) - this.thumb_offset.y;
				
			} else {
				dx = ( slider_bounds.x - this.thumb_offset.x ) - ( thumb_bounds.width / 2.0 );
				dy = ( ( slider_bounds.y + slider_bounds.height ) - ( factor * slider_bounds.height ) ) - this.thumb_offset.y;
			}
			translate = 'translate( ' +  dx + ',' +  dy + ' )';
			this.thumb.setAttributeNS(null, "transform", translate);
			
			if ( this.value_display ) {
				var display = ( this.value_display_prefix || '' ) + this.value.toFixed(this.value_display_precision||0) + ( this.value_display_suffix || '' );
				this.value_display.firstChild.data = display;
			}
		};
		//
		// dial control
		//
		function dial( prefix, options ) {
			control.call(this);
			//
			// find components
			//
			this.control 	= document.getElementById( prefix );
			this.dial 		= document.getElementById( prefix + '.dial' );
			this.pointer 	= document.getElementById( prefix + '.pointer' );
			this.pivot		= document.getElementById( prefix + '.pivot' );
			//
			// hook mouse events
			//
			this.dragging = false;
			this.attach( this.control, 'dial' );
			skyshares.ui.hookmouseevents( this.control, this );
			skyshares.ui.hooktouchevents( this.control, this );
			//
			//
			//
			if ( options ) {
				this.steps = options.steps || 0;
				this.value = options.value || 0;
				this.min = options.min || 0;
				this.max = options.max || 0;
			} else { // defaults
				this.steps = 0;
				this.value = 0;
				this.min = 0.0;
				this.max = 1.0;
			}
			//
			//
			//
			this.updateUI();
		};
		dial.prototype = Object.create( control.prototype );
		dial.prototype.constructor = dial;	
		//
		//
		//	
		dial.prototype.mousedown = function( evt ) {
			var self = evt.target.skyshares.dial;
			self.dragging = true;
			self.setValueToPoint( skyshares.geometry.vec2( evt.clientX,evt.clientY ) );
		};
		dial.prototype.mousemove = function( evt ) {
			var self = evt.target.skyshares.dial;
			if ( self.dragging ) {
				self.setValueToPoint( skyshares.geometry.vec2( evt.clientX,evt.clientY ) );
			}
		};
		dial.prototype.mouseup = function( evt ) {
			var self = evt.target.skyshares.dial;
			if ( self.dragging ) {
				self.dragging = false;
				self.setValueToPoint( skyshares.geometry.vec2( evt.clientX,evt.clientY ) );
				self.fire( 'change_end' );
			}
		};
		dial.prototype.touchstart = function( evt ) {
			var self = evt.target.skyshares.dial;
			var touch = evt.changedTouches[0];
			self.dragging = touch;
			self.setValueToPoint( skyshares.geometry.vec2( touch.clientX,touch.clientY ) );
			evt.preventDefault();
		};
		dial.prototype.touchmove = function( evt ) {
			var self = evt.target.skyshares.dial;
			var touch = evt.changedTouches[0];
			if ( touch == self.dragging ) {
				self.setValueToPoint( skyshares.geometry.vec2( touch.clientX,touch.clientY ) );
			}
			evt.preventDefault();
		};
		dial.prototype.touchend = function( evt ) {
			var self = evt.target.skyshares.dial;
			var touch = evt.changedTouches[0];
			if ( touch == self.dragging ) {
				self.dragging = false;
				self.setValueToPoint( skyshares.geometry.vec2( touch.clientX, touch.clientY ) );
				evt.preventDefault();
				self.fire( 'change_end' );
			}
		};
		dial.prototype.setValueToPoint =  function( point ) {
			var self = this;
			var pivot_rect 	= self.pivot.getBoundingClientRect();
			var pivot_point = skyshares.geometry.vec2( pivot_rect.left + pivot_rect.width / 2.0, pivot_rect.top + pivot_rect.height / 2.0 );
			//var pivot_rect 	= self.pivot.getBBox();
			//var pivot_point = skyshares.geometry.vec2( pivot_rect.x + pivot_rect.width / 2.0, pivot_rect.y + pivot_rect.height / 2.0 );
			var angle = pivot_point.bearing( point );
			console.log( 'angle: ' + angle );
			if ( angle < 90.0 ) angle = 360.0;
			if ( angle < 180.0 ) angle = 180.0;
			var factor = ( angle - 180.0 ) / 180.0;
			self.setValue( self.min + ( self.max - self.min ) * factor );
		};
		dial.prototype.updateUI = function() {
			var pivot_bounds = this.pivot.getBBox();
			var angle = ( 180.0 * ( ( this.value - this.min ) / ( this.max - this.min ) ) ) - 90.0;
			var rotate = 'rotate( ' + angle + ',' +  ( pivot_bounds.x + pivot_bounds.width / 2.0 ) + ',' + ( pivot_bounds.y + pivot_bounds.height / 2.0 ) + ' )';
			this.pointer.setAttributeNS(null, "transform", rotate);
		};
		//
		// radiobutton control
		//
		function radiobutton( prefix, options ) {
			control.call(this);
			//
			// find components
			//
			this.control 	= document.getElementById( prefix );
			this.options = [];
			for ( var i = 0; i < this.control.childNodes.length; i++ ) {
				var id = this.control.childNodes[ i ].id;
				if ( id && id.length > 0 ) {
					var parts = id.split( '.' );
					if ( parts.length == 4 && parts[ 2 ] == 'option' ) {
						this.options.push( this.control.childNodes[ i ] );
					}
				}
			} 
			//
			// hook mouse events
			//
			this.attach( this.control, 'radiobutton' );
			skyshares.ui.hookmouseevents( this.control, this );
			skyshares.ui.hooktouchevents( this.control, this );
			//
			//
			//
			if ( options ) {
				this.value = options.value || 0;
			} else { // defaults
				this.value = 0;
			}
			//
			//
			//
			this.updateUI();
		};
		radiobutton.prototype = Object.create( control.prototype );
		radiobutton.prototype.constructor = radiobutton;	
		//
		//
		//
		radiobutton.prototype.click = function( evt ) {
			var self = evt.target.skyshares.radiobutton;
			var option = -1;
			var current = evt.target;
			while( current && current != self.control && option < 0 ) {
				option = self.options.indexOf( current );
				current = evt.target.parentNode;
			} 
			if ( option >= 0 && option != this.value ) {
				self.value = option;
				self.updateUI();
				self.fire( 'change' );
			}
		}	
		radiobutton.prototype.updateUI = function() {
			for ( var i = 0; i < this.options.length; i++ ) {
				this.options[ i ].setAttributeNS( null, 'filter', i == this.value ? 'url(#glow)' : 'url(#desaturate)' );
			}
		}
		//
		// tab control
		//
		var tab_list = [];
		function tab( prefix, options ) {
			var self = this;
			//
			// get components
			//
			this.control 	= document.getElementById( prefix );
			this.tab 		= document.getElementById( prefix + '.tab' );
			this.content 	= document.getElementById( prefix + '.content' );
			this.animation 	= document.getElementById( prefix + '.animation' );
			//
			// hook mouse events
			//
			this.attach( this.control, 'tab' );
			skyshares.ui.hookmouseevents( this.tab, this );
			skyshares.ui.hooktouchevents( this.tab, this );
			//
			// hook animation events
			//
			
			skyshares.utility.addprefixedeventlistener( this.control, "TransitionEnd", function( evt ) {
				if ( self.is_open ) {
					console.log( 'moving to back' );
					self.movetoback();
				} else {
					self.movetofront();
				}
			});
			
			//
			// calculate metrics
			//
			var control_bounds 	= this.control.getBBox();
			var tab_bounds 		= this.tab.getBBox();
			var content_bounds 	= this.content.getBBox();
			this.open_position = { x: control_bounds.x, y: control_bounds.y };
			this.closed_position = { x: control_bounds.x + content_bounds.width, y: control_bounds.y };		
			this.is_open 	= true;
			//
			//
			//
			tab_list.push( this );
			//
			//
			//
			if ( !options.open ) this.close();
		};
		tab.prototype = Object.create( control.prototype );
		tab.prototype.constructor = tab;
		//
		//
		//
		tab.prototype.toggle = function() {
			if ( this.is_open ) {
				this.close();
			} else {
				this.open();
			}
		}
		tab.prototype.open = function() {
			//
			// close all other tabs
			//
			for ( var i = 0; i < tab_list.length; i++ ) {
				if ( tab_list[ i ] != this ) {
					tab_list[ i ].close();
				}
			}
			if ( !this.is_open ) {
				//
				// open this one
				//
				if ( browser.isIE ) {
					this.movetoback();
					this.control.setAttributeNS( null, 'transform', 'translate( 0, 0 )' );
				} else {
					skyshares.utility.setprefixedproperty( this.control.style, 'Transform', 'translateX( 0px )' );
				}
				this.is_open = true;
			}
		}
		tab.prototype.close = function() {
			if ( this.is_open ) {
				if ( browser.isIE ) {
					this.movetofront();
					this.control.setAttributeNS( null, 'transform', 'translate( 900, 0 )' );
				} else {
					skyshares.utility.setprefixedproperty( this.control.style, 'Transform', 'translateX( 900px )' );
				}
				this.is_open = false;
			}
		}
		tab.prototype.movetofront = function() {
			if ( tab.container && tab.container.lastChild != this.control ) {
				tab.container.removeChild( this.control );
				this.control = tab.container.appendChild( this.control );
			}
		}		
		tab.prototype.movetoback = function() {
			if ( tab.container && tab.container.firstChild != this.control ) {
				tab.container.removeChild( this.control );
				this.control = tab.container.insertBefore( this.control, tab.container.firstChild );
			}
		}		
		//
		//
		//
		tab.prototype.click = function( evt ) {
			var self = evt.target.skyshares.tab;
			self.toggle();
		}	
		//
		// gradient
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
			return { 
				r: Math.round( this.stops[ index ].r * ( 1.0 - blend ) + this.stops[ index + 1 ].r * blend ),
				g: Math.round( this.stops[ index ].g * ( 1.0 - blend ) + this.stops[ index + 1 ].g * blend ),
				b: Math.round( this.stops[ index ].b * ( 1.0 - blend ) + this.stops[ index + 1 ].b * blend )
			};
		};
		//
		// ui functionality
		//
		function ui() {
			//
			//
			//
			var self = this;
			self.emissions_gradient = new gradient( [
				{ r: 147, g: 138, b: 72 },
				{ r: 198, g: 183, b: 147 },
				{ r: 232, g: 224, b: 163 },
				{ r: 147, g: 244, b: 137 },
				{ r: 113, g: 244, b: 166 },
				{ r: 34, g: 181, b: 115 }
			] );
			self.variables = {
				target_temperature : 2,
				risk_scenario : 1,
				allocation_rule : 0,
				mitigation_start : 2015,
				convergence_date : 2050,
				trading_scenario : 0,
				regulated_share	: 1.0
			};
			self.current_time = 2015;
			//
			//
			//
			self.minmax = { 
				emissions: { min: Number.MAX_VALUE, max: Number.MIN_VALUE },
				flow: { min: Number.MAX_VALUE, max: Number.MIN_VALUE }
			};
			//
			//
			//
			self.countries = [];
			self.groups = [];
			self.cow_countries = [];
			//
			// initialise map
			//
			self.tooltip = document.getElementById( 'tooltip' );
			/*
			self.tooltip = document.getElementById( 'ui.tooltip' );
			
			self.tooltip_background = document.getElementById( 'ui.tooltip_bkgnd' );
			self.tooltip_text = [];
			for ( var i = 0; i < 3; i++ ) {
				self.tooltip_text[ i ] = document.getElementById( 'ui.tooltip_text.' + i );
			}
			*/
			self.map = skyshares.map.newmap('map');
			for ( var country in self.map.countries ) {
				self.map.countries[ country ].addEventListener( 'dblclick', function( evt ) {
					var iso = "";
					var current = evt.target;
					while( current ) {
						if ( current.id.length === 3 ) {
							iso = current.id;
							break;
						}
						current = current.parentNode;
					}
					if ( iso.length === 3 ) {
						self.model.postMessage( { command: 'toggle_cow_membership', parameter: iso } );
					}
					evt.preventDefault();
				}, false );
				self.map.countries[ country ].addEventListener( 'mousemove', function( evt ) {
					//
					// TODO: move this into map or util
					//
					var iso = "";
					var country_group = null;
					var current = evt.target;
					while( current ) {
						if ( current.id.length === 3 ) {
							iso = current.id;
							country_group = current;
							break;
						}
						current = current.parentNode;
					}
					if ( iso.length === 3 ) {
						if ( country_group.emissions && country_group.emissions.length > 0 ) {
							var year_index = self.current_time - self.time.min;
							
							var p = {
								x: evt.clientX,
								y: evt.clientY,
							};
							self.showtooltip(p,self.getcountrytooltip( country_group ) );
						}
					}
				} );
				self.map.countries[ country ].addEventListener( 'mouseout', function( evt ) {
					if ( !evt.target != self.tooltip ) {
						self.hidetooltip();
					}
				} );
				//
				// debug flows
				//
				if ( false ) {//self.map.countries[ country ].flow_arrow ) {
					self.map.countries[ country ].flow_arrow.addEventListener( 'mousemove', function( evt ) {
						var iso = evt.target.id;
						if ( iso ) {
							var p = {
								x: evt.clientX - 50,
								y: evt.clientY - 50,
							};
							self.showtooltip(p, iso.substr( iso.length - 4 ) );
						}
					} );
					self.map.countries[ country ].flow_arrow.addEventListener( 'mouseout', function( evt ) {
						self.hidetooltip();
					} );
				}
			}
			//
			//
			//
			self.progress_indicator = document.getElementById( 'ui.progress_indicator' );
			self.progress_indicator.style.visibility = 'hidden';
			//
			//
			//
			self.time = new slider( 'ui.time', {
				orientation: 'horizontal',
				steps: 86,
				min:2015,
				max:2100,
				value: 2015
			});
			self.time.addEventListener( 'change', function( evt ) {
				console.log( 'time changed to: ' + self.time.value );
				if ( self.time.value != self.current_time ) {
					self.current_time = self.time.value;
					self.updatemap();
				}
			}, false );
			//
			//
			//
			self.target_temperature = new slider( 'ui.target_temperature', {
				orientation: 'vertical',
				steps: 70,
				min:0,
				max:6,
				value_display_suffix: '°C',
				value_display_precision: 1,
				value: 0//self.variables.target_temperature
			});
			self.target_temperature.addEventListener( 'change', function( evt ) {
				console.log( 'target_temperature changed to: ' + self.target_temperature.value );
				//56.673
				var sliderbb = self.target_temperature.slider.getBBox();
				var factor = 1.0 - ( self.target_temperature.value - self.target_temperature.min ) / ( self.target_temperature.max - self.target_temperature.min );
				self.target_temperature.indicator.setAttributeNS( null, 'y', ( sliderbb.y + ( sliderbb.height * factor ) ) );
				self.target_temperature.indicator.setAttributeNS( null, 'height', ( sliderbb.height - ( sliderbb.height * factor ) ) + 15 );
				self.variables.target_temperature = self.target_temperature.value;
			}, false );
			self.target_temperature.addEventListener( 'change_end', function( evt ) {
				self.model.postMessage( { command: 'setvariables', parameter: self.variables } );
			});
			//
			// force temp indicator to update
			//
			self.target_temperature.setValue(self.variables.target_temperature);
			//
			//
			//
			self.risk_scenario = new radiobutton( 'ui.risk_scenario', {
				value: self.variables.risk_scenario
			});
			self.risk_scenario.addEventListener( 'change', function( evt ) {
				console.log( 'risk_scenario changed to: ' + self.risk_scenario.value );
				self.variables.risk_scenario = self.risk_scenario.value;
				self.model.postMessage( { command: 'setvariables', parameter: self.variables } );
			}, false );
			//
			// 
			//
			self.convergence_date = new slider( 'ui.convergence_date', {
				orientation: 'horizontal',
				steps: 86,
				min:2015,
				max:2100,
				value:self.variables.convergence_date
			});
			self.convergence_date.addEventListener( 'change', function( evt ) {
				console.log( 'convergence_date changed to: ' + self.convergence_date.value );
				self.variables.convergence_date = self.convergence_date.value;
			}, false );
			self.convergence_date.addEventListener( 'change_end', function( evt ) {
				self.model.postMessage( { command: 'setvariables', parameter: self.variables } );
			});
			//
			//
			//
			self.allocation_rule = new radiobutton( 'ui.allocation_rule', {
				value: self.variables.allocation_rule
			});
			self.allocation_rule.addEventListener( 'change', function( evt ) {
				console.log( 'allocation_rule changed to: ' + self.allocation_rule.value );
				//self.variables.allocation_rule = self.allocation_rule.value;
				switch ( self.allocation_rule.value ) {
					case 0 : 
						self.variables.allocation_rule = 1; // carbon_debt
						break;
					case 1 :
						self.variables.allocation_rule = 0; //per_capita
						break;
					case 2 :
						self.variables.allocation_rule = 2; // GDP_basis
						break;
					//case 3 :
						//self.variables.allocation_rule = 3; // historical_responsibilities
						//break;
				}
				self.model.postMessage( { command: 'setvariables', parameter: self.variables } );
			}, false );
			//
			// NOTE: this actually sets regulated share
			//
			self.trading_scenario = new dial( 'ui.trading_scenario', {
				min:0,
				max:100,
				value: 100
			});
			self.trading_scenario.addEventListener( 'change', function( evt ) {
				console.log( 'trading_scenario changed to: ' + self.trading_scenario.value );
				self.variables.regulated_share = self.trading_scenario.value / 100.0;
			}, false );
			self.trading_scenario.addEventListener( 'change_end', function( evt ) {
				self.model.postMessage( { command: 'setvariables', parameter: self.variables } );
			}, false );
			//
			// initialise control panels
			//
			tab.container = document.getElementById( 'ui.panel_container' );
			self.tool_panel = new tab( 'ui.tool_panel', {} );
			self.rule_panel = new tab( 'ui.rule_panel', { open: true } );
			self.map_panel = new tab( 'ui.map_panel', {} );
			self.graph_panel = new tab( 'ui.graph_panel', {} );
			self.documentation_panel = new tab( 'ui.documentation_panel', {} );
			self.account_panel = new tab( 'ui.account_panel', {} );
			//
			//
			//
			self.toggle_country_flows = document.getElementById( 'ui.country_flows_toggle' );
			self.toggle_country_flows.addEventListener( 'click', function( evt ) {
				if ( self.map.togglecountryflows() ) {
					self.updatemap();
					self.toggle_country_flows.setAttributeNS( null, 'filter', 'url(#glow)' );
				} else {
					self.toggle_country_flows.setAttributeNS( null, 'filter', 'none' );
				}
			}, false );
			self.toggle_region_flows = document.getElementById( 'ui.regional_flows_toggle' );
			self.toggle_region_flows.addEventListener( 'click', function( evt ) {
				if ( self.map.toggleregionflows() ) {
					self.updatemap();
					self.toggle_region_flows.setAttributeNS( null, 'filter', 'url(#glow)' );
				} else {
					self.toggle_region_flows.setAttributeNS( null, 'filter', 'none' );
				}
			}, false );
			//
			//
			//
			self.country_select = document.getElementById( 'ui.map_panel.country_select' );
			self.country_search = document.getElementById( 'ui.map_panel.country_search' );
			if ( self.country_search ) {
				self.country_search.oninput = function( evt ) {
					self.updatelists();
				};			
			}
			self.group_select 	= document.getElementById( 'ui.map_panel.group_select' );
			self.cow_select 	= document.getElementById( 'ui.map_panel.cow_select' );
			self.cow_reset		= document.getElementById( 'ui.map_panel.cow_reset' );
			if ( self.cow_reset ) {
				self.cow_reset.onclick = function( evt ) {
					self.model.postMessage( { command: 'reset_cow' } );
				}
			}
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
						self.updateemissionschart();
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
		ui.prototype.getcountrytooltip = function( country_group ) {
			var country 	= this.getcountry( country_group.id );
			var year_index 	= this.current_time - this.time.min;
			text = country.name + '<br /><span class="tooltip_light" style="font-size: 90%;" >Emissions</span> <span class="tooltip_bold">' + Math.round( country_group.emissions[ year_index ] / 1000000 ) + '</span><span class="tooltip_light" style="font-size: 60%;" >MtCO<sub>2</sub></span>';
			if ( country_group.decarb_cost ) {
				text += '<br /><span class="tooltip_light" style="font-size: 90%;" >Decarbonisation Costs</span> <span class="tooltip_bold">' + skyshares.utility.formatcurrency( country_group.decarb_cost[ year_index ],0 ) + '</span>';
			}
			if ( country_group.total_cost ) {
				text += '<br /><span class="tooltip_light" style="font-size: 90%;" >Total Costs</span> <span class="tooltip_bold">' + skyshares.utility.formatcurrency( country_group.total_cost[ year_index ],0 ) + '</span>';
			}
			return 	text;
		};
		ui.prototype.updateranges = function() {
			var year_index = this.current_time - this.time.min;
			//
			// preflight to get min/max
			//
			for ( var property in this.minmax ) {
				this.minmax[ property ].min = Number.MAX_VALUE;
				this.minmax[ property ].max = Number.MIN_VALUE;
				for ( var country in this.map.countries ) {
					if ( this.map.countries[country][ property ] && this.map.countries[country][ property ].length > 0 ) {
						if ( this.map.countries[country][ property ][ year_index ] < this.minmax[ property ].min ) this.minmax[ property ].min = this.map.countries[country][ property ][ year_index ];
						if ( this.map.countries[country][ property ][ year_index ] > this.minmax[ property ].max ) this.minmax[ property ].max = this.map.countries[country][ property ][ year_index ];
					}
				}
			}
		};
		ui.prototype.updatemap = function() {
			//
			// TODO: fire this off on a timer
			//
			this.updateranges();
			this.updateregions();
			for ( var country in this.map.countries ) {
				this.updatecountry( country );
			}
		};
		ui.prototype.updatecountry = function(country) {
			var year_index = this.current_time - this.time.min;
			//
			// set emission colours 
			//
			if ( this.map.countries[country].emissions && this.map.countries[country].emissions.length > 0 ) {
				try {
					var factor = this.minmax.emissions.min == this.minmax.emissions.max ? 0.0 : ( this.map.countries[country].emissions[ year_index ] - this.minmax.emissions.min ) / ( this.minmax.emissions.max - this.minmax.emissions.min );
					var colour = this.emissions_gradient.getcolour( 1.0 - factor );
					this.map.countries[country].style.fill = 'rgb(' + colour.r + ',' + colour.g + ',' + colour.b + ')';
				} catch( error ) {
					this.map.countries[country].style.fill = 'red';
				}
			} else {
				this.map.countries[country].style.fill = 'rgb(191,191,191 )';
			}
			//
			// update flow arrows
			//
			if ( this.map.countries[country].flow_arrow ) {
				var flow_arrow = this.map.countries[country].flow_arrow;
				if ( this.map.countries[country].flow && this.map.countries[country].flow.length > 0 ) {
					if ( this.map.countries[country].flow[ year_index ] > 0.0 ) {
						var factor = this.map.countries[country].flow[ year_index ] / this.minmax.flow.max;
						flow_arrow.setAttributeNS( null, 'marker-start', 'url(#arrow_head_start)' );
						flow_arrow.setAttributeNS( null, 'marker-end', 'none' );
						flow_arrow.style.stroke = 'red';
						var strokeWidth = 5 + ( 15.0 * factor );
						flow_arrow.style.strokeWidth = strokeWidth;
						//flow_arrow.style.visibility = 'inherit';
						flow_arrow.setAttributeNS( null, 'transform', 'translate(0,0)' );
						flow_arrow.style.visibility = 'inherit';
					} else if ( this.map.countries[country].flow[ year_index ] < 0.0 ) {
						var factor = this.map.countries[country].flow[ year_index ] / this.minmax.flow.min;
						flow_arrow.setAttributeNS( null, 'marker-start', 'none' );
						flow_arrow.setAttributeNS( null, 'marker-end', 'url(#arrow_head_end)' );
						flow_arrow.style.stroke = 'black';
						var strokeWidth = 5 + ( 15.0 * factor );
						flow_arrow.style.strokeWidth = strokeWidth;
						//flow_arrow.style.visibility = 'inherit';
						//flow_arrow.setAttributeNS( null, 'transform', 'translate(0,0)' );
						flow_arrow.setAttributeNS( null, 'transform', 'translate(0, -' + strokeWidth + ')' );
						flow_arrow.style.visibility = 'inherit';
					} else {
						flow_arrow.style.stroke = 'white';
						//flow_arrow.style.visibility = 'false';
						flow_arrow.setAttributeNS( null, 'marker-start', 'none' );
						flow_arrow.setAttributeNS( null, 'marker-end', 'none' );
						flow_arrow.style.visibility = 'hidden';
					}
					
				} else {
					flow_arrow.style.visibility = 'hidden';
				}
			}
		};	
		ui.prototype.updateregions = function() {
			var self = this;
			var year_index = self.current_time - self.time.min;
			var flows = [];
			var min_flow = Number.MAX_VALUE;
			var max_flow = Number.MIN_VALUE;
			var regions = [ 'AFR', 'USA', 'Asia', 'EUR', 'Oceania' ];
			regions.forEach( function( region ) {
				var region_country_isos = skyshares.utility.getgroupmembers(self.groups,region);
				var region_flow = {
					name : region,
					p : skyshares.geometry.vec2(),
					flow : 0.0
				};
				var count = 0.0;
				region_country_isos.forEach( function( country_iso ) {
					if ( self.map.countries[ country_iso ].flow_arrow ) {
						//
						// sum postion
						//
						region_flow.p.x += parseFloat( self.map.countries[ country_iso ].flow_arrow.getAttribute( 'x2' ) );
						region_flow.p.y += parseFloat( self.map.countries[ country_iso ].flow_arrow.getAttribute( 'y2' ) );
						//
						// sum flow
						//
						region_flow.flow += self.map.countries[ country_iso ].flow[ year_index ];
						//
						//
						//
						count++;
					}
				});
				if ( count > 0 && ( region_flow.flow > 0.0 || region_flow.flow < 0.0 ) ) {
					region_flow.p.x /= count;
					region_flow.p.y /= count;
					flows.push(region_flow);
					if ( region_flow.flow < min_flow ) min_flow = region_flow.flow;
					if ( region_flow.flow > max_flow ) max_flow = region_flow.flow;
					
				}
			} );
			console.log( 'flows: ' + JSON.stringify( flows ) );
			//
			// clear region flows layer
			//
			var region_flows = document.getElementById( 'map.region_flows' );
			if ( region_flows ) {
				while( region_flows.childNodes.length > 0 ) region_flows.removeChild( region_flows.childNodes[0] );
				if ( flows.length > 0 ) {
					//
					// sort regions by flow
					//
					function sortbyflow( a, b ) {
						if ( a.flow > b.flow ) return -1;
						if ( b.flow > a.flow ) return 1;
						return 0;
					}
					flows.sort( sortbyflow );
					for ( var i = 1; i < flows.length; i++ ) {
						var arrow = document.createElementNS('http://www.w3.org/2000/svg','path');
						if ( arrow ) {
							var path = '';
							//
							// offset line endings
							//
							var p0 = skyshares.geometry.vec2( flows[ i - 1 ].p.x, flows[ i - 1 ].p.y  );
							//p0.y -= 20;
							var p1 = skyshares.geometry.vec2( flows[ i ].p.x, flows[ i ].p.y );
							//p1.y += 20;
							var angle = p0.bearing( p1 );
							console.log( 'dx: ' + ( p1.x - p0.x ) + ' dy: ' + ( p1.y - p0.y ) + ' angle: ' + angle );
							//
							// calculate line centre and generate perpendicular
							//
							var c = p0.getMiddle( p1 );
							var n = skyshares.geometry.vec2(p1.x-p0.x,p1.y-p0.y);
							n.perpendicular();
							n.rescale( 40.0 );
							c.add( n );
							//
							// create bezier
							//
							path += 'M ' + p0.x + ',' + p0.y;
							path += ' Q ' + c.x + ',' + c.y + ' ' + p1.x + ',' + p1.y;
							arrow.setAttribute( 'id', 'map.region_flows.arrow.' + i );
							arrow.setAttribute( 'd', path );
							arrow.setAttribute( 'fill', 'none' );
							if ( angle <= 45.0 && angle >= -45.0 ) { // right 
								arrow.setAttribute( 'stroke', 'url(#region_flow_gradient_0)' );
							} else if ( angle <= 135. && angle >= 45.0 ) { // up
								arrow.setAttribute( 'stroke', 'url(#region_flow_gradient_1)' );
							} else if ( angle <= 180.0 && angle >= 135.0 || angle <= -180 && angle >= -135 ) {
								arrow.setAttribute( 'stroke', 'url(#region_flow_gradient_2)' );
							} else {
								arrow.setAttribute( 'stroke', 'url(#region_flow_gradient_3)' );
							}
							
							var strokeWidth =  10 + ( 20 * ( flows[ i - 1 ].flow - min_flow ) / ( max_flow - min_flow ) );
							arrow.setAttribute( 'stroke-width', strokeWidth );
							arrow.setAttribute( 'marker-end', 'url(#arrow_head_end)' );
							region_flows.appendChild( arrow );
							/*
							var control_point = document.createElementNS('http://www.w3.org/2000/svg','circle');
							control_point.setAttribute( 'cx', p0.x );
							control_point.setAttribute( 'cy', p0.y );
							control_point.setAttribute( 'r', 4 );
							control_point.setAttribute( 'fill', 'green' );
							region_flows.appendChild( control_point );
							
							control_point = document.createElementNS('http://www.w3.org/2000/svg','circle');
							control_point.setAttribute( 'cx', c.x );
							control_point.setAttribute( 'cy', c.y );
							control_point.setAttribute( 'r', 4 );
							control_point.setAttribute( 'fill', 'red' );
							region_flows.appendChild( control_point );
							
							var h = p0.getMiddle( p1 )
							control_point = document.createElementNS('http://www.w3.org/2000/svg','circle');
							control_point.setAttribute( 'cx', h.x );
							control_point.setAttribute( 'cy', h.y );
							control_point.setAttribute( 'r', 4 );
							control_point.setAttribute( 'fill', 'blue' );
							region_flows.appendChild( control_point );
							
							var line = document.createElementNS('http://www.w3.org/2000/svg','line');
							line.setAttribute( 'x1', h.x );
							line.setAttribute( 'y1', h.y );
							line.setAttribute( 'x2', c.x );
							line.setAttribute( 'y2', c.y );
							line.setAttribute( 'stroke', 'black' );
							line.setAttribute( 'stroke-width', '2' );
							region_flows.appendChild( line );
							
							control_point = document.createElementNS('http://www.w3.org/2000/svg','circle');
							control_point.setAttribute( 'cx', p1.x );
							control_point.setAttribute( 'cy', p1.y );
							control_point.setAttribute( 'r', 4 );
							control_point.setAttribute( 'fill', 'green' );
							region_flows.appendChild( control_point );
							*/
						}
					} 
				}
			}
		};
		ui.prototype.setcountrylist = function( list ) {
			this.countries = list;
			this.updatelists();
		};	
		ui.prototype.setgrouplist = function( list ) {
			this.groups = list;
			this.updatelists();
		};	
		ui.prototype.setcowlist = function( list ) {
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
		ui.prototype.updatelists = function() {
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
		ui.prototype.updateemissionschart = function() {
			var self = this;
			if ( self.world_emissions ) {
				var world_emissions_container = document.getElementById('world_emissions_chart');
				if ( world_emissions_container ) {
					world_emissions_container.innerHTML = '';
					skyshares.chart.linechartd3(  
						world_emissions_container,
						{
							title : 'World Emissions',
							axis : {
								x : {
									min : 2010, 
									max : 2100, 
									step : 10, 
									name: 'year'
								},
								y : {
									min : 0,
									name : 'tons of C0₂'
								}
							}, 
							index : {
								min : 0, max: 90, step: 10
							},
							lines : [
								{
									name: 'world emissions',
									f : function( t ) {
										return self.world_emissions[ t - 2010 ]; 
									},
									stroke : {
										colour: 'red',
										width: 2.
									},
									fill : 'none'
								}
							]
						} );
					}
			}
		};
		ui.prototype.updatecoalitioncharts = function() {
			var self = this;
			//
			// agregate data
			//
			var colours = {
				HIC : 'rgb( 147, 119, 178 )',
				LMIC : 'rgb( 170, 200, 106 )',
				UMIC : 'rgb( 197, 98, 98 )',
				LIC : 'rgb( 108, 147, 201 )'
			};
			var charts = {
				region_allowances : {
						title : 'Allowances of the Coalition',
						axis : {
							x : {
								min : 2010, 
								max : 2100, 
								step : 10, 
								name: 'year'
							},
							y : {
								min : 0,
								name : 'tons of CO₂'
							}
						}, 
						index : {
							min : 0, max: 90, step: 10
						},
						lines : []
				},
				region_percapita_allowances : {
						title : 'Convergence of per capita allowances',
						axis : {
							x : {
								min : 2010, 
								max : 2100, 
								step : 10, 
								name: 'year'
							},
							y : {
								min : 0,
								name : 'tons of CO₂'
							}
						}, 
						index : {
							min : 0, max: 90, step: 10
						},
						lines : []
				},
				region_abatement_demand : { // x = decarbonisation, y = equilibrium price
						title : 'Cumulative Demand for Abatement',
						axis : {
							x : {
								min : Number.MAX_VALUE,
								max : Number.MIN_VALUE,
								tickformat : d3.format('s'),
								name: 'tons of CO₂'
							},
							y : {
								min : Number.MAX_VALUE,
								max : Number.MIN_VALUE,
								name : 'cost / ton of CO₂',
								tickformat : function( d ) { return skyshares.utility.formatcurrency( d, 0 ); }
							}
						},
						index : {
							min : 0, max: 90, step: 10
						},
						lines : []
				},
				region_demand_supply : { // x = decarbonisation, y = equilibrium price
						title : 'Demand/Supply',
						axis : {
							x : {
								min : Number.MAX_VALUE,
								max : Number.MIN_VALUE,
								tickformat : d3.format('s'),
								name: 'tons of CO2'
							},
							y : {
								min : Number.MAX_VALUE,
								max : Number.MIN_VALUE,
								name : 'cost / ton of CO₂',
								tickformat : function( d ) { return skyshares.utility.formatcurrency( d, 0 ); }
							}
						},
						index : {
							min : 0, max: 90, step: 10
						},
						lines : []
				},
				//
				// bar charts 
				//
				region_financial_flows : {
						title : 'Annual Finacial Flows',
						axis : {
							x : {
								min : 2010, 
								max : 2100, 
								step : 10, 
								name: 'year'
							},
							y : {
								name : 'Billions',
								tickformat : function( d ) { return skyshares.utility.formatcurrency( d / 10000000000.0, 0 ); } // convert to billion units
							}
						}, 
						index : {
							min : 0, max: 90, step: 10
						},
						lines : []
				},

			};
			[ 'HIC', 'LMIC', 'UMIC', 'LIC' ].forEach( function( region ) {
				var region_country_isos = skyshares.utility.getgroupmembers(self.groups,region);
				
				var region_allowances = {
					name: region,
					stroke : {
						colour: colours[ region ],
						width: 2.
					},
					fill : 'none',
					data : []
				};
				
				var region_percapita_allowances = {
					name: region,
					stroke : {
						colour: colours[ region ],
						width: 2.
					},
					fill : 'none',
					data : []
				};
				
				var region_abatement_demand = {
					name: region,
					stroke : {
						colour: colours[ region ],
						width: 2.
					},
					fill : 'none',
					data : []
				};
				
				var region_demand_supply = {
					name: region,
					stroke : {
						colour: colours[ region ],
						width: 2.
					},
					fill : 'none',
					data : []
				};
				
				var region_financial_flows = {
					name: region,
					stroke : {
						colour: colours[ region ],
						width: 2.
					},
					fill : 'none',
					data : []
				};
				
				region_country_isos.forEach( function( country_iso ) {
					if ( self.map.countries[ country_iso ].allowances && self.map.countries[ country_iso ].allowances.length > 0 ) {
						for ( var t = 2010; t <= 2100; t++ ) {
							if ( region_allowances.data.length > t - 2010 ) {
								region_allowances.data[ t - 2010 ].y += self.map.countries[ country_iso ].allowances[ t - 2010 ];
							} else {
								region_allowances.data[ t - 2010 ] = {
									x: t,
									y: self.map.countries[ country_iso ].allowances[ t - 2010 ]
								};
							}
							if ( region_percapita_allowances.data.length > t - 2010 ) {
								region_percapita_allowances.data[ t - 2010 ].y += self.map.countries[ country_iso ].percapitaallowances[ t - 2010 ];
							} else {
								region_percapita_allowances.data[ t - 2010 ] = {
									x: t,
									y: self.map.countries[ country_iso ].percapitaallowances[ t - 2010 ]
								};
							}
							if ( region_abatement_demand.data.length > t - 2010 ) {
								region_abatement_demand.data[ t - 2010 ].x += self.map.countries[ country_iso ].emissions[ t - 2010 ];
							} else {
								region_abatement_demand.data[ t - 2010 ] = {
									x: self.map.countries[ country_iso ].emissions[ t - 2010 ],
									y: self.equilibrium_price[ t - 2010 ]
								};
							}
							if ( region_demand_supply.data.length > t - 2010 ) {
								region_demand_supply.data[ t - 2010 ].x += self.map.countries[ country_iso ].transf[ t - 2010 ];
							} else {
								region_demand_supply.data[ t - 2010 ] = {
									x: self.map.countries[ country_iso ].transf[ t - 2010 ],
									y: self.equilibrium_price[ t - 2010 ]
								};
							}
							if ( region_financial_flows.data.length > t - 2010 ) {
								region_financial_flows.data[ t - 2010 ].y += self.map.countries[ country_iso ].flow[ t - 2010 ];
							} else {
								region_financial_flows.data[ t - 2010 ] = {
									x: t,
									y: self.map.countries[ country_iso ].flow[ t - 2010 ]
								};
							}
						}
					}
				});
				if ( region_allowances.data.length > 0 ) {
					charts.region_allowances.lines.push( region_allowances );
				}
				if ( region_allowances.data.length > 0 ) {
					charts.region_percapita_allowances.lines.push( region_percapita_allowances );
				}
				if ( region_abatement_demand.data.length > 0 ) {
					//
					// get min max
					//
					region_abatement_demand.data.forEach( function( data_point ) {
						if ( data_point.x > charts.region_abatement_demand.axis.x.max ) 
							charts.region_abatement_demand.axis.x.max = data_point.x;
						if ( data_point.x < charts.region_abatement_demand.axis.x.min ) 
							charts.region_abatement_demand.axis.x.min = data_point.x;
						if ( data_point.y > charts.region_abatement_demand.axis.y.max ) 
							charts.region_abatement_demand.axis.y.max = data_point.y;
						if ( data_point.y < charts.region_abatement_demand.axis.y.min ) 
							charts.region_abatement_demand.axis.y.min = data_point.y;
					});
					charts.region_abatement_demand.lines.push( region_abatement_demand );
					
				}
				if ( region_demand_supply.data.length > 0 ) {
					//
					// get min max
					//
					region_demand_supply.data.forEach( function( data_point ) {
						if ( data_point.x > charts.region_demand_supply.axis.x.max ) 
							charts.region_demand_supply.axis.x.max = data_point.x;
						if ( data_point.x < charts.region_demand_supply.axis.x.min ) 
							charts.region_demand_supply.axis.x.min = data_point.x;
						if ( data_point.y > charts.region_demand_supply.axis.y.max ) 
							charts.region_demand_supply.axis.y.max = data_point.y;
						if ( data_point.y < charts.region_demand_supply.axis.y.min ) 
							charts.region_demand_supply.axis.y.min = data_point.y;
					});
					charts.region_demand_supply.lines.push( region_demand_supply );
					
				}
				if ( region_financial_flows.data.length > 0 ) {
					charts.region_financial_flows.lines.push( region_financial_flows );
				}
			});
			//
			// generate charts
			//
			var region_allowances_container = document.getElementById('region_allowances_chart');
			if ( region_allowances_container ) {
				region_allowances_container.innerHTML = '';
				skyshares.chart.linechartd3(  
					region_allowances_container,
					charts.region_allowances
				);
			}
			var allowances_convergence_container = document.getElementById('allowances_convergence_chart');
			if ( allowances_convergence_container ) {
				allowances_convergence_container.innerHTML = '';
				skyshares.chart.linechartd3(  
					allowances_convergence_container,
					charts.region_percapita_allowances
				);
			}
			var abatement_demand_container = document.getElementById('abatement_demand_chart');
			if ( abatement_demand_container ) {
				abatement_demand_container.innerHTML = '';
				skyshares.chart.linechartd3(  
					abatement_demand_container,
					charts.region_abatement_demand
				);
			}
			var demand_supply_container = document.getElementById('demand_supply_chart');
			if ( demand_supply_container ) {
				demand_supply_container.innerHTML = '';
				skyshares.chart.linechartd3(  
					demand_supply_container,
					charts.region_demand_supply
				);
			}
			var financial_flows_container = document.getElementById('financial_flows_chart');
			if ( financial_flows_container ) {
				financial_flows_container.innerHTML = '';
				skyshares.chart.groupedbarchartd3(  
					financial_flows_container,
					charts.region_financial_flows
				);
			}
			
		};
		ui.prototype.getcountry = function( iso ) {
			var self = this;
			for ( var i = 0; i < self.countries.length; i++ ) {
				if ( self.countries[ i ].iso == iso ) {
					return self.countries[ i ];
				}
			}
			return null;
		};		
		ui.prototype.getemissioncolour = function(factor) {
		};
		ui.prototype.showtooltip = function( p, text ) {
			/*
			this.tooltip.setAttributeNS(null,"x", p.x);
			this.tooltip.setAttributeNS(null,"y", p.y);
			this.tooltip.setAttributeNS(null,"visibility","visible");
			this.tooltip_background.setAttributeNS(null,"visibility","visible");
			this.tooltip_text[ 0 ].firstChild.data = text0 ? text0 : "";
			this.tooltip_text[ 1 ].firstChild.data = text1 ? text1 : "";
			this.tooltip_text[ 2 ].firstChild.data = text2 ? text2 : "";
			for ( var i = 0; i < 3; i++ ) {
				this.tooltip_text[ i ].setAttributeNS(null,"visibility","visible");
			}
			*/
			this.tooltip.innerHTML = text;
			this.tooltip.style.left = Math.round( p.x + 8 ) + 'px';
			this.tooltip.style.top = Math.round( p.y -  ( this.tooltip.offsetHeight / 2 ) ) + 'px';
			this.tooltip.style.visibility = 'visible';
		}
		ui.prototype.hidetooltip = function() {
			this.tooltip.style.visibility = 'hidden';
			/*
			this.tooltip.setAttributeNS(null,"visibility","hidden");
			this.tooltip_background.setAttributeNS(null,"visibility","hidden");
			this.tooltip_text[ 0 ].firstChild.data = text0 ? text0 : "";
			this.tooltip_text[ 1 ].firstChild.data = text1 ? text1 : "";
			this.tooltip_text[ 2 ].firstChild.data = text2 ? text2 : "";
			for ( var i = 0; i < 3; i++ ) {
				this.tooltip_text[ i ].setAttributeNS(null,"visibility","hidden");
			}
			*/
		}

		return new ui();
	},
	hookmouseevents : function( element, delegate ) {
		var events = [ 'click', 'mousedown', 'mouseup', 'mousemove', 'mouseenter', 'mouseleave' ];
		events.forEach( function( event ) {
			if ( delegate[ event ] ) {
				element.addEventListener( event, delegate[ event ], false );
			}
		});
	},
	hooktouchevents : function( element, delegate ) {
		var events = [ 'touchstart', 'touchmove', 'touchend', 'touchcancel' ];
		events.forEach( function( event ) {
			if ( delegate[ event ] ) {
				element.addEventListener( event, delegate[ event ], false );
			}
		});
	},
	select : function( selector ) {
	
	},
	selectall : function( selector ) {
		
	}
};