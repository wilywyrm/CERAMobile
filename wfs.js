// we might not be defining track and timestep correctly

function getTimestepPointsFromXML(xmlnode)
{
	var coords = $.trim(getTextContent(xmlnode)).split(" ");
	var pts = [];
	$.each(coords, function() {
		if (this.length) {
			var coord = this.split(",");
			if (coord.length == 2) {
				var x = parseFloat(coord[0]), y = parseFloat(coord[1]);
				if (!isNaN(x) && !isNaN(y))
					pts.push(new google.maps.LatLng(y, x));
			}
		}
	});
	return pts;
}

function createTimestepPoints(wmsSpec,cfg)//reieve post $.param(wmsSpec) value
{
	zoomLevel = map.zoom;
	$.get(cfg.django_base + "/ceracgi/cera_wfs?" + wmsSpec + "&SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&TYPENAME=track_timesteps&debug=on&data_host=" + cfg.data_host,
	function(xmlDoc){
		if(timestepMarkerList.length != 0)
		{
			$.each(timestepMarkerList, function(){
				this.setMap(null);
			});
		}
		timestepMarkerList = [];
		var markers = xmlDoc.documentElement.getElementsByTagName("ms:track_timesteps"); 
		var badxml = false;
		if (markers.length == 0) {                                         		                
			badxml = true;
			markers = xmlDoc.documentElement.getElementsByTagName("track_timesteps"); 
		}
			
		for(var i = 0; i < markers.length; i++) {
			var gmlpoint = markers[i].getElementsByTagName(badxml ? "Point" : "gml:Point");
			var gmlcoords = gmlpoint[0].getElementsByTagName(badxml ? "coordinates" : "gml:coordinates");
			var coords = getTextContent(gmlcoords[0]).split(",");
			var pt = new google.maps.LatLng(parseFloat(coords[1]), parseFloat(coords[0]));
			
			var msdatetime = markers[i].getElementsByTagName(badxml ? "DATETIME" : "ms:DATETIME");
			var datetime = getTextContent(msdatetime[0]);
			var d = $.datepicker.parseDate('yymmdd', datetime.substring(0, 8));
			d.setHours(parseInt(datetime.substring(9, 11)));
			
			var mstime;
			if (cfg.timezone != 'utc')
				mstime = markers[i].getElementsByTagName(badxml ? "TIME" : "ms:TIME");
			else
				mstime = markers[i].getElementsByTagName(badxml ? "TIMEUTC" : "ms:TIMEUTC");
			var time = getTextContent(mstime[0]);
			
			//var iscurrent = current && (+d == +current);
			var isCurrent = false;
			timestepMarkerList.push(createTimestepMarker(map, pt, createTimestepIcon(map.getZoom(), isCurrent), json, d, time, isCurrent ? 10000001 : -1000000));
			timestepMarkerList[i].setMap(map);
		}
	});
	
	//markerList[count].setMap(map);
}

function getTextContent(node)
{
	if(!node) 
		return '';
	return node.textContent || node.firstChild.nodeValue;
}

function createTimestepIcon(zoomlevel, current)
{
// figure out required icon size depending on zoomlevel
    //alert(zoomlevel);
	var zoom; // = (zoomlevel % 2 == 1) ? zoomlevel - 1: zoomlevel - 2;
	if (zoomlevel <= 6)
		zoom = '5';
	else if (zoomlevel == 7 || zoomlevel == 8)
		zoom = '6';
	else if (zoomlevel == 9 || zoomlevel == 10)
		zoom = '8';
	else if (zoomlevel >= 11)
		zoom = '10';

	//track timestep symbol
	var image;
	if (current)
		image = "../cera/_marker/track" + zoom + "timestep_curr.png";	// production code
	else
		image = "../cera/_marker/track" + zoom + "timestep.png"; 
	
	var trackIcon = new google.maps.MarkerImage(
		image,
		/*{
			icon: {
				path: google.maps.SymbolPath.CIRCLE,
				scale: 10
			}
		}*/
		new google.maps.Size(17, 17),
		new google.maps.Point(0, 0),
		new google.maps.Point(9, 9)
		);

	return { icon: trackIcon, imageMap: new Array(1, 1, 1, 17, 17, 17, 17, 1), infoWindowAnchor: new google.maps.Point(9, 9) };
}

function createTimestepMarker(map, point, icon, data_array, date, time, zindexprocess)//only create the marker 
{
	var opts = { 
		icon: /*icon.icon*/
			{
				path: google.maps.SymbolPath.CIRCLE,
				scale: map.getZoom(), // this will be changed on every zoom change
				strokeWeight: 0,
				fillOpacity: 1,
				fillColor: "black"  
			},
		title: time,
		anchorPoint: icon.infoWindowAnchor,
		shape: { 
			coord: icon.imageMap, 
			type: 'poly' 
		},
		position: point
	};
	if (zindexprocess) 
		opts.zIndex = zindexprocess;
	
	var marker = new google.maps.Marker(opts);
	
	google.maps.event.addListener(marker, "click", 
		function() {
			infoWindow.setContent(time);
			infoWindow.open(map, marker);
			/*if (!map.maptoolsControl || !map.maptoolsControl.enabledTrackQuery()) 
				select_timestep_layer(data_array, date);*/
			jumpTrackPoint(time);
		});
	return marker;
}

