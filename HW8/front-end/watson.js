var pages = [];
var pageNum = 0;
var favPageNum = 0;
var detailed_place = 0;
var googleReviews = null;
var yelpReviews = null;
var favourites = null;
var detailed_place_id = null;

var searchAtt = {   //attributes to be set for the search button to start working
    "keyword":"",
    "pac-input":"",
    "geo":""
};

//var urlprefix="http://sherlocked.us-west-1.elasticbeanstalk.com/";
var urlprefix="http://localhost:8081/";

$(document).ready(function() {  //initialisation 
    console.debug("document is ready");
    
    //$("#tablePages").hide();
    $("#detailsButton").hide();
    $("#progressBar").hide();
    $("#infoGoogle").hide();
    
    //Setting event handlers for form validation
    $("#keyword").blur(function() {
        validateForm("keyword");
    }).keyup(function(){
        validateForm("keyword");
    });
    $("#pac-input").blur(function() {
        validateForm("pac-input");
    }).keyup(function(){
        validateForm("pac-input");
    });
    
    if(window.localStorage.getItem("favs")!=null)
        favourites = JSON.parse(window.localStorage.getItem("favs"));
    else
        favourites = {};
    console.debug("favourites is ",favourites);
    
    $("#mapFrom").blur(validateMapFrom).keyup(validateMapFrom).focus(validateMapFrom);
    
    //initial radio button configuration
    setClickedHere();
    
    detailsNavbar("Info");
    directionsService = null;
    directionsDisplay = null;
    
    //ajax call for geolocation
    $.ajax({
        url:"http://ip-api.com/json",
        dataType:"JSON",
        success: function(result){
            console.debug(result);
            p = result;
            searchAtt["geo"] = {lat:p.lat,lon:p.lon};
            console.debug(searchAtt["geo"]);
        }
    });
    
    if($(document).width()<=480){
        $("#placesTable").addClass("pre-scrollable");
    }

});

function clearEverything(){
    console.debug("clearing");
    
    $("detailsButtonBtn").attr("disabled","disabled");
    
    $("#placesTable").html('');
    $("#favTable").html('');
    $("#pageButtons").html('');
    $("#favPageButtons").html('');
    $("#tablePagesWarning").html('');
    $("#favPagesWarning").html('');
    $("#reviewTypeButton").html('Google Reviews');
    
    pages = [];
    pageNum = 0;
    favPageNum = 0;
    detailed_place = 0;
    googleReviews = null;
    yelpReviews = null;
    favourites = null;
    detailed_place_id = null;
    
    if(window.localStorage.getItem("favs")!=null)
        favourites = JSON.parse(window.localStorage.getItem("favs"));
    else
        favourites = {};
    
    console.debug("favourites is ",favourites);
    
    //initial radio button configuration
    setClickedHere();
    
    detailsNavbar("Info");
    directionsService = null;
    directionsDisplay = null;
    
    var f = document.forms['searchForm'];
    f[0].value="";
    f[1].value="default";
    f[2].value="";f[2].placeholder=10;
    f[5].value="";f[5].placeholder="Enter a location.";
    
    angular.element("#SherlockSearch").scope().showResults();
    angular.element("#SherlockSearch").scope().$apply();
    
    $("#detailsButton").hide();
    $("#progressBar").hide();
    $("#infoGoogle").hide();
    $('#resultsButton').addClass("active");
    
    $('#favButton').removeClass("active");
    $('#favTable').hide();
    $('#favPageButtons').hide();
    $('#favPagesWarning').hide();
    $("#placesTable").show();
    $('#pageButtons').show();
    $('#tablePagesWarning').show();
}

function validateForm(val){
    var inp = $("#"+val).val();
    var msgWord;
    
    if(!inp.trim()){
        if(val=="keyword")
            msgWord = "keyword."
        else
            msgWord = "location."
        console.debug("invalid "+val);
        $("#"+val).css("border","2px solid red");
        $("#"+val+"Error").html("Please enter a "+msgWord);
    }
    else{
        console.debug("valid "+val);
        $("#"+val).css("border","");
        $("#"+val+"Error").html("");
    }
    searchAtt[val] = $("#"+val).val();
    toggleSearch();
}

function validateMapFrom(){
    var inp = $("#mapFrom").val();
    inp = inp.trim();
    if(!inp){
        $("#mapDirections").attr("disabled","disabled");
    }
    else{
        $("#mapDirections").removeAttr("disabled");
    }
}

