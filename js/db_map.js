var userCity = '';
var emergencyType = '';
var description = '';
var eventLat = '';
var eventLong = '';

var cityMap = [];
var emergencyMap = [];
var pieChart;
var subBarChart;
var barChart;
var userAddress;
var locationArray = [];
var cityData = {};

function showMap() {
    //console.log('Showing map');
    var divId = "map-canvas";
    var defaultLatLng = new google.maps.LatLng(34.0983425, -118.3267434); // Default to Hollywood, CA when no geolocation support
    if (navigator.geolocation) {
        function success(pos) {
            // Location found, show map with these coordinates
            eventLat = pos.coords.latitude;
            eventLong = pos.coords.longitude;
            drawMap(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude), divId);
        }

        function fail(error) {
            drawMap(defaultLatLng, divId); // Failed to find location, show default map
        }
        // Find the users current position.  Cache the location for 5 minutes, timeout after 6 seconds
        navigator.geolocation.getCurrentPosition(success, fail, {
            enableHighAccuracy: true,
            timeout: 6000
        });
    } else {
        drawMap(defaultLatLng, divId); // No geolocation support, show default map
    }

}

function drawMap(latlng, divId) {
    //console.log('Lat Long:' + latlng);
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
        animation: google.maps.Animation.BOUNCE
    });
    /*var infowindow = new google.maps.InfoWindow({
      content:"You are here!"
    });

    infowindow.open(map,marker);*/

    //google.maps.event.trigger(map, 'resize');
}

function initDatabase() {
    //console.log("into init database");

    try {
        if (!window.openDatabase) {
            alert('Databases are not supported in this browser.');
        } else {
            var shortName = 'vigil_app_db';
            var version = '1.0';
            var displayName = 'Database for Vigil Mobile application';
            var maxSize = 100000; //  bytes
            DEMODB = openDatabase(shortName, version, displayName, maxSize);
            //dropTables();
            createTables();

        }
    } catch (e) {

        if (e == 2) {
            // Version number mismatch.
            console.log("Invalid database version.");
        } else {
            console.log("Unknown error " + e + ".");
        }
        return;
    }
}

function dropTables() {

    DEMODB.transaction(
        function(transaction) {
            transaction.executeSql("DROP TABLE user;", [], nullDataHandler, errorHandler);
            transaction.executeSql("DROP TABLE news;", [], nullDataHandler, errorHandler);
        }
    );
    //console.log("Tables has been dropped.");
    //location.reload();			
}

function nullDataHandler() {
    console.log("SQL Query Succeeded");
}

function errorHandler(transaction, error) {

    if (error.code == null || error.code == 'undefined') {
        return;
    }

    if (error.code === 1) {
        // DB Table already exists
    } else {
        // Error is a human-readable string.
        //console.log('Oops.  Error was '+error.message+' (Code '+ error.code +')');
    }
    return false;
}

function createTables() {
    DEMODB.transaction(
        function(transaction) {
            transaction.executeSql('CREATE TABLE IF NOT EXISTS user(id INTEGER NOT NULL PRIMARY KEY, user_name TEXT NOT NULL);', [], nullDataHandler, errorHandler);
            transaction.executeSql('CREATE TABLE IF NOT EXISTS news(news_id INTEGER NOT NULL PRIMARY KEY, city INTEGER NOT NULL, emergencyType TEXT NOT NULL, description TEXT NOT NULL, latitude TEXT, longitude TEXT, insertTime DATETIME, address TEXT, isResolved TEXT, numVerified INTEGER);', [], nullDataHandler, errorHandler);
        }
    );

    populate();
}

