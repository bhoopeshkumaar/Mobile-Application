var userCity = '';

function showMap(){
	console.log('Showing map');
	var defaultLatLng = new google.maps.LatLng(34.0983425, -118.3267434);  // Default to Hollywood, CA when no geolocation support
    if ( navigator.geolocation ) {
        function success(pos) {
            // Location found, show map with these coordinates
            drawMap(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
        }
        function fail(error) {
            drawMap(defaultLatLng);  // Failed to find location, show default map
        }
        // Find the users current position.  Cache the location for 5 minutes, timeout after 6 seconds
        navigator.geolocation.getCurrentPosition(success, fail, {enableHighAccuracy:true, timeout: 6000});
    } else {
        drawMap(defaultLatLng);  // No geolocation support, show default map
    }
    function drawMap(latlng) {
		console.log('Lat Long:' + latlng);
        var myOptions = {
            zoom: 10,
            center: latlng,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        var map = new google.maps.Map(document.getElementById("map-canvas"), myOptions);
        // Add an overlay to the map of current lat/lng
        var marker = new google.maps.Marker({
            position: latlng,
            map: map,
            title: "Greetings!",
			animation:google.maps.Animation.BOUNCE
        });
		/*var infowindow = new google.maps.InfoWindow({
		  content:"You are here!"
		});

		infowindow.open(map,marker);*/
	}
}

function initDatabase() {
	console.log("into init database");
	
	try {
		if (!window.openDatabase) {
			alert('Databases are not supported in this browser.');
		} else {
			var shortName = 'vigil_app_db';
			var version = '1.0';
			var displayName = 'Database for Vigil Mobile application';
			var maxSize = 100000; //  bytes
			DEMODB = openDatabase(shortName, version, displayName, maxSize);
			dropTables();
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

function dropTables() {
			
			DEMODB.transaction(
			    function (transaction) {
			    	transaction.executeSql("DROP TABLE user;", [], nullDataHandler, errorHandler);
					transaction.executeSql("DROP TABLE news;", [], nullDataHandler, errorHandler);
			    }
			);
			console.log("Tables has been dropped.");
			//location.reload();			
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
		
function createTables(){
	DEMODB.transaction(
        function (transaction) {
        	transaction.executeSql('CREATE TABLE IF NOT EXISTS user(id INTEGER NOT NULL PRIMARY KEY, user_name TEXT NOT NULL);', [], nullDataHandler, errorHandler);
			transaction.executeSql('CREATE TABLE IF NOT EXISTS news(news_id INTEGER NOT NULL PRIMARY KEY, city INTEGER NOT NULL, emergencyType TEXT NOT NULL, description TEXT NOT NULL );', [], nullDataHandler, errorHandler);
        }
    );
	
	populate();
}

function getUserLocation(){

	if(!navigator.geolocation) return;
	
	
	navigator.geolocation.getCurrentPosition(function(pos) {
	geocoder = new google.maps.Geocoder();
	var latlng = new google.maps.LatLng(pos.coords.latitude,pos.coords.longitude);
	geocoder.geocode({'latLng': latlng}, function(results, status) {
	if (status == google.maps.GeocoderStatus.OK) {
				var result = results[0];
				console.log('Results: ' + result);
				//look for locality tag and administrative_area_level_1, country
				var city = "";
				var state = ""; //TODO try adding country 
				var country = "";
				for(var i=0, len=result.address_components.length; i<len; i++) {
					var ac = result.address_components[i];
					if(ac.types.indexOf("locality") >= 0) city = ac.long_name;
					if(ac.types.indexOf("administrative_area_level_1") >= 0) state = ac.long_name;
					if(ac.types.indexOf("country") >= 0) country = ac.long_name;
				}
				
				userCity = city;
				//only report if we got Good Stuff
				if(city != '' && state != '' && country != '') {
					$("#currentLocation").html("<h4>Your location is "+city+", "+state+ ", " + country + "!</h4>");
				}
		} 
	});

	});
}

function populate() {
			
			console.log("Pre populate");
			
			DEMODB.transaction(
			    function (transaction) {
				//Starter data when page is initialized
				var data = ['1','Bhoopesh'];  
				
				transaction.executeSql("INSERT INTO user(id, user_name) VALUES (?, ?)", [data[0], data[1]], errorHandler);
			    }
			);

			populateNews();
		}
		
function populateNews(){
	DEMODB.transaction(
			    function (transaction) {
				
				var data = [
							['1','Hyattsville', 'Theft', 'Some text some text Some text some text Some text some text Some text some text Some text some text'],
							['2','Hyattsville', 'Fire', 'Some text some text Some text some text Some text some text Some text some text Some text some text'],
							['3','Hyattsville', 'Medical', 'Some text some text Some text some text Some text some text Some text some text Some text some text'],
							['4','Hyattsville', 'Fire', 'Some text some text Some text some text Some text some text Some text some text Some text some text'],
							['5','Dallas', 'Theft', 'Some text some text Some text some text Some text some text Some text some text Some text some text'],
							['6','Dallas', 'Fire', 'Some text some text Some text some text Some text some text Some text some text Some text some text'],
							['7','Dallas', 'Medical', 'Some text some text Some text some text Some text some text Some text some text Some text some text'],
							['8','Dallas', 'Fire', 'Some text some text Some text some text Some text some text Some text some text Some text some text'],
							['9','Chennai', 'Theft', 'Some text some text Some text some text Some text some text Some text some text Some text some text'],
							['10','Frederick', 'Fire', 'Some text some text Some text some text Some text some text Some text some text Some text some text'],
							['11','Frederick', 'Medical', 'Some text some text Some text some text Some text some text Some text some text Some text some text'],
							['12','Frederick', 'Fire', 'Some text some text Some text some text Some text some text Some text some text Some text some text'],
							];  
				
					for(var i= 0 ; i < 12; i++){
							transaction.executeSql("INSERT INTO news(news_id, city, emergencyType, description) VALUES (?, ?, ?, ?)", [data[i][0], data[i][1], data[i][2], data[i][3],], errorHandler);
						}
				}
			);
}
		
		
function selectUser() {
	    	
			DEMODB.transaction(
			    function (transaction) {
			        transaction.executeSql("SELECT * FROM user;", [], dataUserSelectHandler, errorHandler);
			    }
			);			    
	    }
		
function selectNews(){
	
	console.log("User city : " + userCity);
	
	DEMODB.transaction(
			    function (transaction) {
			        transaction.executeSql("SELECT * FROM news where city = ?;", [userCity], dataNewsSelectHandler, errorHandler);
			    }
			);
	
}
		
function dataUserSelectHandler( transaction, results ) {
			// Handle the results
			var i=0,
				row;
				
		    for (i ; i<results.rows.length; i++) {
		        
		    	row = results.rows.item(i);
		        
				console.log("User name ::" + row['user_name']);
				
				userName = row['user_name'];
				
		        $('#user_n').html('<h4 id="your_name">Your Name is '+ row['user_name'] +'</h4>');
		        
		    }		    
	    }
		
function dataNewsSelectHandler( transaction, results ) {
			// Handle the results
			var i=0,
				row;
			
			console.log('Num of rows: ' + results.rows.length);			
		    for (i ; i<results.rows.length; i++) {
			
		    	row = results.rows.item(i);
		        console.log("Emer Type ::" + row['city']);
				console.log("Emer Type ::" + row['emergencyType']);
				console.log("Description ::" + row['description']);
				
				
				
		       // $('#user_n').html('<h4 id="your_name">Your Name is '+ row['user_name'] +'</h4>');
		        
		    }		    
}		