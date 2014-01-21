function getData(){
var name = $("#name").val();
	street = $("#street").val();
	state = $("#state").val();
	zipcode = $("#zipcode").val();
	electricity = $("#electricity").val();
	injury = $("#injury").val();
	injuryInfo = $("#additionalInformation").val();
}

$("#geolocation").change(function(){
	console.log("in here");
	$("#street").textinput('disable');
}); 