function getUserLocation() {

	console.log("Getting user location.");
	
    if (!navigator.geolocation) return;


    navigator.geolocation.getCurrentPosition(function(pos) {
        geocoder = new google.maps.Geocoder();
        var latlng = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
        geocoder.geocode({
            'latLng': latlng
        }, function(results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                var result = results[0];
                //console.log('Results: ' + result);
                //look for locality tag and administrative_area_level_1, country
                var city = "";
                var state = ""; //TODO try adding country 
                var country = "";
                var street = "";
                var address = result.formatted_address;
                //console.log("Address : " + address);
                userAddress = address;


                for (var i = 0, len = result.address_components.length; i < len; i++) {
                    var ac = result.address_components[i];
                    if (ac.types.indexOf("locality") >= 0) city = ac.long_name;
                    if (ac.types.indexOf("administrative_area_level_1") >= 0) state = ac.long_name;
                    if (ac.types.indexOf("country") >= 0) country = ac.long_name;

                    if (ac.types.indexOf("street_address") >= 0) street = ac.long_name;
                }

                console.log("Setting user location... city: " + city);
				userCity = city;
				
					//console.log("Inside get User location: User loc is " + userCity);
				//$("#set").append("<h4>No new emergencies reported at " + userCity + ". You can be safe.</h4>");
                
                

                if (address == null && address == '') {
                    if (street != '' && city != '' && state != '' && country != '') {
                        $("#currentLocation").html("<h4>Your location is " + street + ", " + city + ", " + state + ", " + country + "!</h4>");
                    } else if (city != '' && state != '' && country != '') {
                        $("#currentLocation").html("<h4>Your location is " + city + ", " + state + ", " + country + "!</h4>");
                    }

                    userAddress = street + ", " + city + ", " + state + ", " + country;

                } else {
                    $("#currentLocation").html("<h4>Your location is " + address + "!</h4>");
                }

            }
        });

    });
}

function populate() {

    //console.log("Pre populate");

    DEMODB.transaction(
        function(transaction) {
            //Starter data when page is initialized
            var data = ['1', 'Bhoopesh'];

            transaction.executeSql("INSERT INTO user(id, user_name) VALUES (?, ?)", [data[0], data[1]], errorHandler);
        }
    );

    populateNews();
}

