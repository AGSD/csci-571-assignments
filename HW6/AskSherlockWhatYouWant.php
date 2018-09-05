<?php
    if(isset($_POST['submit'])){
        //debugging information
        /*echo "locationHere: ".$_POST['locationHere']."<br>";
        echo "keyword: ".$_POST['keyword']."<br>";
        echo "category: ".$_POST['category']."<br>";
        echo "distance: ".$_POST['distance']."<br>";
        echo "from: ".$_POST['from']."<br>";*/
        //debug info ends
        //echo "from: ".$_POST['from']."<br>";
        
        if($_POST["distance"]=="")
            $distance=10;
        else
            $distance=$_POST["distance"];
        
        global $lat;
        global $lon;
        
        if($_POST["from"]=="here"){
            $json = json_decode($_POST["locationHere"]);
            $lat = $json->latitude;
            $lon = $json->longitude;
        }
        else{
            //send grolocation API request get location
            $geourl = "https://maps.googleapis.com/maps/api/geocode/json?address=".urlencode($_POST['location'])."&key=AIzaSyCrfAO3ZtsLWHuPwHftEkVxdLBN0mo2auc";
            
            $geojson = file_get_contents($geourl);
            $p = json_decode($geojson);
            $lat = $p->results['0']->geometry->location->lat;
            $lon = $p->results['0']->geometry->location->lng;
        }
        
        $url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=".$lat.",".$lon."&radius=".($distance*1609.344)."&type=".$_POST["category"]."&keyword=".$_POST["keyword"]."&key=AIzaSyCNjadErl7caBRT2eqbHrpueihyBeBBxlI";
        
        $url2 = str_replace(' ','_',$url);
        //echo $url2;
        global $jsonObj;
        $jsonObj = file_get_contents($url2);
        
    }
    else if(isset($_GET['type'])){
        if($_GET['type']=="place"){
            $url = "https://maps.googleapis.com/maps/api/place/details/json?placeid=".$_GET['id']."&key=AIzaSyANADamvUs1UlzshelfMhI0Q6be8AdNizU";
            
            $placeJson = file_get_contents($url);
            
            $data = json_decode($placeJson);
            $key = "AIzaSyBHAFh1a03iURD1pJPltZAPiE6oo6egnC4";
            
            if(isset($data->result->photos)){
                $numPhotos = count($data->result->photos);
                $iter = min($numPhotos,5);
            }
            else
                $iter = 0;
            
            for($i=0; $i<$iter; $i++){
                $width = $data->result->photos[$i]->width;
                $height = $data->result->photos[$i]->height;
                $max = max($height, $width);
                
                $maxword = $max == $width ? "width" : "height"; 
                
                $ref = $data->result->photos[$i]->photo_reference;
                $url = "https://maps.googleapis.com/maps/api/place/photo?max".$maxword."=".$max."&photoreference=".$ref."&key=".$key;
                $photo = file_get_contents($url);
                
                $photoname = "image".$i.".jpeg";
                file_put_contents($photoname,$photo);
                
                $data->result->photos[$i]->photo_reference = $photoname;
            }
            
            echo $placeJson;
        }
        exit(0);
    }
?>

<!DOCTYPE html>
<html>
<head>
    <title>
        Where do you want to go today?
    </title>
    <meta charset="UTF-8">
    <style>
        
        #box {
            background-color: #fafafa;
            border: 2px solid #cccccc;
            height:185px;
            width:600px;
            margin:0 auto;
        }
        #headingBox {
            border-bottom: 1px solid #cccccc;
            font-size: 25px;
            /*padding: 5px;*/
            text-align: center;
            font-style: italic;
            margin: 5px;
        }
        #formBox {
            padding:5px;
        }
        #left {
            position:relative;
        }
        #right {
            position:relative;
            float:right;
            top: -20px;
            left: -120px;  
        }
        @media screen and (-webkit-min-device-pixel-ratio:0) /*chrome*/
            and (min-resolution:.001dpcm) {
            #right {
                position:relative;
                float:right;
                top: -20px;
                left: -90px;   
            } 
        }
        .noRec {
            background-color: #fafafa;
            text-align: center;
            width: 1000px;
            border: 1px solid grey;
        }
        .infoTable {
            border-collapse:collapse;
        }
        .infoTable thead {
            text-align: center;
        }
        .infoTable td{
            border:1px solid grey;
            padding-left:10px;
        }
        .placeTable {
            border-collapse:collapse;
            margin:0 auto;
            width:600px;
        }
        .placeTable td{
            border:1px solid grey;
            padding: 10px;
        }
        td a {
            text-decoration: none;
            color:black;
        }
        #placeData {
            text-align: center;
            margin:0 auto;
            width:600px;
        }
        .aButton {
            display: block;
            text-decoration: none;
            color: black;
            width: 150px;
            margin: 0 auto;
        }
        #map {
            width: 400px;
            height: 300px;
            background-color: grey;
        }
        #mapMenu{
            width:80px;
            position: relative;
        }
        #mapMenu a{
            background-color: #fafafa;
            text-decoration: none;
            padding: 12px;
            height: 20px;
            width:100%;
            display:block;
            color: black;
        }
        #mapMenu a:hover{
            background-color: #f0f0f0;
        }
        a.mapLink {
            transition:color .2s ease-out;
        }
        a.mapLink:hover{
            color:gray;
        }
        #buttons {
            position: relative;
            top:35px;
            left:62px;
            
        }
        #wrapper {
            width: 1000px;
            margin: 0 auto;
        }
    </style>
