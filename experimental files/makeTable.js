var makeTable = function(jsObjects, strings){
	var table = dom("table", null, 
					dom("tbody", null)
				);
	table.firstChild.appendChild(document.createElement("tr"));
	strings.forEach(function(element){
					var header = document.createElement("th");
					header.appendChild(document.createTextNode(element));
					table.firstChild.firstChild.appendChild(header);
				});	

	/*jsObjects.forEach(function(element){
					var value = document.createElement("td");
					value.appendChild(document.createTextNode(element));
					table.firstChild.firstChild.appendChild(value);
				});	*/

	forEach(jsObjects, function(object){
		var value = document.createElement("tr");
	   	forEach(strings, function(name) {
	      	console.log(String( name + " " + object[name]))
	      	value.appendChild(document.createElement("td"));
			value.lastChild.appendChild(document.createTextNode(String(object[name])));
			//table.firstChild.appendChild(value);
	    });
		table.firstChild.appendChild(value);

	});
	
				
	return table;	
}