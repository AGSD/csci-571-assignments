var directionsService = null;
var directionsDisplay = null;
var map = null;
var pano = null;
var dest = null;

/*For the autocomplete javascript*/
function initAutocompletes() {        
    var input = document.getElementById('pac-input');


    var autocomplete = new google.maps.places.Autocomplete(input);

    // Bind the map's bounds (viewport) property to the autocomplete object,
    // so that the autocomplete requests use the current map bounds for the
    // bounds option in the request.


    autocomplete.addListener('place_changed', function() {
      var place = autocomplete.getPlace();
      if (!place.geometry) {
        // User entered the name of a Place that was not suggested and
        // pressed the Enter key, or the Place Details request failed.
        window.alert("No details available for input: '" + place.name + "'");
        return;
      }


      var address = '';
      if (place.address_components) {
        address = [
          (place.address_components[0] && place.address_components[0].short_name || ''),
          (place.address_components[1] && place.address_components[1].short_name || ''),
          (place.address_components[2] && place.address_components[2].short_name || '')
        ].join(' ');
      }
    });
    
    var input2 = document.getElementById('mapFrom');
    var autocomplete2 = new google.maps.places.Autocomplete(input2);

    // Bind the map's bounds (viewport) property to the autocomplete object,
    // so that the autocomplete requests use the current map bounds for the
    // bounds option in the request.


    autocomplete2.addListener('place_changed', function() {
      var place2 = autocomplete2.getPlace();
      if (!place2.geometry) {
        // User entered the name of a Place that was not suggested and
        // pressed the Enter key, or the Place Details request failed.
        window.alert("No details available for input: '" + place2.name + "'");
        return;
      }


      var address2 = '';
      if (place2.address_components) {
        address2 = [
          (place2.address_components[0] && place2.address_components[0].short_name || ''),
          (place2.address_components[1] && place2.address_components[1].short_name || ''),
          (place2.address_components[2] && place2.address_components[2].short_name || '')
        ].join(' ');
      }
    });
}

function initMap(latitude,longitude){
    console.debug("map opening with latitude="+latitude+", longitude="+longitude);
    
    directionsService = new google.maps.DirectionsService();
    directionsDisplay = new google.maps.DirectionsRenderer();
    directionsDisplay.setPanel(document.getElementById('panel'));
    
    var uluru = {lat: Number(latitude),lng: Number(longitude)};
    dest = uluru;
    
    map = new google.maps.Map(document.getElementById('map'), {
      zoom: 13,
      center: uluru
    });
    directionsDisplay.setMap(map);
    
    marker = new google.maps.Marker({
          position: uluru,
          map: map
    });
    

    //rama.setVisible(true);
    //map.setStreetView(panorama);
    $("#pano").hide();
}

function calcRoute() {
    var from = $("#mapFrom").val();
    var to = $("#mapTo").val();//{lat:destLat, lng:destLng};
    var mode = $("#mapMode").val();
    
    from = from.trim();
    
    if(from=="Your Location"){
        from = {lat:searchAtt["geo"].lat, lng:searchAtt["geo"].lon};
    }
    
    marker.setMap(null);
    
    var request = {
        origin: from,
        destination: to,
        travelMode: google.maps.TravelMode[mode],
        provideRouteAlternatives: true
    };
    
    directionsService.route(request, function(response, status) {
        if (status == 'OK') {
            directionsDisplay.setDirections(response);
        }
    });
    
    return false;
}

function toggleMapView(){
    if($("#pano").is(':visible')){
        $("#pano").hide();
        $("#map").show();
        $("#toggleImage").html('<img width=40px src="http://cs-server.usc.edu:45678/hw/hw8/images/Pegman.png">');
    }
    else{   //map visible
        $("#map").hide();
        $("#pano").show();
        $("#toggleImage").html('<img width=40px src="http://cs-server.usc.edu:45678/hw/hw8/images/Map.png">');
        if(!pano){
            panorama = new google.maps.StreetViewPanorama(document.getElementById('pano'),{
                position: dest,
                pov:{
                    heading: 34,
                    pitch: 10
                },
                zoom: 1
            });
        }
    }
}
