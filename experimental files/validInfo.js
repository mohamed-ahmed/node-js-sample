var userForm = document.forms.userinfo

var validInfo = function(form){
	var emailRegexText = new RegExp("\w@\w\.\w(\.\w)?");
	if(form.nodeName == "FORM" )
	{
		if(form.elements.name.value != "" && /\w@\w+\.\w(\.+\w)?/.test(form.elements.email.value))
			return true;
		else
			return false;
	}
	else
		return false;
};

userForm.elements.send.onclick = function() {
	if(validInfo(userForm) ){
		userForm.submit();
		alert("Form submitted");
	}
	else{
		alert("Incorrect info. Form not submitted");
	}
};

userForm.elements.name.focus();
