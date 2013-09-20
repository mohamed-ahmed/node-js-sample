var app = require('http').createServer(handler),
	sio = require('socket.io'),
	fs = require('fs');



var MongoClient = require('mongodb').MongoClient

var globalSocket;

// assuming io is the Socket.IO server object


var index_end;
var index_start;

app.listen(process.env.PORT || 5000);
var url;

var io = sio.listen(app);

io.set('transports', ['xhr-polling']);
io.set('polling duration', 10);

/*Here we handle the routes*/

function handler(req, res) {
	
	console.log("waiting on: " + req.url);
	
	

	if(req.url[1] === '+'){
		console.log("trying to get hashtag");
		globalSocket.emit("hashtagRequest", req.url.split('+')[1]);
		res.end();
	}

	if( /^\/post/.test(req.url) && !(req.url.indexOf('.') != -1) ){
		url = req.url
		var postNum = req.url.split('post')[1];
		console.log("trying to get post: " + postNum );
		fs.readFile(__dirname + '/post.html', function (err, data) {
      if (err) console.log(err);
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write(data);
   		//globalSocket.emit("postRequest", postNum );
      res.end();
   });

		//res.end();

		/*fs.readFile(__dirname + '/post.html', function (err, data) {
        if (err) console.log("readfile error: " + err);
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(data);
        res.end();
        //url = req.url;
    });*/
	}

	if((req.url.indexOf('.html') != -1) || req.url === ("/")) { //req.url has the pathname, check if it conatins '.html'

    fs.readFile(__dirname + '/index.html', function (err, data) {
      if (err) console.log(err);
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.write(data);
      res.end();
      url = req.url;
    });

  }

    if(req.url.indexOf('.js') != -1){ //req.url has the pathname, check if it conatins '.js'

      fs.readFile(__dirname + req.url, function (err, data) {
        if (err) console.log(err);
        res.writeHead(200, {'Content-Type': 'text/javascript'});
        res.write(data);
        res.end();
      });

    }

    if(req.url.indexOf('.css') != -1){ //req.url has the pathname, check if it conatins '.css'

      fs.readFile(__dirname + req.url, function (err, data) {
        if (err) console.log(err);
        res.writeHead(200, {'Content-Type': 'text/css'});
        res.write(data);
        res.end();
      });

    }

    if(req.url.indexOf('.ico') != -1){ //req.url has the pathname, check if it conatins '.css'

      fs.readFile(__dirname + '/icon.ico', function (err, data) {
        if (err) console.log(err);
        res.writeHead(200, {'Content-Type': 'text/css'});
        res.write(data);
        res.end();
      });

    }
}

io.configure( function() {
	io.set('close timeout', 60*60*24); // 24h time out
});



