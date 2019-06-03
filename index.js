// Example url
//    <script async defer src="https://maps.googleapis.com/maps/api/js?key={apiKey}&callback=initMap"></script>

var $div = $('#time');


function isValidKey(val)
{
	return val !== null && val.length > 0;
}

let searchParams = new URLSearchParams(window.location.search);
if (searchParams.has('reset'))
{
	window.localStorage.setItem('apiKey', '');
	window.localStorage.setItem('startAddress', '');
	window.localStorage.setItem('endAddress', '');
}

let apiKey = window.localStorage.getItem('apiKey');
let startAddress = window.localStorage.getItem('startAddress');
let endAddress = window.localStorage.getItem('endAddress');

function tryLoad()
{
	if (isValidKey(apiKey) && isValidKey(startAddress) && isValidKey(endAddress))
	{
		$.getScript("https://maps.googleapis.com/maps/api/js?key=" + apiKey + "&callback=initMap");
		return true;
	}
	else
		return false;
}

if (tryLoad() === false)
{
	apiKey = prompt("Enter Google Directions API Key:");
	startAddress = prompt("Enter Start Address:");
	endAddress = prompt("Enter End Address:");
	
	window.localStorage.setItem('apiKey', apiKey);
	window.localStorage.setItem('startAddress', startAddress);
	window.localStorage.setItem('endAddress', endAddress);
	if (tryLoad())
		alert("Saved! Use ?reset if you need to reinput the data");
	else
		alert("Invalid data! Reload the page to try again.");
}

function initMap()
{
  directionsService = new google.maps.DirectionsService;

  updateRoute();
  setInterval(tick, 60 * 1000);
  //driveTime.addEventListener("click", updateRoute);
  
	setInterval(updateTime, 1000);
	updateTime();
}

function updateTime()
{
	// Set the current time and date on the clock
    $div.html(new Date().toLocaleTimeString());
}


var driveTime = document.getElementById("driveTime");
var lastUpdated = document.getElementById("lastUpdated");
var routesDiv = document.getElementById("routes");

var directionsService;
// Called by the api request

var times = ["9:00am", "9:10am", "9:20am", "9:30am", "9:40am"];

var goalArrivalTime;
var getReadyTime;
var warningBuffer;

function getTimeStr(d)
{
  d = d || new Date();
  var h = (d.getHours() % 12) == 0 ? 12 : d.getHours() % 12;
  var m = (d.getMinutes() < 10 ? "0" : "") + d.getMinutes();
  var ampm = d.getHours() < 12 ? "am" : "pm";
  return timeStr = h + ":" + m + ampm;
}

function tick()
{
  var timeStr = getTimeStr();
  console.log("Checking time: " + timeStr);
  if (times.includes(timeStr))
	  updateRoute();
  else
	  updateRouteDisplay();
}

var routes;
var fastestRoute;
function updateRouteDisplay()
{
  var routeDivs = document.getElementsByClassName("route");
  for (var i = 0; i < routeDivs.length; i++)
  {
	  if (i == 0)
		  routeDivs[i].classList.add("selected");
	  else
		  routeDivs[i].classList.remove("selected");
  }
  let now = new Date();
  let minDrive = Math.round(fastestRoute.legs[0].duration_in_traffic.value / 60);
  let minShower = 20;
  let etaDate = new Date((new Date()).getTime() + (minDrive + minShower) * 60000);
  let etaStr = getTimeStr(etaDate);
  document.getElementById("eta").innerHTML = "ETA: " + etaStr;
  document.getElementById("eta").style.color = etaDate.getHours() < 10 ? (etaDate.getMinutes() < 55 ? "green" : "yellow") : "red";
}

function updateRoute()
{
  console.log("Getting fresh directions @ " + getTimeStr());
  directionsService.route({
	  origin: startAddress,
	  destination: endAddress,
	  provideRouteAlternatives: true,
	  travelMode: 'DRIVING',
	  drivingOptions: {
		  departureTime: new Date()
	  },
  }, function (response, status)
	  {
		  if (status === 'OK')
		  {
			  lastUpdated.innerHTML = "Last updated: " + getTimeStr();
			  console.log("GOT fresh directions @ " + new Date().toLocaleTimeString());
			  console.log("GOT routes:  " + response.routes.length);

			  routes = response.routes;
			  routes.sort((a, b) => (a.legs[0].duration_in_traffic.value > b.legs[0].duration_in_traffic.value) ? 1 : -1)
			  fastestRoute = routes[0];

			  routesDiv.innerHTML = "";
			  for (var i = 0; i < response.routes.length; i++)
			  {
				  var newDiv = document.createElement("div");
				  var route = response.routes[i];
				  newDiv.innerHTML = route.summary + " - " + route.legs[0].duration_in_traffic.text;
				  newDiv.classList.add("route");
				  newDiv.setAttribute("routeId", i);
				  routesDiv.appendChild(newDiv);
			  }

			  updateRouteDisplay();

		  } else
		  {
			  console.log("GOT BAD directions @ " + new Date().toLocaleTimeString());
			  //driveTime.innerHTML = "Directions request failed due to " + status;
			  //window.alert('Directions request failed due to ' + status);
		  }
	  });
}