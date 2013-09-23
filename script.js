//var currentLocation;

var idNum = 0;
var globalSocket;
$(document).ready(function(){

  var currentLocation;

  var input = document.getElementById('search-bar');
  autocomplete = new google.maps.places.Autocomplete(input);

  google.maps.event.addListener(autocomplete, 'place_changed', inputEventHandler);

  var searchInfo = $("<p>");
  $(searchInfo).attr("id","searchInfo");
  $(searchInfo).append("Latest posts");

  $(searchInfo).insertAfter("#inputWarningWrapper");


  var inputWarning = $("<p>");
  $("#inputWarningWrapper").append(inputWarning);
  $(inputWarning).attr("id","inputWarning");
  $(inputWarning).append(" ");

  //$(inputWarning).insertAfter("#desc");



  function inputEventHandler() {
      //input.className = '';
    var place = autocomplete.getPlace();
    console.log("Searching for place: ");
    console.log(place.formatted_address);
    if (!place.geometry) {
      // Inform the user that the place was not found and return.
      //input.className = 'notfound';
      return;
    }

    else{
      console.log("place: ");
      console.log(place);
      $(searchInfo)[0].textContent = "Latest posts near " + place.formatted_address;
      $(".boarder").remove();

      //change more button to get more search results
      $("#more").unbind();
      $("#more").click(function() {
        console.log("loading more search results");
        socket.emit('locationSearchReloadRequest', [place.geometry.location.qb, place.geometry.location.pb]);
      });


      socket.emit("locationSearchRequest", [place.geometry.location.qb, place.geometry.location.pb]);
    }
    

    
  }

  window.navigator.geolocation.getCurrentPosition(GetLocation);
  function GetLocation(value) {
      currentLocation = {
        longitude: value.coords.longitude,
        latitude: value.coords.latitude,
        accuracy: value.coords.accuracy
      }
  };

  $("#desc").focus();

  var host = window.location.host.split(':')[0];


  io.set('transports', ['xhr-polling']);
  io.set('polling duration', 10);

  var socket = io.connect(window.location.hostname);

  io.set('transports', ['xhr-polling']);
  io.set('polling duration', 10);

  globalSocket = socket;
  

  var submission;
  $("#desc").focus(function(){
    console.log("text area is on focus")
    $("#inputWarning")[0].textContent = "";
  });

  $("#submit").click(function(){
    if($("#desc").val().length < 1 ){
        console.log("submission too short");
        $("#inputWarning")[0].textContent = "Submission cannot be empty.";
    }
    else{
      console.log("clicked")
      var dateNow = (new Date()).getTime();
      window.navigator.geolocation.getCurrentPosition(GetLocation);
      function GetLocation(value) {
          currentLocation = {
            longitude: value.coords.longitude,
            latitude: value.coords.latitude,
            accuracy: value.coords.accuracy
          }
      };

      submission =
      {
        desc: $("#desc").val(),
        date: dateNow,
        loc: {
          type : "Point",
          coordinates : [currentLocation.longitude, currentLocation.latitude]
        },
        accuracy : currentLocation.accuracy
      };
      console.log(submission);
      //$("p").hide();
      
      //$("p:last-child").slideUp(0);
      //$("#boarder").slideDown("slow");
      
      $("#desc").val("");
      socket.emit("idRequest");
    }
  }); //end submit

  $("#more").click(function(){
    console.log("loading more posts");
    socket.emit('requestLoadMore');
    //addNewLineAfter(submission);
    
  });
  
  socket.on('idResponse', function (unqieId){
    console.log("unqieId: " + unqieId);
    submission.id = unqieId;
    addNewLineBefore(submission);
    console.log(submission);
    socket.emit('newEntry', $.toJSON( submission ));
  })

  socket.on('preload', function (submission){
    var submissionObject = submission;
    //console.log(submissionObject);
    addNewLineAfter(submissionObject);
    $("#boarder").slideDown("slow");
  });

  socket.on('responseLoadMore', function (submission){
    var submissionObject = submission;
    console.log(submissionObject);
    addNewLineAfter(submissionObject);
/*    $("#boarder:last-of-type").slideDown("slow");*/
  });

  socket.on("hashtagRequest", function (data){
    $(".boarder").remove();
  })

  socket.on("postResponse", function (submission){
    $(".boarder").remove();
    $("#desc").hide();
    $("#submit").hide();
    $("#more").hide();
    addNewLineBefore(submission);
  });

  

});

