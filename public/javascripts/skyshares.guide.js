//
// SkyShares ui module
//
;
(function() {
	var self = skyshares.guide = skyshares.guide || {
		//
		//
		//
		template : 
			"<div class='skyshares-guide-close' onclick='skyshares.guide.close()'></div>" + 
			"<div class='skyshares-guide-prev' onclick='skyshares.guide.prevscene()'></div>" + 
			"<div class='skyshares-guide-next' onclick='skyshares.guide.nextscene()'></div>" + 
			"<div class='skyshares-guide-content'>%s</div>",
		//
		//
		//
		script : [
			{
				section: 'map-controls',
				content: '<h1>Welcome to SkyShares</h1>SkyShares allows you to visualise the financial flows and economic costs of a climate agreement.<h3>Can you create a climate deal which will get political agreement?</h3>'
			},
			{
				section: 'options',
				subsection: 'options',
				target: '#carbon-budget',
				content: '<b>Cap:&nbsp;</b>Set the temperature target and the likelihood for the world to stay below it.'
			},
			{
				section: 'options',
				subsection: 'options',
				target: '#allocation-rule',
				content: '<b>Allocate:&nbsp;</b>Decide how the carbon budget should be shared among countries in the world.'
			},
			{
				section: 'options',
				subsection: 'options',
				target: 'input#allocation-historical + label.skyshares',
				content: '<b>Equal Stocks:&nbsp;</b>In this scenario, the stock of past emissions since 1800 is taken into account and future allowances are adjusted accordingly.'
			},
			{
				section: 'options',
				subsection: 'options',
				target: 'input#allocation-percapita + label.skyshares',
				content: '<b>Per Capita:&nbsp;</b>Allowances are shared on an equal per capita basis.'
			},
			{
				section: 'options',
				subsection: 'options',
				target: 'input#allocation-money + label.skyshares',
				content: '<b>Per Dollar:&nbsp;</b>Use this scenario to visualise what the distribution of allowances would be if the richest countries were allowed to emit more than poor countries.'
			},
			{
				section: 'options',
				subsection: 'options',
				target: '#trading-scenario',
				content: '<b>Trade:&nbsp;</b>Enable trading so that decarbonisation happens where it is cheapest. You can also choose to regulate, and mandate how much of the abatement target should be met by decarnonising at home.'
			},
			{
				section: 'options',
				subsection: 'coalition',
				target: '#country-list',
				content: '<b>Coalition:&nbsp;</b>Choose how many countries or groups of countries should be part of the SkyShares coalition.'
			},
			{
				section: 'map-controls',
				target: 'input#flow-country + label.skyshares',
				content: '<b>Country Flow:&nbsp;</b>This button allows you to toggle financial flows on a country basis. The bigger the circle, the bigger the value of the financial flows. Red circles means a country spends money to buy allowances from the coalition. Black circles represent financial inflows, from money received for making sales of allowances. Financial outflows have a plus sign in front of them, but financial inflows have a minus sign to represent the money coming in.'
			},
			{
				section: 'map-controls',
				target: 'input#flow-regional + label.skyshares',
				content: '<b>Regional Flow:&nbsp;</b>This button allows you to see what financial flows would result on a regional basis for Africa, the Americas, Asia, Europe and Oceania. Bear in mind that this shows aggregate flows and so will average out the difference if a continent contains seller and buyer countries.'
			}
		],
		//
		//
		//
		backdrop : undefined,
		dialog : undefined,
		current_scene: 0, 		
		start : function() {
			//
			//
			//
			self.backdrop = document.createElement('div');
			self.backdrop.classList.add( 'skyshares-guide-backdrop' );
			self.dialog = document.createElement('div');
			self.dialog.classList.add( 'skyshares-guide-dialog' );
			self.backdrop.appendChild( self.dialog );
			document.body.appendChild( self.backdrop );
			//
			//
			//
			window.addEventListener( 'resize', self.aligndialog, false );
			//
			//
			//
			self.showscene(0);
		},
		close : function() {
			if ( self.backdrop ) {
				document.body.removeChild( self.backdrop );
				self.backdrop.removeChild( self.dialog );
				delete self.dialog;
				self.dialog = undefined;
				delete self.backdrop;
				self.backdrop = undefined;
			}
			window.removeEventListener( 'resize', self.aligndialog, false );
		},
		showscene : function( scene ) {
			self.current_scene = scene;
			if ( self.dialog ) {
				if ( self.script[ self.current_scene ].section ) {
					var button = document.querySelector(".menu-item[data-section='#" + self.script[ self.current_scene ].section + "']");
					if ( button ) button.click();
				}
				if ( self.script[ self.current_scene ].subsection ) {
					var button = document.querySelector(".menu-item[data-subsection='#" + self.script[ self.current_scene ].subsection + "']");
					if ( button ) button.click();
				}
				self.dialog.innerHTML = sprintf( self.template, self.script[ self.current_scene ].content );
				
				setTimeout( function() {
					self.aligndialog();
					//
					//
					//
					self.dialog.querySelector('.skyshares-guide-prev').style.visibility = self.current_scene > 0 ? 'visible' : 'hidden';
					self.dialog.querySelector('.skyshares-guide-next').style.visibility = self.current_scene < self.script.length - 1 ? 'visible' : 'hidden';
				},10);
			}
		},
		nextscene : function() {
			if ( self.current_scene < self.script.length - 1 ) {
				self.showscene(self.current_scene+1);
			}
		},
		prevscene : function() {
			if ( self.current_scene > 0 ) {
				self.showscene(self.current_scene-1);
			}
		},
		aligndialog : function() {
			function removestyles() {
				[
					'topleft',
					'topright',
					'bottomleft',
					'bottomright',
					'lefttop',
					'leftbottom',
					'righttop', 
					'rightbottom' ].forEach( function( style ) {
						self.dialog.classList.remove(style);
					} );
			
			}
			if ( self.dialog ) {
				var window_dim = {
					width: window.innerWidth,
					height: window.innerHeight
				};
				var dialog_dim = {
					width: self.dialog.offsetWidth,
					height: self.dialog.offsetHeight
				};
				var target = self.script[ self.current_scene ].target ? document.querySelector(self.script[ self.current_scene ].target) : undefined;
				if ( target ) {
					var rect = target.getBoundingClientRect(); // TODO: should use this but scrolling div should be acomodated
					var target_bounds = { 
						x: target.offsetLeft,
						y: target.offsetTop + 128,
						width: target.offsetWidth,
						height: target.offsetHeight
					};
					//
					//
					//
					var offset = 9;
					var alignments = [
						{
							name : 'topleft',	// align with left above target
							x : target_bounds.x,
							y : target_bounds.y - ( dialog_dim.height + offset )
						},
						{
							name : 'topright',	// align with right above target 
							x : ( target_bounds.x + target_bounds.width ) - dialog_dim.width,
							y : target_bounds.y - ( dialog_dim.height + offset )
						},
						{
							name : 'bottomleft', // align with left below target
							x : target_bounds.x,
							y : target_bounds.y + target_bounds.height + offset
						},
						{
							name : 'bottomright', // align with right below target
							x : ( target_bounds.x + target_bounds.width ) - dialog_dim.width,
							y : target_bounds.y + target_bounds.height + offset
						},
						{
							name : 'lefttop', // align with top on lefthand side of target
							x : target_bounds.x - ( dialog_dim.width + offset ),
							y : target_bounds.y
						},
						{
							name : 'leftbottom', // align with bottom on lefthand side of target
							x : target_bounds.x - ( dialog_dim.width + offset ),
							y : target_bounds.y - dialog_dim.height
						},
						{
							name : 'righttop', // align with top on righthand side of target
							x : target_bounds.x + target_bounds.width + offset,
							y : target_bounds.y
						},
						{
							name : 'rightbottom', // align with bottom on righthand side of target
							x : target_bounds.x + target_bounds.width + offset,
							y : target_bounds.y - dialog_dim.height
						}
					];
					var alignment = -1;
					var candidate = -1;
					var min_offset = {
						x: Number.MAX_VALUE,
						y: Number.MAX_VALUE
					};
					var min_distance = Number.MAX_VALUE;
					for ( var i = 0; i < alignments.length; i++ ) {
						if ( 
							alignments[ i ].x >= 0 && 
							alignments[ i ].x + dialog_dim.width <= window_dim.width &&
							alignments[ i ].y >= 0 && 
							alignments[ i ].y + dialog_dim.height <= window_dim.height
							) {
							alignment = i;
							break;
						} else {
							var offset = {
								x: alignments[ i ].x >= 0 ? Math.abs( alignments[ i ].x ) : -( ( alignments[ i ].x + dialog_dim.width ) - window_dim.width ), 
								y: alignments[ i ].y >= 0 ? Math.abs( alignments[ i ].y ) : -( ( alignments[ i ].y + dialog_dim.height ) - window_dim.height ) 
							};
							var distance = Math.sqrt( offset.x * offset.x + offset.y * offset.y );
							if ( Math.sqrt( offset.x * offset.x + offset.y * offset.y ) < min_distance ) {
								min_offset = offset;
								min_distance = distance;
								candidate = i;
							}
						}
					}
					if ( alignment < 0 ) {
						alignment = candidate;
						alignments[ alignment ].x += min_offset.x;
						alignments[ alignment ].y += min_offset.y;
					}
					//
					//
					//
					removestyles();
					self.dialog.classList.add(alignments[ alignment ].name);
					self.dialog.style.left = alignments[ alignment ].x + 'px';
					self.dialog.style.top = alignments[ alignment ].y + 'px';
				} else {
					removestyles();
					self.dialog.style.left 	= Math.round( ( window_dim.width - dialog_dim.width ) / 2. ) + 'px';
					self.dialog.style.top 	= Math.round( ( window_dim.height - dialog_dim.height ) / 2. ) + 'px';
				}
			}
		}
	}
	skyshares.guide.start();
})();