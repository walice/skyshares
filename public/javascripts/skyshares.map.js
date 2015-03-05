;
skyshares.map = {
	newmap : function(prefix) {
		function svgmap( prefix ) {
			this.map 			= document.getElementById( prefix );
			this.world 			= document.getElementById( prefix + '.world' );
			this.region_flows 	= document.getElementById( prefix + '.region_flows' );
			this.country_flows 	= document.getElementById( prefix + '.country_flows' );
			//
			// initialise transform
			//
			this.resettransform();
			var bbox = this.world.getBBox();
			
			this.width 	= bbox.width;//parseFloat( this.map.getAttributeNS( null, 'width' ) );
			this.height = bbox.height;//parseFloat( this.map.getAttributeNS( null, 'height' ) );
			//
			// hook events TODO: touch events
			//
			this.dragging 			= false;
			this.previous_position 	= null;
			var self = this;
			this.map.addEventListener( 'mousedown', function( evt ) {
				self.dragging = true;
				previous_position = { x: evt.clientX, y: evt.clientY };
				evt.preventDefault();
			}, false );
			this.map.addEventListener( 'mouseup', function( evt ) {
				self.dragging = false;
				previous_position = null;
				evt.preventDefault();
			}, false );
			this.map.addEventListener( 'mousemove', function( evt ) {
				if ( self.dragging ) {
					self.pan( evt.clientX - previous_position.x, evt.clientY - previous_position.y ); 
					previous_position.x = evt.clientX;
					previous_position.y = evt.clientY;
				}
				evt.preventDefault();
			}, false );
			this.map.addEventListener( 'touchstart', function( evt ) {
				var touch = evt.changedTouches[0];
				self.dragging = touch;
				previous_position = { x: touch.clientX, y: touch.clientY };
				evt.preventDefault();
			}, false );
			this.map.addEventListener( 'touchend', function( evt ) {
				var touch = evt.changedTouches[0];
				if ( touch == self.dragging ) {
					self.dragging = false;
					previous_position = null;
					evt.preventDefault();
				}
			}, false );
			this.map.addEventListener( 'touchmove', function( evt ) {
				var touch = evt.changedTouches[0];
				if ( touch == self.dragging ) {
					self.pan( touch.clientX - previous_position.x, touch.clientY - previous_position.y ); 
					previous_position.x = touch.clientX;
					previous_position.y = touch.clientY;
				}
				evt.preventDefault();
			}, false );
			document.getElementById( 'navigation.zoom_in' ).addEventListener( 'click', function( evt ) {
				self.zoom( 1.25 );
				evt.preventDefault();
			}, false );
			document.getElementById( 'navigation.zoom_out' ).addEventListener( 'click', function( evt ) {
				self.zoom( 0.8 );
				evt.preventDefault();
			}, false );
			//
			//
			//
			self.countries = {};
			for ( var i = 0; i < self.world.childNodes.length; i++ ) {
				if ( self.world.childNodes[ i ].id && self.world.childNodes[ i ].id.length == 3 ) {
					self.countries[ self.world.childNodes[ i ].id ] = self.world.childNodes[ i ];
					/* utility to generate flow arrows
					var bbox = self.world.childNodes[ i ].getBBox();
					var id = 'map.country_flow.' + self.world.childNodes[ i ].id;
					var x = bbox.x + ( bbox.width / 2.0 );
					var y2 = bbox.y + ( bbox.height / 2.0 );
					var y1 = y2 - 80.0;
					var line = '<line id="' + id + '" x1="' + x + '" x2="' + x + '" y1="' + y1 + '" y2="' + y2 + '" style="visibility: hidden;" stroke-width="20" stroke-linecap="butt" marker-start="url(#arrow_head_start)" marker-end="url(#arrow_head_end)"/>';
					console.log( line );
					*/
					if ( self.country_flows ) {
						self.countries[ self.world.childNodes[ i ].id ].flow_arrow = self.country_flows.querySelector( '#map\\.country_flow\\.' + self.world.childNodes[ i ].id );
					}
				}
			}
		};
		// 
		// transform
		//
		svgmap.prototype.resettransform = function() {
			this.current_scale	= 1.0;
			this.current_pan	= { x: 0, y: 0 };
			this.matrix = [1,0,0,1,0,0];
		};
		svgmap.prototype.zoomin = function() {
			this.zoom( this.scale * 2.0 );
		};
		svgmap.prototype.zoomout = function() {
			this.zoom( this.scale * 0.5 );
		};
		svgmap.prototype.zoom = function( scale ) {
			this.scale *= scale;
			for ( var i = 0; i < this.matrix.length; i++ ) {
				this.matrix[ i ] *= scale;
			}
			this.matrix[4] += (1-scale)*this.width/2.0;
			this.matrix[5] += (1-scale)*this.height/2.0;
			this.applytransform();
		};
		svgmap.prototype.pan = function( dx, dy ) {
			this.matrix[ 4 ] += dx;
			this.matrix[ 5 ] += dy;
			this.applytransform();
		};
		svgmap.prototype.applytransform = function(animate) {
			if ( animate ) {
			
			} else {
				var matrix = "matrix(" +  this.matrix.join(' ') + ")";
				this.world.setAttributeNS(null, "transform", matrix);
			}
		}
		//
		//
		//
		svgmap.prototype.togglecountryflows = function() {
			if ( this.country_flows ) {
				if ( this.country_flows.style.visibility === 'visible' ) {
					this.country_flows.style.visibility = 'hidden';
					return false;
				} else {
					this.country_flows.style.visibility = 'visible';
					return true;
				}
			}
			return false;
		}
		svgmap.prototype.toggleregionflows = function() {
			if ( this.region_flows ) {
				if ( this.region_flows.style.visibility === 'visible' ) {
					this.region_flows.style.visibility = 'hidden';
					return false;
				} else {
					this.region_flows.style.visibility = 'visible';
					return true;
				}
			}
			return false;
		}
		//
		//
		//
		svgmap.prototype.showcountry = function( country_iso ) {
			var self = this;
			if ( self.countries[ country_iso ] == undefined ) {
				alert( country_iso + ' not defined!' );
			} else {
				for ( iso in self.countries ) {
					self.countries[ iso ].style.fill = ( iso == country_iso ? 'red' : '#777777' );
				}
			}
		}
		svgmap.prototype.showgroup = function( group ) {
			var self = this;
			var group_data = JSON.parse( localStorage.getItem( group ) );
			for ( iso in self.countries ) {
				self.countries[ iso ].style.fill = ( group_data.members.indexOf( iso ) != -1 ? 'red' : '#777777' );
			}
		}
		
		
		return new svgmap(prefix);
	}
};