function populateNews() {
    DEMODB.transaction(
        function(transaction) {

            var data = [
                ['1', 'Hyattsville', 'Theft', 'Two male UMD students reported that property was taken from the residence', '38.9528572', '-76.95194594', 'Fri 4 Dec 2015 12:15:00', '', 'no', '56'],
                ['2', 'Hyattsville', 'Fire', 'Major fire outbreak next to my Apartment. in my current location', '38.953241', '-76.94656007','Thu 17 Dec 2015 02:30:00', '', 'no', '45'],
                ['3', 'Hyattsville', 'Medical', 'Women aged 65 need urgent help to commute to a nearby hospital. She is unconscious', '38.95831359', '-76.94364182', 'Fri 15 Jan 2016 09:45:00', '', 'no', '43'],
                ['4', 'Hyattsville', 'Fire', 'Fire near my location. Need urgent help.', '38.9606829', '-76.95467107', 'Mon 1 Feb 2016 10:20:00', '', 'no', '33'],
                ['5', 'Dallas', 'Theft', 'A unidentified male was seen mugging a student. The suspect was armed and roaming near McDonalds', '32.78052496', '-96.79033602', 'Mon 8 Feb 2016 12:40:00', '', 'yes', '11'],
                ['6', 'Dallas', 'Fire', 'Fire leakage near my place. Ferris manor apartments is the location', '32.78290628', '-96.80136527', 'Tue 9 Feb 2016 01:55:00', '', 'yes', '13'],
                ['7', 'Dallas', 'Medical', 'A male is unconscious lying at the exact location where Iam in. He seems like a student from UTD', '32.78586481', '-96.78739632', 'Mon 15 Feb 2016 03:40:00', '', 'yes', '12'],
                ['8', 'Dallas', 'Fire', 'Fire at three storeyed building. No fire stations nearby', '32.78713021', '-96.80155635', 'Wed 17 Feb 2016 03:50:00', '', 'yes', '19'],
                ['9', 'Chennai', 'Theft', 'I was mugged near the Marina beach. The suspect was having gun and took my purse and cellphone. He was 6 feet tall and was wearing a gold chain', '13.0828056', '80.27498848', 'Sat 20 Feb 2016 06:40:00', '', 'yes', '20'],
                ['10', 'Frederick', 'Fire', 'My house is in fire. I am caught inside. I am at Courtlong Apartments, Apt no,3', '39.41292138', '-77.40676045', 'Sun 21 Feb 2016 07:10:00', '', 'yes', '16'],
                ['11', 'Frederick', 'Medical', 'Need medical help for an aged man. We are at NewAge apartments Apt no3 and he had cardiac arrest', '39.41806037', '-77.40637422', 'Wed 24 Feb 2016 10:20:00', '', 'yes', '30'],
                ['12', 'Frederick', 'Fire', 'Fire outbreak near my place', '39.4218895', '-77.42781043', 'Fri 25 Mar 2016 11:40:00', '', 'yes', '11'],
				['13','New Britain','Fire','Huge fire breakout 3 people stuck','41.665158','-72.762913','Tue 15 Sep 2015 05:25:00','752 Durham Road  New Britain, CT 06051', 'yes', '19'],
				['14','Lawndale','Medical','Pregnant women needs attention','38.434855','-122.596905','Sat 26 Sep 2015 06:30:00','313 Deerfield Drive, Lawndale, CA 90260', 'yes', '29'],
				['15','Oklahoma City','Theft','tall male white blazers blue jean','35.51859','-97.59673','Sat 24 Oct 2015 10:20:00','170 Warren Avenue Oklahoma City, OK 73112', 'yes', '29'],
				['16','Oakland','Other','Suspect activity near my area','37.798141','-122.258','Sun 22 Nov 2015 10:25:00','566 1st Avenue Oakland, CA 94603', 'yes', '14'],
				['17','Mount Holly','Fire','Huge fire breakout 3 people stuck','39.989586','-74.797957','Wed 2 Dec 2015 11:40:00','108 Willow Lane Mount Holly, NJ 08060', 'yes', '0'],
				['18','Munster','Medical','Accident near i-95 - need ambulance','41.539546','-87.491987','Mon 14 Dec 2015 13:10:00','753 Cardinal Drive Munster, IN 46321', 'yes', '7'],
				['19','West Palm Beach','Theft','tall male white blazers blue jean','26.555954','-80.095162','Fri 25 Dec 2015 14:35:00','758 Buttonwood Drive West Palm Beach, FL 33404', 'yes', '6'],
				['20','Saint Paul','Other','Suspect activity near my area','45.003537','-93.118923','Fri 1 Jan 2016 14:40:00','204 Crescent Street Saint Paul, MN 55104', 'yes', '5'],
				['21','Piqua','Fire','Huge fire breakout 3 people stuck','39.860482','-83.936762','Thu 28 Jan 2016 15:20:00','973 Willow Avenue Piqua, OH 45356', 'yes', '9'],
				['22','San Jose','Medical','Accident near i-75 - need ambulance','37.378625','-121.826399','Thu 25 Feb 2016 17:40:00','847 Summit Street San Jose, CA 95127', 'yes', '10'],
				['23','Wake Forest','Theft','tall male white blazers blue jean','35.885278','-78.650882','Fri 26 Feb 2016 19:10:00','980 Penn Street Wake Forest, NC 27587', 'yes', '10'],
				['24','Dickson','Other','sand storm approaching','36.077005','-87.38779','Thu 10 Mar 2016 19:15:00','164 Buckingham Drive Dickson, TN 37055', 'yes', '9'],
				['25','Sarasota','Medical','Fatal accident near my location','27.292308','-82.496739','Sun 13 Mar 2016 20:20:00','20 Deerfield Drive Sarasota, FL 34231', 'yes', '6']

            ];

            for (var i = 0; i < 25; i++) {
                transaction.executeSql("INSERT INTO news(news_id, city, emergencyType, description,  latitude, longitude, insertTime, address, isResolved, numVerified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [data[i][0], data[i][1], data[i][2], data[i][3], data[i][4], data[i][5], data[i][6]+' GMT-0400 (Eastern Daylight Time)', data[i][7], data[i][8], data[i][9]], errorHandler);
            }
        }
    );
}

function insertNews() {

    var dateTime = new Date();

    //console.log("Date time : " + dateTime);

    DEMODB.transaction(

        function(transaction) {
            //console.log('Lattt: ' + eventLat + 'Longi: ' + eventLong);
            if (eventLat == '' && eventLong == '') {
                transaction.executeSql("INSERT INTO news(city, emergencyType, description, insertTime, address,isResolved, numVerified) VALUES (?, ?, ?, ?, ?, ?, ?)", [userCity, emergencyType, description, dateTime, userAddress, 'no', 0], errorHandler);
            } else {
                transaction.executeSql("INSERT INTO news(city, emergencyType, description, latitude, longitude, insertTime, address, isResolved, numVerified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [userCity, emergencyType, description, eventLat, eventLong, dateTime, userAddress, 'no', 0], errorHandler);
            }

        }
    );

    $('#description').val('');
}

function selectUser() {

    DEMODB.transaction(
        function(transaction) {
            transaction.executeSql("SELECT * FROM user;", [], dataUserSelectHandler, errorHandler);
        }
    );
}

function selectNews() {

    DEMODB.transaction(
        function(transaction) {
            transaction.executeSql("SELECT * FROM news where city = ? and isResolved='no' order by news_id desc;", [userCity], dataNewsSelectHandler, errorHandler);
        }
    );

}

function dataUserSelectHandler(transaction, results) {
    // Handle the results
    var i = 0,
        row;

    for (i; i < results.rows.length; i++) {

        row = results.rows.item(i);

        //console.log("User name ::" + row['user_name']);

        userName = row['user_name'];


        $('#user_n').html('<h4 id="your_name">Your Name is ' + row['user_name'] + '</h4>');

    }
}
function sleep(delay) {
    var start = new Date().getTime();
    while (new Date().getTime() < start + delay);
  }
function dataNewsSelectHandler(transaction, results) {

    //console.log("Inside dataNewsSelectHandler. city name:  " + userCity);
    // Handle the results
    var i = 0,
        row;
    var newsContent = '';
    //console.log('Num of rows: ' + results.rows.length);	
	
    $("#set").empty();
		console.log("Sleeping for 3 secs");
	
	
	setTimeout(function(){ 
		
    }, 2000);
	 
	 console.log('User city: ' + userCity);
	 
     if (results.rows.length == 0) {
		var loc = userCity;
		if(userCity == ''){
			loc = ' your location'
		}
		$("#set").append("<h4>No new emergencies reported at " + loc + ".</h4>");
	  }
	  else{
	  
        for (i; i < results.rows.length; i++) {
            row = results.rows.item(i);
            //console.log('Div id : '  + row['city']+row['news_id'] );

            var divId = row['city'] + row['news_id'];
            var mapDivId = 'newsmap' + row['news_id'];
            var time = row['insertTime'];
            if (time != null && time != '') {
                time = time.split("GMT")[0].trim();
            }
            //console.log("Time::: " + time);
            var subDesc = row['description'].substring(0, 10) + ' .....';

            var imageFile = row['emergencyType'].toLowerCase() + '.png';


            newsContent = "<div id='" + divId + "' data-role='collapsible' data-collapsed='true' data-iconpos='right'><h4><img src='images/" + imageFile + "' alt='icon' width='20' height='20'/>" + '  ' + subDesc + " <img src='images/new.gif' alt='new'/></h4>" + '<b>Incident Type:</b> ' + row['emergencyType'] + "<p><b>Description:</b>" + row['description'] + "</p><div class= 'newsMapDiv' id='" + mapDivId + "'></div><p><b>News updated at:</b> " + time + "</p>";
			
			var newsid = row['news_id'];
			var verifiedCount = row['numVerified'];
			newsContent += "<div id='imgDiv"+newsid+"'><a href='#popupDivForVerify' onclick='return updateNumVerify("+newsid+","+verifiedCount+");'><img src='images/star_before.png' width='30' height='30'/></a>"+verifiedCount+"<h5>Click on the star to verify. </h5></div>"
			
			newsContent += "</div>";

            $("#set").append(newsContent).collapsibleset('refresh');

            //console.log('Laaaaatttt :' + row['latitude'] + ' longggiiii : ' + row['longitude'] );

            if (row['latitude'] != null && row['latitude'] != '') { // TODO -- Map loading only on resize. 
                //console.log("Latitude and longitude is not null :" + row['latitude']);
                var latitude = row['latitude'];
                var longitude = row['longitude'];
                var latLong = new google.maps.LatLng(parseFloat(latitude), parseFloat(longitude));
                //console.log("Drawing new map in each of the collapsible. lat long: " + latLong);
                drawMap(latLong, mapDivId);
            } else {
                //console.log("No co-ordinates information..");
                $('#' + mapDivId).html('No information on the location co-ordinates.');
            }
        }
    }
    //console.log(newsContent);

}

function updateNumVerify(newsId, verifiedCount){
	var verifiedCount = parseInt(verifiedCount) + 1;
	DEMODB.transaction(
        function(transaction) {
				
                transaction.executeSql("update news set numVerified=? where news_id = ?", [verifiedCount, newsId], errorHandler);
        }
    );
	
	$('#imgDiv'+newsId).html("<img src='images/star-after.png' width='30' height='30'/></a>"+verifiedCount);
	
	return true;

}

function addNewsIntoDB() {


    //console.log("Notifying event....");
    $("input[name=radio-choice]:checked").each(function() {
        emergencyType = $(this).val();
    });

    description = $('#description').val().trim();

    //console.log("Emergency Type: " + emergencyType + " Desc :" + description + ' User city : ' + userCity);

    $("input[name=radio-choice-exactaddr]:checked").each(function() {
        if ($(this).val() == 'yes') {
            var event_address = $('#address').val();
            getLatLongForLocation(event_address);
        }
    });

    setTimeout(insertNews(), 4000);
	sendEmail();
    return true;
}



function getLatLongForLocation(address) {

    console.log("Address getting lat longggg .... " + address);
    var geocoder = new google.maps.Geocoder();
    geocoder.geocode({
        'address': address
    }, function(results, status) {

        if (status == google.maps.GeocoderStatus.OK) {
            var latitude = results[0].geometry.location.lat();
            var longitude = results[0].geometry.location.lng();
            console.log(latitude + " " + longitude);
            eventLat = latitude;
            eventLong = longitude;
        }
    });
}


function reset() {
    //console.log("Resetting");
    $("#description").val('');
    $("input[name='radio-choice']:first").attr("checked", true).checkboxradio("refresh");
}



function getEmergencyMap() {
    DEMODB.transaction(
        function(transaction) {
            transaction.executeSql("SELECT * FROM news", [], emergencyCountSelectHandler, errorHandler);
        }
    );
}

function emergencyCountSelectHandler(transaction, results) {

    var i = 0,
        row;
    emergencyMap = [];
    //console.log("Total rows: " + results.rows.length);

    for (i; i < results.rows.length; i++) {
        row = results.rows.item(i);
        var ctyMap = [];

        //console.log("emergencyMap[row['emergencyType']] :: " + emergencyMap[row['emergencyType']]);

        if (emergencyMap[row['emergencyType']] != null && emergencyMap[row['emergencyType']] != 'undefined') {
            ctyMap = emergencyMap[row['emergencyType']];
        }

        //console.log("ctyMap[row['city']]:: " + ctyMap[row['city']]);

        if (ctyMap[row['city']] == null || ctyMap[row['city']] == 'undefined') {
            ctyMap[row['city']] = 1;
        } else {
            ctyMap[row['city']] += 1;
        }

        //console.log("City ::" + row['city'] + " Count : " + ctyMap[row['city']]);
        emergencyMap[row['emergencyType']] = ctyMap;
    }
}

function getCityDataCount() {

    DEMODB.transaction(
        function(transaction) {
            transaction.executeSql("SELECT * FROM news", [], dataCityCountSelectHandler, errorHandler);
        }
    );
}

function dataCityCountSelectHandler(transaction, results) {
    var i = 0,
        row;

    cityMap = [];
    locationArray = [];
    //console.log("Total rows: " + results.rows.length);

    for (i; i < results.rows.length; i++) {
        var eachRow = new Array();
        row = results.rows.item(i);


        if (cityMap[row['city']] == null || cityMap[row['city']] == 'undefined') {
            cityMap[row['city']] = 1;

        } else {
            cityMap[row['city']] += 1;
        }

        //console.log("City ::" + row['city'] + " Count : " + cityMap[row['city']]);

        eachRow.push(row['city']); //0
        eachRow.push(row['emergencyType']); //1
        eachRow.push(row['description']); //2
        eachRow.push(row['latitude']); //3
        eachRow.push(row['longitude']); //4
        eachRow.push(row['address']); //5
        eachRow.push(row['insertTime']); //6
        locationArray.push(eachRow);
    }

    //console.log("Location Array Length : " + locationArray.length); 	
}




function drawBarChart(chartDivId) {

    //console.log("Drawing chart... ");

    var cityNames = [];
    var cityCount = [];

    //console.log("CITY MAP:::::: " + cityMap);

    for (var i in cityMap) {
        cityNames.push(i);
        cityCount.push(cityMap[i]);
    }

    var data = {
        labels: cityNames,
        datasets: [{
            label: "No of Cases",
            fillColor: "rgba(235, 105, 18,0.5)",
            strokeColor: "rgba(235, 105, 18,0.8)",
            highlightFill: "rgba(235, 105, 18,0.75)",
            highlightStroke: "rgba(235, 105, 18,1)",
            data: cityCount
        }]
    };

    var ctx = document.getElementById(chartDivId).getContext("2d");

    window.barChart = new Chart(ctx).Bar(data, {
        responsive: true // change to "false" and it will work
    });


    drawMapViz(locationArray[0][0]);

}


function drawPieBarChart() {
    var emerTypeCount = [];
    for (var i in emergencyMap) {
        emerTypeCount[i] = 0;
        for (var j in emergencyMap[i]) {
            emerTypeCount[i] += emergencyMap[i][j];
        }
    }

    //console.log("Final count map  : : Theft :  "  + emerTypeCount['Other'] + ' Medical: ' +  emerTypeCount['Fire']);
    var pieData = [{
        value: checkNull(emerTypeCount['Medical']),
        label: 'Medical',
        color: getRandomColor()
    }, {
        value: checkNull(emerTypeCount['Fire']),
        label: 'Fire',
        color: getRandomColor()
    }, {
        value: checkNull(emerTypeCount['Theft']),
        label: 'Theft',
        color: getRandomColor()
    }, {
        value: checkNull(emerTypeCount['Other']),
        label: 'Other',
        color: getRandomColor()
    }];


    var context = document.getElementById('emergencyTrendPieChart').getContext('2d');
    pieChart = new Chart(context).Doughnut(pieData);

    //console.log("Drawing chart... ");

    var cityNames = [];
    var cityCount = [];

    for (var i in cityMap) {
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
            data: getCityCount('Theft')
        }]
    };


    var subcontext = document.getElementById('emergencyTrendBarChart').getContext('2d');
    subBarChart = new Chart(subcontext).Bar(barData);

}