</head>
<body>
<div id='wrapper'>
    <div id='box'>
        <div id='headingBox'>Travel and Entertainment Search</div>
        <div id='formBox'>
            <form method='POST' action="AskSherlockWhatYouWant.php" name="searchForm">
                <div id='left'>
                    <b>Keyword</b> &nbsp<input name='keyword' type='text'><br/>
                    <b>Category</b> &nbsp<select name='category'>
                    <option value="default">default</option>
                    <option value="cafe">cafe</option>
                    <option value="bakery">bakery</option>
                    <option value="restaurant">restaurant</option>
                    <option value="beauty salon">beauty salon</option>
                    <option value="casino">casino</option>
                    <option value="movie theater">movie theater</option>
                    <option value="lodging">lodging</option>
                    <option value="airport">airport</option>
                    <option value="train station">train station</option>
                    <option value="subway station">subway station</option>
                    <option value="bus station">bus station</option>
                    </select>
                    <br/>
                <b>Distance(miles)</b> &nbsp<input name='distance' type='text' placeholder="10">&nbsp <b>from</b>
                </div>
                <div id='right'>
                <input name='from' id='radioHere' type='radio' onclick="setClickedHere(this.form);" value='here' checked>Here<br/>
                <input name='from' id='radioThere' type='radio' onclick="setClickedThere(this.form);" value=''><input type='text' name='location' placeholder='location' disabled/>
                </div>
                <div id='buttons'>
                    <input name='submit' onclick="setRequired(this.form);" id='search' type='submit' value='Search' disabled>
                    <button name='clear' type='button' onclick='clearData(this.form);'>Clear</button>
                </div>
                <input type='hidden' name='locationHere' id='locationHere' value=''>
            </form>
        </div>
    </div>
    <br>
    <div id="dataTable">
    </div>
    <div id="placeData">
    </div>
    <div id='map' hidden=true>
    </div>
    <div id='mapMenu' hidden=true>
        <a href="javascript:calcRoute('WALKING')">Walk there</a>
        <a href="javascript:calcRoute('BICYCLING')">Bike there</a>
        <a href="javascript:calcRoute('DRIVING')">Drive there</a>
    </div>
</div>
<script>
var placesData;
var title;
var currentLat;
var currentLon;
var arrowDown = "http://cs-server.usc.edu:45678/hw/hw6/images/arrow_down.png";
var arrowUp = "http://cs-server.usc.edu:45678/hw/hw6/images/arrow_up.png";
var mapOnAnchor;
var currentLatLon;
var clickedLatLon;
var directionsService;
var directionsDisplay;
var marker;

function clearData(f) {
    console.debug("Entered clearData");
    f[0].value="";f[0].placeholder=' ';
    f[0].required = false;
    f[1].value="default";
    f[2].value='';f[2].placeholder='10';
    f[3].value='here';
    setClickedHere();
    f[5].value='';f[5].placeholder='location';
    f[5].required = false;
    
    hideMap();
    document.getElementById('dataTable').innerHTML = "";
    document.getElementById('dataTable').className = "";
    document.getElementById('placeData').innerHTML = "";
    document.getElementById('placeData').className = "";
}

