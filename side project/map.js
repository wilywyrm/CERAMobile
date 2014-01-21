var map;
var pos;

function init(){
	setResolution()
	geolocation().done(initialize);
}

var initialize = function(){
	var mapOptions = {
		center: pos,
		zoom: 8,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};
	//console.log(pos);
	map = new google.maps.Map(document.getElementById('map_canvas'),mapOptions);
	//console.log("in init");
};

var geolocation = function() {
	//console.log("in here");
	var def =$.Deferred();
	if(navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(
	    function(position)
	    {
	    	pos = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
	    	//console.log("in geo");
	    	def.resolve(); 
	    });
	  }
	//console.log("outside");
	return def;	
};

function setResolution()
{
	var width = $(window).width();
		height = $(window).height();
	$("#map_canvas").css("width",width);
	$("#map_canvas").css("height",height * .8);
}
