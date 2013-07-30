//var platform = navigator.userAgent;
//if(platform.indexOf("Android") == -1 && platform.indexOf("Mobile") == -1 && platform.indexOf("Windows Phone") == -1 && platform.indexOf("Blackberry") == -1)
	//window.location = "http://cera.cct.lsu.edu/cgi-cera-ng/cera-ng.cgi";

window.addEventListener('orientationchange', doOnOrientationChange);
  function doOnOrientationChange(){
    if((window.orientation==-90)||(window.orientation==90))//portrait
    {  
  		$("#map").css({width: '90%', height: window.innerWidth * .9 + ""});
    }
    else//landscape
    {
  		$("#map").css({width: '90%', height: window.innerHeight * .9 + ""});
    }
  }

function jumpLayer(layerIndex) {				
	$('#layers div').removeClass("button-selected");
	$('#layers').find('div:eq('+ layerIndex + ')').addClass("button-selected");
	//$('#layerName').text(layerList[layerIndex]);
	getMap(layerIndex, null);
}

function jumpHurricane(hurricaneIndex) {
	//$('#hurricaneName').text(hurricaneList[hurricaneIndex].text);
	JSONURL = getLatestJSONURL(hurricaneIndex,null);
	$('#source').html('<p>Reading from <a href=' + JSONURL + ' style="text-decoration: none;">' + JSONURL + '</a></p>');
	$('#hurricanes div').removeClass("button-selected");
	$('#hurricanes').find('div:eq('+ hurricaneIndex + ')').addClass("button-selected");				
	getMap($('#layers div.button-selected').index(), refresh());		
	//$('#layers div').show();		
	//$('#layerName').text("Layers");
}

function jumpTrackPoint(time)
{
	//var layerIndex = $('#layers div.button-selected').index();
  	var hurricaneIndex = $('#hurricanes div.button-selected').index();
  	JSONURL = getLatestJSONURL(hurricaneIndex,time);
  	$.getJSON(JSONURL,function(){
  		getMap($('#layers div.button-selected').index(), null);}
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
	var layerName = $('#layers').find("div:eq(" + layerIndex + ")").text(); //the name of our last selected layer, is "" during first run				
	for (var i = 0; i < map.overlayMapTypes.length; i++)
		map.overlayMapTypes.setAt(i, null); // clear map

	if(deferred != null) // if NOT a layer change refresh
		deferred.done(function(){
			if(layerIndex == null) // if first run
			{
				layerIndex = 0;
				$('#layers div:eq(0)').addClass("button-selected");
				$('#hurricanes div:eq(0)').addClass("button-selected");
				//$('#hurricaneName').text(hurricaneList[0].text);
				//$('#layerName').text(layerList[0]);
			}	  				
			else if(layerList[layerIndex] != layerName) // if the old layer name is not in the same place
			{
				var newIndex = 0; //default to using first layer in layerList
				if(layerList.indexOf(layerName) != -1) // if the layer we previously selected still exists in the array somewhere
					newIndex = layerList.indexOf(layerName); // select the index of that layer, wherever it is
				
				$('#layers div').removeClass("button-selected"); // clear old selected layer, if any
				$('#layers').find("div:eq(" + newIndex + ")").addClass("button-selected"); // select new layer
				$('#layers div').show();
				//console.log("hi");
				$('#layerName').text("Layers");
				//$('#layer-button span').show();
				//$('#layerName').hide();
				
				//map.overlayMapTypes.push(returnImageList(map, newIndex)/*clear selected layer and default to first layer in array*/);
			}
			else // if the layer name is in the same place
			{
				//console.log("hi");
				if($('#layerName').text() != "Layers") // if we hid the layer select menu
					$('#layers div').hide(); // also hide new hurricane/json's new divs which are visible by default
				$('#layers').find("div:eq(" + layerIndex + ")").addClass("button-selected");
				//map.overlayMapTypes.push(returnImageList(map, layerIndex)/*call a function that returns list of image in an array*/);
			}
			map.overlayMapTypes.push(returnImageList(map, layerIndex));
			//$('#hurricane-button span').hide();
			//$('#hurricane-button span:last').show(); // display "Hurricane" on hurricane-button
		});
	else // we're probably in a layer change refresh, no refresh of JSON needed
	{
		map.overlayMapTypes.push(returnImageList(map, layerIndex));
		$('#layerName').text("Layers");
	}
}
			
function toggleLayerButton(){
	$('#layers div').slideToggle(100, function(){
//		$('#layer-button span').hide();
		if($('#layers div').is(':visible'))
			$('#layerName').text("Layers");
		else{
			$('#layerName').text(layerList[$('#layers div.button-selected').index()]);
		}
	});
	//console.log(layerList[$('#layers div.button-selected').index()]);
	//$('#layerName').text(layerList[$('#layers div.button-selected').index()]);
}
		
function toggleHurricaneButton(){
	$('#hurricanes div').slideToggle(100, function(){
//		$('#hurricane-button span').hide();
	if($('#hurricanes div').is(':visible'))
		$('#hurricaneName').text("Hurricanes");
	else
		$('#hurricaneName').text(hurricaneList[$('#hurricanes div.button-selected').index()].text);
	});
}