function toggleSearch(){
    console.debug(searchAtt);
    for(i in searchAtt){
        if(!searchAtt[i]){
            $("#search").attr('disabled','disabled');
            console.debug("still wrong");
            return;
        }
    }
    console.debug("correct now");
    $("#search").removeAttr('disabled');
}

function setClickedHere(f=document.forms["searchForm"]){
    //f.location.required = false;
    f["pac-input"].disabled = true;
    var r = document.getElementById('radioHere');
    var r2 = document.getElementById('radioThere');
    r.value="here";
    r.checked=true;
    r2.checked=false;
    
    $("#pac-input").css("border","");
    $("#pac-inputError").html("");
    
    searchAtt["pac-input"] = "dontCare";
    toggleSearch();
}    

function setClickedThere(f=document.forms["searchForm"]){
    //f.location.required = true;
    f["pac-input"].disabled = false;
    var r = document.getElementById('radioHere');
    var r2 = document.getElementById('radioThere');
    r2.value="";
    r.checked=false;
    r2.checked=true;
    
    searchAtt["pac-input"] = $("#pac-input").val();
    toggleSearch();
}

function sendData(f){
    $("#progressBar").show();
    var frm,dis;
    if(f[3].checked==true)
        frm = "here";
    else
        frm = "custom";
    if(f[2].value=="")
        dis=10;
    else
        dis=f[2].value;
    
    //set default values for globasl
    pages = [];
    pageNum = 0;
    detailed_place = 0;
    
    var GET_data = {
        keyword : f[0].value.trim(),
        category : f[1].value,
        distance: Number(dis),
        from : frm,
        location: f[5].value.trim(),
        lat:searchAtt["geo"].lat,
        lon:searchAtt["geo"].lon
    };
    console.debug(GET_data);
    $.ajax({
        type: "GET",
        url: urlprefix+"Places?"+$.param(GET_data),
        success: function(msg){
            $("#tablePages").show();
            $("#progressBar").hide();
            handlePages(msg);
            console.debug(urlprefix+"Places?"+$.param(GET_data));
        }
    });
    return false;
}

function handlePages(jsn=null){
    console.debug(pageNum+" "+pages.length);
    if(pageNum+1>pages.length){    //if I have a new page
        pages.push(JSON.parse(jsn));   
        console.debug("added a new page from normal request");
        if(pages && pageNum<pages.length)
            makeTable(pages[pageNum]);    
    }
    if(pages && pageNum<pages.length)
        makeTable(pages[pageNum]);  //pageNum will be modified by the next/previous buttons
}

function nextPage(tkn){
    pageNum++;
    var GET_data = {
        token:tkn
    };
    if(pageNum+1>pages.length){
        $("#progressBar").show();
        $("#placesTable").html("");
        $("#pageButtons").html("");
        
        $.ajax({
            type: "GET",
            url: urlprefix+"PlacesPage?"+$.param(GET_data),
            success: function(msg){
            $("#tablePages").show();
            $("#progressBar").hide();
            handlePages(msg);
                console.debug(msg);
        }
        });
    }
    else
        handlePages();
}

function previousPage(){
    pageNum--;
    handlePages();
}

