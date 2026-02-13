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


function makeMapArt(){
	window.location.hash = "#uploadInProgress"
	let file = document.getElementById('fileUpload').files[0];
	if (!file){
		hideMain()
		document.getElementById("error").classList.remove("hide")
		document.getElementById("error").classList.add("show")
		document.getElementById("errorMessage").innerText="No file was selected."
		return
	}
	let validFile=true;
	let fileName = file.name;
	let fileSize = file.size;
	if(fileSize==0){
		validFile=false
		hideMain()
		document.getElementById("error").classList.remove("hide")
		document.getElementById("error").classList.add("show")
		document.getElementById("errorMessage").innerText="The image file is empty, it cannot be used to create a map."
		return
	}
	if(getPalette().lenght==0){
		validFile=false
		hideMain()
		document.getElementById("error").classList.remove("hide")
		document.getElementById("error").classList.add("show")
		document.getElementById("errorMessage").innerText="Not blocks are allowed in the palette, this would result in an empty structure. No need to proceed"
		return
	}
	if(validFile){
		let uploadObject={}
		fileUploadObject.Body=file
		fileUploadObject.ACL="public-read"
		hideMain()
		getToken(signFiles)
		document.getElementById("processing").classList.add('show');
		document.getElementById("processing").classList.remove('hide');
		document.getElementById("processingTitle").innerText="Requesting Upload"
		document.getElementById("processingText").innerText="This may take up to 3 seconds"
	}
}
function getPalette(){
	let palette = {}
	for(const ColorEnable of document.getElementsByClassName("blockenable")){
		let colorString = ColorEnable.name
		if (ColorEnable.checked){
			let blockSelect=document.getElementById(colorString+"-select")
			palette[colorString]=blockSelect.value
		}
		
	}
	return palette
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
	
	if(headder.hasOwnProperty("path")){
		document.getElementById("processingTitle").innerText="Uploading Files"
		document.getElementById("processingText").innerText="This may take some time."
		pathStructure = headder.path
		guid = headder.guid
		postFile(fileUploadObject.Body,headder.url)
	}else{
		hideMain()
		document.getElementById("error").classList.remove("hide")
		document.getElementById("error").classList.add("show")
		document.getElementById("errorMessage").innerText="An error occured while requesting permision to upload, try again later."
	}
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
	let palette = getPalette()
	if (palette.length == 0 ){
		hideMain()
		document.getElementById("error").classList.remove("hide")
		document.getElementById("error").classList.add("show")
		document.getElementById("errorMessage").innerText="No blocks have been selected, cannot make map art"
		return
	}
	let outName = document.getElementById("name_input").value
	let headder={page:"makeMapArt",token:jwtoken,loc:pathStructure,guid:guid,name:outName,palette:JSON.stringify(palette)}
	console.log(headder)
	fetch(apiUrlM2M, {
		method: 'POST',
		headers: headder
	})
	.then(response => response.json())
	.then(response => {
			clearForms()
			console.log(response)
			if(response.hasOwnProperty("downloadLoc")){
				document.getElementById('downloadLink').href = response.downloadLoc
				hideMain()
				document.getElementById('download').classList.add('show')
				document.getElementById('download').classList.remove('hide')
			}else{
				hideMain()
				document.getElementById("error").classList.remove("hide")
				document.getElementById("error").classList.add("show")
				document.getElementById("errorMessage").innerText="An unknown error occured, please try again later or with different images."
			}
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
		//hideMain()
		document.getElementById("signOutButton").classList.remove("show")
		document.getElementById("signOutButton").classList.add("hide")
		document.getElementById("profLink").classList.remove("show")
		document.getElementById("profLink").classList.add("hide")
		document.getElementById("loginLink").classList.remove("hide")
		document.getElementById("loginLink").classList.add("show")
		document.getElementById("loginError").classList.remove("hide")
		document.getElementById("loginError").classList.add("show")
		document.getElementById("submitButton").classList.remove("show")
		document.getElementById("submitButton").classList.add("hide")
		//document.getElementById("error").classList.add("show")
		//document.getElementById("errorMessage").innerText="You must login to continue."
		//document.getElementById("errorLink").innerText="Login Here"
		//document.getElementById("errorLink").href="https://structuralab.com/login.html#login"
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
	document.getElementById("loginError").classList.remove("show")
	document.getElementById("loginError").classList.add("hide")
	document.getElementById("submitButton").classList.remove("hide")
	document.getElementById("submitButton").classList.add("show")
	//document.getElementById("errorMessage").innerText=""
	//document.getElementById("errorLink").innerText="Return to Map Art Upload"
	//document.getElementById("errorLink").href="https://structuralab.com/mapart.html"
	
}