function getCityNames(emerType) {
    var cityNames = [];
    for (var i in emergencyMap) {
        for (var j in emergencyMap[i]) {
            if (i == emerType) {
                cityNames.push(j);
            }
        }
    }
    return cityNames;
}


function getCityCount(emerType) {
    var cityCount = [];
    for (var i in emergencyMap) {
        for (var j in emergencyMap[i]) {
            if (i == emerType) {
                cityCount.push(emergencyMap[i][j]);
            }
        }
    }
    return cityCount;
}


function checkNull(value) {
    if (value == null || value == 'undefined' || value == '') {
        return 0;
    }
    return parseInt(value);
}

function updateBarChart(e) {
    var activeSector = pieChart.getSegmentsAtEvent(e);

    var barData = {
        labels: getCityNames(activeSector[0].label),
        datasets: [{
            label: "No of Cases",
            fillColor: "rgba(235, 105, 18,0.5)",
            strokeColor: "rgba(235, 105, 18,0.8)",
            highlightFill: "rgba(235, 105, 18,0.75)",
            highlightStroke: "rgba(235, 105, 18,1)",
            data: getCityCount(activeSector[0].label)
        }]
    };

    var subcontext = document.getElementById('emergencyTrendBarChart').getContext('2d');
    subBarChart = new Chart(subcontext).Bar(barData);
}