function makeFavTable(){
    $("#favTable").html("");
    $("#favPageButtons").html("");
    $("#detailsButton").hide();
    $("#favPagesWarning").html("");
    
    if(!favourites || Object.keys(favourites).length==0 || (Object.keys(favourites).length==1 && favourites.hasOwnProperty('maxpos'))){
        //if favourites is empty
        var d = $("<div id='favPlacesNoRecord'>").addClass("alert alert-warning").html("No records.");
        $("#favPagesWarning").append(d);
        return;
    }
    
    $("#detailsButton").show();
    
    var keys = Object.keys(favourites);
    var p = [];
    for(var i=0; i<keys.length;++i){
        if(keys[i]!="maxpos")
            p.push(favourites[keys[i]]);
    }
    
    p.sort(function(a,b){return a.pos>b.pos;}); //sort the favourites according to pos values
    
    for(var pageN=0;pageN<Math.ceil(p.length/20);pageN++){
        
        var pageDiv = $('<div>').attr('id','favPage'+pageN).css('display','none');
        
        var table = $("<table>").addClass("table table-hover");
        var thead = $("<thead>").appendTo(table);
        var row = $("<tr>").appendTo(thead);
        var th = $("<th scope='col'>").html("#").appendTo(row);
        var th = $("<th scope='col'>").html("Category").appendTo(row);
        var th = $("<th scope='col'>").html("Name").appendTo(row);
        var th = $("<th scope='col'>").html("Address").appendTo(row);
        var th = $("<th scope='col'>").html("Favorite").appendTo(row);
        var th = $("<th scope='col'>").html("Details").appendTo(row);  

        var tbody = $("<tbody>").appendTo(table);
        for(var i=pageN*20; i<(pageN+1)*20 && i<p.length; ++i){

            var place_num = (pageNum)*20+(i+1);

            var res = p[i].res;
            var row = $("<tr>").appendTo(tbody);
            row.attr('id',"favPlace"+place_num);

            if(res.place_id == detailed_place_id)
                row.addClass("alert alert-warning");

            var th = $("<th scope='row'>").html(i+1).appendTo(row);
            var td = $("<td>").appendTo(row);
            var im = $("<img>").attr("src",res.icon).attr("width","40px").appendTo(td);
            td = $("<td>").html(res.name).appendTo(row);
            td = $("<td>").html(res.vicinity).appendTo(row);
            td = $("<td>").appendTo(row);
            var button = $("<button>").addClass("btn default").appendTo(td);
            (function(res){ //for loop closure
                button.click(function(){deleteFav(res);});
            }(res));
            im = $("<span>").addClass("far fa-trash-alt").appendTo(button);
            
            td = $("<td>").appendTo(row);
            button = $("<button>").addClass("btn default").appendTo(td);
            (function(place_id,place_num,res){
                button.click(function(){viewDetails(place_id,place_num,res);});
            }(res.place_id,place_num,res));
            im = $("<span>").addClass("fas fa-chevron-right").appendTo(button);
        }
        
        pageDiv.append(table);
        $("#favTable").append(pageDiv);
    }
    
    $("#favPage"+favPageNum).show();
    makeFavButtons();
    
}

function makeFavButtons(){
    $("#favPageButtons").html('');
    console.debug('Entered makeFavButtons');
    console.debug("favpagenumstuff "+(Object.keys(favourites).length-1)+" "+(favPageNum+1)*20);
    
    var nextFavPage = function(){console.debug("trying next fav page with favpagenum"+favPageNum);$("#favPage"+favPageNum).hide();$("#favPage"+(favPageNum+1)).show();favPageNum++;makeFavButtons();};
    var prevFavPage = function(){$("#favPage"+favPageNum).hide();$("#favPage"+(favPageNum-1)).show();favPageNum--;makeFavButtons();};
    
    if(favPageNum>0){
        console.debug('previous button required');
        var b = $("<button>").addClass("btn default").html("Previous").click(prevFavPage);
        $("#favPageButtons").append(b);
    }
    
    
    
    if(favourites && (Object.keys(favourites).length-1)>(favPageNum+1)*20){
        console.debug('next button required');
        var b = $("<button>").addClass("btn default").html("Next").click(nextFavPage);
        $("#favPageButtons").append(b);
    }
}

function deleteFav(res){
    delete favourites[res.place_id];
    if(favourites && (favPageNum)*20>=(Object.keys(favourites).length-1))
        favPageNum--;
    
    window.localStorage.setItem("favs",JSON.stringify(favourites));
    makeFavTable();
    
}

