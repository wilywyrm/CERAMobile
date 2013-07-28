function refresh(){
  	var layerIndex = $('#layers div.button-selected').index();
  	var hurricaneIndex = $('#hurricanes div.button-selected').index();
	var tempDeferred = 
		$.getJSON(JSONURL, function(data) {
	  		json = data;
	  			
  			var layerHTML = [];
			var count = 0;
			layerList = [];
			
			$.each(json.layers, function(layer, value) {
				if(value && (layer.indexOf('max') != -1)) // if the layer option is true (available)
				{
					layerHTML.push('<div class=\'dropdown-item\' onclick="jumpLayer(' + count + ')">' + layer + '</div>');
					layerList.push(layer);
					count++;
				}
			});
			$('#layers').html(layerHTML.join(''));
			
			var hurricaneHTML = [];
			hurricaneList = [];
			count = 0;
			//year -> data -> text,value,year
			$.each(json.years, function()
			{
				$.each(this.data, function()
				{
					hurricaneList.unshift(this);
					count++;
				})
			})
			
			$.each(json.years, function()
			{
				$.each(this.data, function()
				{
					count--;
					hurricaneHTML.unshift('<div class=\'dropdown-item\' onclick="jumpHurricane(' + count + ')">' + this.text + '</div>');
				})
			})
			$('#hurricanes').html(hurricaneHTML.join(''));		
			
			if(hurricaneIndex != -1)
				$('#hurricanes').find('div:eq('+ hurricaneIndex + ')').addClass("button-selected");
			
			if(layerIndex != -1)
				$('#layers').find('div:eq('+ layerIndex + ')').addClass("button-selected");
	  		});
  	  return tempDeferred;
}
		  	
function getLatestJSONURL(index){
	if(hurricaneList.length != 0 && hurricaneList[index] != null)
		return "http://cera.cct.lsu.edu/cera_data/adcircrun/day=/time=/id=/yr=" + hurricaneList[index].year + "/stormnr=" + hurricaneList[index].value + "/adv=/tracknr=/tz=cdt/asgs=ng/dev=0.json";
	else
		return "http://cera.cct.lsu.edu/cera_data/adcircrun/day=/time=/id=/yr=/stormnr=/adv=/tracknr=/tz=cdt/asgs=ng/dev=0.json"; //defaults to latest
}

function returnImageList(map, layerIndex)
{
	var cfg = getConfigData();
	var wmsSpec = wmsSpecDataGenerator(cfg);
	createLegend(wmsSpec,cfg);//accepts raw wmsSpec data
	wmsSpec = $.param(wmsSpec);
	createTrackLine(wmsSpec,cfg);	
	createTimestepPoints(wmsSpec,cfg);
	createTrackPoints(wmsSpec, cfg);
	var wms_url = wmsUrlGenerator(wmsSpec);
	var overlay = new google.maps.ImageMapType(
	{
		getTileUrl: function(tile, zoom) {
			// tile.x,y delivers the Google tile number 
			// *256 = pixel coordinates related to 0,0 (UL) of Google Maps
			// map.getProjection() (Point) returns projected Mercator x,y coordinates -> convert pixel coord to projected coord
			// PixelCoordinate = ProjectedCoordinate(x,y) * 2 exp(zoomLevel) [== Math.pow(2, zoom)]
			// convert projected ccord to LatLng coordinates for MapServer request
			var proj = map.getProjection();
			var zfactor = Math.pow(2, zoom);
			var ul = proj.fromPointToLatLng(new google.maps.Point(tile.x * 256 / zfactor, tile.y * 256 / zfactor) ); 
			var lr = proj.fromPointToLatLng(new google.maps.Point((tile.x + 1) * 256 / zfactor, (tile.y + 1) * 256 / zfactor)); 
			var url_data = {
				"REQUEST": "GetMap",
				"SERVICE": "WMS",
				"VERSION": "1.1.1",
				"LAYERS": layerList[layerIndex],
				"STYLES": "default",
				"FORMAT": "image/png",
				"BGCOLOR": "0xFFFFFF",
				"SRS": "EPSG:4326",
				"WIDTH": 256,
				"HEIGHT": 256,
				"BBOX" : ul.lng() + "," + lr.lat() + "," + lr.lng() + "," + ul.lat(),
				"TRANSPARENT": "TRUE",
				"reaspect": "false"
			};

			if(layerList[layerIndex] == null || typeof layerList[layerIndex] === "undefined")
				url_data.LAYERS = "maxelevhist";
				
			url_data.LAYERS += ",griddomain";
				
			var url;
			if(typeof json.nr_cache_hosts === "undefined")
				url = "http://tc" + ((tile.x % 4)+1) + '.' + wms_url + "&" + $.param(url_data);
			else
				url = "http://tc" + ((tile.x % json.nr_cache_hosts)+1) + '.' + wms_url + "&" + $.param(url_data);
				
			return url;
		},
		tileSize: new google.maps.Size(256, 256),
		isPng: true	
	});
	return overlay;
}

function wmsUrlGenerator(wmsSpec)//receive post $.param(wmsSpec) value
{
	wms_url = "cera.cct.lsu.edu/cera_data/ceracgi/cera_wms_tiled?" + wmsSpec;
	return wms_url;
}

function wmsSpecDataGenerator(cfg)
{
	var time = selectIndex(json.times); 
	var com = selectIndex(json.comments_day);
	var storm_year = selectIndex(json.years);
	var day = selectIndex(json.dates); 
	var wms_spec_data = { 
		"day": day, 
		"time": time, 
		"com": com,
		"griddomain": json.grid.name, 
		"tz": cfg.timezone
	};
	return wms_spec_data;
}

function selectIndex(array)
{
	for(var i = 0; i < array.length; i++)
		if(array[i].selected != null)
			return array[i].value;
	return -1; // really oughtn't happen
} 	
			
function getConfigData()
{
	var config_data = {
		isdefault: "1",
		trackline_check: false,
		hydro_check: false,
		prec_check: false,
		query: false,
		trackquery: false,
		maptype: "ROADMAP",
		sw: [ 21,-97 ],
		ne: [ 37,-74 ],
		zoom: "",
		anilayer: "",
		django_base: "/cera_data",
		//django_base: "http://cera.cct.lsu.edu/cera_data",
		data_url: "/cera_data/adcircrun/day=/time=/id=/yr=/stormnr=/adv=/tracknr=/tz=cdt/asgs=ng",
		cgi_base: "/cgi-cera",
		timezone: "cdt",
		asgs: "ng",
		selectmenu: 0,
		mapextent: "gulf",
		mapextent_data: [
			{ value: "gulf", text: "Gulf / Atlantic" },
			{ value: "ng", text: "Northern Gulf" },
			{ value: "al", text: "Alabama" },
			{ value: "la", text: "Louisiana" },
			{ value: "ms", text: "Mississippi" },
			{ value: "orleans", text: "New Orleans" },
			{ value: "custom", text: "- Custom -", default_entry: true }
		],
		maptools: 0,
		googlekey: "AIzaSyADfBA05E4I5N2GCpEQqMvQwOngVbaKuxQ",
		data_host: json.data_host
	};
	//console.log("in getconfig");
	return config_data;
}	