function route(pathname) {
	console.log("About to request a path for " + pathname);
}

function start() {
	console.log("Request handlers 'start' was called.");
}


function upload() {
	console.log("Request handlers 'upload' was called.");
}

exports.route = route;