function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}


function updateMapMarkers(e) {
    //console.log("Clicking the bar chart");
    //console.log("Segments : " + barChart.getBarsAtEvent(e)[0].label);
    var cityNAME = barChart.getBarsAtEvent(e)[0].label;
    drawMapViz(cityNAME);
}


function getLocationForCity(cityName) {
    var locations = [];
    if (locationArray == null || locationArray.length == 0) {
        console.log("Locations Array is empty");
        return locations;
    }

    for (var i = 0; i < locationArray.length; i++) {
        tempArray = locationArray[i];
        if (tempArray[0] == cityName) {
            console.log("Temp Array :" + tempArray);
            locations.push(tempArray);
        }
    }

    return locations;
}



function showMapOverlay() {

    var cityNames = [];
    var cityCount = [];

    var cityOverlayMap = [];
    for (var i in cityMap) {
        //console.log("City in city map :" + i + " Count :" + cityMap[i]);
        var cityName = i;
        var latLongArray = getLatLongForCity(i);
        //console.log("Lat long obj: " + latLongArray[0] + " " + latLongArray[1] );
        var tempArray = new Array();
        tempArray.push(latLongArray);
        tempArray.push(cityMap[i]);

        cityOverlayMap[cityName] = tempArray;
    }

    var map = new google.maps.Map(document.getElementById('map_overlay'), {
        zoom: 4,
        center: {
            lat: 37.090,
            lng: -95.712
        },
        mapTypeId: google.maps.MapTypeId.TERRAIN
    });

    var i = 0;
    for (var city in cityOverlayMap) {

        var locations = getLocationForCity(city);
        var htmlStr = "<h4 align='center'><font color='#800000'><b><u>" + city + " Area</u></b></font></h4>";
        htmlStr += "<table class='cityTables'>";
        htmlStr += "<tr><th></th><th>Type</th><th>Description</th><th>Address</th><th>Date</th></tr>"

        for (var i = 0; i < locations.length; i++) {
            htmlStr += "<tr>";
            htmlStr += "<td><img src='images/" + locations[i][1].toLowerCase() + ".png' width='20' height='20'/></td>";
            htmlStr += "<td>" + locations[i][1] + "</td>";
            htmlStr += "<td>" + locations[i][2] + "</td>";
            htmlStr += "<td>" + locations[i][5] + "</td>";

            var time = locations[i][6];
            if (time != null && time != '') {
                time = time.split("GMT")[0].trim();
            }

            htmlStr += "<td>" + time + "</td>";
            htmlStr += "</tr>";
        }

        htmlStr += "</table>"
        console.log(htmlStr);


        var cityCircle = new google.maps.Circle({
            strokeColor: '#ff0000',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#ff0000',
            fillOpacity: 0.35,
            map: map,
            center: new google.maps.LatLng(cityOverlayMap[city][0][0], cityOverlayMap[city][0][1]),
            radius: Math.sqrt(cityOverlayMap[city][1]) * 100000,
            id: i,
            html: htmlStr

        });


        google.maps.event.addListener(cityCircle, 'click', function() {
            var infowindow = new google.maps.InfoWindow({
                id: this.id,
                content: this.html,
                position: this.getCenter()
            });

            infowindow.open(map);
        });


        i++;
    }

}
var map;
var markers = [];