function setRequired(f){
    console.debug("entered setRequired");
    f[0].required = true;
    if(f[5].disabled==false) f[5].required=true;
}
function setData(){
    console.debug("inside setData");
    var f = document.forms["searchForm"];

    f[0].value="<?php if(isset($_POST['submit'])) echo $_POST['keyword']; ?>";
    f[1].value="<?php if(isset($_POST['submit']))echo $_POST['category']; ?>";
    f[2].value="<?php if(isset($_POST['submit'])) echo $_POST['distance']; ?>"; f[2].placeholder='10';
    f[3].value="<?php if(isset($_POST['submit'])) echo $_POST['from']; else echo 'here' ?>";
    
    if(f[3].value=="here")
        setClickedHere();
    else
        setClickedThere();
    
    f[5].value="<?php if(isset($_POST['location'])) echo $_POST['location']; ?>";f[5].placeholder='location';
    
    currentLat = "<?php if(isset($_POST['submit'])) echo $lat; ?>";
    currentLon = "<?php if(isset($_POST['submit'])) echo $lon; ?>";
    currentLatLon = {lat: Number(currentLat),lng: Number(currentLon)};
}

function buildTable(){
    console.debug("Inside buildTable");
    console.debug(placesData);
    
    if(placesData == '')
        return false;
    
    var p = placesData;
    var tb = document.getElementById('dataTable');
    var ntb = document.createElement("TABLE");
    tb.appendChild(ntb);
    ntb.style.width="1000px";
    
    if(p.status=="ZERO_RESULTS"){
        tb.className = "noRec";
        var row = ntb.insertRow(0);
        var cell = row.insertCell(0);
        cell.innerHTML = "No Records have been found";
        return;
    }
    else{
        ntb.className = "infoTable"; 
        
        //header
        var header = ntb.createTHead();
        var row = header.insertRow(0);
        var cell;
        cell = row.insertCell(); cell.innerHTML = "<b>Category</b>";
        cell = row.insertCell(); cell.innerHTML = "<b>Name</b>";
        cell = row.insertCell(); cell.innerHTML = "<b>Address</b>";
        
        //body
        var tbd = ntb.createTBody();
        tbd.style.textAlign = "left";
        var i;
        for(i=0; i<p.results.length; ++i){
            row = tbd.insertRow();
            
            cell = row.insertCell();
            cell.style.padding=0;
            var im = document.createElement("IMG");
            im.src = p.results[i].icon;
            im.height = 35;
            im.width = 50;
            cell.appendChild(im);
            
            cell = row.insertCell(); 
            var a = document.createElement('A');
            a.href = "javascript:getPlaceData(\""+encodeURI(p.results[i].place_id)+"\",\""+encodeURI(p.results[i].name)+"\");";
            a.innerHTML = p.results[i].name;
            cell.appendChild(a);
            var anchorid = "address"+i;
            a = document.createElement('A');
            a.id = anchorid;
            a.href = "javascript:showMap("+encodeURI(p.results[i].geometry.location.lat)+","+encodeURI(p.results[i].geometry.location.lng)+","+encodeURI(i)+","+encodeURI(p.results.length)+")";
            cell = row.insertCell();
            a.innerHTML = p.results[i].vicinity;
            a.className = "mapLink";
            cell.appendChild(a);
        }
    }
    console.debug(p.results[0].name);   
}
    
function getPlaceData(id,ti){
    hideMap();
    console.debug("Place id = "+id);
    title = ti;
    var url = document.URL+"?type=place&id="+id;
    ajax(url,parsePlaceData,true);
}

