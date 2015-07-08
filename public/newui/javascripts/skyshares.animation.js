;
skyshares.animation = {
	init : function( timeline ) {
		var self = skyshares.animation;
		//
		// setup animation callback
		//
		window.requestAnimFrame = (function (callback) {
			return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
			function (callback) {
				window.setTimeout(callback, 1000 / 60);
			};
		})();
	},
	player : null,
	getplayer : function(canvas) {
		var self = skyshares.animation;
		function Player( canvas ) {
			this.timeline 	= null;
			this.stopping 	= false;
		};
				
		Player.prototype.start = function() {
			var _this = this;
			this.stopping = false;
			this.start_time = new Date().getTime();
			this.update();
		};
		
		Player.prototype.stop = function() {
			this.stopping = true;
		};
		Player.prototype.update = function() {
			var self = this;
			if ( this.timeline ) {
				var time = new Date().getTime() - this.start_time;
				this.timeline.update( time );
				this.context.clearRect( 0, 0, this.canvas.width, this.canvas.height );
				this.context.save();
				this.context.scale( 0.5, 0.5 );
				this.timeline.draw(this.context);
				this.context.restore();
				var miliseconds = this.timeline.local_time;
				var minutes = Math.floor( miliseconds / 60000.0 );
				var seconds = Math.floor( ( miliseconds / 1000.0 ) - ( minutes * 60.0 ) );
				miliseconds -= Math.floor( ( seconds * 1000.0 ) + ( minutes * 60000.0 ) );
				this.context.fillStyle = '#000';
				this.context.fillText( ( minutes < 10 ? '0' : '' ) + minutes + ':' + ( seconds < 10 ? '0' : '' ) + seconds + ':' + ( miliseconds < 100 ? miliseconds < 10 ? '0' : '' : '' ) + miliseconds, 4, 12 );
				if ( !this.stopping ) {
					requestAnimFrame( function() {
						self.update();
					} );
				} else {
				
				}
			}
		};
		//
		//
		//
		function TimelineItem() {
			//
			// initialise default properties
			//
			this.start_time = 0;
			this.duration = 0;
			this.direction = 1;
			this.loop_type = "none";
			//
			//
			//
			this.local_time = -1;
			this.local_start_time = 0;
			this.playing = false;
			//
			//
			//
			this.parent = null;
			this.children = [];
		};
		TimelineItem.prototype.setup = function( json ) {
			//
			//
			//
			this.name 		= json.name;
			this.start_time = parseFloat( json.start_time );
			this.duration 	= parseFloat( json.duration );
			this.loop_type 	= json.loop_type || 'none';
			this.loop_count	= parseInt( json.loop_count || 0 );
			//
			//
			//
			this.local_start_time = this.start_time;
			this.direction = 1;
			this.playing = false;
			//
			//
			//
			return true;
		};
		TimelineItem.prototype.reset = function() {
			this.resetChildren();
		};
		TimelineItem.prototype.load = function( filename ) {
			return false;
		};
		//
		//
		//
		TimelineItem.prototype.play = function() {
			//console.log( "playing : " + this.name );
			this.loop_counter = 0;
			this.playing = true;
		};
		TimelineItem.prototype.stop = function( ) {
			//console.log( "stopping : " + this.name );
			this.playing = false;
			this.stopChildren();
		};
		TimelineItem.prototype.isPlaying = function( ) {
			return this.playing;
		};		
		TimelineItem.prototype.update = function( time ) {
			if ( time >= this.local_start_time ) {
				var dt = time - this.local_start_time;
				if ( dt > this.duration ) {
					if ( this.isPlaying() ) {
						if ( this.loop_type == "palindrome" ) {
							this.local_start_time = time;
							this.direction *= -1;
							dt -= this.duration;
						} else if ( this.loop_type == "normal" ) {
							if ( this.loop_count > 0 && ++this.loop_counter >= this.loop_count ) {
								this.stop();
								this.local_time = -1;
								this.reset();
							} else {
								this.local_start_time = time;
								dt -= this.duration;
								this.loopChildStartTimes();
								this.reset();
							}
						} else {
							
							this.stop();
							this.local_time = -1;
							return;
						}
					}
				} else if ( !this.isPlaying() ) {
					this.play();
				}
				//
				// update local time
				//
				if ( this.direction < 0 ) {
					this.local_time = this.duration - dt;
				} else {
					this.local_time = dt;
				}
			} else {
				this.playing = false;
				this.local_time = -1;
			}
		};
		//
		//
		//
		TimelineItem.prototype.setParent = function( parent ) {
			if ( this.parent ) {
				this.parent.removeChild( this );
			}
			this.parent = parent;
			if ( this.parent ) {
				this.parent.addChild( this );
				//
				// clip duration to my duration
				// TODO: rationalise this
				//
				/*
				if ( this.start_time + this.duration > parent.this.duration ) {
					this.duration = parent.this.duration - this.start_time;
				}
				*/
			}
		};
		//
		//
		//

		TimelineItem.prototype.loadChildren = function( json ) {
			if ( json.children ) {
				for ( var i = 0; i < json.children.length; i++ ) {
					var item = TimelineItemFromJSON( json.children[ i ] );
					if ( item ) {
						item.setParent( this );
					}
				}
    
			}

		};
		
		TimelineItem.prototype.addChild = function( child ) {
			this.children.push( child );
		};

		TimelineItem.prototype.removeChild = function( child ) {
			var index = this.children.indexOf( child );
			if ( index >= 0 ) {
				this.children.splice( index, 1 );
			}
		};

		TimelineItem.prototype.loopChildStartTimes = function() {
			//
			// only works for non palindromic parents
			//
			this.children.forEach( function( child ) {
				child.local_start_time = child.start_time;
				child.loopChildStartTimes();
			});
		};
		
		TimelineItem.prototype.fitToChildDurations = function() {
			//
			// 
			//
			var duration = 0;
			for ( var i = 0; i < this.children.length; i++ ) {
				var end_time = this.children[ i ].local_start_time + this.children[ i ].duration;
				duration = Math.max( end_time, duration );
			}
			this.duration = duration;
		};

		TimelineItem.prototype.resetChildren = function() {
			this.children.forEach( function( child ) {
				child.reset();
			});
		};

		TimelineItem.prototype.stopChildren = function() {
			this.children.forEach( function( child ) {
				child.stop();
			});
		};
		TimelineItem.prototype.settime = function( time ) {
			this.local_start_time -= time - this.local_time;
			this.local_time = time;
		};
		//
		//
		//
		function Timeline() {
			TimelineItem.call(this);
		};
		Timeline.prototype = Object.create(TimelineItem.prototype);
		Timeline.prototype.constructor = Timeline;
		//
		//
		//
		Timeline.prototype.setup = function( json ) {
			if ( json.path ) {
				//
				//
				//
				
				return true;
			} else {
				return this._setup(json);
			}
			return false;
		};
		//
		//
		//
		Timeline.prototype._setup = function( json ) {
			//
			// get default properties
			//
			if ( TimelineItem.prototype.setup.call( this, json ) ) {        
				//
				// load children
				//
				this.loadChildren(json);
				//
				//
				//
				//this.fitToChildDurations();
				return true;
			}
			return false;
		};
		//
		//
		//
		Timeline.prototype.update = function( time ) {
			TimelineItem.prototype.update.call( this, time );
			if ( this.isPlaying() ) {
				//
				// update all timeline items
				//
				var local_time = this.local_time;
				this.children.forEach( function( child ) {
					child.update( local_time );
				});
			}
		};
		Timeline.prototype.draw = function( context ) {
			if ( this.local_time < 0 ) return;
			//
			//
			//
			//ofEnableAlphaBlending();
			//
			// draw all timeline items
			//
			var progress = [];
			//progress.push( this.local_time / this.duration );
			this.children.forEach( function( child ) {
				child.draw( context );
				//progress.push( child.local_time / child.duration );
			});
			
			var y = 2;
			var height = 8;
			context.fillStyle = 'rgb( 255, 255, 255 )';
			context.strokeStyle = 'rgb( 0, 0, 0 )';
			progress.forEach( function( u ) {
				if ( u < 0.99 ) {
					var width = ( 768.0 - 4.0 ) * u;
					context.fillRect( 2, y, width, height );
					context.strokeRect( 2, y, width, height );
					y += height + 2;
				}
			});
		};
		/*
		TimelineAnimation.prototype.initialiseEasings = function() {
			if ( !s_easings_initialised ) {
				//
				// easings
				//
				s_easings[ "linear" ]		= new ofxEasingLinear();
				s_easings[ "bounce" ]		= new ofxEasingBounce();
				s_easings[ "back" ]			= new ofxEasingBack();
				s_easings[ "exponential" ]	= new ofxEasingExpo();
				s_easings[ "circular" ]		= new ofxEasingCirc();
				s_easings[ "sine" ]			= new ofxEasingSine();
				s_easings[ "cubic" ]		= new ofxEasingCubic();
				s_easings[ "quad" ]			= new ofxEasingQuad();
				s_easings[ "quart" ]		= new ofxEasingQuart();
				s_easings[ "quint" ]		= new ofxEasingQuint();
				//
				// types
				//
				s_easing_types[ "easein" ]		= (int)ofxTween::easeIn;
				s_easing_types[ "easeout" ]		= (int)ofxTween::easeOut;
				s_easing_types[ "easeinout" ]	= (int)ofxTween::easeInOut;
				//
				//
				//
				s_easings_initialised = true;
			}
		}
		*/

		function TimelineAnimation() {
			TimelineItem.call( this );
			this.start = { // TODO: create vec4 object
				x : 0.0, y : 0.0, z : 0.0, w : 0.0
			};
			this.end = { 
				x : 0.0, y : 0.0, z : 0.0, w : 0.0
			};
			//
			//
			//
			this.ease = {
				none_none: function (t) {
					return t;
				},
				in_quad: function (t, b, c, d) {
					return c*(t/=d)*t + b;
				},
				out_quad: function (t, b, c, d) {
					return -c *(t/=d)*(t-2) + b;
				},
				in_out_quad: function (t, b, c, d) {
					if ((t/=d/2) < 1) return c/2*t*t + b;
					return -c/2 * ((--t)*(t-2) - 1) + b;
				},
				in_cubic: function (t, b, c, d) {
					return c*(t/=d)*t*t + b;
				},
				out_cubic: function (t, b, c, d) {
					return c*((t=t/d-1)*t*t + 1) + b;
				},
				inout_cubic: function (t, b, c, d) {
					if ((t/=d/2) < 1) return c/2*t*t*t + b;
					return c/2*((t-=2)*t*t + 2) + b;
				},
				in_quart: function (t, b, c, d) {
					return c*(t/=d)*t*t*t + b;
				},
				out_quart: function (t, b, c, d) {
					return -c * ((t=t/d-1)*t*t*t - 1) + b;
				},
				inout_quart: function (t, b, c, d) {
					if ((t/=d/2) < 1) return c/2*t*t*t*t + b;
					return -c/2 * ((t-=2)*t*t*t - 2) + b;
				},
				in_quint: function (t, b, c, d) {
					return c*(t/=d)*t*t*t*t + b;
				},
				oiut_quint: function (t, b, c, d) {
					return c*((t=t/d-1)*t*t*t*t + 1) + b;
				},
				inout_quint: function (t, b, c, d) {
					if ((t/=d/2) < 1) return c/2*t*t*t*t*t + b;
					return c/2*((t-=2)*t*t*t*t + 2) + b;
				},
				in_sine: function (t, b, c, d) {
					return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
				},
				out_sine: function (t, b, c, d) {
					return c * Math.sin(t/d * (Math.PI/2)) + b;
				},
				inout_sine: function (t, b, c, d) {
					return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
				},
				in_expo: function (t, b, c, d) {
					return (t==0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
				},
				out_expo: function (t, b, c, d) {
					return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
				},
				inout_expo: function (t, b, c, d) {
					if (t==0) return b;
					if (t==d) return b+c;
					if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;
					return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
				},
				in_circ: function (t, b, c, d) {
					return -c * (Math.sqrt(1 - (t/=d)*t) - 1) + b;
				},
				out_circ: function (t, b, c, d) {
					return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
				},
				inout_circ: function (t, b, c, d) {
					if ((t/=d/2) < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
					return c/2 * (Math.sqrt(1 - (t-=2)*t) + 1) + b;
				},
				in_elastic: function (t, b, c, d) {
					var s=1.70158;var p=0;var a=c;
					if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
					if (a < Math.abs(c)) { a=c; var s=p/4; }
					else var s = p/(2*Math.PI) * Math.asin (c/a);
					return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
				},
				out_elastic: function (t, b, c, d) {
					var s=1.70158;var p=0;var a=c;
					if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
					if (a < Math.abs(c)) { a=c; var s=p/4; }
					else var s = p/(2*Math.PI) * Math.asin (c/a);
					return a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b;
				},
				inout_elastic: function (t, b, c, d) {
					var s=1.70158;var p=0;var a=c;
					if (t==0) return b;  if ((t/=d/2)==2) return b+c;  if (!p) p=d*(.3*1.5);
					if (a < Math.abs(c)) { a=c; var s=p/4; }
					else var s = p/(2*Math.PI) * Math.asin (c/a);
					if (t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
					return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )*.5 + c + b;
				},
				in_back: function (t, b, c, d, s) {
					if (s == undefined) s = 1.70158;
					return c*(t/=d)*t*((s+1)*t - s) + b;
				},
				out_back: function (t, b, c, d, s) {
					if (s == undefined) s = 1.70158;
					return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
				},
				inout_back: function (t, b, c, d, s) {
					if (s == undefined) s = 1.70158; 
					if ((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
					return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
				},
				in_bounce: function (t, b, c, d) {
					return c - this.out_bounce(d-t, 0, c, d) + b;
				},
				out_bounce: function (t, b, c, d) {
					if ((t/=d) < (1/2.75)) {
						return c*(7.5625*t*t) + b;
					} else if (t < (2/2.75)) {
						return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
					} else if (t < (2.5/2.75)) {
						return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
					} else {
						return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
					}
				},
				inout_bounce: function (t, b, c, d) {
					if (t < d/2) return this.in_bounce(t*2, 0, c, d) * .5 + b;
					return this.out_bounce(t*2-d, 0, c, d) * .5 + c*.5 + b;
				}			
			};
		}
		TimelineAnimation.prototype = Object.create(TimelineItem.prototype);
		TimelineAnimation.prototype.constructor = TimelineAnimation;


		TimelineAnimation.prototype.setup = function( json ) {
			if ( TimelineItem.prototype.setup.call(this, json ) ) {
				//
				// get properties
				//
				this.property_name 	= json.property_name;
				this.easing 		= json.easing;
				this.easing_type 	= json.easing_type;
				this.easing_key 	= this.easing && this.easing_type ? this.easing_type + '_' + this.easing : undefined;
				//
				//
				//
				this.value_type	= json.value_type;
				this.start.x = parseFloat( json.start.x );
				this.start.y = parseFloat( json.start.y );
				this.start.z = parseFloat( json.start.z );
				this.start.w = parseFloat( json.start.w );
				this.end.x = parseFloat( json.end.x );
				this.end.y = parseFloat( json.end.y );
				this.end.z = parseFloat( json.end.z );
				this.end.w = parseFloat( json.end.w );

				return true;
			}
			return false;
	
		}

		//
		//
		//
		TimelineAnimation.prototype.update = function( time ) {
			TimelineItem.prototype.update.call(this,time);
			if ( this.isPlaying() ) {
				var u = this.local_time / this.duration;
				if ( this.easing_key ) {
					// t: current time, b: begInnIng value, c: change In value, d: duration
					try {
						u = this.ease[ this.easing_key ]( u, 0.0, 1.0, 1.0 );
					} catch( error ) {
 						console.log( 'invalid easing key : ' + this.easing_key );
					}
				}

				var v = {
					x : this.start.x + ( this.end.x - this.start.x ) * u,
					y : this.start.y + ( this.end.y - this.start.y ) * u,
					z : this.start.z + ( this.end.z - this.start.z ) * u,
					w : this.start.w + ( this.end.w - this.start.w ) * u
				};
				if ( this.value_type == "float" ) {
					this.parent[ this.property_name ] = v.x;
				} else if ( this.value_type == "ofVec2f" ) {
					this.parent[ this.property_name ].x = v.x;
					this.parent[ this.property_name ].y = v.y;
				} else if ( this.value_type == "ofColor" ) {
					this.parent[ this.property_name ].r = v.x;
					this.parent[ this.property_name ].g = v.y;
					this.parent[ this.property_name ].b = v.z;
					this.parent[ this.property_name ].a = v.w;
				}
			}
		}
		//
		//
		//
		TimelineAnimation.prototype.reset = function() {
			TimelineItem.prototype.reset.call(this);
		}
		//
		//
		//
		return new Player();
	}
};