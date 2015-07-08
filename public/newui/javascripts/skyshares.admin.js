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
		var data_types = [ "constant", "group", "dataset", "function" ];
		for ( var data_type in data_types ) {
			skyshares.admin.populateList( data_types[ data_type ] );
		}
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
								skyshares.admin.editData( item );
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
	}
}