function parsePlaceData(response){
    console.debug(response);
    var p = JSON.parse(response);
    console.debug(p);
    
    var mainDiv = document.getElementById('placeData');
    mainDiv.innerHTML = "<p><b>"+title+"</b></p>";
    
    //create reviews
    var div1 = document.createElement('DIV');
    
    var arr = document.createElement('IMG');
    var a = document.createElement('A');
    a.innerHTML = "click to show reviews<br>";
    arr.src = arrowDown;
    arr.width="40";
    arr.id = "reviewToggle";
    a.href = "javascript:toggleTables(\'r\');";
    a.appendChild(arr);
    a.className = "aButton";
    div1.appendChild(a);
    
    var tbl = document.createElement('TABLE');
    tbl.id = "reviewTable";
    tbl.className = "placeTable";
    var row;
    var cell;
    var r;
    var img;
    var iter;
    
    if("reviews" in p.result)
        iter = Math.min(5,p.result.reviews.length)
    else
        iter = 0;
    
    for(var i=0; i<iter; ++i){
        r = p.result.reviews[i];
        row = tbl.insertRow();
        cell = row.insertCell();
        img = document.createElement('IMG');
        img.src = r.profile_photo_url;
        img.width = 35;
        cell.innerHTML = "<b>"+r.author_name+"</b>";
        cell.insertBefore(img,cell.firstChild);
        
        row = tbl.insertRow();
        cell = row.insertCell();
        cell.innerHTML = r.text;
        cell.style.textAlign = "left";
    }
    
    if(iter==0){
        row = tbl.insertRow();
        cell = row.insertCell();
        cell.innerHTML = "<b>No Reviews Found</b>";
        cell.style.padding = 0;
    }
    
    div1.appendChild(tbl);
    div1.appendChild(document.createElement('BR'));
    mainDiv.appendChild(div1);
    
    //create photo table
    var div2 = document.createElement('DIV');
    
    arr = document.createElement('IMG');
    arr.src = arrowDown;
    arr.width="40";
    arr.id = "photoToggle";
    a = document.createElement('A');
    a.innerHTML = "click to show photos<br>";
    a.href = "javascript:toggleTables(\'p\')";
    a.appendChild(arr);
    a.className = "aButton";
    div2.appendChild(a);
    
    tbl = document.createElement('TABLE');
    tbl.id = "photoTable";
    tbl.className = "placeTable";
    
    
    if("photos" in p.result)
        iter = Math.min(5,p.result.photos.length)
    else
        iter = 0;
    
    for(var i=0; i<iter; i++){
        row = tbl.insertRow();
        cell = row.insertCell();
        a = document.createElement('A');
        img = document.createElement('IMG');
        img.src = "image"+i+".jpeg";
        img.width = "600";
        a.href = img.src;
        a.target = "_blank";
        a.appendChild(img);
        cell.appendChild(a);
    }
    
    if(iter==0){
        row = tbl.insertRow();
        cell = row.insertCell();
        cell.innerHTML = "<b>No Photos Found</b>";
        cell.style.padding = 0;
    }
    div2.appendChild(tbl);
    mainDiv.appendChild(div2);
    
    var tableDiv = document.getElementById('dataTable');
    tableDiv.innerHTML = "";
    toggleTables('n');
    
}

function toggleTables(which){
    var arrR = document.getElementById('reviewToggle');
    var arrP = document.getElementById('photoToggle');
    var divP = document.getElementById('photoTable');
    var divR = document.getElementById('reviewTable');
    var parR = arrR.parentElement; 
    var parP = arrP.parentElement;
    
    if(which=='n'){  //none
        arrP.src = arrowDown;
        arrR.src = arrowDown;
        divR.hidden = true;
        divP.hidden = true;
        parR.innerHTML = "click to show reviews";
        parP.innerHTML = "click to show photos";
    }
    else if(which=='r'){
        console.debug("reviewToggle Pressed");
        
        var l = arrR.src;
        
        if(l==arrowDown){
            arrR.src = arrowUp;
            arrP.src = arrowDown;
            divP.hidden = true;
            divR.hidden = false;
            parR.innerHTML = "click to hide reviews";
            parP.innerHTML = "click to show photos";
        }
        else{
            arrR.src = arrowDown;
            arrP.src = arrowDown;
            divP.hidden = true;
            divR.hidden = true;
            parR.innerHTML = "click to show reviews";
            parP.innerHTML = "click to show photos";
        }
    }
    else if(which=='p'){
        console.debug("photoToggle Pressed");
        
        var l = arrP.src;
        
        if(l==arrowDown){
            arrR.src = arrowDown;
            arrP.src = arrowUp;
            divP.hidden = false;
            divR.hidden = true;
            parR.innerHTML = "click to show reviews";
            parP.innerHTML = "click to hide photos";
        }
        else{
            arrR.src = arrowDown;
            arrP.src = arrowDown;
            divP.hidden = true;
            divR.hidden = true;
            parR.innerHTML = "click to show reviews";
            parP.innerHTML = "click to show photos";
        }
    }
    parR.appendChild(arrR);
    parP.appendChild(arrP);
}
    
function setClickedHere(f=document.forms["searchForm"]){
    //f.location.required = false;
    f.location.disabled = true;
    var r = document.getElementById('radioHere');
    var r2 = document.getElementById('radioThere');
    r.value="here";
    r.checked=true;
    r2.checked=false;
}    

function setClickedThere(f=document.forms["searchForm"]){
    //f.location.required = true;
    f.location.disabled = false;
    var r = document.getElementById('radioHere');
    var r2 = document.getElementById('radioThere');
    r2.value="";
    r.checked=false;
    r2.checked=true;
}   
    
function ajax(url,callb,t=true){
    var xhttp = new XMLHttpRequest;
    xhttp.onreadystatechange = function () {
        if(this.readyState==4){
            if(this.status==200)
                callb(this.responseText);
            else{
                console.debug("xhttp didn't work, status = "+this.status);
            }
        }
    };
    
    xhttp.open("GET",url,t);
    xhttp.send();
}
    