function makeTable(p){
    if(!p)
        return;
    $("#placesTable").html("");
    $("#pageButtons").html("");
    $("#detailsButton").hide();
    $("#tablePagesWarning").html("");
    
    if(p.status=="ZERO_RESULTS"){
        var d = $("<div id='placesNoRecord'>").addClass("alert alert-warning").html("No records.");
        $("#tablePagesWarning").append(d);
        return;
    }
    
    $("#detailsButton").show();
    
    var table = $("<table>").addClass("table table-hover");
    var thead = $("<thead>").appendTo(table);
    var row = $("<tr>").appendTo(thead);
    var th = $("<th scope='col'>").html("#").appendTo(row);
    var th = $("<th scope='col'>").html("Category").appendTo(row);
    var th = $("<th scope='col'>").html("Name").appendTo(row);
    var th = $("<th scope='col'>").html("Address").appendTo(row);
    var th = $("<th scope='col'>").html("Favorite").appendTo(row);
    var th = $("<th scope='col'>").html("Details").appendTo(row);
    
    
    var tbody = $("<tbody>").appendTo(table);
    for(var i=0; i<p.results.length; ++i){
        
        var place_num = (pageNum)*20+(i+1);
        
        var res = p.results[i];
        var row = $("<tr>").appendTo(tbody);
        row.attr('id',"place"+place_num);
        
        if(res.place_id == detailed_place_id)
            row.addClass("alert alert-warning");
        
        var th = $("<th scope='row'>").html(i+1).appendTo(row);
        var td = $("<td>").appendTo(row);
        var im = $("<img>").attr("src",res.icon).attr("width","40px").appendTo(td);
        td = $("<td>").html(res.name).appendTo(row);
        td = $("<td>").html(res.vicinity).appendTo(row);
        td = $("<td>").appendTo(row);
        var button = $("<button>").addClass("btn default").appendTo(td);
        (function(res){ //for loop closure
            button.click(function(){toggleFav(res);});
        }(res));
        if(favourites && !(res.place_id in favourites))
            im = $("<span>").addClass("far fa-star").attr("id","fav"+res.place_id).appendTo(button);
        else
            im = $("<span>").addClass("fas fa-star").attr("id","fav"+res.place_id).appendTo(button);
        td = $("<td>").appendTo(row);
        button = $("<button>").addClass("btn default").appendTo(td);
        (function(place_id,place_num,res){
            button.click(function(){viewDetails(place_id,place_num,res);});
        }(res.place_id,place_num,res));
        im = $("<span>").addClass("fas fa-chevron-right").appendTo(button);
    }
    
    $("#placesTable").append(table);

    console.debug(table);
    
    if(pageNum>0){
        var b = $("<button>").addClass("btn default").html("Previous").click(previousPage);
        $("#pageButtons").append(b);
    }
    if('next_page_token' in p && p.next_page_token){
        var b = $("<button>").addClass("btn default").html("Next").click(function(){nextPage(p.next_page_token);});
        $("#pageButtons").append(b);
    }
}

function resultsNavbar(who){
    
    //Make sure we slide back to res fav
    angular.element("#SherlockSearch").scope().showResults();
    angular.element("#SherlockSearch").scope().$apply();
    
    switch(who){
        case 'fav':
            //if($('favButton').hasClass('active'))
                //return;
            
            console.debug("got into fav");
            
            $('#resultsButton').removeClass("active");
            $('#favButton').addClass("active");
            
            $("#placesTable").hide();
            $('#pageButtons').hide();
            $('#tablePagesWarning').hide();
            
            console.debug("going to show everything now");
                        
            $('#favTable').show();
            $('#favPageButtons').show();
            $('#favPagesWarning').show();
            
            makeFavTable();

            break;
            
        case 'result':
            if($('resultsButton').hasClass('active'))
                return;
            
            $('#resultsButton').addClass("active");
            $('#favButton').removeClass("active");
            
            $('#favTable').hide();
            $('#favPageButtons').hide();
            $('#favPagesWarning').hide();
            
            $("#placesTable").show();
            $('#pageButtons').show();
            $('#tablePagesWarning').show();
            
            handlePages();
            
            break;
    }
}

function toggleFav(res){
    console.debug("inside toggle fav");
    
    var place_id = res.place_id;
    var setTableStar = "#fav"+place_id;
    var setDetailsStar = "#detailsFav";
    
    if(favourites.hasOwnProperty(place_id)){  //already in favourites
        delete favourites[place_id];
        $(setTableStar).removeClass("fas").addClass("far");
        $(setDetailsStar).removeClass("fas").addClass("far");
        console.debug("went in if");
    }
    else{   //not in favourites
        var pos;
        if(!favourites || Object.keys(favourites).length==0 || (Object.keys(favourites).length==1 && favourites.hasOwnProperty('maxpos'))){
            pos = 0;
        }
        else{
            pos = favourites.maxpos;
            console.debug("fav was not empty");
        }
            
        var o = {};
        o.res = res;
        o.pos = pos+1;

        favourites.maxpos = o.pos;
        favourites[place_id] = o;
        
        $(setTableStar).removeClass("far").addClass("fas");
        $(setDetailsStar).removeClass("far").addClass("fas");
        
        console.debug("went in else "+pos+" ");
    }
    
    window.localStorage.setItem("favs",JSON.stringify(favourites));
}