function drawMapViz(cityName) {
	$('#map_info').html("<h5><font color='#800000'>Showing incidents at " + cityName + " region</font><h5>");
    var locations = getLocationForCity(cityName);
    map = new google.maps.Map(document.getElementById('map_markers'), {
        zoom: 12,
        center: new google.maps.LatLng(parseFloat(locations[0][3].trim()), parseFloat(locations[0][4].trim())),
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });

    var num_markers = locations.length;
    //console.log("Num markers: " + num_markers);
    for (var i = 0; i < num_markers; i++) {

        //console.log("Lat : '" + locations[i][3].trim() + "' Long : '" + locations[i][4].trim() + "'");

        //TODO - try to include marker images

        markers[i] = new google.maps.Marker({
            position: {
                lat: parseFloat(locations[i][3].trim()),
                lng: parseFloat(locations[i][4].trim())
            },
            map: map,
            html: "<img src='images/" + locations[i][1].toLowerCase() + ".png' width='20' height='20' alt='icon'/><b>" + locations[i][1] + "</b><p>" + locations[i][2] + "</p>",
            id: i,
        });

        google.maps.event.addListener(markers[i], 'click', function() {
            var infowindow = new google.maps.InfoWindow({
                id: this.id,
                content: this.html,
                position: this.getPosition()
            });
            google.maps.event.addListenerOnce(infowindow, 'closeclick', function() {
                markers[this.id].setVisible(true);
            });
            this.setVisible(false);
            infowindow.open(map);
        });
    }
}


