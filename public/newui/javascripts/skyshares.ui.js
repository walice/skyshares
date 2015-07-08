	var isMobile = {
    Android: function() {
        return navigator.userAgent.match(/Android/i);
    },
    BlackBerry: function() {
        return navigator.userAgent.match(/BlackBerry/i);
    },
    iOS: function() {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    Opera: function() {
        return navigator.userAgent.match(/Opera Mini/i);
    },
    Windows: function() {
        return navigator.userAgent.match(/IEMobile/i);
    },
    any: function() {
        return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
    }
};
//
// SkyShares ui module
//
;
(function() {
	var self = skyshares.ui = skyshares.ui || {
		//
		// menu handling
		//
		select : function( item ) {
			var container = item.parentNode;
			if ( container ) {
				var target_id = container.getAttribute( 'data-target' );	
				var translation = container.getAttribute( 'data-translation' );
				if ( target_id && translation ) {
					var target = document.querySelector(target_id);
					if ( target ) {
						var parts = translation.split( ',' );
						if ( parts.length >= 2 ) {
							var items = container.querySelectorAll( '.menu-item' );
							var tx = parseFloat( parts[ 0 ] ) / items.length;
							var ty = parseFloat( parts[ 1 ] ) / items.length;
							for ( var i = 0; i < items.length; i++ ) {
								if ( items[ i ] === item ) {
									items[ i ].classList.add('menu-item-selected');
									tx *= i;
									ty *= i;
								} else {
									items[ i ].classList.remove('menu-item-selected');
								}
							}
							var transform = sprintf('translate(%f\%,%f\%)',tx,ty); // JONS: IMPORTANT, no spaces for -ms-transform to work
							target.style[ '-ms-transform' ] 	= 
							target.style[ '-webkit-transform' ] = 
							target.style[ 'transform' ] 		=  transform;
						}
					}
				}
			}
		},	
		//
		// input event handling
		//
		findinput : function( input_id ) {
			var count = this.inputs.length;
			for ( var i = 0; i < count; i++ ) {
				if ( this.inputs[ i ].id === input_id ) return this.inputs[ i ];
			}
			return undefined;
		},
		addinputeventlistner : function( input_id, handler ) {
			var input = this.findinput( input_id );
			if ( input ) {
				input.listeners.push( handler );
			}
		},
		removeinputeventlistner : function( input_id, handler ) {
			var input = this.findinput( input_id );
			if ( input ) {
				var index = input.listeners.indexOf( handler );
				if ( index >= 0 ) {
					input.listeners.splice( index, 1, 0 );
				}
			}
		},
		//
		// utility methods
		//
		monitorelementcontent : function( element_id, handler ) {
			var element = document.getElementById(element_id);
			if ( element ) {
				element.addEventListener( 'DOMSubtreeModified', handler, false );
			}
		},
		animate :	function(f) {
					( window.requestAnimationFrame || 
					window.mozRequestAnimationFrame || 
					window.webkitRequestAnimationFrame ||
                    window.msRequestAnimationFrame )(f);
		},
		//
		//
		//
		current_section : undefined,
		current_subsection : undefined
	};
	//
	// initialise inputs
	//
	self.inputs = [];
	var inputs = document.querySelectorAll( 'input.skyshares' );
	for ( var i = 0; i < inputs.length; i++ ) {
		var element = inputs[ i ];
		//
		// add default event handlers
		//
		(function(input) {
			var listeners = [];
			var output = document.querySelector( '#' + input.name + '-output' );
			function formatOutput() {
				var format = output.getAttribute( 'data-format' );
				if ( format ) {
					output.innerHTML = sprintf( format, input.value );
				} else {
					output.innerHTML = input.value;
				}
			}
			function forwardEvent( evt ) {
				listeners.forEach( function( listener ) { 
					listener.call(input,evt);
				} );
			} 
			function handleEvent( evt ) {
				if ( output ) formatOutput();
				if ( listeners.length > 0 ) forwardEvent( evt );
			}
			input.addEventListener( "change", handleEvent, false );
			input.addEventListener( "input", handleEvent, false );
			self.inputs.push( {
				id : input.id,
				input : input,
				output : output,
				listeners : listeners
			} );
		})(element);
	}
	//
	// initialise map
	//
	var country_details = document.querySelector( '#country-details' );
	if ( country_details ) {
		skyshares.map.addrolloverlistener( function( iso ) {
			var country_info = iso && iso.length === 3 ? skyshares.controller.getcountryinfo(iso) : undefined;
			if ( country_info ) {
				country_details.innerHTML = country_info;
				country_details.style.visibility = 'visible';
			} else {
				country_details.innerHTML = '';
				country_details.style.visibility = 'hidden';
			}
		} );
	}
	var mapzoom = document.querySelector( '#mapzoom' );
	mapzoom.addEventListener( 'input', function(evt) {
		skyshares.map.setzoom(parseFloat(this.value)/100.0); 
		var output = document.getElementById( this.name + "-output" );
		if ( output ) {
			var format = output.getAttribute( 'data-format' );
			if ( format ) {
				output.innerHTML = sprintf( format, skyshares.map.scale );
			} else {
				output.innerHTML = map.scale;
			}
		}
		evt.stopPropagation();
		return false;	
		
	}, false);
	
	mapzoom.addEventListener( 'change', function(evt) {
		skyshares.map.setzoom(parseFloat(this.value)/100.0); 
		var output = document.getElementById( this.name + "-output" );
		if ( output ) {
			var format = output.getAttribute( 'data-format' );
			if ( format ) {
				output.innerHTML = sprintf( format, skyshares.map.scale );
			} else {
				output.innerHTML = map.scale;
			}
		}
		evt.stopPropagation();
		return false;	
	}, false);
	mapzoom.addEventListener( 'mousemove', function(evt) {
		evt.stopPropagation();
		return false;	
	}, false);
})();