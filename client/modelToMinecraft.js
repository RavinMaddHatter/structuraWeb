const apiUrlM2M = "https://8xv3m8qm6j.execute-api.us-east-2.amazonaws.com/default/ModelToMinecraftWeb"
const poolData = {
	UserPoolId: 'us-east-2_F8JCwtZAa', // Your user pool id here
	ClientId: 'tese5jomgf225lrvescg5o96l', // Your client id here
};
var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);//user pool data for account management
var credentials = null;//current login credentials. Gets set by cognito.
checkLogin();//verifies user login state to keep experience uniform
var fileUploadObject={}
var pathStructure = ""
var guid = ""



function uploadMcstructure(){
	window.location.hash = "#uploadInProgress"
	let file = document.getElementById('fileUpload').files[0];
	let validFile=true;
	let fileName = file.name;
	let fileSize = file.size;
	if(fileSize==0){
		alert(fileName+" is an empty file.")
		validFile=false
	}
	if(validFile){
		let uploadObject={}
		fileUploadObject.Body=file
		fileUploadObject.ACL="public-read"
	}
	if(validFile){
		hideMain()
		getToken(signFiles)
		document.getElementById("processing").classList.add('show');
		document.getElementById("processing").classList.remove('hide');
		document.getElementById("processingTitle").innerText="Requesting Upload"
		document.getElementById("processingText").innerText="This may take up to 3 seconds"
	}
}

function clearForms(){//reset all form values to empty
	let inputs = document.getElementsByTagName('input');
	for (index = 0; index < inputs.length; ++index) {
		if(inputs[index].type!="submit"&&inputs[index].type!="button"){
			inputs[index].value="";
		}
	}	
}


//Signed Event Callbacks typically called after a getToken
function signFiles(jwtoken){// called from the file upload button as callback. needs addition args
	getSignedS3Urls(uploadFile,jwtoken)
}
function uploadFile(headder){
	
	document.getElementById("processingTitle").innerText="Uploading Files"
	document.getElementById("processingText").innerText="This may take some time."
	pathStructure = headder.path
	guid = headder.guid
	console.log(headder)
	postFile(fileUploadObject.Body,headder.url)
}
function getSignedS3Urls(callback,jwtoken){
	let headder={page:"upload",token:jwtoken,file:fileUploadObject.Body.name}
	fetch(apiUrlM2M, {
		method: 'POST',
		headers: headder
	})
	.then(response => response.json())
	.then(response => {
		callback(response)
	})
}
function convertFile(jwtoken){
	let rotx = document.getElementById("rotX").value
	let roty = document.getElementById("rotY").value
	let rotz = document.getElementById("rotZ").value
	let scale = document.getElementById("scaleInput").value
	let headder={page:"convertFile",token:jwtoken,loc:pathStructure,rotx:rotx,roty:roty,rotz:rotz,scale:scale,guid:guid}
	console.log(headder)
	fetch(apiUrlM2M, {
		method: 'POST',
		headers: headder
	})
	.then(response => response.json())
	.then(response => {
			clearForms()
		//if("downloadLink" in response){
			document.getElementById('downloadLink').href = response.downloadLoc
			hideMain()
			document.getElementById('download').classList.add('show')
			document.getElementById('download').classList.remove('hide')
		//}else{
		//	document.getElementById('fail').classList.add('show')
		//	document.getElementById('fail').classList.remove('hide')
		//}
	})
}
//helpers
function hideMain(){//reset web page to a default state to enable loading
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
function postFile(file,signedRequest){
	const options = {
		method: 'PUT',
		body: file
	};
	fetch(signedRequest, options).then(response =>{
		
		document.getElementById("processingTitle").innerText="Converting File"
		document.getElementById("processingText").innerText="This can take up to 1 minute after 1 minute it will fail if the file is too big"
		getToken(convertFile)

	})
}


// function for getting JWT from cognito to verify user Identity
function getToken(callback){
	var session=cognitoUser.getSession(function(e,r) {
		if(e){
			alert(e.message||JSON.strigify(e))
		}
		callback(r.getAccessToken().getJwtToken())
	})
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

