const express = require('express');
const app = express();
var port = process.env.PORT || 8081;

var request = require('request');

app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/',function (req, res) {res.send('Hello World!');});
app.get('/randomPage',function (req, res) {res.send('This the deep web');});
app.get('/Places',function (req,res){
    var lat=0,lon=0;
    var final = {pages:[]};
    
    var getNextPage = function(p,final){
        var nurl = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken="+p.next_page_token+"&key=AIzaSyCNjadErl7caBRT2eqbHrpueihyBeBBxlI";
        
        request(nurl,function(error, response, body){
            if(!error && response.statusCode == 200){
                console.log("recvd next page");
                var p2 = JSON.parse(body);
                if(p2.status=="INVALID_REQUEST"){
                    console.log("invalid request");
                    setTimeout(function(){getNextPage(p,final);},100);   //the request can not be invalid, it must be because we called too early, so try again
                }
                else if('next_page_token' in p2 && p2.next_page_token){ //if there is yet another page,
                    final.pages.push(p2); //append this one to the list
                    getNextPage(p2,final);  //get the next one
                }
                else{   //at some point, there won't be another new page,
                    final.pages.push(p2);  //append the final page
                    res.send(JSON.stringify(final));    //send the json back
                }
            }
        });
    }
    
    var placesCallback = function(error, response, body){
        if(!error && response.statusCode == 200){
            //console.log(body);
            console.log("recvd places json");
            res.send(body);
        }
    }
    if(req.query.from=="here"){
        lat = req.query.lat;
        lon = req.query.lon;
        
        var url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location="+lat+","+lon+"&radius="+(req.query.distance*1609.344)+"&type="+req.query.category+"&keyword="+req.query.keyword+"&key=AIzaSyCNjadErl7caBRT2eqbHrpueihyBeBBxlI";
        url = url.replace(" ","+");
        console.log("here "+url);
        request(url, placesCallback);
    }
    else{
        var loc = req.query.location;
        loc = loc.replace(" ","+");
        geourl = "https://maps.googleapis.com/maps/api/geocode/json?address="+loc+"&key=AIzaSyCrfAO3ZtsLWHuPwHftEkVxdLBN0mo2auc";    

        request(geourl, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var p = JSON.parse(body) // Print the google web page.
                lat = p.results[0].geometry.location.lat;
                lon = p.results[0].geometry.location.lng;
                
                var url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location="+lat+","+lon+"&radius="+(req.query.distance*1609.344)+"&type="+req.query.category+"&keyword="+req.query.keyword+"&key=AIzaSyCNjadErl7caBRT2eqbHrpueihyBeBBxlI";
                url = url.replace(" ","+");
                console.log("custom "+url);
                request(url, placesCallback);
            }
        })
    }
});

app.get('/PlacesPage',function (req,res){
    var pageToken = req.query.token;
    var url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken="+pageToken+"&key=AIzaSyCNjadErl7caBRT2eqbHrpueihyBeBBxlI";
    request(url, function(error, response, body){
       if(!error && response.statusCode == 200){
           console.log("recvd next page");
           res.send(body);
       } 
    });
});

app.get('/Yelp',function (req,res){
    var name = req.query.name;
    var address = req.query.address;
    
    console.log('Yelp with: '+name+' '+address);
    
    var parts = address.split(',');
    var len = parts.length;
    for(var i=0; i<len; ++i)
        parts[i] = parts[i].trim();
    
    if(len<3){
        console.log("not enough components in address: "+address);
        res.send('error');
        return;
    }
    
    //get country
    var country = parts[len-1];
    if(country != 'USA')
    {
        console.log('country not usa it is '+parts[len-1]);
        res.send('error');
        return;
    }
    country = "US"; //Yelp API wants 2 charater country
    
    //get zip and state
    var splitTest = parts[len-2].split(' ');
    if(splitTest.length != 2){
        console.log('weird split for: '+parts[len-2]);
        res.send('error');
    }
    var state = splitTest[0];
    var zip   = splitTest[1];
    if(zip.length != 5){
        console.log("incorrect zip "+zip);
        zip = '';
    }
    
    //get city
    var city = parts[len-3];
    
    //set address1
    var address1 = '';
    if(len>=4){
        address1 = parts[0];
    }
    
    var url = "https://api.yelp.com/v3/businesses/matches/best?"+"name="+name+"&city="+city+"&state="+state+"&country="+country;
    
    
    if(address1)
        url += '&address1='+address1;
    if(zip)
        url += '&postal_code'+zip;
    
    
    var options = {
        url: url,
        headers: {
            'Authorization': 'Bearer jdwilRH0IhJ22RdVcK8yAmHlvtGK_xMbxYLZ630FKPslBAaDlyHN7LvRvBLq2h4ZhEY5sg93qWwRZ1OsyB84_6K-cokAfBX9-y6LWu7qxinD0yuEdC7-wZUMPLvGWnYx'
        }
    };
    
    request(options, function(error, response, body){
        if(!error && response.statusCode == 200){
            console.log("recvd best match");
            console.log(body);
            var p = JSON.parse(body);
            if(p.businesses.length == 0){
                res.send('no records');
                return;
            }
            
            var id = p.businesses[0].id;
            
            var url2 = "https://api.yelp.com/v3/businesses/"+id+"/reviews?locale=en_US";
            var options2 = {
                url: url2,
                headers: {
                    'Authorization': 'Bearer jdwilRH0IhJ22RdVcK8yAmHlvtGK_xMbxYLZ630FKPslBAaDlyHN7LvRvBLq2h4ZhEY5sg93qWwRZ1OsyB84_6K-cokAfBX9-y6LWu7qxinD0yuEdC7-wZUMPLvGWnYx'
                }
            };
            
            console.log('trying to get reviews with '+url2);
            request(options2, function(error2, response2, body2){
                if(!error2 && response2.statusCode == 200){
                    console.log("rcvd reviews");
                    res.send(body2);
                }
            });
        }
        else {
            console.log(response)
        }
    });
    
});

app.listen(port, function() { console.log('Example app listening on port '+port+'!');});