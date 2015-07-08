//
// TODO: move this to skyshares.admin
//
;
skyshares.admin = {
	init : function() {
		//
		//
		//
		localStorage.clear();
		//
		// populate data lists 
		//
		[ 'constant', 'group', 'dataset', 'function', 'variable' ].forEach( function(data_type) {
			skyshares.admin.populateList( data_type );
		});
		//
		// MAC data
		//
		skyshares.admin.populateMacList();
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
						items.sort( function( a, b ) {
							return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
						} );
						function createlistitem( item ) {
							var listitem = document.createElement( "div" );
							listitem.className = "listitem";
							var editButton = document.createElement( "a" );
							editButton.className = "listleftbutton";
							editButton.onclick = function(e) {
								skyshares.admin.edit( item );
							};
							editButton.innerHTML = item.name;
							listitem.appendChild( editButton );
							var deleteButton = document.createElement( "a" );
							deleteButton.className = "listrightbutton";
							deleteButton.onclick = function(e) {
								skyshares.admin.deleteData( item );
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
	populateMacList : function() {
		var container = document.getElementById( 'mac' );
		if ( container ) {
			skyshares.rest.get( "macnames", {
				onloadend : function(e) {
					var request = e.target;
					var response = request.response === undefined ? request.responseText : request.response;
					var items = JSON.parse( response );
					if ( items ) {
						items.sort( function( a, b ) {
							return a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
						} );
						function createlistitem( item ) {
							var listitem = document.createElement( "div" );
							listitem.className = "listitem";
							var editButton = document.createElement( "a" );
							editButton.className = "listleftbutton";
							editButton.innerHTML = item.name;
							listitem.appendChild( editButton );
							var deleteButton = document.createElement( "a" );
							deleteButton.className = "listrightbutton";
							deleteButton.onclick = function(e) {
								skyshares.admin.deleteMac( item );
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
	// new
	//
	add : function(type) {
		var win = window.open('/editor/new/' + type, 'skyshares.share', 'width=640,height=480,modal=yes');
		if ( win ) {
			win.addEventListener("beforeunload", function(e){
			   skyshares.admin.populateList( type );
			}, false);	
		}
	},
	//
	// edit
	//
	edit : function(item) {
		var win = window.open('/editor/edit/' + item._id, 'skyshares.share', 'width=640,height=480,modal=yes');
		if ( win ) {
			win.addEventListener("beforeunload", function(e){
			   skyshares.admin.populateList( item.type );
			}, false);	
		}
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
						//alert( item.name + ' removed from database.' );
						//window.location.reload();
						skyshares.admin.populateList( item.type );
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
	deleteMac : function(item) {
		if ( confirm( 'Are you sure you want to remove ' + item.name + ' from the database' ) ) {
			skyshares.rest.delete( 'mac/' + item.name, {
				onloadend : function(e) {
					var request = e.target;
					if ( request.status == 200 ) {
						//alert( item.name + ' removed from database.' );
						//window.location.reload();
						skyshares.admin.populateMacList();
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
}