function createTrackPoints(wmsSpec, cfg)
{
	// read map layer 'track_labels' via WFS (to create track points and labels)
	$.get(cfg.django_base + "/ceracgi/cera_wfs?" + wmsSpec + "&SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&TYPENAME=track_labels&debug=on&data_host=" + cfg.data_host, //getting xml
		function(xmlDoc) {   //function to process the state change events that happen on that request
			if(trackMarkerList.length != 0)
			{
				$.each(trackMarkerList, function(){
					this.setMap(null);
				});
			}
			trackMarkerList = [];
			// obtain the array of markers and loop through it
			// once the data has been read, the event function can grab a collection of data from the XML tags
			var markers = xmlDoc.documentElement.getElementsByTagName("ms:track_labels"); 
			var badxml = false;
			if (0 == markers.length) {
				badxml = true;
				markers = xmlDoc.documentElement.getElementsByTagName("track_labels"); 
			}
			
			for (var i = 0; i < markers.length; ++i) {
				// obtain the attribues of each marker
				var gmlpoint = markers[i].getElementsByTagName(badxml ? "Point" : "gml:Point");
				var gmlcoords = gmlpoint[0].getElementsByTagName(badxml ? "coordinates" : "gml:coordinates");
				var mslabel; 
				if (cfg.timezone != 'utc')
					mslabel = markers[i].getElementsByTagName(badxml ? "TIME" : "ms:TIME");
				else
					mslabel = markers[i].getElementsByTagName(badxml ? "TIMEUTC" : "ms:TIMEUTC");
				var mscategory = markers[i].getElementsByTagName(badxml ? "CATEGORY" : "ms:CATEGORY");

				var msdatetime = markers[i].getElementsByTagName(badxml ? "DATETIME" : "ms:DATETIME");
				var datetime = getTextContent(msdatetime[0]);
				var d = $.datepicker.parseDate('yymmdd', datetime.substring(0, 8));
				//d.setHours(parseInt(datetime.substring(9, 11)) + 1);
				d.setHours(parseInt(datetime.substring(9, 11)));
				var category = getTextContent(mscategory[0]);
				
				var coords = getTextContent(gmlcoords[0]).split(",");
				var pt = new google.maps.LatLng(parseFloat(coords[1]), parseFloat(coords[0]));
				
				var opts = { 
					icon: /*icon.icon*/
						{
							path: google.maps.SymbolPath.CIRCLE,
							scale: map.getZoom() + 5, // this will be changed on every zoom change
							strokeWeight: 0,
							fillOpacity: 1,
							fillColor: "red",
							infoWindowAnchor: new google.maps.Point(9, 9)
						},
					title: cfg.time,
					anchorPoint: new google.maps.Point(9, 9),
					position: pt
					};
								
				var marker = new google.maps.Marker(opts);
				marker.setMap(map);
				trackMarkerList.push(marker);
				//map.overlays.push(marker);
				
			}
		});
}

//function createTrackLine(map, cfg, wms_spec, newlevel)
function createTrackLine(wmsSpec, cfg)//accept post $.param(wmsSpec) value
{
	zoomLevel = map.zoom;	
	$.get(cfg.django_base + "/ceracgi/cera_wfs?" + wmsSpec + "&SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&TYPENAME=track_lines&debug=on&data_host=" + cfg.data_host,
		function(xmlDoc) {   //function to process the state change events that happen on that request
			if(lineList.length != 0)
			{
				$.each(lineList, function(){
					this.setMap(null);
				});
			}
			lines = xmlDoc.documentElement.getElementsByTagName("ms:track_lines"); 
			var badxml = false;
			if (0 == lines.length) {
				badxml = true;
				lines = xmlDoc.documentElement.getElementsByTagName("track_lines"); 
			}
			// obtain the attribues of each line segment
			for (var i = 0; i < lines.length; i++) {				
				var cls = getClass(lines[i], badxml);
				var gmllinestring = lines[i].getElementsByTagName(badxml ? "LineString" : "gml:LineString");
				var gmlcoords = gmllinestring[0].getElementsByTagName(badxml ? "coordinates" : "gml:coordinates");
				var color = '#555';
				if (cls != "3") 
					color = '#500000';
				var poly = new google.maps.Polyline({
					path: getTimestepPointsFromXML(gmlcoords[0]), 
					strokeColor: color, 
					strokeWeight: 2, 
					strokeOpacity: 1, 
					clickable: false,
					geodesic: true,
					map: map
				});
				poly.setMap(map);
				lineList.push(poly);
			}
		});
}

function createLegend(wmsSpec, cfg){//accept raw wmsSpec
	layer_data = { 
				"com": wmsSpec.com,
				"layer": "",
				"tz": cfg.timezone,
				"data_host": cfg.data_host
			};
			
	var params = "id=" + layer_data.com + "/tz=" +layer_data.tz + "/layer=" + "0";
	if (layer_data.dev) 
		params = params + "/dev=" + layer_data.dev;
		
	$.get(cfg.django_base+"/adcircrun/" + params + ".html", 
		function(response) {
			$('#legend').html(response);
		});
}

function getClass(marker, badxml)
{
	var msclass = marker.getElementsByTagName(badxml ? "CLASS" : "ms:CLASS");
	if (!msclass[0])
		msclass = marker.getElementsByTagName(badxml ? "class" : "ms:class");
	return getTextContent(msclass[0])
}