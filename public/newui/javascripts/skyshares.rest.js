//
// SkyShares rest interface
//
;
(function() {
	skyshares.rest = skyshares.rest || {
		createrequest : function (method, url, param, delegate) {
			var _this = this;
			//
			// create request object
			//
			var xhr = new XMLHttpRequest();
			//
			// 
			//
			xhr.rest = {
				delegate: (delegate != undefined) ? delegate : null,
				progress: 0,
				status: 0,
				statustext: ""
			};
			if ( delegate ) {
				//
				// hook events
				//
				if ( delegate.onloadend !== undefined ) {
					if (xhr.onloadend) {
						if ( delegate.onload !== undefined ) {
							xhr.addEventListener('load', function (e) {
								delegate.onload(e);
							}, false);
						}
						xhr.addEventListener('loadend', function (e) {
							delegate.onloadend(e);
						}, false);
					} else {
						xhr.addEventListener('load', function (e) {
							delegate.onloadend(e);
						}, false);
					}
				}

				if ( delegate.onloadstart !== undefined ) {
					xhr.addEventListener('loadstart', function (e) {
						delegate.onloadstart(e);
					}, false);
				}
			
				if ( delegate.onprogress !== undefined ) {
					xhr.addEventListener('progress', function (e) {
						delegate.onprogress(e);
					}, false);
				}
			
				if ( delegate.onabort !== undefined ) {
					xhr.addEventListener('abort', function (e) {
						delegate.onabort(e);
					}, false);
				}
			
				if ( delegate.ontimeout !== undefined ) {
					xhr.addEventListener('timeout', function (e) {
						delegate.ontimeout(e);
					}, false);
				}
			
				if ( delegate.onerror !== undefined ) {
					xhr.addEventListener('error', function (e) {
						delegate.onerror(e);
					}, false);
				}
			}
			//
			// build query string
			//
			var query = "";
			for (var key in param) {
				if (query.length == 0) {
					query += '?';
				} else {
					query += '&';
				}
				query += key + '=' + escape(param[key]);
			}
			//
			// open request
			//
			xhr.open(method, url + query, true);
			//
			//
			//
			return xhr;
		},
		//
		// 
		//
		get : function( url, delegate ) {
			//
			// create request
			//
			var request = skyshares.rest.createrequest("GET", url, {}, delegate);
			//
			// send
			// 
			request.send();
		},
		post : function( url, data, delegate ) {
			//
			// create request
			//
			var request = skyshares.rest.createrequest("POST", url, {}, delegate);
			request.setRequestHeader('Content-Type', 'application/json');
			//
			// send data
			// 
			request.send(JSON.stringify(data));
		},
		put : function( url, data, delegate ) {
			//
			// create request
			//
			var request = skyshares.rest.createrequest("PUT", url, {}, delegate);
			request.setRequestHeader('Content-Type', 'application/json');
			//
			// send data
			// 
			request.send(JSON.stringify(data));	
		},
		delete : function( url, delegate ) {
			//
			// create request
			//
			var request = skyshares.rest.createrequest("DELETE", url, {}, delegate);
			//
			// send
			// 
			request.send();
		},
		//
		//
		//
		iserror : function( evt ) {
			return evt.target.status >= 400;
		},
		getresponse : function( evt ) {
			var request = evt.target;
			return response = request.response === undefined ? request.responseText : request.response;
		},
		parseresponse : function( evt ) {
			var self = skyshares.rest;
			var response = self.getresponse( evt );
			try {
				var json = JSON.parse( response );
				return json;
			} catch( err ) {
				return undefined;
			}
		},
		formaterror : function( evt ) {
			var self = skyshares.rest;
			var request = evt.target;
			var code = request.status;
			var text = request.statusText;
			var description = self.parseresponse( evt );
			return code + ' : ' + text +  ( description && description.message ? ' : ' + description.message : '' );
		} 
	};
})();
