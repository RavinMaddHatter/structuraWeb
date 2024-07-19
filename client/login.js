var credentials = null;//current login credentials. Gets set by cognito.
var resetUsername = "";//used in the password reset process
const poolData = {
	UserPoolId: 'us-east-2_F8JCwtZAa', // Your user pool id here
	ClientId: 'tese5jomgf225lrvescg5o96l', // Your client id here
};
var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);//user pool data for account management
checkLogin();//verifies user login state to keep experience uniform
initialLoad();//Check hash and start loading website
//Navigation
function initialLoad(){
	let path = window.location.pathname;
	let page = path.split("/").pop().replace(".html","");
	pageType="#"+page
	if (window.location.hash.length>2){
		pageType = window.location.hash
	}
	load()
}
function load(){
	hideMain();
	pagenum=0;
	if (window.location.hash.length>2){
		pageType = window.location.hash
	}
	switch(pageType){
		case "#restpass":
			previousPage="#userprofile"
			showElement(document.getElementById("ResetPasswordDiv"));;
			break;
		case "#login":
			metaTitle = "Structura Lab: Login"
			showElement(document.getElementById("loginFormDiv"));;
			break;
		case "#signout":
			metaTitle = "Structura Lab: Signout"
			signOut();
			break;
		case "#signup":
			metaTitle = "Structura Lab: Signup"
			showElement(document.getElementById("signupFormDiv"));;
			break;
		case "#home":
			goHome()
	}
}
//helpers
window.onhashchange = function(){//checks if the hash has changed to refresh user views
	pageType=window.location.hash
	load();//determine what should happen on this hash refreshe
}
function clearForms(){//reset all form values to empty
	let inputs = document.getElementsByTagName('input');
	for (index = 0; index < inputs.length; ++index) {
		if(inputs[index].type!="submit"&&inputs[index].type!="button"){
			inputs[index].value="";
		}
	}	
}

function hideMain(){//reset web page to a default state to enable loading
	clearForms();//removes all default entry data from forms
	var elements = document.getElementsByClassName("main");
    for (let i = 0; i < elements.length; i++) {
      var element = elements[i];
      if (element.classList.contains('show')) {
        element.classList.remove('show');
      }
	  if (element.classList.contains('showGrid')) {
        element.classList.remove('showGrid');
      }
	  element.classList.add('hide');
    }
}
function validateUsername(usrName){
	return /\s/g.test(usrName);
}
//Login and signup forms
function signOut(){
	credentials.user.signOut()
	checkLogin();
	window.location.hash = '#login';
}
function signUp(email, password, usr) {
	let attributeList=[];
	let dataEmail={
		Name: "email",
		Value: email
	}
	username=usr
	let attributeEmail = new AmazonCognitoIdentity.CognitoUserAttribute(dataEmail);
	attributeList.push(attributeEmail);
	userPool.signUp(usr, password, attributeList, null, function(
		err,
		result
	) {
		if (err) {
			alert(err.message || JSON.stringify(err));
			return;
		}
		var cognitoUser = result.user;
		document.getElementById("emailConfirmMsg").innerText = "Email sent to "+email+" please  confirm email to continue."
		document.getElementById("user").value = "";
		document.getElementById("pass").value = "";
		document.getElementById("passConf").value = "";
		document.getElementById("email").value = "";
		showElement(document.getElementById("confirmDiv"));
	});
}

