//
//
//
;
skyshares.chart = {
	//
	// element 
	//
	//
	chart : function( element, chart ) {
		var self = skyshares.chart;
		//
		//
		//
		switch ( chart.type ) {
			case 'line' : {
			
			}
			break;
			case 'bar' : {
			
			}
			break;
		}
	},
	//
	// element : DOM element, id or element
	// config = {
	//		axis : {
	//			x : {
	//				min : 0,
	//				max : 0,
	//				step : 0,
	//				name : "name"
	//			},
	//			y : {
	//				min : 0,
	//				max : 0,
	//				step : 0,
	//				name : "name"
	//			},
	//			colour: 'rgb(...)'
	//		},
	//		lines : [
	//			{
	//				data: [] or
	//				f: function(x) { return y for x },
	//				stroke : {
	//					colour:'',
	//					width: 1
	//				},
	//				fill : {
	//					colour:''
	//				}
	//				name : "name"
	//			}
	//		]
	//		
	//	}
	//
	linechart : function( element, config ) {
		var self = skyshares.chart;
		//
		// 
		//
		var svg = dimple.newSvg(element,590,400);
		if ( svg ) {
			//
			// initialise data
			//
			var data = [];
			for ( var x = config.axis.x.min; x < config.axis.x.max; x += config.axis.x.step ) {
				for ( var i = 0; i < config.lines.length; i++ ) {
					var line = config.lines[ i ];
					var data_point = { name: line.name };
					data_point[ config.axis.x.name ] = line.data ? line.data[ x ].x : x;
					data_point[ config.axis.y.name ] = line.data ? line.data[ x ].y : line.f( x );
					data.push( data_point );
				}
			}
			//
			//
			//
			var chart = new dimple.chart( svg, data );
			chart.setBounds(60, 30, 505, 305);
			//
			// add axis
			//
			//if ( config.axis.x.type == 'date' ) {
			//	chart.addAxis("x", null, null, config.axis.x.name );
			//} else {
			var x_axis = chart.addCategoryAxis( 'x', config.axis.x.name );
			if ( config.axis.x.type == 'date' ) {
				//x_axis.tickFormat = '%Y';
				//x_axis.addOrderRule("Date");
			}
			x_axis.ticks = 5;
			//}
			chart.addAxis( 'y', config.axis.y.name ).ticks = 5;
			var series = chart.addSeries( 'name', dimple.plot.line);
			series.interpolation = 'basis';
			//chart.addLegend(60, 10, 500, 20, 'right');
			chart.draw();
		}
	},
	linechartd3 : function( element, config ) {
		var self = skyshares.chart;
		try {
			//
			// initialise data 
			//
			var data = [];
			var range = {
				y : {
					min: ( config.axis.y.min === undefined ? Number.MAX_VALUE : config.axis.y.min ),
					max: ( config.axis.y.max === undefined ? Number.MIN_VALUE : config.axis.y.max )
				},
				x : {
					min: ( config.axis.x.min === undefined ? Number.MAX_VALUE : config.axis.x.min ),
					max: ( config.axis.x.max === undefined ? Number.MIN_VALUE : config.axis.x.max )
				}
			};
			//
			// TODO: work out range increment for x axis with function for y
			//
			for ( var i = 0; i < config.lines.length; i++ ) {
				var line = config.lines[ i ];
				var line_data = { name: line.name, stroke: line.stroke, fill: line.fill, data: [] };
				for ( var j = config.index.min; j <= config.index.max; j += config.index.step ) {
					var x = line.data ? line.data[ j ].x : range.x.min + j;
					var y = line.data ? line.data[ j ].y : line.f( x )
					var data_point = {
						x: x,
						y: y
					};
					if ( config.axis.x.min == undefined && x < range.x.min ) range.x.min = x;
					if ( config.axis.x.max == undefined && x > range.x.max ) range.x.max = x;
					if ( config.axis.y.min == undefined && y < range.y.min ) range.y.min = y;
					if ( config.axis.y.max == undefined && y > range.y.max ) range.y.max = y;
					line_data.data.push( data_point );
				}
				data.push( line_data );
			}
			//
			// calculate width,height scale
			//
			var margin = config.margin || {
				top: 20,
				left: 60,
				bottom: 40,
				right: 20
			};
			var width = element.offsetWidth - ( margin.left + margin.right );
			var height = element.offsetHeight - ( margin.top + margin.bottom );
			var x_scale = d3.scale.linear().domain( [ range.x.min, range.x.max ] ).range( [ 0, width ] );
			var y_scale = d3.scale.linear().domain( [ range.y.min, range.y.max ] ).range( [ height, 0 ] );
			//
			// create graph container
			//			
			var graph = d3.select( '#' + element.id ).append( 'svg' )
				.attr( 'width', element.offsetWidth )
				.attr( 'height', element.offsetHeight )
				.append('g')
					.attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')' );
			//
			// create axis
			//
			var x_axis = d3.svg.axis()
				.scale(x_scale)
				.tickSize(-height)
				.ticks(config.axis.x.tickcount || 4)
				.tickFormat(config.axis.x.tickformat || d3.format('r'))
				.orient( 'bottom' );
			var y_axis = d3.svg.axis()
				.scale(y_scale)
				.tickSize(-width)
				.ticks(config.axis.x.tickcount || 4)
				.tickFormat(config.axis.y.tickformat || d3.format('s'))
				.orient("left"); 
			graph.append( 'g' )
				.attr("class", "axis")
				.attr('transform', 'translate(0, ' + height + ')')
				.call( x_axis );
			graph.append( 'g' )
				.attr("class", "axis")
				.call( y_axis );
			//
			// draw graph
			//
			var line = d3.svg.line()
			.x( function( d ) {
				return x_scale(d.x);
			})
			.y( function( d ) {
				return y_scale(d.y);
			})
			.interpolate("basis");;
			data.forEach( function( line_data ) {
				graph.append("path").attr("d", line(line_data.data))
				.attr("stroke", line_data.stroke.colour )
				.attr("stroke-width", line_data.stroke.width )
				.attr("fill", line_data.fill );
			});
			//
			// append title
			//
			if ( config.title ) {
				graph.append( 'text' )
					.attr("class", "title")
					.attr("text-anchor", "end")
					.attr("x", width )
					.text(config.title);
			}
			//
			// append axis lables
			//
			if ( config.axis.x.name ) {
				graph.append("text")
					.attr("class", "x label")
					.attr("text-anchor", "middle")
					.attr("x", width / 2.0)
					.attr("y", height + 28)
					.text(config.axis.x.name);
			}
			if ( config.axis.y.name ) {
				graph.append("text")
					.attr("class", "y label")
					.attr("text-anchor", "middle")
					.attr("transform", "translate( -34, " + ( height / 2 ) + ") rotate(-90)")
					.text(config.axis.y.name);		
			}	
		} catch( error ) {
			console.log( 'error : skyshares.chart.linechartd3 : ' + config.name + ' : ' + error );
		}		
	},
	groupedbarchartd3 : function( element, config ) {
		var self = skyshares.chart;
		try {
			//
			// initialise data 
			//
			var data = [];
			var range = {
				y : {
					min: ( config.axis.y.min === undefined ? Number.MAX_VALUE : config.axis.y.min ),
					max: ( config.axis.y.max === undefined ? Number.MIN_VALUE : config.axis.y.max )
				},
				x : {
					min: ( config.axis.x.min === undefined ? Number.MAX_VALUE : config.axis.x.min ),
					max: ( config.axis.x.max === undefined ? Number.MIN_VALUE : config.axis.x.max )
				}
			};
			//
			// TODO: work out range increment for x axis with function for y
			//
			for ( var i = 0; i < config.lines.length; i++ ) {
				var line = config.lines[ i ];
				var line_data = { name: line.name, stroke: line.stroke, fill: line.fill, data: [] };
				for ( var j = config.index.min; j <= config.index.max; j += config.index.step ) {
					var x = line.data ? line.data[ j ].x : range.x.min + j;
					var y = line.data ? line.data[ j ].y : line.f( x )
					var data_point = {
						x: x,
						y: y
					};
					if ( config.axis.x.min == undefined && x < range.x.min ) range.x.min = x;
					if ( config.axis.x.max == undefined && x > range.x.max ) range.x.max = x;
					if ( config.axis.y.min == undefined && y < range.y.min ) range.y.min = y;
					if ( config.axis.y.max == undefined && y > range.y.max ) range.y.max = y;
					line_data.data.push( data_point );
				}
				data.push( line_data );
			}
			//
			// calculate width,height scale
			//
			var margin = config.margin || {
				top: 20,
				left: 60,
				bottom: 40,
				right: 20
			};
			var width = element.offsetWidth - ( margin.left + margin.right );
			var height = element.offsetHeight - ( margin.top + margin.bottom );
			var x0_scale	= d3.scale.ordinal().rangeRoundBands([0, width], .1).domain( data.map( function( d ) { return d.name; } ) );
			var range_band = x0_scale.rangeBand();
			var bar_width = ( range_band / Math.max( 1, data[ 0 ].data.length ) ) - ( .1 * data[ 0 ].data.length );
			var y_max = range.y.min < 0 ? Math.max( Math.abs( range.y.min ), Math.abs( range.y.max ) ) : range.y.max;
			var y_min = range.y.min < 0 ? -y_max : range.y.min;
			var x1_scale 	= d3.scale.linear().domain( [ range.x.min, range.x.max ] ).range( [ 0, x0_scale.rangeBand() ] );
			var y_scale 	= d3.scale.linear().domain( [ y_min, y_max ] ).range( [ height, 0 ] );
			//
			// create graph container
			//			
			var graph = d3.select( '#' + element.id ).append( 'svg' )
				.attr( 'width', element.offsetWidth )
				.attr( 'height', element.offsetHeight )
				.append('g')
					.attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')' );
			//
			// create axis
			//
			var x_axis = d3.svg.axis()
				.scale(x0_scale)
				.orient("bottom");
			var y_axis = d3.svg.axis()
				.scale(y_scale)
				.orient("left")
				.tickSize(-width)
    			.tickFormat(config.axis.y.tickformat || d3.format(".2s"));
			graph.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0," + height + ")")
				.call(x_axis);

			graph.append("g")
				.attr("class", "y axis")
				.call(y_axis)
			//
			//
			//
			var group = graph.selectAll(".group")
				.data(data)
					.enter().append("g")
					.attr("class", "g")
					.attr("transform", function(d) { return "translate(" + x0_scale(d.name) + ",0)"; });
			group.selectAll("rect")
				.data(function(d) { return d.data; })
					.enter().append("rect")
						.attr("width", bar_width) 
						.attr("x", function(d) { 
							return x1_scale(d.x); 
						})
						.attr("y", function(d) { 
							if ( range.y.min < 0 ) {
								return d.y < 0 ? y_scale( 0.0 ) : y_scale( d.y );
							} 
							return y_scale(d.y); 
						})
						.attr("height", function(d) { 
							if ( range.y.min < 0 ) {
								return Math.abs(y_scale(d.y) - y_scale(0));
							}
							return height - y_scale(d.y); 
						})
						.style("fill", function(d) { 
							var factor = ( d.x - range.x.min ) / ( range.x.max - range.x.min );
							var s = Math.round( 255.0 * factor ).toString( 16 );
							return '#' + s + s + s; 
						});
			//
			// append title
			//
			if ( config.title ) {
				graph.append( 'text' )
					.attr("class", "title")
					.attr("text-anchor", "end")
					.attr("x", width )
					.text(config.title);
			}
			//
			// append axis lables
			//
			if ( config.axis.x.name ) {
				graph.append("text")
					.attr("class", "x label")
					.attr("text-anchor", "middle")
					.attr("x", width / 2.0)
					.attr("y", height + 28)
					.text(config.axis.x.name);
			}
			if ( config.axis.y.name ) {
				graph.append("text")
					.attr("class", "y label")
					.attr("text-anchor", "middle")
					.attr("transform", "translate( -34, " + ( height / 2 ) + ") rotate(-90)")
					.text(config.axis.y.name);		
			}	

		} catch( error ) {
			console.log( 'error : skyshares.chart.groupedbarchartd3 : ' + config.name + ' : ' + error );
		}
	},
	//
	//
	//
	path : function() {
		function Path() {
			this.svg = "";
		}
		Path.prototype.moveto = function( x, y ) {
			if ( this.svg.length > 0 ) this.svg += ',';
			this.svg += 'M' + Math.round( x ) + ',' + Math.round( y );
			return this;
		}
		Path.prototype.lineto = function( x, y ) {
			if ( this.svg.length > 0 ) this.svg += ',';
			this.svg += 'L' + Math.round( x ) + ',' + Math.round( y );
			return this;
		}
		Path.prototype.close = function() {
			if ( this.svg.length > 0 ) this.svg += ',';
			this.svg += 'Z';
			return this;
		}
		Path.prototype.curveto = function( x1, y1, x2, y2, x, y ) {
			if ( this.svg.length > 0 ) this.svg += ',';
			this.svg += 'C' + Math.round( x1 ) + ',' + Math.round( y1 ) + ',' + Math.round( x2 ) + ',' + Math.round( y2 ) + ',' + Math.round( x ) + ',' + Math.round( y );
			return this;
		}
		Path.prototype.smoothcurveto = function( x2, y2, x, y ) {
			if ( this.svg.length > 0 ) this.svg += ',';
			this.svg += 'S' + Math.round( x2 ) + ',' + Math.round( y2 ) + ',' + Math.round( x ) + ',' + Math.round( y );
			return this;
		}
		Path.prototype.quadraticbezierto = function( x1, y1, x, y ) {
			if ( this.svg.length > 0 ) this.svg += ',';
			this.svg += 'Q' + Math.round( x1 ) + ',' + Math.round( y1 ) + ',' + Math.round( x ) + ',' + Math.round( y );
			return this;
		}
		Path.prototype.smoothquadraticbezierto = function( x, y ) {
			if ( this.svg.length > 0 ) this.svg += ',';
			this.svg += 'T' + Math.round( x ) + ',' + Math.round( y );
			return this;
		}
		Path.prototype.clear = function() {
			this.svg = "";
		}
		Path.prototype.length = function() {
			return this.svg.length;
		}
		Path.prototype.getsvg = function() {
			return this.svg;
		}
		return new Path();
	},
	//
	//
	//
	linechart_D3 : function( config ) {
	
	}	
};

