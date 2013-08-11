//var platform = navigator.userAgent;
//if(platform.indexOf("Android") == -1 && platform.indexOf("Mobile") == -1 && platform.indexOf("Windows Phone") == -1 && platform.indexOf("Blackberry") == -1)
	//window.location = "http://cera.cct.lsu.edu/cgi-cera-ng/cera-ng.cgi";

window.addEventListener('orientationchange', doOnOrientationChange);
  function doOnOrientationChange(){
    if((window.orientation==-90)||(window.orientation==90))//portrait
    {  
  		$("#map").css({width: '100%', height: window.innerHeight * .85 + ""});
    }
    else//landscape
    {
  		$("#map").css({width: '97%', height: window.innerHeight * .85 + ""});
    }
  }

function jumpLayer(index) {
	getMap(index, null);
}

function jumpHurricane(index) {
	JSONURL = getLatestJSONURL(index,selectIndex(json.dates),null);
	console.log('<p>Reading from <a href=' + JSONURL + ' style="text-decoration: none;">' + JSONURL + '</a></p>');				
	getMap(index, refresh(index));
}

function jumpTrackPoint()
{
	var layerIndex = $('#jqlayer-button')[0].selectedIndex;
  	var hurricaneIndex = $('#jqhurricane-button')[0].selectedIndex;
  	JSONURL = getLatestJSONURL(hurricaneIndex,selectIndex(json.dates),selectIndex(json.times));
  	$.getJSON(JSONURL,function(){
  		getMap($(layerIndex, null));}
  	);		
}
	
function initMap()
{					
	JSONURL = getLatestJSONURL();
	var firstRefresh = refresh(); // preload JSON so we can use any delay in geolocation	
	var marker;
	makeMap(30.411761, -91.181841);
	navigator.geolocation.getCurrentPosition(
		function(position){ // on success
			//makeMap(position.coords.latitude, position.coords.longitude);
			var point = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
			marker.setMap(null);
			marker = new google.maps.Marker
	  			({position: point,map: map,title: "You"});
	  		
			map.setCenter(point);
			map.panTo(point);	
			//console.log(position.coords.latitude + ", " + position.coords.longitude);
		}/*, 
		function(error){	// on error
			makeMap(30.411761, -91.181841);
			//console.log("code: " + error.code + " message: " + error.message);
		}
		//{maximumAge:0, timeout:1000, enableHighAccuracy: true}*/ // for pinpointing
	);
	//makeMap(30.411761, -91.181841); // load this in the meantime
	
	function makeMap(lat, lon) {
		var point = new google.maps.LatLng(lat, lon);
 		var mapOptions = {zoom: 8, center: point, mapTypeId: google.maps.MapTypeId.ROADMAP, mapTypeControl: false};
  		map = new google.maps.Map(document.getElementById('map'),mapOptions);
  		marker = new google.maps.Marker
	  			({position: point,map: map,title: "You"});
	  	
	  	//from here on is the custom control
	  	$("#layers-container").show();
		var layerDropdown = document.getElementById('layers-container');
		map.controls[google.maps.ControlPosition.TOP_RIGHT].push(layerDropdown);
		
		$("#hurricanes-container").show();
		var hurricaneDropdown = document.getElementById('hurricanes-container');
		map.controls[google.maps.ControlPosition.TOP_RIGHT].push(hurricaneDropdown);
		
		$('#redirect-button').buttonMarkup({corners: false});
		
		google.maps.event.addListener(map, "zoom_changed", function() {
    		$.each(trackMarkerList, function(){
    			this.setIcon(
    			{
					path: google.maps.SymbolPath.CIRCLE,
					scale: map.getZoom() + 5, // this will be changed on every zoom change
					strokeWeight: 0,
					fillOpacity: 1,
					fillColor: "red"  
				});
    		});
    		
    		$.each(timestepMarkerList, function(){
    			this.setIcon(
    			{
					path: google.maps.SymbolPath.CIRCLE,
					scale: map.getZoom(), // this will be changed on every zoom change
					strokeWeight: 0,
					fillOpacity: 1,
					fillColor: "black"  
				});
    		});
		});		
		getMap(null, firstRefresh);
	}
}

function getMap(layerIndex, deferred) // making deferred a paramter is messy organization-wise, but it enables first-load optimization
{
	//var layerName = $('#jqlayer-button option:selected').text();
	for (var i = 0; i < map.overlayMapTypes.length; i++)
		map.overlayMapTypes.setAt(i, null); // clear map

	if(deferred != null) // if NOT a layer change refresh
		deferred.done(function(){
			layerIndex = $('#jqlayer-button')[0].selectedIndex;		
			map.overlayMapTypes.push(returnImageList(map, layerIndex));
		});
	else // we're probably in a layer change refresh, no refresh of JSON needed
	{
		map.overlayMapTypes.push(returnImageList(map, layerIndex));
	}
}