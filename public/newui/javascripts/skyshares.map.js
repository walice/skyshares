//
// SkyShares map module
// TODO: change to singlton ( there is only ever one in SkyShares land )
;
(function() {
	var self = skyshares.map = skyshares.map || {
		// 
		// transform
		//
		resettransform : function() {
			self.scale	= 1.0;
			self.pan	= { x: 0, y: 0 };
		},
		/*
		zoomin : function() {
			self.zoom( self.scale * 2.0 );
		},
		zoomout : function() {
			self.zoom( self.scale * 0.5 );
		},
		*/
		setzoom : function( scale ) {
			self.scale = self.min_zoom + ( self.max_zoom - self.min_zoom ) * scale;
			if ( self.scale <= 1.0 ) {
				self.pan.x =
				self.pan.y = 0;
			}
			self.applytransform();
		},
		panby : function( dx, dy ) {
			if ( self.scale <= 1.0 ) return;
			
			self.pan.x += dx * ( 1.0 / self.scale );
			self.pan.y += dy * ( 1.0 / self.scale );
			
			self.applytransform();
		},
		applytransform : function(animate) {
			if ( animate ) { // TODO: deprecate this use transitions? Browser support a problem
			
			} else {
				var c = { x: (self.width/2.0)+self.pan.x, y: (self.height/2.0)+self.pan.y };
				var matrix = [self.scale,0,0,self.scale,c.x-c.x*self.scale,c.y-c.y*self.scale];
				var matrix_string = "matrix(" +  matrix.join(' ') + ")";
				self.world.setAttributeNS(null, "transform", matrix_string);
			}
		},
		getcountryfrompoint : function( x, y ) {
			if ( self.document ) {
				if ( self.document.msElementsFromPoint ) {
					var elements = self.document.msElementsFromPoint(x,y);//+self.object.offsetTop);
					for ( var i = 0; i < elements.length; i++ ) {
						//console.log( elements[ i ].id );
						if ( elements[ i ].parentNode ) {
							var iso = elements[ i ].parentNode.id;
							if ( iso && iso.length === 3 ) {
								return iso;
							} else { // JONS: temporary fix to get flow indicators 
								var parts = elements[ i ].id.split( '.' );
								if ( parts[ parts.length - 1 ].length === 3 ) {
									return parts[ parts.length - 1 ];
								}
							}
						}
					}
				} else {
					/*
					var viewbox = self.document.getAttributeNS( null, 'viewBox' );
					console.log( 'viewBox=' + viewbox );
					*/
					var element = self.document.elementFromPoint( x, y );
					if ( element && element.parentElement ) {
						var iso = element.parentElement.id;
						if ( iso && iso.length === 3 ) {
							return iso;
						} else { // JONS: temporary fix to get flow indicators 
							var parts = element.id.split( '.' );
							if ( parts[ parts.length - 1 ].length === 3 ) {
								return parts[ parts.length - 1 ];
							}
						}
					}
					
				}
			}
			return undefined;
		},
		//
		//
		//
		togglecountryflows : function() {
			if ( self.country_flows ) {
				if ( self.country_flows.style.visibility === 'visible' ) {
					self.country_flows.style.visibility = 'hidden';
					return false;
				} else {
					self.country_flows.style.visibility = 'visible';
					return true;
				}
			}
			return false;
		},
		toggleregionflows : function() {
			if ( self.region_flows ) {
				if ( self.region_flows.style.visibility === 'visible' ) {
					self.region_flows.style.visibility = 'hidden';
					return false;
				} else {
					self.region_flows.style.visibility = 'visible';
					return true;
				}
			}
			return false;
		},
		//
		//
		//
		showcountry : function( country_iso ) {
			var self = this;
			for ( iso in self.countries ) {
				//self.countries[ iso ].style.fill = ( iso == country_iso ? 'red' : '#777777' );
				self.countries[ iso ].style[ 'stroke-width' ] = ( iso == country_iso ? '0.5' : '0.1' );
			}
		},
		showgroup : function( group ) {
			var self = this;
			var group_data = JSON.parse( localStorage.getItem( group ) );
			for ( iso in self.countries ) {
				self.countries[ iso ].style.fill = ( group_data.members.indexOf( iso ) != -1 ? 'red' : '#777777' );
			}
		},
		scalecountry : function( iso, scale ) {
			var self = this;
			if ( scale === 1.0 ) {
				self.countries[ iso ].setAttributeNS( null, 'transform', '' );
			} else {
				var cx = self.width / 2.0;
				var cy = self.height / 2.0;
				var transform = sprintf( 'translate( %f %f ) scale( %f %f ) translate( %f %f )', cx, cy, scale, scale, -cx, -cy );
				self.countries[ iso ].setAttributeNS( null, 'transform', transform );
			}
		},
		listeners : [],
		addrolloverlistener : function( handler ) {
			if ( this.listeners.indexOf( handler ) < 0 ) {
				this.listeners.push( handler );
			}
		},
		removerolloverlistener : function( handler ) {
			var index = this.listeners.indexOf( handler )
			if ( index >= 0 ) {
				this.listeners.splice( index, 1, 0 );
			}
		}
	}
	//
	//
	//
	var prefix = 'map';
	self.object = document.getElementById( prefix + '.object' );
	self.object.addEventListener( 'load', function() {
		var self = skyshares.map;
		self.document = self.object.contentDocument || self.object.getSVGDocument();
		self.map = self.document.getElementById( prefix );
		self.world = self.document.getElementById( prefix + '.world' );
		self.country_elements = self.document.getElementById( prefix + '.countries' );
		self.region_flows 	= self.document.getElementById( prefix + '.region_flows' );
		self.country_flows 	= self.document.getElementById( prefix + '.country_flows' );
		//
		// initialise transform
		//
		var bbox = self.world.getBBox();
		self.width 	= bbox.width;
		self.height = bbox.height;
		self.min_zoom = 1.0;
		self.max_zoom = 8.0;
		self.resettransform();
		//
		// hook events TODO: touch events
		//
		self.dragging 			= false;
		self.previous_position 	= null;
		self.map.addEventListener( 'mousedown', function( evt ) {
			self.dragging = true;
			previous_position = { x: evt.clientX, y: evt.clientY };
			evt.preventDefault();
		}, false );
		self.map.addEventListener( 'mouseup', function( evt ) {
			self.dragging = false;
			previous_position = null;
			evt.preventDefault();
		}, false );
		self.map.addEventListener( 'mousemove', function( evt ) {
			if ( self.dragging ) {
				self.panby( previous_position.x - evt.clientX, previous_position.y - evt.clientY ); 
				previous_position.x = evt.clientX;
				previous_position.y = evt.clientY;
			} else {
				var iso = self.getcountryfrompoint(evt.clientX,evt.clientY - self.object.offsetTop);
				self.showcountry( iso );
				self.listeners.forEach( function( listener ) {
					listener(iso);
				});
			}
			evt.preventDefault();
		}, false );
		self.map.addEventListener( 'touchstart', function( evt ) {
			var touch = evt.changedTouches[0];
			self.dragging = touch;
			previous_position = { x: touch.clientX, y: touch.clientY };
			evt.preventDefault();
		}, false );
		self.map.addEventListener( 'touchend', function( evt ) {
			var touch = evt.changedTouches[0];
			if ( touch == self.dragging ) {
				self.dragging = false;
				previous_position = null;
				evt.preventDefault();
			}
		}, false );
		self.map.addEventListener( 'touchmove', function( evt ) {
			var touch = evt.changedTouches[0];
			if ( touch == self.dragging ) {
				self.panby( previous_position.x - touch.clientX, previous_position.y - touch.clientY ); 
				previous_position.x = touch.clientX;
				previous_position.y = touch.clientY;
			}
			evt.preventDefault();
		}, false );
		//
		//
		//
		self.countries = {};
		for ( var i = 0; i < self.country_elements.childNodes.length; i++ ) {
			var iso = self.country_elements.childNodes[ i ].id;
			if ( iso && iso.length == 3 ) {
				self.countries[ iso ] = self.country_elements.childNodes[ i ];
				/* utility to generate flow arrows
				var bbox = self.country_elements.childNodes[ i ].getBBox();
				var id = 'map.country_flow.' + self.country_elements.childNodes[ i ].id;
				var x = bbox.x + ( bbox.width / 2.0 );
				var y2 = bbox.y + ( bbox.height / 2.0 );
				var y1 = y2 - 80.0;
				var line = '<line id="' + id + '" x1="' + x + '" x2="' + x + '" y1="' + y1 + '" y2="' + y2 + '" style="visibility: hidden;" stroke-width="20" stroke-linecap="butt" marker-start="url(#arrow_head_start)" marker-end="url(#arrow_head_end)"/>';
				console.log( line );
				*/
				if ( self.country_flows ) {
					self.countries[ iso ].flow_indicator = self.country_flows.querySelector( '#map\\.country_flow\\.' + iso );
				}
				self.countries[ iso ].addEventListener( 'mouseover', function( evt ) {
						var iso = evt.target.id;
						if ( iso ) {
							console.log( 'ISO:' + iso );
						}
					} );
			}
		}
		//
		// sort country flows by y
		//
		var done = false;
		while( !done ) {
			done = true;
		};
	}, false);
})();