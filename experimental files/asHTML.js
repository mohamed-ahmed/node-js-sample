var asHTML = function(DOM_node){
	console.log(DOM_node.name);
	if(DOM_node.childNodes.length > 0){
		var childArray = DOM_node.childNodes;
		forEach(child){
			asHTML(DOM_node);

		}
	}

}