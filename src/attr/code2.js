

function HelpCenter() {
	//the database to hold the data
	var db = [];
	//initialize this instance of HelpCenter
	function init() {
		axshCall( "help", function ( out, err ) {
			setStatus( "Loading attributes", true );
			axshCall( "help", function ( out, err ) {
				setStatus();
				if ( err ) {
					axellPopUp( "Could not use the HELP command to get the list of attributes: " + err );
					return;
				} else {
					//empty all array elements
					db.length = 0;
					//parse each line of help to get a list of attributes
					var lines = split2( out, "\n" );
					for ( var i = 0; i < lines.length; i++ ) {
						var e = lines[i].match( /(\S+)\s+(\S+)\s+(.*)/ );
						if ( !e ) {
							console.error( "Could not parse line: " + quote( lines[i] ) );
							continue;
						}
						//attribute name
						var att = e[1];
						//permissions (rwx)
						var perm = e[2];
						//description
						var desc = e[3];
						//add the operations
						if( e[2].indexOf( "r" ) != -1 ) {
							
						}
						if( e[2].indexOf( "w" ) != -1 ) {
							
						}
						if( e[2].indexOf( "x" ) != -1 ) {
							
						}
					}
				}
			});	
		});
	}
	function saveToCache() {
	}
	function loadFromCache() {
	}
	function deleteCache() {
	}
	function isInitialized () {
		return db.length > 0;
	}
}