function dom(name, attributes) {
  var node = document.createElement(name);
  if (attributes) {
    forEachIn(attributes, function(name, value) {
    setNodeAttribute(node, name, value);
  });
  }
  for (var i = 2; i < arguments.length; i++) {
    var child = arguments[i];
  if (typeof child == "string")
    child = document.createTextNode(child);
  node.appendChild(child);
  }
  return node;
}

function forEachIn(object, action) {
for (var property in object) {
  if (object.hasOwnProperty(property))
    action(property, object[property]);
  }
}

function setNodeAttribute(node, attribute, value) {
  if (attribute == "class")
    node.className = value;
  else if (attribute == "checked")
    node.defaultChecked = value;
  else if (attribute == "for")
    node.htmlFor = value;
  else if (attribute == "style")
    node.style.cssText = value;
  else
    node.setAttribute(attribute, value);
}
  
function initializeMap(longitude,latitude,Accuracy) {
  console.log("accuracy: " + Accuracy);
  var mapZoom = 12;

  if(Accuracy < 100)
    mapZoom = 14;

  var myLatlng = new google.maps.LatLng(latitude,longitude);
  var mapOptions = {
    center: myLatlng,
    zoom: mapZoom,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };

  var map = new google.maps.Map(document.getElementById("map-canvas" + idNum),
      mapOptions);

  var marker = new google.maps.Marker({
    position: myLatlng,
    map: map,
    title: 'Spotted!'
  });

  var circleOptions = {
    strokeColor: '#FF0000',
    strokeOpacity: 0.8,
    strokeWeight: 2,
    fillColor: '#FF0000',
    fillOpacity: 0.10,
    map: map,
    center: myLatlng,
    radius: Accuracy / 2 
  };

  var circle = new google.maps.Circle(circleOptions);

  // Create the DIV to hold the control and
  // call the HomeControl() constructor passing
  // in this DIV.
  var homeControlDiv = document.createElement('div');
  var homeControl = new HomeControl(homeControlDiv, map, myLatlng);

  homeControlDiv.index = 1;
  map.controls[google.maps.ControlPosition.TOP_RIGHT].push(homeControlDiv);


  idNum++;
}

function addNewLineBefore(submission){
  console.log("submission: ")
  console.log(JSON.stringify(submission));

  var newElem = getSubmissionDOM(submission);

  var lastBoarder = $("#boarder")[0];
  var button = document.getElementById("button-wrapper");
  /*bodyColumn.insertBefore(newElem,lastBoarder);*/
  $(newElem).insertAfter("#submit-button-wrapper");
  $("#boarder").slideDown("slow");
  initializeMap(submission.loc.coordinates[0] ,submission.loc.coordinates[1] ,submission.accuracy);
  /*while(! $("#map-canvas" + idNum)[0].style)*/
  console.log("button clicked: " + $("#desc").val());
};

function addNewLineAfter(submission){
    var newElem = getSubmissionDOM(submission);

  $(document).ready(function(){
    var button = document.getElementById("button-wrapper");
    var bodyColumn = $("#bodyColumn")[0];
    bodyColumn.insertBefore(newElem, button);
    
    

    $("#map-canvas"+idNum).parent().parent().slideDown("slow");
    initializeMap(submission.loc.coordinates[0] ,submission.loc.coordinates[1] ,submission.accuracy);
    console.log("button clicked: " + $("#desc").val());
    console.log($( "#fb" + (idNum-1) )[0]);
  });
  
  $( "#map-canvas"+(idNum-1) ).load(function() {
    //FB.XFBML.parse($( "#fb" + (idNum-1) )[0]);
  });

};

