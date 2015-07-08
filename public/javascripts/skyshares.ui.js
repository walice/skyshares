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
	    selectsection: function (item) {
	        var container = item.parentNode;
	        if (container) {
	            var items = container.querySelectorAll('.menu-item');
	            for (var i = 0; i < items.length; i++) {
	                var target = document.querySelector(items[i].getAttribute('data-section'));
	                if (items[i] === item) {
	                    items[i].classList.add('menu-item-selected');
	                    if (target) {
	                    	target.style.display = 'block';
	                    	var width = target.offsetWidth;
	                    	console.log( items[i].getAttribute('data-section') + ' width=' + width );
	                    }
	                } else {
	                    items[i].classList.remove('menu-item-selected');
	                    if (target) target.style.display = 'none';
	                }
	            }
	            //
	            // hide tooltip
	            //
	            var country_details = document.querySelector('#country-details');
	            if (country_details) {
	                country_details.style.visibility = 'hidden';
	                country_details.innerHTML = '';
	            }
	        }
	    },
 	   selectsubsection: function (item) {
	        var container = item.parentNode;
	        if (container) {
	            var target_id = container.getAttribute('data-target');
	            var translation = container.getAttribute('data-translation');
	            if (target_id && translation) {
	                var target = document.querySelector(target_id);
	                if (target) {
	                    var parts = translation.split(',');
	                    if (parts.length >= 2) {
	                        var items = container.querySelectorAll('.menu-item');
	                        var tx = parseFloat(parts[0]) / items.length;
	                        var ty = parseFloat(parts[1]) / items.length;
	                        for (var i = 0; i < items.length; i++) {
	                            if (items[i] === item) {
	                                items[i].classList.add('menu-item-selected');
	                                tx *= i;
	                                ty *= i;
	                            } else {
	                                items[i].classList.remove('menu-item-selected');
	                            }
	                        }
	                        var transform = sprintf('translate(%f\%,%f\%)', tx, ty); // JONS: IMPORTANT, no spaces for -ms-transform to work!!!?
	                        target.style['-ms-transform'] =
							target.style['-webkit-transform'] =
							target.style['transform'] = transform;
	                        //
	                        // hide tooltip
	                        //
	                        var country_details = document.querySelector('#country-details');
	                        if (country_details) {
	                            country_details.style.visibility = 'hidden';
	                            country_details.innerHTML = '';
	                        }
	                    }
	                }
	            }
	        }
	    },
	    //
		//
		//
		setprogress : function( progress ) {
			var self = skyshares.ui;
			var control_panel = document.querySelector( '#control-panel' );
			if ( control_panel ) {
				if ( progress.status === undefined && progress.total === undefined && progress.current === undefined ) {
					control_panel.style.visibility = 'hidden';
				} else {
					if ( self.status_clear_id ) {
						clearTimeout(self.status_clear_id);
						self.status_clear_id = undefined;
					}
					var progress_indicator = control_panel.querySelector( '#skyshares-progress' );
					if ( progress_indicator ) {
						if ( progress.total === undefined || progress.current === undefined || progress.total <= progress.current ) {
							progress_indicator.classList.remove( 'progressindicator-spin' );
						} else {
							progress_indicator.classList.add( 'progressindicator-spin' );
						}
					}
					var status_display = control_panel.querySelector( '#skyshares-status' );
					if ( status_display ) {
						var status = progress.status;
						if ( progress.current && progress.total && progress.current < progress.total ) {
							status += ' ' + skyshares.utility.formatpercent( (progress.current/progress.total)*100, 0 );
						}
						status_display.innerHTML = status;
					}
					control_panel.style.visibility = 'visible';
					self.status_clear_id = setTimeout(function() {
						self.setprogress( {} );
					}, 2000);
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
		gettranslation : function(element) {
		    var style = window.getComputedStyle(element, null);
		    var matrix = style.getPropertyValue("-webkit-transform") ||
                        st.getPropertyValue("-moz-transform") ||
                        st.getPropertyValue("-ms-transform") ||
                        st.getPropertyValue("-o-transform") ||
                        st.getPropertyValue("transform") ||
                        'none';
		    if (matrix && matrix != 'none') {
		        //console.log(matrix);
		        var values = matrix.split('(')[1].split(')')[0].split(',');
		        return { x: values[ 4 ], y: values[ 5 ] };
		    }
		    return { x: 0, y: 0 };
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
	if (country_details) {
	    skyshares.map.addrolloverlistener(function (iso) {
	        var country_info = iso && iso.length === 3 ? skyshares.controller.getcountryinfo(iso) : undefined;
	        if (country_info) {
	            country_details.setAttribute('data-iso', iso);
	            country_details.innerHTML = country_info;
	            country_details.style.visibility = 'visible';
	        } else {
	            country_details.style.visibility = 'hidden';
	            country_details.innerHTML = '';
	        }
	    });
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
	/* JONS: all offscreen section containers are now display none
    //
    // initialise offscreen div manager
    //
	function divmanager() {
	    var container = document.querySelector('#scrollcontainer');
	    if (container) {
	        var panel = container.querySelector('#scrollpanel');
	        if (panel) {
	            var height = container.offsetHeight;
	            var offset = self.gettranslation(panel);
	            var sections = document.querySelectorAll('div.skyshares-sectioncontainer');
	            for (var i = 0; i < sections.length; i++) {
	                var top = sections[i].offsetTop + offset;
	                var bottom = top + sections[i].offsetHeight;
	                sections[i].style.visibility = top > height || bottom < 0 ? 'hidden' : 'visible';
	            }
	        }
	    }
	    setTimeout(divmanager, 100);
	}
	setTimeout(divmanager, 100);
	*/
})();