function getLatLongForCity(cityName) {

    var latlong = [];
    for (var i = 0; i < locationArray.length; i++) {
        tempArray = locationArray[i];
        if (tempArray[0] == cityName) {
            latlong.push(tempArray[3]);
            latlong.push(tempArray[4]);
            return latlong;
        }
    }
    return latlong;
}


function sendEmail() {
	console.log("Sending email...");
    $.ajax({
      type: 'POST',
      url: 'https://mandrillapp.com/api/1.0/messages/send.json',
      data: {
        'key': 'Qq4UDLUmpIaIzLBz_PKYug',
        'message': {
          'from_email': 'bhoopeshkumaar@gmail.com',
          'to': [
              {
                'email': 'v.bhoopeshkumaar@gmail.com',
                'name': 'Bhoopesh',
                'type': 'to'
              }
            ],
          'autotext': 'true',
          'subject': 'YOUR SUBJECT HERE!', //subject
          'html': 'YOUR EMAIL CONTENT HERE! YOU CAN USE HTML!' // content
        }
      }
     }).done(function(response) {
       console.log(response); // if you're into that sorta thing
     });
	 console.log("Email sent...");
}

function getUnresolvedData(){
	
	console.log("Unresolved data..");
	
	 DEMODB.transaction(
        function(transaction) {
            transaction.executeSql("SELECT * FROM news where isResolved='no' order by news_id;", [], dataNewsUnresolvedHandler, errorHandler);
        }
    );

}




