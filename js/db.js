function initDatabase() {
	try {
	    if (!window.openDatabase) {
	        alert('Databases are not supported in this browser.');
	    } else {
	        var shortName = 'vigil_db';
	        var version = '1.0';
	        var displayName = 'Database for Vigil Mobile application';
	        var maxSize = 100000; //  bytes
	        DEMODB = openDatabase(shortName, version, displayName, maxSize);
			createTables();
			
	    }
	} catch(e) {
 
	    if (e == 2) {
	        // Version number mismatch.
	        console.log("Invalid database version.");
	    } else {
	        console.log("Unknown error "+e+".");
	    }
	    return;
	}
}

function createTables(){
	DEMODB.transaction(
        function (transaction) {
        	transaction.executeSql('CREATE TABLE IF NOT EXISTS user(id INTEGER NOT NULL PRIMARY KEY, user_name TEXT NOT NULL);', [], nullDataHandler, errorHandler);
        }
    );
	
	prePopulate();
}

function selectAll() {
	    	
			DEMODB.transaction(
			    function (transaction) {
			        transaction.executeSql("SELECT * FROM user;", [], dataSelectHandler, errorHandler);
			    }
			);			    
	    }
		
function dataSelectHandler( transaction, results ) {
			// Handle the results
			var i=0,
				row;
				
		    for (i ; i<results.rows.length; i++) {
		        
		    	row = results.rows.item(i);
		        
				console.log("User name ::" + row['user_name']);
		       
		        $('#user_n').html('<h4 id="your_name">Your Name is '+ row['user_name'] +'</h4>');
		        
		        
		
		    }		    
	    }

function nullDataHandler() {
		    console.log("SQL Query Succeeded");
	    }

function errorHandler( transaction, error ) {
			console.log("Error handling");
		 	if (error.code===1){
		 		// DB Table already exists
		 	} else {
		    	// Error is a human-readable string.
			    console.log('Oops.  Error was '+error.message+' (Code '+ error.code +')');
		 	}
		    return false;		    
	    }

function prePopulate() {
			DEMODB.transaction(
			    function (transaction) {
				//Starter data when page is initialized
				var data = ['1','Bhoopesh'];  
				
				transaction.executeSql("INSERT INTO user(id, user_name) VALUES (?, ?)", [data[0], data[1]]);
			    }
			);				
		}