function viewDetails(pid,place_num,res){
    var request = {
        placeId: pid
    };
    
    console.debug(pid+' '+place_num);
    
    if((pageNum)*20<detailed_place && detailed_place<(pageNum)*20+20)   //if the detailed place is on the current page
        $("#place"+detailed_place).removeClass("alert alert-warning");
    
    detailed_place = place_num;
    detailed_place_id = res.place_id;
    
    $("#place"+detailed_place).addClass("alert alert-warning");
    
    var map = new google.maps.Map(document.getElementById('map'), {
      zoom: 15
    });
    $("#detailsButtonBtn").removeAttr("disabled");
    
    service = new google.maps.places.PlacesService(map);
    
    
    var callback = function(place, status) {
        if (status == google.maps.places.PlacesServiceStatus.OK) {
            console.log(place); //We can now render the details
            
            //Remove old data
            $("#detailsInfo").html(""); //info
            for(var i=0; i<4; ++i){ //photos
                    $("#photoCol"+i%4).html("");
            }
            $("#panel").html("");
            $("#googleReviews").html("");
            $("#yelpReviews").html("");
            $("#detailsFav").attr("class","");
            $("#detailsFav").addClass("far fa-star");
            $("#reviewTypeButton").html('Google Reviews');
            
            //Update the title
            $("#placeName").html(place.name);
            googleReviews = null;
            yelpReviews = null;
            
            detailsNavbar("Info");
            
            //Populate the info
            var table = $("<table>").addClass("table table-striped");
            var tbody = $("<tbody>").appendTo(table);
            if('formatted_address' in place && place.formatted_address){
                var tr = $("<tr>").appendTo(tbody);
                var th = $("<th>").html("Address").appendTo(tr);
                var td = $("<td>").html(place.formatted_address).appendTo(tr);
            }
            if('international_phone_number' in place && place.international_phone_number){
                var tr = $("<tr>").appendTo(tbody);
                var th = $("<th>").html("Phone Number").appendTo(tr);
                var td = $("<td>").html(place.international_phone_number).appendTo(tr);
            }
            if('price_level' in place && place.price_level){
                var tr = $("<tr>").appendTo(tbody);
                var th = $("<th>").html("Price Level").appendTo(tr);
                var dollars = "";
                for(var i=0; i<place.price_level; ++i){
                    dollars += '$';
                }
                var td = $("<td>").html(dollars).appendTo(tr);
            }
            if('rating' in place && place.rating){
                var tr = $("<tr>").appendTo(tbody);
                var th = $("<th>").html("Rating").appendTo(tr);
                var td = $("<td>").appendTo(tr);
                var di = $("<div>").html(place.rating+' ').css({float:'left'}).appendTo(td);
                var di = $("<div>").attr("id",'rateYo').css({float:'left','margin-top':'5px'}).appendTo(td);
                var rating = Number(place.rating);
                console.debug("rating "+Math.ceil(rating));
                di.rateYo({
                    rating: rating,
                    readOnly:true,
                    starWidth:'14px',
                    normalFill: 'transparent'
                });
            }
            if('url' in place && place.url){
                var tr = $("<tr>").appendTo(tbody);
                var th = $("<th>").html("Google Page").appendTo(tr);
                var td = $("<td>").appendTo(tr);
                var a  = $("<a>").attr({'href':place.url,'target':'_blank'}).html(place.url).appendTo(td);
            }
            if('website' in place && place.website){
                var tr = $("<tr>").appendTo(tbody);
                var th = $("<th>").html("Website").appendTo(tr);
                var td = $("<td>").appendTo(tr);
                var a  = $("<a>").attr({'href':place.website,'target':'_blank'}).html(place.website).appendTo(td);
            }
            if('opening_hours' in place && place.opening_hours){
                var tr = $("<tr>").appendTo(tbody);
                var th = $("<th>").html("Hours").appendTo(tr);
                var td = $("<td>").appendTo(tr);
                var di = $("<div>");
                
                
                if(!place.opening_hours.open_now){
                    di.html("Closed");
                }
                else{
                    var day = moment().utcOffset(place.utc_offset).isoWeekday();    //day is from 1-7 Monday to Sunday
                    console.debug('day '+day);
                    
                    var wtext = place.opening_hours.weekday_text;   // this uses an array with 0-6 Monday to Sunday
                    var timeRange = wtext[day].split('day:')[1];
                    console.debug(timeRange);
                    var str = "Open now:"+timeRange+'&nbsp';
                    di.html(str);
                    
                    var bt  = $("<button>").attr({'data-toggle':"modal",'data-target':"#myModal"}).addClass("btn btn-link").html('Daily open hours').appendTo(di);
                    bt.css("padding-top",'0');
                    
                    var tbl = $("<table>").addClass("table");
                    $("#modalData").html("");
                    $("#modalData").append(tbl);
                    
                    var tbdy = $("<tbody>").appendTo(tbl);
                    
                    var trm = $("<tr>").appendTo(tbdy).appendTo(tbdy);
                    var thm = $("<th>").html(wtext[day-1].split('day:')[0]+'day').appendTo(trm);
                    var thm = $("<th>").html(wtext[day-1].split('day:')[1]).appendTo(trm);
                    
                    for(var i=1; i<=6; ++i){
                        var weekday = (day-1+i)%7;
                        var trm = $("<tr>").appendTo(tbdy).appendTo(tbdy);
                        var tdm = $("<td>").html(wtext[weekday].split('day:')[0]+'day').appendTo(trm);
                        var tdm = $("<td>").html(wtext[weekday].split('day:')[1]).appendTo(trm);
                    }
                }
                di.appendTo(td);
            }
            
            $("#detailsInfo").append(table);
            
            //Populate the photos
            if('photos' in place){
                var photos = place.photos;

                for(var i=0; i<photos.length; ++i){
                    var url = photos[i].getUrl({'maxWidth':2000,'maxHeight':2000});
                    var a   = $("<a>").attr({'href':url,'target':'_blank'}).addClass("photosClick");
                    var img = $("<img>").attr({'src':url}).appendTo(a);
                    $("#photoCol"+i%4).append(a);
                }
                
                $("#photosWarning").html("");
            }
            else{
                
                var d = $("<div id='placesNoRecord'>").addClass("alert alert-warning").html("No records.");
                $("#photosWarning").append(d);
            }
            
            //Populate the map
            var f = document.forms["searchForm"];
            $("#mapDirections").removeAttr("disabled");
            if(f[3].checked)
                $("#mapFrom").val("Your Location");
            else
                $("#mapFrom").val(f[5].value);
            $("#mapTo").val(place.name+", "+place.formatted_address);
            $("#mapMode").val("DRIVING");
            initMap(place.geometry.location.lat(),place.geometry.location.lng());
            
            //fix margin issues
            if($(document).width()<500){
                $("#map").css({'margin-left':'10px','margin-right':'10px'});
                console.debug("small map");
            }
            
            //set the googleReviews
            googleReviews = [];
            yelpReviews = [];
            if('reviews' in place && place.reviews){
                for(var i=0; i<place.reviews.length; ++i){
                    var r = place.reviews[i];
                    var singleReview = {
                        img_url: r.profile_photo_url,
                        page_url: r.author_url,
                        name: r.author_name,
                        rating: r.rating,
                        time: r.time,
                        text: r.text,
                        index: i
                    };
                    googleReviews.push(singleReview);
                }
            }
            //set the data to send to backend
            var GET_data = {
                name: place.name,
                address: place.formatted_address
            };
            
            //$("#googleReviews").show();
            $("#yelpReviews").show();
            
            var setYelpReviews = function(jsn){
                if(jsn=='no records' || jsn=='error'){
                    console.debug('issue with yelp: '+jsn);
                    yelpReviews = [];
                    return;
                }
                
                var p = JSON.parse(jsn);
                console.debug(p);
                
                for(var i=0; i<p.reviews.length; ++i){
                    var r = p.reviews[i];
                    var singleReview = {
                        img_url: r.user.image_url,
                        page_url: r.url,
                        name: r.user.name,
                        rating: r.rating,
                        time: moment(r.time_created, "YYYY/MM/DD H:mm:ss").unix(),
                        text: r.text,
                        index: i
                    };
                    console.debug(+" "+r.time_created);
                    yelpReviews.push(singleReview);
                }
            }
            
            $.ajax({
                type: "GET",
                url: urlprefix+"Yelp?"+$.param(GET_data),
                success: function(msg){
                    console.debug('got yelp reviews')
                    setYelpReviews(msg);
                    renderReviews('y');
                }
            });
            renderReviews('g');
            if(favourites && res.place_id in favourites)
                $("#detailsFav").removeClass("far").addClass("fas");
            
            $("#detailsFav").parent().off('click');
            $("#detailsFav").parent().click(function(){toggleFav(res);});
            
            var tweet = "https://twitter.com/intent/tweet?text=Check out "+place.name;
            if('formatted_address' in place)
                tweet += ' located at '+place.formatted_address;
            if('website' in place)
                tweet += '. Website:'+place.website;
            
            //tweet = encodeURIComponent(tweet);
            
            var makeWindow = function(){
                var win = window.open(tweet,'popup','height=300,width=350,status=yes,toolbar=no,menubar=no,location=no,scrollbars=1,resizable=1'); 
                console.debug("tweet is "+tweet);
            }
            
            $("#tweetButton").off('click');
            $("#tweetButton").click(makeWindow);
            
            angular.element("#SherlockSearch").scope().showDetails();
            angular.element("#SherlockSearch").scope().$apply();
        }
    }
    
    service.getDetails(request, callback);

}

