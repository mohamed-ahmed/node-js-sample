userForm.elements.send.onclick = function() {
	if(validInfo(userForm) ){
		userForm.submit();
		alert("Form submitted");
	}
	else{
		alert("Incorrect info. Form not submitted");
	}
};