function dataNewsUnresolvedHandler(transaction, results) {

    var i = 0,
        row;
		
		
		console.log("results.rows.length::" + results.rows.length);
		
		if(results.rows.length == 0){
			$('#unresolved').html("<h5>There are no unresolved incidents yet. All are resolved.</h5>");
		}
		else{
			
		var htmlStr = "<table class='cityTables ui-responsive table-stroke' data-role='table' data-mode='reflow'>"
		htmlStr+= '<tr><th></th><th>City</th><th>Type</th><th>Description</th><th>Address</th><th>Updated</th></tr>'
        for (i; i < results.rows.length; i++) {
            row = results.rows.item(i);
			
			var newsId = row['news_id'];
			var city = row['city'];
			var type = row['emergencyType']
			var description = row['description'];
			var address = row['address'];
			var time = row['insertTime']
			if (time != null && time != '') {
                time = time.split("GMT")[0].trim();
            }
			
			
			
			
			
			htmlStr += '<tr>'
			htmlStr += "<td><a href='#popupDiv' data-rel='popup' class='ui-btn ui-btn-inline ui-corner-all ui-icon-check ui-btn-icon-left' onclick='return updateResolved("+newsId+");'>Resolve</a></td>";
			htmlStr += '<td>'+ city + '</td>';
			htmlStr += '<td>'+ type + '</td>';
			htmlStr += '<td>'+ description + '</td>';
			htmlStr += '<td>'+ address + '</td>';
			htmlStr += '<td>'+ time + '</td>';
			htmlStr+= '</tr>'
			
			
           }
   
		htmlStr += '</table>';
		$('#unresolved').html(htmlStr);
	}
}

function updateResolved(newsId){
	console.log("Updating resolved .. " + newsId);
	
	DEMODB.transaction(
        function(transaction) {
                transaction.executeSql("update news set isResolved='yes' where news_id = ?", [newsId], errorHandler);
        }
    );
	
}