function renderReviews(which){
    var gyReviews;
    var idName;
    
    if(which=='g'){
        gyReviews = googleReviews;
        idName = "#googleReviews";
    }
    else{
        gyReviews = yelpReviews;
        idName = "#yelpReviews";
    }
    
    $(idName).html(""); //clear out the old stuff
    
    if(gyReviews.length==0){
        var d = $("<div>").addClass("alert alert-warning").html("No records.");
        $(idName).append(d);
    }

    for(var i=0; i<gyReviews.length; ++i){
        var review = gyReviews[i];
        var card =  $("<div>").addClass("card").css({'margin-top':'5px','margin-bottom':'5px'});
        var cbody = $("<div>").addClass("card-body").appendTo(card).css('display','flex');
        var imgdiv = $("<div>").css({width:'40px','margin-right':'15px','display':'inline-block','vertical-align':'top'}).appendTo(cbody);
        var a = $("<a>").attr({"href":review.page_url,"target":"_blank"}).appendTo(imgdiv);
        var img = $("<img>").css("width","40px").attr("src",review.img_url).appendTo(a);

        var div = $("<div>").css({display:'inline-block',felx:1}).appendTo(cbody);
        var name = $("<span>").html(review.name).css('color','#5ec4ff').appendTo(div);

        var divLine = $("<div>").css({display:'flex'}).appendTo(div);

        var rat = Number(review.rating);
        var rating = $("<div>").rateYo({
            rating: 5,
            readOnly:true,
            starWidth:'14px',
            numStars: rat
        }).css({'margin-top':'5px','padding-left':'0px','display':'inline-block'}).appendTo(divLine);

        var time = $("<div>").html(moment.unix(review.time).format("YYYY-MM-DD HH:mm:ss")).css({'color':'grey','display':'inline-block',flex:1}).appendTo(divLine);
    
        var text = $("<p>").html(review.text).appendTo(div);
        $(idName).append(card);
    }
}

