//
//
//
;
skyshares.filereader = {
	//
	//
	//
	readfile : function( fileInput, fileTypes, delegate, readas ) {
		var self = skyshares.filereader;
		if ( readas === undefined || readas === 'text' ) {
			self.readtextfile( fileInput, fileTypes, delegate );
		} else if ( readas == 'binary' ) {
			self.readbinaryfile( fileInput, fileTypes, delegate );
		} else if ( readas == 'dataurl' ) {
			self.readdataurl( fileInput, fileTypes, delegate );
		} else {
			self.throwerror( delegate, -1, 'Invalid read type \'' + readas + '\'!' );
		}	
	},
	readtextfile : function( fileInput, fileTypes, delegate ) {
		var self = skyshares.filereader;
		var reader = self.readfilecommon( fileInput, fileTypes, delegate );
		if ( reader ) {
			//
			// read files
			//
			for ( var i = 0; i < fileInput.files.length; i++ ) {
				var file = fileInput.files[i];
				if (file.type.match(reader.types)) {
					reader.reader.readAsText(file);	
				} else {
					//
					// trigger error event
					//
					self.throwerror( delegate, FileError.TYPE_MISMATCH_ERR, 'Invalid filetype!' );
				}
			}
		}
	},
	readbinaryfile : function( fileInput, fileTypes, delegate ) {
		var self = skyshares.filereader;
		var reader = self.readfilecommon( fileInput, fileTypes, delegate );
		if ( reader ) {
			//
			// read files
			//
			for ( var i = 0; i < fileInput.files.length; i++ ) {
				var file = fileInput.files[i];
				if ( reader.validfile( file ) ) {
					reader.readAsArrayBuffer(file);	
				} else {
					//
					// trigger error event
					//
					self.throwerror( delegate, FileError.TYPE_MISMATCH_ERR, 'Invalid filetype!' );
				}
			}
		}
	},
	readdataurl : function( fileInput, fileTypes, delegate ) {
		var self = skyshares.filereader;
		var reader = self.readfilecommon( fileInput, fileTypes, delegate );
		if ( reader ) {
			//
			// read files
			//
			for ( var i = 0; i < fileInput.files.length; i++ ) {
				var file = fileInput.files[i];
				if ( reader.validfile( file ) ) {
					reader.readAsDataURL(file);	
				} else {
					//
					// trigger error event
					//
					self.throwerror( delegate, FileError.TYPE_MISMATCH_ERR, 'Invalid filetype!' );
				}
			}
		}
	}, 
	readfilecommon : function( fileInput, fileTypes, delegate ) {
		var self = skyshares.filereader;
		if ( fileInput ) {
			//
			// build regex for filetype
			//
			var regEx = '';
			for ( var i = 0; i < fileTypes.length; i++ ) {
				regEx += fileTypes[ i ];
				if ( i < fileTypes.length - 1 ) {
					regEx += '|';
				}
			}
			var types = new RegExp(regEx);
			//
			// initialise file reader
			//
			var reader = new FileReader();
			//
			// attach event handlers
			//
			var attachhandler = function( handler, callback ) {
				//
				// strip 'on' prefix
				//
				var i = handler.indexOf( 'on' );
				if ( i == 0 ) {
					handler = handler.substr( 2 ); 
				}
				reader.addEventListener( handler, callback );
			}
			for ( var handler in delegate ) {
				var callback = delegate[ handler ];
				attachhandler( handler, callback );
			}
			//
			// reader wrapper
			//
			function Reader( reader, types ) {
				this.reader = reader;
				this.types = types;
			}
			Reader.prototype.validfile = function( file ) {
				return file.type.match(this.types);
			}
			Reader.prototype.readAsText = function( file ) {
				this.reader.readAsText( file );
			}
			Reader.prototype.readAsArrayBuffer = function( file ) {
				this.reader.readAsArrayBuffer( file );
			}
			Reader.prototype.readAsDataURL = function( file ) {
				this.reader.readAsDataURL( file );
			}
			
			return new Reader( reader, types );
		}
		//
		// trigger error event
		//
		self.throwerror( delegate, -1, 'Invalid or missing file input element!' );
	},
	throwerror : function( delegate, error_code, message ) {
		if ( delegate.onerror ) {
			delegate.onerror( {
				target: {
					error: {
						code: error_code,
						message: message
					}
				}
			});
		}
	},
	//
	//
	//
	errordescription : function( error ) {
		var message = 'Unknown error';
		if (error != null) {
			if ( error.message ) {
				message = error.message;
			} else {
				switch (error.code) {
					case FileError.ENCODING_ERR:
						message = 'Encoding error!';
						break;
					case FileError.NOT_FOUND_ERR:
						message = 'File not found!';
						break;
					case FileError.NOT_READABLE_ERR:
						message = 'File could not be read!';
						break;
					case FileError.SECURITY_ERR:
						message = 'Security issue with file!';
						break;
					case FileError.TYPE_MISMATCH_ERR:
						message = 'Invalid file type!';
						break;
					default:
						message = 'Unknown error';
				}
				message += ' : ' + error.code;
			}
		}
		return message;
	}
}

