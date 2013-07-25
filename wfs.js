function createTrackPoints(wmsSpec,cfg)//reieve post $.param(wmsSpec) value
{
	zoomLevel = map.zoom;
	//remeber to add in django.data_host to the front before uploading it to the server. hardcoding was purely for testing purposes.
	$.get(cfg.django_base + "/ceracgi/cera_wfs?" + wmsSpec + "&SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&TYPENAME=track_timesteps&debug=on&data_host=" + cfg.data_host,
	function(xmlDoc){
		if(markerList.length != 0)
		{
			$.each(markerList, function(){
				this.setMap(null);
			});
		}
		markerList = [];
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
			markerList.push(createTimestepMarker(map, pt, createTimestepIcon(map.getZoom(), isCurrent), json, d, time, isCurrent ? 10000001 : -1000000));
			markerList[i].setMap(map);
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
	if (zoomlevel <= 6) {
		zoom = '5';
	}	
	else if (zoomlevel == 7 || zoomlevel == 8) {
		zoom = '6';
	}
	else if (zoomlevel == 9 || zoomlevel == 10) {
		zoom = '8';
	}
	else if (zoomlevel >= 11) {
		zoom = '10';
	}

	//track timestep symbol
	var image;
	if (current)
		//image = "http://cera.cct.lsu.edu/cera/_marker/track" + zoom + "timestep_curr.png";	// testing/dev at home code
		image = "../cera/_marker/track" + zoom + "timestep_curr.png";	// production code
	else
		//image = "http://cera.cct.lsu.edu/cera/_marker/track" + zoom + "timestep.png";	
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

function createTimestepMarker(map, point, icon, data_array, date, time, zindexprocess) 
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
	/* 
	google.maps.event.addListener(marker, "click", 
		function() {
			if (!map.maptoolsControl || !map.maptoolsControl.enabledTrackQuery()) 
				select_timestep_layer(data_array, date);
		});
	*/
	return marker;
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
					path: getPointsFromXML(gmlcoords[0]), 
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

function getClass(marker, badxml)
{
	var msclass = marker.getElementsByTagName(badxml ? "CLASS" : "ms:CLASS");
	if (!msclass[0])
		msclass = marker.getElementsByTagName(badxml ? "class" : "ms:class");
	return getTextContent(msclass[0])
}

function getPointsFromXML(xmlnode)
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