function orderReviews(how){
    var currentReview = $("#reviewTypeButton").html().trim();
    var gyReviews;
    var which;
    
    console.debug(currentReview);
    if(currentReview == 'Google Reviews'){
        gyReviews = googleReviews;
        which = 'g';
    }
    else{
        gyReviews = yelpReviews;
        which = 'y';
    }
    
    console.debug(how+' '+which);
    
    switch(how){
        case 'do':
            gyReviews.sort(function(a,b){return a.index-b.index;});
            $("#sortButton").html("Default Order");
            break;
        case 'hr':
            gyReviews.sort(function(a,b){return Number(b.rating)-Number(a.rating);});
            $("#sortButton").html("Highest Rating");
            break;
        case 'lr':
            gyReviews.sort(function(a,b){return Number(a.rating)-Number(b.rating);});
            $("#sortButton").html("Lowest Rating");
            break;
        case 'mre':
            gyReviews.sort(function(a,b){return b.time-a.time;});
            $("#sortButton").html("Most Recent");
            break;
        case 'lre':
            gyReviews.sort(function(a,b){return a.time-b.time;});
            $("#sortButton").html("Least Recent");
            break;    
    }
    
    renderReviews(which);
}

function reviewType(s){
    $("#reviewTypeButton").html(s);
}

function detailsNavbar(who){
    console.log(who);
    var vals = {
        Info: false,
        Photos: false,
        Map: false,
        Reviews: false
    };
    vals[who] = true;
    
    for(k in vals){
        if(vals[k]){
            $("#detailsNav"+k).addClass("active");
            $("#details"+k).show();
        }
        else{
            $("#detailsNav"+k).removeClass("active");
            $("#details"+k).hide();
        }
    }
}