function getSubmissionDOM(submission){
  var submissionDOM = dom("div", {id:"boarder", class:"boarder"},
          dom("div",{id:"dropdown"},
            getHashtagParagraph(submission.desc),
            dom("p",{id:"date"}, document.createTextNode(new Date(submission.date).toString() )),
            dom("p",{id:"location"}, document.createTextNode("at " + submission.loc.coordinates[0] + "," + submission.loc.coordinates[1] + ", accurate to " + submission.accuracy + "m")),
            dom("div", {id:"map-canvas" + idNum, class: "map-canvas"},document.createTextNode("")),
            dom("p",{id:"url"}, 
              document.createTextNode("Link to post: "), dom("a", {href:"/post" + submission.id}, "spotted.me/post" + submission.id), getLikeElement(submission.id)
            )

          )
        );
  return submissionDOM
}

/**
 * The HomeControl adds a control to the map that simply
 * returns the user to the marker. This constructor takes
 * the control DIV as an argument.
 * @constructor
 */
function HomeControl(controlDiv, map, center) {

  // Set CSS styles for the DIV containing the control
  // Setting padding to 5 px will offset the control
  // from the edge of the map
  controlDiv.style.padding = '5px';

  // Set CSS for the control border
  var controlUI = document.createElement('div');
  controlUI.style.backgroundColor = 'white';
  controlUI.style.borderStyle = 'solid';
  controlUI.style.borderWidth = '1px';
  controlUI.style.margin = '1px';
  controlUI.style.cursor = 'pointer';
  controlUI.style.textAlign = 'center';
  controlUI.title = 'Click to set the map to Home';
  controlDiv.appendChild(controlUI);
  controlUI.style.setProperty("border-radius","2px");
  controlUI.style.setProperty("border-color","#c2c2c2")

  // Set CSS for the control interior
  var controlText = document.createElement('div');
  controlText.style.fontFamily = 'Arial,sans-serif';
  controlText.style.fontSize = '12px';
  controlText.style.paddingLeft = '4px';
  controlText.style.paddingRight = '4px';
  controlText.innerHTML = '<b>Home</b>';
  controlUI.appendChild(controlText);

  // Setup the click event listeners: simply set the map to
  // the marker
  google.maps.event.addDomListener(controlUI, 'click', function() {
    map.setCenter(center);
  });

}

function getHashtagParagraph(descripton){
  var hashtags = descripton.split("#");
  var p = document.createElement("p");
  p.appendChild(document.createTextNode(hashtags[0]));
  console.log(hashtags[0]);
  for( var i = 1 ; i < hashtags.length ; i++){
    console.log("#" + hashtags[i].split(" ")[0] );
    var link = document.createElement("a");
    link.appendChild( document.createTextNode( "#" + hashtags[i].split(" ")[0] + " " ) );
    link.setAttribute("href", "/#" + hashtags[i].split(" ")[0]);
    $(link).click(function (){
      console.log("link clicked");
      var tagString = link.text;
      globalSocket.emit("requestHashtags",tagString);
      $(".boarder").remove()
    })
    p.appendChild(link);
    for(var j=1 ; j < hashtags[i].split(" ").length ; j++ ){
       console.log( hashtags[i].split(" ")[j] );
       p.appendChild(document.createTextNode( hashtags[i].split(" ")[j] + " ") );
    }
  }
  return p;

}

function getLikeElement(id){
  var likeElem = $( "<div/>",
  {
    "class":"fb-like ",
    "data-href":"http://spotted.me/post"+id,
    "data-width":"450",
    "data-layout":"button_count",
    "data-show-faces":"true",
    "data-send":"true",
    "id": "fb" + idNum
  });

  $(likeElem).load(function(){
    FB.XFBML.parse(likeElem);
    });
  return likeElem[0];
}

  
