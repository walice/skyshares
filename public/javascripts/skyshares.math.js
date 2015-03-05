;
skyshares.math = {
	//
	// mathjs instance
	//
	math : mathjs(),
	//
	// 
	//
	whitespace : [
		' ', '\t', '\n'
	],
	mathjsoperators : [
		'(', ')', '[', ']', ',', '.', ';', '+', '-', '*', '.*', '/', './', '%', 'mod', '^', '.^', '-', '\'', '!', '=', ':', 'to', 'in', '==', '!=', '<', '>', '<=', '>='
	],
	mathjsfunctions : [
		// Arithmetic

		'abs',
		'add',
		'ceil',
		'cube',
		'divide',
		'edivide',
		'emultiply',
		'epow',
		'equal',
		'exp',
		'fix',
		'floor',
		'gcd',
		'larger',
		'largereq',
		'lcm',
		'log',
		'log10',
		'mod',
		'multiply',
		'pow',
		'round',
		'sign',
		'smaller',
		'smallereq',
		'subtract',
		'sqrt',
		'square',
		'unary',
		'unequal',
		'xgcd',

		// Complex

		're',
		'im',
		'arg',
		'conj',

		// Construction

		'bignumber',
		'boolean',
		'complex',
		'index',
		'matrix',
		'number',
		'parser',
		'select',
		'string',
		'unit',

		// Expression

		'eval',
		'help',
		'parse',

		// Matrix

		'concat',
		'det',
		'diag',
		'eye',
		'inv',
		'ones',
		'range',
		'resize',
		'size',
		'squeeze',
		'subset',
		'transpose',
		'zeros',

		// Probability

		'combinations',
		'factorial',
		'distribution',
		'permutations',
		'pickRandom',
		'random',
		'randomInt',

		// Statistics

		'max',
		'min',
		'mean',

		// Trigonometry

		'acos',
		'asin',
		'atan',
		'atan2',
		'cos',
		'cot',
		'csc',
		'sec',
		'sin',
		'tan',

		// Units

		'to',
		
		// Comparison
		
		'compare',
		'deepEqual',
		'equal',
		'larger',
		'largerEq',
		'smaller',
		'smallerEq',
		'unequal',

		// Utils

		'config',
		'clone',
		'forEach',
		'ifElse',
		'format',
		'import',
		'map',
		'print',
		'typeof'
	
	],
	numericfunctions : [
		'abs',
		'acos',
		'add',
		'addeq',
		'all',
		'and',
		'andeq',
		'any',
		'asin',
		'atan',
		'atan2',
		'band',
		'bench',
		'bnot',
		'bor',
		'bxor',
		'ccsDim',
		'ccsDot',
		'ccsFull',
		'ccsGather',
		'ccsGetBlock',
		'ccsLUP',
		'ccsLUPSolve',
		'ccsScatter',
		'ccsSparse',
		'ccsTSolve',
		'ccs<op>',
		'cLU',
		'cLUsolve',
		'cdelsq',
		'cdotMV',
		'ceil',
		'cgrid',
		'clone',
		'cos',
		'det',
		'diag',
		'dim',
		'div',
		'diveq',
		'dopri',
		'Dopri.at',
		'dot',
		'eig',
		'epsilon',
		'eq',
		'exp',
		'floor',
		'geq',
		'getBlock',
		'getDiag',
		'gt',
		'identity',
		'imageURL',
		'inv',
		'isFinite',
		'isNaN',
		'largeArray',
		'leq',
		'linspace',
		'log',
		'lshift',
		'lshifteq',
		'lt',
		'LU',
		'LUsolve',
		'mapreduce',
		'mod',
		'modeq',
		'mul',
		'neg',
		'neq',
		'norm2',
		'norm2Squared',
		'norminf',
		'not',
		'or',
		'oreq',
		'parseCSV',
		'parseDate',
		'parseFloat',
		'pointwise',
		'pow',
		'precision',
		'prettyPrint',
		'random',
		'rep',
		'round',
		'rrshift',
		'rrshifteq',
		'rshift',
		'rshifteq',
		'same',
		'seedrandom',
		'setBlock',
		'sin',
		'solve',
		'solveLP',
		'solveQP',
		'spline',
		'Spline.at',
		'Spline.diff',
		'Spline.roots',
		'sqrt',
		'sub',
		'subeq',
		'sum',
		'svd'
	],
	skysharesfunctions : [
		'get', 'sum', 'goalseek', 'integrate', 'differentiate', 'numintegrate', 'interpolate'
	],
	//
	//
	//
	evaluatefunction : function( source, scope ) {
		return new MathJsFunction( source, scope );
	},
	getdefaultscope : function() {
		return { 
			get : skyshares.math.get,
			getcolumn : skyshares.math.getcolumn,
			getrow : skyshares.math.getrow,
			sum : skyshares.math.sum,
			sumrow : skyshares.math.sumrow,
			sumcolumn : skyshares.math.sumcolumn,
			tospline : skyshares.math.tospline,
			interpolator : skyshares.math.interpolator,
			goalseek : skyshares.math.goalseek,
			integrate : skyshares.math.integrate,
			newtonraphson :  skyshares.math.newtonraphson,
			numintegrate : skyshares.math.numintegrate,
			interpolate : skyshares.math.interpolate,
			//
			//
			//
			epsilon : 2.220446049250313e-16 //????
		};
	},
	//
	// skyshares extensions to mathjs
	//
	get : function( dataset, i, t ) {
		var self = skyshares.math;
		return self.getcolumn( dataset, i, t );
	},
	getcolumn : function( dataset, i, t ) {
		if ( dataset.type !== 'dataset' ) {
			throw { message: "get : invalid datatype : " + dataset.type };
		} else if ( i < 0 || i > dataset.members.length - 1 ) {
			//throw { message: "get : index i=" +  i + " is out of range 0-" + ( dataset.members.length - 1 ) };
			return Math.NaN;
		}
		var member = dataset.members[ i ];
		if ( t < member.index.min_index || t > member.index.max_index ) {
			//throw { message: "get : index t=" + t + " is out of range " + member.index.min_index + "-" + member.index.max_index };
			return Math.NaN;
		}
		var index = t - member.index.min_index;
		return parseFloat( member.data[ index ] );
	},
	getrow : function( dataset, i ) {
		if ( dataset.type !== 'dataset' ) {
			throw { message: "get : invalid datatype : " + dataset.type };
		} else if ( i < 0 || i > dataset.members.length - 1 ) {
			//throw { message: "get : index i=" +  i + " is out of range 0-" + ( dataset.members.length - 1 ) };
			return Math.NaN;
		}
		return dataset.members[ i ];
	},
	sum : function( dataset, t ) {
		var self = skyshares.math;
		return self.sumcolumn( dataset, t );
	},
	sumcolumn : function( dataset, t, clamp ) {
		var self = skyshares.math;
		if ( dataset.type !== 'dataset' ) {
			throw { message: "sumcolumn : invalid datatype : " + dataset.type };
		}
		var member = dataset.members[ 0 ];
		var sum = 0;
		var it 	= Math.floor(t);
		var u 	= t - it;
		var index = it - member.index.min_index;
		var subsample = index < dataset.members[ 0 ].data.length - 1;
		
		if ( clamp ) {
			if ( it < member.index.min_index ) {
				return self.sumcolumn( dataset, member.index.min_index );
			} else if ( it > member.index.max_index ) {
				return self.sumcolumn( dataset, member.index.max_index );
			}
		} else {
			if ( it < member.index.min_index || it > member.index.max_index ) {
				//throw { message: "sumcolumn : index " + t + " out of range : " + member.index.min_index + " - " + member.index.max_index };
				return Math.NaN;
			}
		}
		for ( var i = 0; i < dataset.members.length; i++ ) {
			if ( u > 0.0 && subsample ) {
				sum += ( dataset.members[ i ].data[ index ] * ( 1 - u ) ) + ( dataset.members[ i ].data[ index + 1 ] * u );
			} else {
				sum += dataset.members[ i ].data[ index ];
			}
		}
		return sum;
	},
	sumrow : function( dataset, i ) {
		if ( dataset.type !== 'dataset' ) {
			throw { message: "sumrow : invalid datatype : " + dataset.type };
		}
		if ( i < 0 || i >= dataset.members.length ) {
			//throw { message: "sumrow : index i out of range : " + i };
			return Math.NaN;
		}
		var sum = 0;
		var member = dataset.members[ i ];
		for ( var t = 0; t < member.data.length; t++ ) {
			sum += member.data[ t ];
		}
		return sum;
	},
	getbyiso : function( dataset, iso ) {
		if ( dataset.type !== 'dataset' ) {
			throw { message: "getbyiso : invalid datatype : " + dataset.type };
		}
		try {
			for ( var i = 0; i < dataset.members.length; i++ ) {
				if ( dataset.members[ i ].iso === iso ) return dataset.members[ i ];
			}
		} catch( error ) {
			throw { message: "getbyiso : invalid member index" };
		}
		return null;
	},
	tospline : function( dataset, i ) {
	},
	interpolator : function( member ) {
		var self = skyshares.math;
		var count = member.data.length;
		var pts = [];
		if ( member.dimension === undefined || member.dimension == 1 ) {
			//
			// NOTE: this assumes the data is continuous
			//
			for ( var index = 0; index < count; index++ ) {
				var pt = {
					x : member.index.min_index + ( ( member.index.max_index - member.index.min_index ) / count ) * index,
					y : member.data[ index ]
				};
				pts.push( pt );
			}
		} else {
			pts = member.data;
		}
		var b = skyshares.geometry.bezier( pts );
		return function( x ) {
			return b.YFromX( x );
		};
	},
	goalseek : function( f, goal, min_value, max_value ) {
		var self = skyshares.math;
		//
		// seek parameters
		//
		var seek_param = {
			//
			// 
			//
			bracket 	: [ min_value === undefined ? 0.0 : min_value, max_value === undefined ? Number.MAX_VALUE : max_value ], // TODO: initial guess	
			result		: [0,0],
			distance	: [0,0],
			//current_direction : 0,
			//
			//
			//
			candidate			: -1,
			candidate_value		: Number.NaN,
			candidate_distance	: Number.MAX_VALUE,
			//
			//
			//
			threshold		: 0.0000001,
			iter			: 1000
		};	
		//
		// seek function
		//
		function seek(param) {
			param.result[ 0 ] = f( param.bracket[ 0 ] );
			param.result[ 1 ] = f( param.bracket[ 1 ] );
			var d0 = goal - param.result[ 0 ];
			var d1 = goal - param.result[ 1 ];
			param.distance[ 0 ] = Math.abs( d0 );
			param.distance[ 1 ] = Math.abs( d1 );
			//console.log( 'result[ ' + param.result[ 0 ] + ' , ' + param.result[ 1 ] + ' ] goal=' + goal );
			if ( true /*param.candidate_distance >= Math.min( param.distance[ 0 ], param.distance[ 1 ] )*/ ) {
				//
				// getting closer
				//
				/*
				param.candidate = param.distance[ 0 ] < param.distance[ 1 ] ? 0 : param.distance[ 0 ] > param.distance[ 1 ] ? 1 : -1;
				param.candidate_value = param.candidate == -1 ? param.bracket[ 0 ] : param.bracket[ param.candidate ];	
				param.candidate_distance = param.candidate == -1 ? param.distance[ 0 ] : param.distance[ param.candidate ];	
				*/
				var range = param.bracket[ 1 ] - param.bracket[ 0 ];
				var u = ( ( goal - param.result[ 0 ] ) / ( param.result[ 1 ] - param.result[ 0 ] ) );
				param.candidate_distance = Math.min( param.distance[ 0 ], param.distance[ 1 ] );
				if ( param.candidate_distance <= param.threshold ) {
					//console.log( 'u=' + u );
					return param.bracket[ 0 ] + ( range * u );
					//return param.candidate_value;
				} else {
					//
					// shift bracket towards best result
					//
					var c = param.bracket[ 0 ] + ( range * u );
					if ( param.result[ 0 ] > goal ) {
						param.bracket[ 0 ] -= range * 0.25;
					} else {
						if ( u > 1.0 ) {
							param.bracket[ 0 ] += range * 0.25;
						} else {
							param.bracket[ 0 ] = Math.max( min_value || 0, c - range * 0.25 );
						}
					}
					if ( param.bracket[ 0 ] < min_value ) param.bracket[ 0 ] = min_value;
					if ( param.result[ 1 ] < goal ) {
						param.bracket[ 1 ] += range * 0.25;
					} else {
						if ( u < 0.0 ) {
							param.bracket[ 1 ] -= range * 0.25;
						} else {
							param.bracket[ 1 ] = Math.min( max_value || Number.MAX_VALUE, c + range * 0.25 );
						}
					}
					if ( param.bracket[ 1 ] > max_value ) param.bracket[ 1 ] = max_value;
				}
			} else {
				//
				// moving further away so try elsewhere
				//
				var min_shift = -param.bracket[ 0 ];
				var max_shift = max_value - param.bracket[ 1 ];
				var shift = min_shift + ( Math.random() * ( max_shift - min_shift ) );
				param.bracket[ 0 ] += shift;
				param.bracket[ 1 ] += shift;
				//param.iter = 100;
			}
			if ( --param.iter >= 0 ) {
				//
				// try again
				//
				return seek(param);
			} else {
				//
				// no result
				//
				return Number.NaN;
			}
		};
		
		var result = seek(seek_param);
		
		return result;
	},
	integrate : function( f ) {
	
	},
	newtonraphson : function( f, f_prime, max_iter, start_value ) {
		var curr = start_value;
		for ( var i = 0; i < max_iter; i++ ) {
			var prev = curr;
			var fval = f(prev);
			var f_prime_val = f_prime(prev);
			curr = prev - fval / f_prime_val;
			//console.log( 'i=' + i + 'f=' + fval + 'fprime=' + f_prime_val + 'curr=' + curr + ' prev=' + prev );
			if ( curr == prev ) break;
		}
		return curr;
	},
	//
	//
	//
	adaptivesimpson : function( f, a, b, epsilon, s, fa, fb, fc, level ) {
		var self = skyshares.math;
		var c = (a + b)/2.0;
		var h = b - a;                                                                  
		var d = (a + c)/2.0
		var e = (c + b)/2;                                                              
		var fd = f(d), fe = f(e);                                                                      
		var sleft = (h/12.0)*(fa + 4.0*fd + fc);                                                           
		var sright = (h/12.0)*(fc + 4.0*fe + fb);                                                          
		var s2 = sleft + sright;     
		var val;                                                                  
		if (level <= 0 || Math.abs(s2 - s) <= 15.0*epsilon) {
			val = s2 + (s2 - s)/15.0;  // within error or at max recursion 
		} else {
			val = 
				self.adaptivesimpson(f, a, c, epsilon/2, sleft,  fa, fc, fd, level-1) + 
				self.adaptivesimpson(f, c, b, epsilon/2, sright, fc, fb, fe, level-1); 
		}
		return val;                    
	
	},
	numintegrate : function(f, lower_bound, upper_bound, precision_parameter, max_recursion ) {
		var self = skyshares.math;
		var a = lower_bound;
		var b = upper_bound;
		var c = (a + b)/2.0;
		var h = b - a;                                                                  
		var fa = f(a);
		var fb = f(b);
		var fc = f(c);                                                           
		var s = (h/6.0)*(fa + 4.0*fc + fb);                                                                
		var val = self.adaptivesimpson(f, a, b, precision_parameter || 0.000000001, s, fa, fb, fc, max_recursion || 10);                   
		return val;
	},
	numintegrateint : function( f, lower_bound, upper_bound ) {
		var self = skyshares.math;
		var Fa = f( lower_bound );
		var Fb = f( upper_bound );
 
		var ab = (lower_bound + upper_bound) / 2;
 
		var Fab = f(ab);
 
		return (upper_bound - lower_bound) / 6 * (Fa + 4 * Fab + Fb);	
	},
	//
	// interpolation 
	// assumes data_set is an array with two sets of values x,y
	// data_set = [
	//	[ x0, x1, x2, x3 ],
	//	[ y0, y1, y2, y3 ],
	// ]			
	interpolate : function( member, x ) { 
		var self = skyshares.math;
		var interpolator = self.interpolator( member );
		return interpolator( x ); 
	},
	//
	// simple interpolation
	//
	linerinterp : function( p, x ) {
		try {
			function interpolate( x, p0, p1 ) {
				if ( p1.x == p0.x ) { // line is vertical
					return p1.y + ( p1.y - p0.y );
				}
				var y = p0.y + ( ( x - p0.x ) / ( p1.x - p0.x ) ) * ( p1.y - p0.y );
				if ( !isFinite( y ) ) { // probably caused by divide by zero
					throw 'interpolate( ' + x + ',' + JSON.stringify( p0 ) + ',' + JSON.stringify( p1 ) + ' ) is Infinite'
				}
				return y; 
			}
			var np = p.length;
			if ( x < p[ 0 ].x ) { // extrapolate back from first point
				return interpolate( x, p[ 1 ], p[ 0 ] );
			} else if ( x > p[ np - 1 ].x ) { // extrapolate forwards from last point
				return interpolate( x, p[ np - 2 ], p[ np - 1 ] );
			} else {
				for ( var i = 0; i < np - 1; i++ ) { 
					if ( x >= p[ i ].x && x <= p[ i + 1 ].x ) {
						return interpolate( x, p[ i ], p[ i + 1 ] );
					} 
				}
			}
		} catch( error ) {
			log( 'linerinterp : error : ' + error );
		}
	},
	linerinterpinv : function( p, y ) { // interpolate x for y
		try {
			function interpolate( y, p0, p1 ) {
				if ( p0.y == p1.y ) { // line is horizontal
					p1.x + ( p1.x - p0.x );
				}
				var x = p0.x + ( ( y - p0.y ) / ( p1.y - p0.y ) ) * ( p1.x - p0.x );
				if ( !isFinite( x ) ) {
					throw 'interpolate( ' + y + ',' + JSON.stringify( p0 ) + ',' + JSON.stringify( p1 ) + ' ) is Infinite'
				}
				return x;
			}
			var np = p.length;
			if ( y < p[ 0 ].y ) { // extrapolate back from first point
				return interpolate( y, p[ 1 ], p[ 0 ] );
			} else if ( y > p[ np - 1 ].y ) { // extrapolate forwards from first point
				return interpolate( y, p[ np - 2 ], p[ np - 1 ] );
			} else {
				for ( var i = 0; i < np - 1; i++ ) {
					if ( y >= p[ i ].y && y <= p[ i + 1 ].y ) {
						return interpolate( y, p[ i ], p[ i + 1 ] );
					} 
				}
			}
		} catch( error ) {
			log( 'linerinterpinv : error : ' + error );
		}
	}
};
//
//
//
function MathJsFunction( source, scope ) {
	this.scope = scope;
	this.source = source;
	this.evaluate();
}
MathJsFunction.prototype.evaluate = function() {
	var self = this;
	//
	// remove \r\n TODO: perhaps should support multiline source, each line parsed into separate function 
	//
	var source = this.source.replace( /\r\n|\n/g, ' ' ); 
	//
	// parse source and get all dependencies
	//
	// name( param1, param2 ) = param1 / param2
	//
	// extract all parameters, variables, constants and functions from source
	//
	function isNumeric( n ) {
		return !isNaN( parseFloat(n) ) && isFinite( n );
	};
	function isWhiteSpace( str ) {
		return skyshares.math.mathjsoperators.indexOf( str ) != -1 || 
			skyshares.math.whitespace.indexOf( str ) != -1; 
	};
	function isReserved( str ) {
		return skyshares.math.numericfunctions.indexOf( str ) != -1 || 
			skyshares.math.mathjsoperators.indexOf( str ) != -1 || 
			skyshares.math.mathjsfunctions.indexOf( str ) != -1 || 
			skyshares.math.skysharesfunctions.indexOf( str ) != -1 || 
			skyshares.math.whitespace.indexOf( str ) != -1; 
	};
	var function_body_start = source.indexOf( '=' );
	var invariable = false;
	var variable = '';
	this.variables = [];
	this.parameters = [];
	for ( var i = 0; i < source.length; i++ ) {
		if ( invariable ) {
			if ( i == source.length - 1 || isWhiteSpace( source[ i ] ) ) {
				if ( i == source.length - 1 ) {
					variable += source[ i ];
				}
				if ( variable.length > 0 &&
					!isNumeric( variable) && 
					!isReserved( variable ) &&
					this.parameters.indexOf( variable ) == -1 &&
					this.variables.indexOf( variable ) == -1 ) {
					if ( i < function_body_start ) {
						this.parameters.push( variable ); 
					} else {
						this.variables.push( variable ); 
					}
				}
				invariable = false;
				variable = '';
			} else {
				
				variable += source[ i ];
			}
		} else {
			invariable = !isReserved( source[ i ] );
			if ( invariable ) {
				variable += source[ i ];
			}
		}
	}
	//
	// store function name for reference
	//
	this.function_name = this.parameters[ 0 ];
	/*
	//
	// check if function name appears in function body
	//
	var function_body = source.substr( function_body_start + 1 );
	function_body = function_body.replace( this.function_name, this.function_name + '_r' );
	source = source.substr( 0, function_body_start ) + ' = ' + function_body;
	*/
	//
	// create mathjs scope
	//
	this.scope = this.scope || skyshares.math.getdefaultscope(); 
	//
	// recursive function call
	//
	/*
	if ( function_body.indexOf( this.function_name + '_r' ) >= 0 ) {
		this.scope[ this.function_name + '_r' ] = function() {
			var stack_entry = {};
			for ( var i = 1; i < self.parameters.length; i++ ) {
				stack_entry[ i - 1 ] = self.scope[self.parameters[i]];
				self.scope[self.parameters[i]] = arguments[i-1];
				console.log( self.parameters[i] + ' in ' +  self.scope[self.parameters[i]] );
			}
			var result = self.scope[ self.function_name ].apply(self,arguments);
			for ( var i = 1; i < self.parameters.length; i++ ) {
				self.scope[self.parameters[i]] = stack_entry[self.parameters[i]];
				console.log( self.parameters[i] + ' out ' +  self.scope[self.parameters[i]] );
			}
			return result;
		};
	}
	*/
	//
	// get variable values
	//
	var math = mathjs(); // should use global object here
	for ( var i = 0; i < this.variables.length; i++ ) {
		if ( this.scope[ this.variables[ i ] ] == undefined ) {
			var data_json = localStorage.getItem( this.variables[ i ] );
			if ( data_json && data_json.length > 0 ) {
				var data = JSON.parse( data_json );
				if ( data ) {
					switch( data.type ) {
						case 'group' : {
								//
								// TODO: prefetch data from source ????
								//
							}
							break;
						case 'function' : {
								var mathjsfunction = new MathJsFunction( data.source, this.scope );
								this.scope[ this.variables[ i ] ] = mathjsfunction.bindfunction();
							}
							break;
						case 'dataset' :
							this.scope[ this.variables[ i ] ] = data;
							break;
						case 'variable' :
						case 'constant' :
							this.scope[ this.variables[ i ] ] = parseFloat(data.value);
							break;
					}
				}
			} else {
				log( 'problem evaluating function : ' + this.function_name + ' unable to get variable : ' + this.variables[ i ] );
			}
		}
	}
	//
	// build mathjs node
	//
	try {
		/*
		var stage = 'parsing';
		this.node = math.parse( source );
		
		stage = 'compiling';
		this.code = this.node.compile( math );

		stage = 'evaluating';
		var result = this.code.eval( this.scope );
		*/
		var result = math.eval( source, this.scope );
	} catch( err ) {
		alert( "Unable to evaluate : " + this.function_name + " : " + err.message );
	}
	//
	// return function
	//
	return this.scope[ this.function_name ];
}
MathJsFunction.prototype.getfunction = function() {
	return this.scope[ this.function_name ];
}
MathJsFunction.prototype.callfunction = function() {
	for ( var i = 0; i < arguments.length; i++ ) {
		this.scope[ this.parameters[ i + 1 ] ] = arguments[ i ];
	}
	return this.scope[ this.function_name ].apply( this, arguments );
}
MathJsFunction.prototype.bindfunction = function() {
	return this.scope[ this.function_name ].bind( this );
}


