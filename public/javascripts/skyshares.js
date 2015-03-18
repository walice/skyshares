skyshares = {
	map : null,
	countries : [],
	lookupcountry : function( partial ) {
		var candidates = [];
		countries.forEach( function( c ) {
			if ( c.name.indexOf( partial ) != -1 ) {
				candidates.push( c );
			}
		});
		return candidates;
	},
	init : function( mode ) {
		console.log( 'initialising mode: ' + mode );
		try {
			skyshares[ "init" + mode ]();
		} catch( error ) {
			console.log( "Unable to initialise SkyShares : " + error );
		}
	},
	initindex : function() {
		//
		// initialise local storage
		//
		localStorage.clear();
		//
		//
		//
		skyshares.ui.init();
		/*
		//
		// initialise data
		//
		skyshares.rest.get( 'data/group', {
				onloadend : function(e) {
					var request = e.target;
					var response = request.response === undefined ? request.responseText : request.response;
					var items = JSON.parse( response );
					if ( items ) {
						var group_container = document.getElementById( 'groups' );
						for ( var item in items ) {
							//
							//
							//
							if ( group_container ) {
								var name = items[ item ].name;
								var button = document.createElement( 'a' );
								button.className = 'button';
								button.innerHTML = items[ item ].name;
								button.skyshares = {
									name: name
								};
								button.onclick  = function( evt ) {
									skyshares.map.showgroup(evt.currentTarget.skyshares.name);
								};
								group_container.appendChild(button);
							}
							//
							// add item to local storage
							//
							localStorage.setItem( items[ item ].name, JSON.stringify( items[ item ] ) );
						}
					}
				
				}
			} );
		
		skyshares.rest.get( 'country', {
				onloadend : function(e) {
					var request = e.target;
					var response = request.response === undefined ? request.responseText : request.response;
					var items = JSON.parse( response );
					if ( items ) {
						//
						// store countries
						//
						skyshares.countries = items;
						var country_container = document.getElementById( 'countries' );
						if ( country_container ) {
							items.forEach( function( country ) {
									var button = document.createElement( 'a' );
									button.className = 'button';
									button.innerHTML = country.name;
									button.skyshares = {
										country: country
									};
									button.onclick  = function( evt ) {
										skyshares.map.showcountry(evt.currentTarget.skyshares.country.iso);
									};
									country_container.appendChild(button);
							});
						}
						//
						// add items to local storage
						//
					}
				
				}
			} );
		*/
	},
	showcountry : function( country_iso ) {
		/*
		var world = skyshares.map.firstChild;
		if ( world ) {
			world.fillColor = '#777777';
			if ( world.children[ country_iso ] ) {
				world.children[ country_iso ].fillColor = 'red';
			} else {
				alert( country_iso + ' not defined!' );
			}
			paper.view.draw();
		}
		*/
		
	},
	showgroup : function( group ) {
		var group_data = JSON.parse( localStorage.getItem( group ) );
		var world = skyshares.map.firstChild;
		if ( world ) {
			world.fillColor = 'black';
			group_data.members.forEach( function( country_iso ) {
				world.children[ country_iso ].fillColor = 'red';
			});
			paper.view.draw();
			/*
			var country = group.firstChild;
			while( country ) {
				var iso = country.name.substr( 1 );
				if ( group_data.members.indexOf( iso ) != -1 ) {
					country.fillColor = 'red';
				} else {
					country.fillColor = 'black';
				}
				country = country.nextSibling;
			}
			*/
		}
	},
	//
	// TODO: move this to skyshares.admin
	//
	initadmin : function() {
		//
		//
		//
		localStorage.clear();
		//
		// populate data lists 
		//
		var data_types = [ "constant", "group", "dataset", "function", "variable" ];
		for ( var data_type in data_types ) {
			skyshares.populateList( data_types[ data_type ] );
		}
		//
		// download countries
		//
		
	},
	//
	//
	//
	populateList : function( type ) {
		var container_name = type + "s";
		var container = document.getElementById( container_name );
		if ( container ) {
			skyshares.rest.get( "data/" + type, {
				onloadend : function(e) {
					var request = e.target;
					var response = request.response === undefined ? request.responseText : request.response;
					var items = JSON.parse( response );
					if ( items ) {
						function createlistitem( item ) {
							var listitem = document.createElement( "div" );
							listitem.className = "listitem";
							var editButton = document.createElement( "a" );
							editButton.className = "listleftbutton";
							editButton.onclick = function(e) {
								skyshares.editData( item );
							};
							editButton.innerHTML = item.name;
							listitem.appendChild( editButton );
							var deleteButton = document.createElement( "a" );
							deleteButton.className = "listrightbutton";
							deleteButton.onclick = function(e) {
								skyshares.deleteData( item );
							};
							deleteButton.innerHTML = "-";
							listitem.appendChild( deleteButton );
							return listitem;
						}
						container.innerHTML = "";
						for ( var item in items ) {
							container.appendChild( createlistitem( items[ item ] ) );
							//
							// add item to local storage
							//
							localStorage.setItem( items[ item ].name, JSON.stringify( items[ item ] ) );
						}
					}
				
				}
			} );
		}	
	}, 
	//
	//
	//
	addConstant : function() {
		window.location = '/editor/new/constant';
	},
	addVariable : function() {
		window.location = '/editor/new/variable';
	},
	addGroup : function() {
		window.location = '/editor/new/group';
	},
	addDataset : function() {
		window.location = '/editor/new/dataset';
	},
	addFunction : function() {
		window.location = '/editor/new/function';
	},
	//
	// delete
	//
	deleteData : function(item) {
		if ( confirm( 'Are you sure you want to remove ' + item.name + ' from the database' ) ) {
			skyshares.rest.delete( 'data/' + item._id, {
				onloadend : function(e) {
					var request = e.target;
					if ( request.status == 200 ) {
						alert( item.name + ' removed from database.' );
						window.location.reload();
					} else {
						alert( 'Failed to remove ' + item.name + ' from database : ' + request.status + ' : ' + request.statusText ); 
					}
				},
				onerror : function(e) {
					alert( 'Failed to remove ' + item.name + ' from database : ' + request.status + ' : ' + request.statusText ); 
				}
			});
		}
	},
	//
	//
	//
	editData : function(item) {
		//
		// show edit interface for type
		//
		window.location = '/editor/edit/' + item._id;
	},
	//
	//
	//
	chainedoperations : {
	
	},
	//
	//
	//
	utility : {
		//
		//
		//
		getcountrybyiso : function( countries, iso ) {
			for ( var i = 0; i < countries.length; i++ ) {
				if ( countries[ i ].iso === iso ) {
					return countries[ i ];
				}
			}
			return null;
		},
		//
		//
		//
		getgroupmembers : function( groups, name ) {
			for ( var i = 0; i < groups.length; i++ ) {
				if ( groups[ i ].name === name ) {
					return groups[ i ].members;
				}
			}
			return [];
		},
		//
		// returns an array of countries in all the groups contained in group_names
		//
		// countries 	: array of country entries, in the format returned by /country  
		// groups 		: array of groups, in the format returned by /data/group
		// group_names	: array of group names
		//
		intersectgroupsmembers : function( countries, groups, group_names ) { 
			var self = skyshares.utility;
			var candidates = [];
			for ( var i = 0; i < group_names.length; i++ ) {
				var members = self.getgroupmembers( groups, group_names[ i ] );
				
				if ( candidates.length > 0 ) {
					candidates = candidates.filter( function( candidate ) {
						return members.indexOf( candidate ) >= 0;
					} );
					if ( candidates.length == 0 ) { // no intersection
						break;
					}
				} else {
					candidates = members;
				}
			}
			var result = [];
			for ( var i = 0; i < candidates.length; i++ ) {
				var country = self.getcountrybyiso( candidates[ i ] );
				if ( country ) {
					result.push( country );
				}
			}
			return result;
		},
		formatcurrency : function(n, decPlaces, thouSeparator, decSeparator, currencySymbol) {
			// check the args and supply defaults:
			decPlaces = isNaN(decPlaces = Math.abs(decPlaces)) ? 2 : decPlaces;
			decSeparator = decSeparator == undefined ? "." : decSeparator;
			thouSeparator = thouSeparator == undefined ? "," : thouSeparator;
			currencySymbol = currencySymbol == undefined ? "$" : currencySymbol;

			var sign = n < 0 ? "-" : "";
			var i = parseInt(n = Math.abs(+n || 0).toFixed(decPlaces)) + "";
			var j = (j = i.length) > 3 ? j % 3 : 0;

			return sign + currencySymbol + (j ? i.substr(0, j) + thouSeparator : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thouSeparator) + (decPlaces ? decSeparator + Math.abs(n - i).toFixed(decPlaces).slice(2) : "");
		},
		formatpercent : function(n, decPlaces, thouSeparator, decSeparator, currencySymbol) {
			// check the args and supply defaults:
			decPlaces = isNaN(decPlaces = Math.abs(decPlaces)) ? 2 : decPlaces;
			decSeparator = decSeparator == undefined ? "." : decSeparator;
			thouSeparator = thouSeparator == undefined ? "," : thouSeparator;
			currencySymbol = currencySymbol == undefined ? "$" : currencySymbol;
			var sign = n < 0 ? "-" : "";
			var i = parseInt(n = Math.abs(+n || 0).toFixed(decPlaces)) + "";
			var j = (j = i.length) > 3 ? j % 3 : 0;

			return sign + (j ? i.substr(0, j) + thouSeparator : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thouSeparator) + (decPlaces ? decSeparator + Math.abs(n - i).toFixed(decPlaces).slice(2) : "") + '%';
		},
		numberWithCommas : function(x) {
    	var parts = x.toString().split(".");
    	parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    	return parts.join(".");
		},
		//
		// browser compatibility
		//
		browser_prefixes : ["webkit", "moz", "ms", "o", ""],
		addprefixedeventlistener : function(element, type, callback) {
			var self = skyshares.utility;
			for (var p = 0; p < self.browser_prefixes.length; p++) {
				if (!self.browser_prefixes[p]) type = type.toLowerCase();
				element.addEventListener(self.browser_prefixes[p]+type, callback, false);
			}
		},
		setprefixedproperty : function(element, property, value) {
			var self = skyshares.utility;
			for (var p = 0; p < self.browser_prefixes.length; p++) {
				if (!self.browser_prefixes[p]) property = property.toLowerCase();
				element[ self.browser_prefixes[p] + property ] = value;
			}
		},
		//
		// debug utilities
		//
		getstack : function() {
			var e = new Error('dummy');
			var stack = e.stack.replace(/^[^\(]+?[\n$]/gm, '')
				.replace(/^\s+at\s+/gm, '')
				.replace(/^Object.<anonymous>\s*\(/gm, '{anonymous}()@')
				.split('\n');
		  return stack;
		}
	},
	//
	// TODO: complete this and move it out to skyshares.dialogbox
	//
	dialogbox : {
		show : function( properties ) {
			function DialogBox(properties) {
				//
				//
				//
				var _this = this;
				//
				// create 
				//
				this.backdrop = document.createElement("div");
				this.backdrop.className = "backdrop";
				this.dialog = document.createElement("div");
				this.dialog.className = "dialog";
				
				if (properties.width && properties.width > 0) {
					this.dialog.style.width = properties.width + "px";
				}
				if (properties.height && properties.height > 0) {
					this.dialog.style.height = properties.width + "px";
				}
				this.header = document.createElement("div");
				this.header.className = "dialogheader";
				if ( properties.header ) {
					if ( typeof properties.header == 'string' ) {
						this.header.innerHTML = properties.header;
					} else {
						this.header.appendChild( properties.header );
					}
				}
				this.dialog.appendChild(this.header);
				//
				//
				//
				this.body = document.createElement("div"); 
				this.body.className = "dialogbody";
				if ( properties.body ) {
					if ( typeof properties.body == 'string' ) {
						this.body.innerHTML = properties.body;
					} else {
						this.body.appendChild( properties.body );
					}
				}
				this.dialog.appendChild(this.body);
				//
				//
				//
				this.footer = document.createElement("div"); 
				this.footer.className = "dialogfooter";
				this.dialog.appendChild(this.footer);
				//
				//
				//
				var close = document.createElement("div");
				close.className = "dialogclose";
				close.innerHTML = "close";
				close.onclick = function(e) {
					_this.close();
				};
				this.dialog.appendChild( close );
				//
				// attach dialog to backdrop
				//
				this.backdrop.appendChild(this.dialog);
			 }

			DialogBox.prototype.show = function (show) {
				if (show === undefined || show) {
					document.body.appendChild(this.backdrop);
				} else {
					this.backdrop.parentElement.removeChild(this.backdrop);
				}
			}

			DialogBox.prototype.close = function () {
				if (this.backdrop) {
					this.backdrop.parentElement.removeChild(this.backdrop);
					this.backdrop = null;
				}
			}
			var dialog = new DialogBox( properties );
			dialog.show();
		}
	}
	
};
