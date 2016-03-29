var userCity ='';
var emergencyType = '';
var description = '';
var eventLat = '';
var eventLong = '';

var cityMap = [];
var emergencyMap = [];
var pieChart;
var subBarChart;
var barChart;



function showMap(){
	console.log('Showing map');
	var divId = "map-canvas";
	var defaultLatLng = new google.maps.LatLng(34.0983425, -118.3267434);  // Default to Hollywood, CA when no geolocation support
    if ( navigator.geolocation ) {
        function success(pos) {
            // Location found, show map with these coordinates
			eventLat = pos.coords.latitude;
			eventLong = pos.coords.longitude;
            drawMap(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude), divId);
        }
        function fail(error) {
            drawMap(defaultLatLng, divId);  // Failed to find location, show default map
        }
        // Find the users current position.  Cache the location for 5 minutes, timeout after 6 seconds
        navigator.geolocation.getCurrentPosition(success, fail, {enableHighAccuracy:true, timeout: 6000});
    } else {
        drawMap(defaultLatLng, divId);  // No geolocation support, show default map
    }
    
}

function drawMap(latlng, divId) {
		console.log('Lat Long:' + latlng);
        var myOptions = {
            zoom: 10,
            center: latlng,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        var map = new google.maps.Map(document.getElementById(divId), myOptions);
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
		
		//google.maps.event.trigger(map, 'resize');
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
			
			if(error.code == null || error.code == 'undefined'){
				return;
			}
			
		 	if (error.code===1){
		 		// DB Table already exists
		 	} 
			else {
		    	// Error is a human-readable string.
			    console.log('Oops.  Error was '+error.message+' (Code '+ error.code +')');
		 	}
		    return false;		    
	    }
		
function createTables(){
	DEMODB.transaction(
        function (transaction) {
        	transaction.executeSql('CREATE TABLE IF NOT EXISTS user(id INTEGER NOT NULL PRIMARY KEY, user_name TEXT NOT NULL);', [], nullDataHandler, errorHandler);
			transaction.executeSql('CREATE TABLE IF NOT EXISTS news(news_id INTEGER NOT NULL PRIMARY KEY, city INTEGER NOT NULL, emergencyType TEXT NOT NULL, description TEXT NOT NULL, latitude TEXT, longitude TEXT, insertTime DATETIME);', [], nullDataHandler, errorHandler);
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
				var street = "";
				var address = result.formatted_address;
				console.log("Address : " + address);
				
				
				
				for(var i=0, len=result.address_components.length; i<len; i++) {
					var ac = result.address_components[i];
					if(ac.types.indexOf("locality") >= 0) city = ac.long_name;
					if(ac.types.indexOf("administrative_area_level_1") >= 0) state = ac.long_name;
					if(ac.types.indexOf("country") >= 0) country = ac.long_name;
					
					if(ac.types.indexOf("street_address") >= 0) street = ac.long_name;
				}
									
				console.log("Setting user location...");
				userCity = city;
				console.log("Inside get User location: User loc is " + userCity);
				//only report if we got Good Stuff
				
				if(address == null && address == ''){
					if(street!= '' && city != '' && state != '' && country != '') {
						$("#currentLocation").html("<h4>Your location is "+ street + ", "+city+", "+state+ ", " + country + "!</h4>");
					}
					else if(city != '' && state != '' && country != '') {
						$("#currentLocation").html("<h4>Your location is "+city+", "+state+ ", " + country + "!</h4>");
					}			
				}
				else{
					$("#currentLocation").html("<h4>Your location is " + address + "!</h4>");
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
							['1','Hyattsville', 'Theft', 'Some text some text Some text some text Some text some text Some text some text Some text some text', '38.9528572', '-76.95194594'],
							['2','Hyattsville', 'Fire', 'Some text some text Some text some text Some text some text Some text some text Some text some text', '38.953241', '-76.94656007'],
							['3','Hyattsville', 'Medical', 'Some text some text Some text some text Some text some text Some text some text Some text some text' , '38.95831359', '-76.94364182'],
							['4','Hyattsville', 'Fire', 'Some text some text Some text some text Some text some text Some text some text Some text some text' , '38.9606829', '-76.95467107'],
							['5','Dallas', 'Theft', 'Some text some text Some text some text Some text some text Some text some text Some text some text' , '32.78052496', '-96.79033602'],
							['6','Dallas', 'Fire', 'Some text some text Some text some text Some text some text Some text some text Some text some text' , '32.78290628', '-96.80136527'],
							['7','Dallas', 'Medical', 'Some text some text Some text some text Some text some text Some text some text Some text some text' , '32.78586481', '-96.78739632'],
							['8','Dallas', 'Fire', 'Some text some text Some text some text Some text some text Some text some text Some text some text' , '32.78713021', '-96.80155635'],
							['9','Chennai', 'Theft', 'Some text some text Some text some text Some text some text Some text some text Some text some text',  '13.0828056', '80.27498848'],
							['10','Frederick', 'Fire', 'Some text some text Some text some text Some text some text Some text some text Some text some text',  '39.41292138', '-77.40676045'],
							['11','Frederick', 'Medical', 'Some text some text Some text some text Some text some text Some text some text Some text some text',  '39.41806037', '-77.40637422'],
							['12','Frederick', 'Fire', 'Some text some text Some text some text Some text some text Some text some text Some text some text', '39.4218895', '-77.42781043'],
							];  
				
					for(var i= 0 ; i < 12; i++){
							transaction.executeSql("INSERT INTO news(news_id, city, emergencyType, description,  latitude, longitude, insertTime) VALUES (?, ?, ?, ?, ?, ?, ?)", [data[i][0], data[i][1], data[i][2], data[i][3], data[i][4], data[i][5], new Date() ], errorHandler);
						}
				}
			);
}

function insertNews(){

var dateTime = new Date();

console.log("Date time : " + dateTime);

DEMODB.transaction(
				
			    function (transaction) {
				console.log('Lattt: ' + eventLat + 'Longi: ' + eventLong);
							if(eventLat == '' && eventLong == ''){
								transaction.executeSql("INSERT INTO news(city, emergencyType, description, insertTime) VALUES (?, ?, ?, ?)", [userCity, emergencyType, description, dateTime], errorHandler);
							}
							else{
								transaction.executeSql("INSERT INTO news(city, emergencyType, description, latitude, longitude, insertTime) VALUES (?, ?, ?, ?, ?, ?)", [userCity, emergencyType, description, eventLat, eventLong, dateTime], errorHandler);
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

	
	DEMODB.transaction(
			    function (transaction) {
			        transaction.executeSql("SELECT * FROM news where city = ? order by news_id desc;", [userCity], dataNewsSelectHandler, errorHandler);
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

			console.log("Inside dataNewsSelectHandler. city name:  " + userCity);
			// Handle the results
			var i=0,
				row;
			var newsContent = '';
			console.log('Num of rows: ' + results.rows.length);	
			
			$("#set").empty();
			
			if(results.rows.length == 0){
				newsContent = $("#set").append("<h4>No new emergencies reported at " + userCity + ". You can be safe.</h4>");
			}
			else{
				for (i ; i<results.rows.length; i++) {
					row = results.rows.item(i);
					console.log('Div id : '  + row['city']+row['news_id'] );
					
					var divId = row['city']+row['news_id'];
					var mapDivId = 'map'+row['news_id'];
					var time  = row['insertTime'];
					if(time != null && time != ''){
						time = time.split("GMT")[0].trim();
					}
					console.log("Time::: " + time);
					var subDesc = row['description'].substring(0,10)+ ' .....';
					
					var imageFile =  row['emergencyType'].toLowerCase() + '.png';
					
					
					newsContent = "<div id='" + divId + "' data-role='collapsible' data-collapsed='true' data-iconpos='right'><h4><img src='images/"+imageFile+"' alt='icon' width='20' height='20'/>" + '  '+ subDesc + " <img src='images/new.gif' alt='new'/></h4>" + '<b>Incident Type:</b> ' + row['emergencyType']  + "<p><b>Description:</b>" + row['description'] + "</p><div class= 'newsMapDiv' id='"+mapDivId+"'></div><p><b>News updated at:</b> "+ time +"</p></div>";
					
					
					
					$("#set").append( newsContent ).collapsibleset('refresh');
					
					console.log('Laaaaatttt :' + row['latitude'] + ' longggiiii : ' + row['longitude'] );
					
					if(row['latitude'] != null && row['latitude'] != ''){ // TODO -- Map loading only on resize. 
						console.log("Latitude and longitude is not null :" + row['latitude']);
						var latitude = row['latitude'];
						var longitude = row['longitude'];
						var latLong = new google.maps.LatLng(parseFloat(latitude), parseFloat(longitude));
						console.log("Drawing new map in each of the collapsible. lat long: " + latLong);
						drawMap(latLong, mapDivId);
					}
					else{
						console.log("No co-ordinates information..");
						$('#'+mapDivId).html('No information on the location co-ordinates.');
					}
				}	
			}
			//console.log(newsContent);
			
}		


function addNewsIntoDB(){
	
	
	console.log("Notifying event....");
	 $("input[name=radio-choice]:checked").each(function() {
        emergencyType = $(this).val();
    });
	
	description = $('#description').val().trim();
	
	console.log("Emergency Type: " + emergencyType + " Desc :" + description + ' User city : ' + userCity);
	
	$("input[name=radio-choice-exactaddr]:checked").each(function() {
        if($(this).val() == 'yes'){
		    var event_address = $('#address').val();
			getLatLongForLocation(event_address);
		}
    });
	
	setTimeout(insertNews(), 4000);
	
	return true;
}


function getLatLongForLocation(address){

console.log("Address getting lat longggg .... " + address);
var geocoder = new google.maps.Geocoder();
geocoder.geocode( { 'address': address}, function(results, status) {

  if (status == google.maps.GeocoderStatus.OK) {
    var latitude = results[0].geometry.location.lat();
    var longitude = results[0].geometry.location.lng();
    console.log(latitude + " "  +  longitude);
	eventLat = latitude;
	eventLong = longitude;
  } 
}); 
}


function reset(){
		
		$("input[name='radio-choice']:first").attr("checked",true).checkboxradio("refresh");
		$("input[name='radio-choice-exactaddr']").attr("checked",true).checkboxradio("refresh");
		
		$('#eventMap').hide();
}



function getEmergencyMap(){
	DEMODB.transaction(
			    function (transaction) {
			        transaction.executeSql("SELECT * FROM news", [], emergencyCountSelectHandler, errorHandler);
			    }
			);
}
function emergencyCountSelectHandler( transaction, results ){

	var i=0,
	row;		
	emergencyMap=[];
	//console.log("Total rows: " + results.rows.length);
	
	  for (i ; i<results.rows.length; i++) {
		    	row = results.rows.item(i);
		        var ctyMap = [];
				
				//console.log("emergencyMap[row['emergencyType']] :: " + emergencyMap[row['emergencyType']]);
				
				if(emergencyMap[row['emergencyType']] != null && emergencyMap[row['emergencyType']] != 'undefined' ){
					ctyMap = emergencyMap[row['emergencyType']] ;
				}
			
				console.log("ctyMap[row['city']]:: " + ctyMap[row['city']]);
				
				if(ctyMap[row['city']] == null || ctyMap[row['city']] == 'undefined' ){
						ctyMap[row['city']] = 1; 
					}
					else{
						ctyMap[row['city']]+=1;
					}
					
				//console.log("City ::" + row['city'] + " Count : " + ctyMap[row['city']]);
				emergencyMap[row['emergencyType']] = ctyMap;
		    }	
			
		
		//console.log("EMmergency Map:....... ");
		
		/*for (var i in emergencyMap){
			//console.log("Emergency Type : " + i);
			//console.log("Emergency Map for each city: " + emergencyMap[i]);
			for(var j in emergencyMap[i]){
				//console.log("City : " + j);
				//console.log("Count: " + emergencyMap[i][j]);
			}
			console.log("----");
		}*/
}

function getCityDataCount(){

			DEMODB.transaction(
			    function (transaction) {
			        transaction.executeSql("SELECT * FROM news", [], dataCityCountSelectHandler, errorHandler);
			    }
			);
}

function dataCityCountSelectHandler( transaction, results ){
			var i=0,
				row;
			
			cityMap=[];
			
			console.log("Total rows: " + results.rows.length);
			
		    for (i ; i<results.rows.length; i++) {
		        
		    	row = results.rows.item(i);
		        
				
				if(cityMap[row['city']] == null || cityMap[row['city']] == 'undefined' ){
					cityMap[row['city']] = 1;
					
				}
				else{
					cityMap[row['city']]+=1;
					
				}
				
				console.log("City ::" + row['city'] + " Count : " + cityMap[row['city']]);
			
				
				
		    }	
			
			
			
			
}

function drawBarChart(chartDivId){

	
	console.log("Drawing chart... ");

	var cityNames = [];
	var cityCount = [];

	console.log("CITY MAP:::::: " + cityMap);

	for (var i in cityMap){
		cityNames.push(i);
		cityCount.push(cityMap[i]);
	}
	
	

	if (barChart == null){
					var data = {
						labels: cityNames,
						datasets: [{
							label: "No of Cases",
							fillColor: "rgba(235, 105, 18,0.5)",
							strokeColor: "rgba(235, 105, 18,0.8)",
							highlightFill: "rgba(235, 105, 18,0.75)",
							highlightStroke: "rgba(235, 105, 18,1)",
							data:  cityCount
						}]
					};
				
					var ctx = document.getElementById(chartDivId).getContext("2d");
				
					window.barChart = new Chart(ctx).Bar(data, {
						responsive: true // change to "false" and it will work
					});
				}           
}


function drawPieBarChart(){
	var emerTypeCount  = [];
	for (var i in emergencyMap){
			emerTypeCount[i] = 0; 
			for(var j in emergencyMap[i]){
				emerTypeCount[i] += emergencyMap[i][j];
			}
		}
	
	console.log("Final count map  : : Theft :  "  + emerTypeCount['Other'] + ' Medical: ' +  emerTypeCount['Fire']);
	var pieData = [
				   { value: checkNull(emerTypeCount['Medical']), label: 'Medical', color:  getRandomColor() },
				   { value: checkNull(emerTypeCount['Fire']), label: 'Fire', color:  getRandomColor() },
				   { value: checkNull(emerTypeCount['Theft']), label: 'Theft', color:  getRandomColor() },
				   { value : checkNull(emerTypeCount['Other']), label: 'Other', color:  getRandomColor() }
				 ];
	
				 
	var context = document.getElementById('emergencyTrendPieChart').getContext('2d');
	pieChart = new Chart(context).Doughnut(pieData);
	
	
	console.log("Drawing chart... ");

	var cityNames = [];
	var cityCount = [];

	for (var i in cityMap){
		cityNames.push(i);
		cityCount.push(cityMap[i]);
	}
	
	var barData = {
						labels: getCityNames('Theft'),
						datasets: [{
							label: "No of Cases",
							fillColor: "rgba(235, 105, 18,0.5)",
							strokeColor: "rgba(235, 105, 18,0.8)",
							highlightFill: "rgba(235, 105, 18,0.75)",
							highlightStroke: "rgba(235, 105, 18,1)",
							data:  getCityCount('Theft')
						}]
					};
					
					
	var subcontext = document.getElementById('emergencyTrendBarChart').getContext('2d');
	subBarChart = new Chart(subcontext).Bar(barData);

}

function getCityNames(emerType){
	var cityNames = [];
	for (var i in emergencyMap){
			for(var j in emergencyMap[i]){
				if(i == emerType){
					cityNames.push(j);
				}
			}
		}
	return cityNames;
}


function getCityCount(emerType){
	var cityCount = [];
	for (var i in emergencyMap){
			for(var j in emergencyMap[i]){
				if(i == emerType){
					cityCount.push(emergencyMap[i][j]);
				}
			}
		}
	return cityCount;
}


function checkNull(value){
	if(value == null || value == 'undefined' || value == ''){
		return 0;
	}
	return parseInt(value);
}

function updateBarChart(e){	
	var activeSector = pieChart.getSegmentsAtEvent(e);

	var barData = {
						labels: getCityNames(activeSector[0].label),
						datasets: [{
							label: "No of Cases",
							fillColor: "rgba(235, 105, 18,0.5)",
							strokeColor: "rgba(235, 105, 18,0.8)",
							highlightFill: "rgba(235, 105, 18,0.75)",
							highlightStroke: "rgba(235, 105, 18,1)",
							data:  getCityCount(activeSector[0].label)
						}]
					};
					
	var subcontext = document.getElementById('emergencyTrendBarChart').getContext('2d');
	subBarChart = new Chart(subcontext).Bar(barData);				
}


function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++ ) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}


var locations = [
  ['Bondi Beach', -33.890542, 151.274856, 4],
  ['Coogee Beach', -33.923036, 151.259052, 5],
  ['Cronulla Beach', -34.028249, 151.157507, 3],
  ['Manly Beach', -33.80010128657071, 151.28747820854187, 2],
  ['Maroubra Beach', -33.950198, 151.259302, 1]
];
var map;
var markers = [];

function drawMapViz(cityName){

  //var locations = getLocationForCity(cityName);
  map = new google.maps.Map(document.getElementById('map_markers'), {
    zoom: 10,
    center: new google.maps.LatLng(-33.92, 151.25),
    mapTypeId: google.maps.MapTypeId.ROADMAP
  });

  var num_markers = locations.length;
  for (var i = 0; i < num_markers; i++) {  
    markers[i] = new google.maps.Marker({
      position: {lat:locations[i][1], lng:locations[i][2]},
      map: map,
      html: locations[i][0],
      id: i,
    });
      
    google.maps.event.addListener(markers[i], 'click', function(){
      var infowindow = new google.maps.InfoWindow({
        id: this.id,
        content:this.html,
        position:this.getPosition()
      });
      google.maps.event.addListenerOnce(infowindow, 'closeclick', function(){
        markers[this.id].setVisible(true);
      });
      this.setVisible(false);
      infowindow.open(map);
    });
  }
}

function updateMapMarkers(e){
	console.log("Clicking the bar chart");
	console.log("Segments : " + barChart.getBarsAtEvent(e)[0].label);
	var cityNAME = barChart.getBarsAtEvent(e)[0].label;
	//drawMapViz(cityNAME);
}


function getLocationForCity(cityName){
	
	
	
}