let changePassForm = document.getElementById("changePasswordForm");
changePassForm.addEventListener("submit", (e) => {
	e.preventDefault();
	let oldpass = document.getElementById("oldPass").value;
	let pass = document.getElementById("changePass").value;
	let passConf = document.getElementById("changePassConf").value;
	if(!validatePassword(pass)){
		document.getElementById("changeProblems").innerText = "Password must be at least 8 charaters and contain: upper case, lower case, number and special character"
		return
	}
	if(pass!=passConf){
		document.getElementById("changeProblems").innerText = "Password and confirmation must match"
		return
	}
	document.getElementById("changeProblems").innerText = ""
	document.getElementById("changePass").value = "";
	document.getElementById("changePassConf").value = "";
	credentials.user.changePassword(oldpass,pass,function(err,result){
		if (err) {
			alert(err.message || JSON.stringify(err));
			return;
		}
		window.location.hash = '#userprofile';
	})
});
let loginForm = document.getElementById("loginForm");
loginForm.addEventListener("submit", (e) => {
	e.preventDefault();
	let usr = document.getElementById("loginUser").value;
	usr=usr.replace(/\s/g,'')
	let pass = document.getElementById("loginPass").value;
	login(usr,pass);
	
});
let signupForm = document.getElementById("signupForm");
signupForm.addEventListener("submit", (e) => {
	e.preventDefault();
	let usr = document.getElementById("user").value;
	let pass = document.getElementById("pass").value;
	let passConf = document.getElementById("passConf").value;
	let email = document.getElementById("email").value;
	if (!validateUsername){
		document.getElementById("problems").innerText = "username cannot contains blank spaces such as tabs, returns or line breaks"
	}
	if(!validatePassword(pass)){
		document.getElementById("problems").innerText = "Password must be atleast 8 charaters and contain: upper case, lower case, number and special character"
		return
	}
	if(pass!=passConf){
		document.getElementById("problems").innerText = "Password and confirmation must match"
		return
	}
	document.getElementById("problems").innerText = ""
	signUp(email, pass, usr)
	
});
let confirmForm = document.getElementById("confirmForm");
confirmForm.addEventListener("submit", (e) => {
  e.preventDefault();
	let confirmation = document.getElementById("conf").value;
	let userData = {
		Username: username,
		Pool: userPool,
	}
	cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
	cognitoUser.confirmRegistration(confirmation, true, function(err, result) {
		if(err){
			alert("confirmation doesnt match")
		}else{
			previousPage="#userprofile"
			window.location.hash = '#login';
			alert("confirmation is complete, please login to finish!")
		}
	});
});
let resetForm1 = document.getElementById("resetPasswordForm1");
resetForm1.addEventListener("submit", (e) => {
	e.preventDefault();
	resetUsername = document.getElementById("resetUsername").value;
	let cognitoUser = new AmazonCognitoIdentity.CognitoUser({
        Username: resetUsername,
        Pool: userPool
    });
	cognitoUser.forgotPassword({
        onSuccess: function(result) {
            showElement(document.getElementById("ResetPassword2"))
        },
        onFailure: function(err) {
            alert(err);
        },
    });
});
let resetForm2 = document.getElementById("resetPasswordForm");
resetForm2.addEventListener("submit", (e) => {
	e.preventDefault();
	let verificationCode = document.getElementById("resetCode").value;
	let pass = document.getElementById("resetpass").value;
	let passConf = document.getElementById("resetpassConf").value;
	if(!validatePassword(pass)){
		document.getElementById("problemsreset").innerText = "Password must be atleast 8 charaters and contain: upper case, lower case, number and special character"
		return
	}
	if(pass!=passConf){
		document.getElementById("problemsreset").innerText = "Password and confirmation must match"
		return
	}
	document.getElementById("problemsreset").innerText = ""
	let cognitoUser = new AmazonCognitoIdentity.CognitoUser({
        Username: resetUsername,
        Pool: userPool
    });
	cognitoUser.confirmPassword(verificationCode, pass, {
            onFailure(err) {
                alert(err);
            },
            onSuccess() {
                window.location.hash="#login"
            },
        });
});
function login(usr,pass){
	let authenticationData = {
		Username: usr,
		Password: pass,
	};
	let authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);
	let userData = {
		Username: usr,
		Pool: userPool,
	};
	cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
	cognitoUser.authenticateUser(authenticationDetails, {
		onSuccess: function(result) {
			window.location.hash = "#home"//winodw.location.pathname = "https://structuralab.com"
		},
		onFailure: function(err) {
			alert(err.message || JSON.stringify(err));
		},
		
	})
}
function validatePassword(pw) {
    return /[A-Z]/       .test(pw) &&
           /[a-z]/       .test(pw) &&
           /[0-9]/       .test(pw) &&
           /[^A-Za-z0-9]/.test(pw) &&
           pw.length >= 8;

}
//login status


function showElement(element,checkLogin=false){
	hideMain();
	if(credentials == null && checkLogin){
		window.location.hash = '#login';
		showElement(document.getElementById("loginFormDiv"));
	}else{
		element.classList.remove("hide")
		element.classList.add("show")
	}
}


function checkLogin(){
	cognitoUser = userPool.getCurrentUser();
	
	if(cognitoUser==null){
		document.getElementById("signOutButton").classList.remove("show")
		document.getElementById("signOutButton").classList.add("hide")
		document.getElementById("profLink").classList.remove("show")
		document.getElementById("profLink").classList.add("hide")
		document.getElementById("loginLink").classList.remove("hide")
		document.getElementById("loginLink").classList.add("show")
		credentials=null;
		return
	}
	credentials={}
	credentials.user = cognitoUser;
	username = cognitoUser.username
	document.getElementById("signOutButton").classList.add("show")
	document.getElementById("signOutButton").classList.remove("hide")
	document.getElementById("profLink").classList.add("show")
	document.getElementById("profLink").classList.remove("hide")
	document.getElementById("loginLink").classList.add("hide")
	document.getElementById("loginLink").classList.remove("show")
}