function getGeolocation(response){
    console.debug("got geolocation");
    var p = JSON.parse(response);
    
    var lat = p.lat;
    var lon = p.lon;
    
    console.debug("Latitude and longitude: "+lat+" "+lon);
    
    //enable the search button
    console.debug("enabling search button!");
    var btn = document.getElementById("search");
    btn.disabled = false;
    
    var locHere = document.getElementById("locationHere");
    //locHere.value="{'latitude':"+p.lat+",'longitude':"+p.lon+"}";
    locHere.value=JSON.stringify({"latitude":p.lat,"longitude":p.lon});
    
}

function initMap(latitude,longitude){
    console.debug("map opening with latitude="+latitude+", longitude="+longitude);
    if(!latitude)
        return;
    
    directionsService = new google.maps.DirectionsService();
    directionsDisplay = new google.maps.DirectionsRenderer();
    
    var uluru = {lat: Number(latitude),lng: Number(longitude)};
    var map = new google.maps.Map(document.getElementById('map'), {
          zoom: 13,
          center: uluru
    });
    directionsDisplay.setMap(map);
    
    marker = new google.maps.Marker({
          position: uluru,
          map: map
    });
    
    clickedLatLon = uluru;
}

function hideMap(){
    var m = document.getElementById("map");
    var mapmenu = document.getElementById("mapMenu");
    m.innerHTML = "";
    m.hidden = true;
    mapmenu.hidden=true;
}
    
function showMap(lat,lng,a_id,totalAds){
    console.debug("showing map for anchor "+a_id+" total = "+totalAds);
    var m = document.getElementById("map");
    var mapmenu = document.getElementById("mapMenu");
    
    if(mapOnAnchor == a_id){ //map is visible for this anchor, hide it
        hideMap();
        mapOnAnchor = -1;
        return;
    }
    
    m.hidden=false;
    
    var a = document.getElementById("address"+a_id);
    console.debug(a.parentElement);
    var tdWidth = window.getComputedStyle(a.parentElement,null).getPropertyValue("width");
    var tdHeight = window.getComputedStyle(a.parentElement,null).getPropertyValue("height");
    
    
    var mapWidth = 400;
    var mapHeight = 300;
    var wrapperWidth = 1000;
    var menuWidth = 80;
    
    tdWidth = parseFloat(tdWidth,10);
    tdHeight = parseFloat(tdHeight,10);
    
    m.style.left = String((wrapperWidth/2)-tdWidth+(mapWidth/2))+"px"; //400 is half of 800 which is the size of the viewable wrapper
    m.style.margin = "0 auto";
    m.zIndex = 1;
    m.style.top = String(-(totalAds-1-a_id)*(tdHeight+2.8)-10)+"px";
    
    mapmenu.style.position = "relative";
    mapmenu.style.margin = "0 auto";
    mapmenu.zIndex = 5;
    mapmenu.hidden=false;
    mapmenu.style.top = String(parseFloat(m.style.top,10)-mapHeight)+"px";
    console.debug("top "+mapmenu.style.top);
    mapmenu.style.left = String((wrapperWidth/2)-tdWidth+(menuWidth/2))+"px";
    
    initMap(lat,lng);
    mapOnAnchor = a_id;
}

function calcRoute(mode) {
    console.debug(currentLatLon);
    console.debug(clickedLatLon);
    marker.setMap(null);
    
    var request = {
        origin: currentLatLon,
        destination: clickedLatLon,
        travelMode: google.maps.TravelMode[mode]
    };
    directionsService.route(request, function(response, status) {
        if (status == 'OK') {
            directionsDisplay.setDirections(response);
        }
    });
}
    
window.onload = function() {
    ajax("http://ip-api.com/json",getGeolocation,true);
    placesData = <?php global $jsonObj; if(isset($_POST['submit'])) echo $jsonObj; else echo '""' ?>;
    currentLat = null;
    currentLon = null;
    currentLatLon = null;
    clickedLatLon = null;
    directionsService = null;
    directionsDisplay = null;
    marker = null;
    mapOnAnchor = -1;
    
    if(placesData != ''){   //form was submitted
        setData();
        buildTable();
    }
    var directionKey = "AIzaSyC0FooO_kXlqoFsbe7SemoWRxHyAr8yaFA";
};
</script>
<script async defer
    src="https://maps.googleapis.com/maps/api/js?key=AIzaSyAbp8DlTn-ps7H-YImJUnmtIkya7uUX6iI">
</script>
</body>
</html>