io.sockets.on('connection', function (socket) { // the actual socket callback
	globalSocket = socket;
	console.log("socket on connection");
	//redis_client= redis.createClient();

	var db;
	var skipNum = 0;

	console.log("url: " + url);
	if(url === '/'){
		MongoClient.connect('mongodb://127.0.0.1:27017/test', function(err, database){
			if(err) throw err;
			db = database;

			db.collection('posts').find().sort( {date:-1} ).limit(5).each(function (err, doc){
				if(doc){
					//console.log(doc)
					socket.emit('preload', doc);
				}
			});
				
		});

		skipNum+=5;
	}

	else if ( /^\/post/.test(url) ){
		console.log ("url: " + url);

		MongoClient.connect('mongodb://127.0.0.1:27017/test', function(err, database){
			if(err) throw err;
			db = database;
		
		
			var postNum = parseInt(url.split('post')[1]);
			db.collection('posts').findOne({id:postNum}, function (err, doc){
				if(doc){
					//console.log(doc)
					socket.emit('postResponse', doc);
				}
			});
				
		});

	}


	socket.on('newEntry', function (data){
		var entry = JSON.parse(data);
		var splittedString = entry.desc.split('#');
		var hashtag;
		for ( var i = 1 ; i < splittedString.length ; i++){
			hashtag = splittedString[i].split(" ")[0];
			console.log("hashtag: " + hashtag);
			//redis_client.rpush('#' + hashtag, entry.id)
		}
		console.log(JSON.stringify(entry));


	
		db.collection('posts').insert(entry, {w:1}, function(err, objects){
			if(err) console.warn(err.message);
			if (err && err.message.indexOf('E11000 ') !== -1) {
        // this _id was already inserted in the database
        console.warn("this id was already in the database");
      }
		})
	});

	

	socket.on('requestLoadMore',loadMore);

	function loadMore(){
		console.log("load more posts");


		db.collection('posts').find().limit(5).sort( {date:-1} ).skip(skipNum).each(function (err, doc){
			console.log("doc: "  + doc + "skipNum: " + skipNum);
			if(err) throw err;
			if(doc){
				//console.log(doc)
				socket.emit('responseLoadMore', doc);
			}
			
		});
		skipNum+=5;

	}	//end of loadMore

	socket.on('idRequest',function (){
		console.log("got ID Request");
		/*redis_client.incr("id", function (err, reply){
			socket.emit('idResponse', reply);
		})*/
		db.collection('data').update({name:'counter'}, {$inc: {id:1}}, {w:1}, function (err){
			if(err) console.warn(err.message);
			else console.log("successfully incremeneted id");
			db.collection('data').findOne({name:'counter'}, function (err, document){
				if(err) console.warn(err.message);
				console.log("id: " + document.id);
				socket.emit('idResponse', document.id);
			} );
		});

	}); //end of id request

	socket.on("locationSearchRequest", function (data){

		skipNum = 0;

		console.log(" locationQuery: " + data);
		var queryObject = {loc : 
												{$near : 
													{	$geometry:
														{ type : "Point",
															coordinates: data
														}
													}
												}
											};
		db.collection('posts').ensureIndex( {loc: "2dsphere"}, function (err, name){
			if(err) console.warn(err);
			console.log("callback name:" + name);
		} );
		db.collection('posts').find( queryObject ).limit(5).each(function (err, doc){
			console.log("doc: "  + doc);
			if(err) throw err;
			if(doc){
				console.log(doc)
				socket.emit('responseLoadMore', doc);
			}
			
		});

	}); //end of locationSearchRequest

	socket.on("locationSearchReloadRequest", function (data){
		console.log("**locationSearchReloadRequest**");
		skipNum += 5;
		console.log("skipNum: " + skipNum);

		console.log(" locationQuery: " + data);
		var queryObject = {loc : 
												{$near : 
													{	$geometry:
														{ type : "Point",
															coordinates: data
														}
													}
												}
											};
		db.collection('posts').ensureIndex( {loc: "2dsphere"}, function (err, name){
			console.log("callback name:" + name);
		} );
		db.collection('posts').find( queryObject ).limit(5).skip(skipNum).each(function (err, doc){
			console.log("doc: "  + doc);
			if(err) throw err;
			if(doc){
				console.log(doc)
				socket.emit('responseLoadMore', doc);
			}
			
		});

	}); //end of locationSearchRequest

	socket.on("postRequest", function (data){
		console.log("socket on post request")
		postRequest(data);
	});

	 function postRequest (data){
		console.log("func postRequest: " + data);
		db.collection('posts').findOne( {id : data }, function (err, doc){
			console.log("\n\n*****response*****");
			console.log(doc);
			if(err) console.warn(err);
			socket.emit("postResponse", doc);
		});
	}

	socket.on("requestHashtags",function (data){
		console.log("requesthashtag: " + data);

		/*redis_client.llen(data, function (err, listLength){
			
			index_end = listLength -1;
			console.log("index_end: " + index_end);
		

			index_start = index_end - 4
			if(index_start < 0)
				index_start = 0;
			

			console.log("loading posts " + (index_start) + " to " + index_end);
			redis_client.lrange(data,0, 100 , function (err, reply) {
				

				console.log("reply: " + reply);
				reply.forEach(function (element){
					redis_client.get("desc"+element, function (error, value){
						console.log("reply: " + value + "\n\n");
						socket.emit('preload', value);
						});
				});
			});
		});*/


	});

});

