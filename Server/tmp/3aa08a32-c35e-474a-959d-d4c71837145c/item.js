//global Constants
const apiUrl="https://9gfs7b30ea.execute-api.us-east-2.amazonaws.com/default/structurawebpage";
const structuraURL = "https://q8d2yjlbd3.execute-api.us-east-2.amazonaws.com/default/structura"
const defaultDescription = "Community site for Minecraft Bedrock users. Discover and share Minecraft Bedrock tutorials, builds, redstone, decorations and more."
const poolData = {
	UserPoolId: 'us-east-2_F8JCwtZAa', // Your user pool id here
	ClientId: 'tese5jomgf225lrvescg5o96l', // Your client id here
};
//Global Variables
var resetUsername = "";//used in the password reset process
var previousEndKey = "";//used in dynamoDB querry to get next MB of data
var cachedItems = {}//cache of all items from fetch to reduce needless API querries
var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);//user pool data for account management
var credentials = null;//current login credentials. Gets set by cognito.
var fileUploadObjects={}//place holder for items being uploaded during callbacks.
var previousPage=""//holds the previous hash for during login events
var metaTitle = document.querySelector('title').textContent//title of SEO purpases
var Description = document.getElementById("metaDescription")//Description handle for SEO purposes
// check if user is logged in
checkLogin();//verifies user login state to keep experience uniform

window.onclick = function(event) {//clicking the dropdowns
  if (!event.target.matches('.dropbtn')) {
    hideDropdowns();
  }
}
//Page Generation Callbacks
function editItemForm(item){
	document.getElementById("editThumnail").src = "https://s3.us-east-2.amazonaws.com/structuralab.com/"+item["GUID"]+"/thumbnail.png"
	document.getElementById("editTitle").value = item["Name"]
	document.getElementById("editDescription").value = item["Description"]
	document.getElementById("editCategory").value = item["Category"]
	document.getElementById("editVisibility").checked = item["Visible"]
	if("youtube" in item){
		document.getElementById("setYoutubeLink").value = item["youtube"]
	}
	if("youtube" in item && item["youtube"].length>0){
		const videoguid = item["youtube"].split("/").pop()
		const youtubeThumb = "https://img.youtube.com/vi/"+videoguid+"/0.jpg"
		document.getElementById("editThumnail").src = youtubeThumb
	}
}
// Default on error functions
function noProfPic(element){
	element.src='https://s3.us-east-2.amazonaws.com/structuralab.com/Profiles/Default_pfp.png'
}
function noThumbnail(element){
	element.src = "https://s3.us-east-2.amazonaws.com/structuralab.com/default.png"
}
function noImage(element){
	element.src = "https://s3.us-east-2.amazonaws.com/structuralab.com/default.png"
}
//buttons
function clickFilter() {
  show = !document.getElementById("filter").classList.contains("show");
  hideDropdowns();
  if(show){
	document.getElementById("filter").classList.add("show");
  }
}
function submitItemEdit(){
	getToken(postEdit)
	getToken(makeStructura)
}
function editItemButton(){
	hideMain()
	showElement(document.getElementById("editItem"));
}
function delteItemButton(){
	if(confirm("Pressing Okay will delete this post.\nThis cannot be undone.\nPressing Cancel will return.")){
		getToken(deleteItem)
	}
}
function loadUserProfilePage(){
	getToken(fetchProfile)
}
function uploadButton(){
	
	if(cognitoUser){
		window.location.href = 'https://structuralab.com#upload';
		return
	}
	window.location.href = 'https://structuralab.com#login';
}
function uploadMcstructure(){
	let files = document.getElementById('fileUpload').files;
	if(files){
		fileUploadObjects={}
		Array.from(files).forEach(file => {
			let validFile=true;
			let fileName = file.name;
			let fileSize = file.size;
			if(!fileName.includes(".mcstructure")){
				alert(fileName+" is not a .mcstructure file")
				validFile=false
			}
			if(fileSize==0){
				alert(fileName+" is an empty file.")
				validFile=false
			}
			if(validFile){
				let uploadObject={}
				uploadObject.Body=file
				uploadObject.ACL="public-read"
				fileUploadObjects[fileName]=uploadObject
			}
		});
		getToken(signFiles)
	}
}
//navigation and show functions 
function showElement(element,checkLogin=false){
	hideMain();
	if(credentials == null && checkLogin){
		window.location.href = 'https://structuralab.com/#login';
		showElement(document.getElementById("loginFormDiv"));
	}else{
		element.classList.remove("hide")
		element.classList.add("show")
	}
}


//Clearing and default form functions
function clearChildElements(hostElement){//Removes all childern from element
	while (hostElement.firstChild) {
		hostElement.removeChild(hostElement.lastChild);
	}
}
function hideMain(){//reset web page to a default state to enable loading
	//clearForms();//removes all default entry data from forms
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
function clearForms(){//reset all form values to empty
	let inputs = document.getElementsByTagName('input');
	for (index = 0; index < inputs.length; ++index) {
		if(inputs[index].type!="submit"&&inputs[index].type!="button"){
			inputs[index].value="";
		}
	}	
}
function hideDropdowns(){//hides the dropdowns for the middle navagation menue
	var dropdowns = document.getElementsByClassName("dropdown-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
}
//Cognito user functions
function signOut(){
	credentials.user.signOut()
	checkLogin();
	window.location.href = 'https://structuralab.com/#login';
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


function validatePassword(pw) {
    return /[A-Z]/       .test(pw) &&
           /[a-z]/       .test(pw) &&
           /[0-9]/       .test(pw) &&
           /[^A-Za-z0-9]/.test(pw) &&
           pw.length >= 8;

}
// profile editing
function saveUserProfile(){
	getToken(postUserProfile)
}
// Posting/uploading files (pre-signed S3 URLS)
function postFile(file,signedRequest){
	const options = {
		method: 'PUT',
		body: file
	};
	fetch(signedRequest, options).then(response =>{
		//Status bar updates go here...
	})
}
function postFileWithCallback(file,signedRequest,callback){
	const options = {
		method: 'PUT',
		body: file
	};
	fetch(signedRequest, options)
	.then(response =>{
		getToken(callback)
	})
}

//Credentials checker using AWS Cognito Identities
function checkLogin(){
	cognitoUser = userPool.getCurrentUser();
	document.getElementById("editPageButtonDiv").classList.remove("show")
	document.getElementById("editPageButtonDiv").classList.add("hide")
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
	creator=document.getElementById("itemProfile").innerText
	if (username=creator){
		document.getElementById("editPageButtonDiv").classList.add("show")
		document.getElementById("editPageButtonDiv").classList.remove("hide")
	}

	document.getElementById("signOutButton").classList.add("show")
	document.getElementById("signOutButton").classList.remove("hide")
	document.getElementById("profLink").classList.add("show")
	document.getElementById("profLink").classList.remove("hide")
	document.getElementById("loginLink").classList.add("hide")
	document.getElementById("loginLink").classList.remove("show")
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

//Signed Event Callbacks typically called after a getToken
function signFiles(jwtoken){// called from the file upload button as callback. needs addition args
	getSignedS3Urls(uploadFileBatch,Object.keys(fileUploadObjects),jwtoken)
	//consider refactor of call back to incldue addtional args to remove function
}
function fetchProfile(jwtoken){
	if (credentials==null){
		showElement(document.getElementById("loginFormDiv"));;
		return
	}
	hideMain()
	document.getElementById("userProfile").classList.remove("hide")
	document.getElementById("userProfile").classList.add("show")
	fetch(apiUrl, {
		method: 'POST',
		headers: {page:"usrprofile",filter:credentials.user.username,token:jwtoken}
	})
	.then(response => response.json())
	.then(response => {
		document.getElementById("userProfileIcon").src = "https://s3.us-east-2.amazonaws.com/structuralab.com/Profiles/"+credentials.user.username+"/profilePic.png"
		document.getElementById("userProfileYoutubeInput").value = response["profile"]["Youtube"];
		document.getElementById("userProfileDiscordInput").value = response["profile"]["Discord"];
		document.getElementById("userProfilePatreonInput").value = response["profile"]["Paetron"];
		document.getElementById("userProfileKoFiInput").value = response["profile"]["Ko-Fi"];
		document.getElementById("userProfileTwitchInput").value = response["profile"]["Twitch"];
		showGrid();
		setupGrid(response["items"])
	})
}

function getSignedS3Urls(callback,fileNameList,jwtoken){
	fetch(apiUrl, {
		method: 'POST',
		headers: {page:"upload1",filter:"None",token:jwtoken,files:fileNameList}
	})
	.then(response => response.json())
	.then(response => {
		callback(response)
	})
}

function fixThumnailSize(jwtoken){
	const guid = window.location.href.split("/").slice(-2, -1)[0]
	fetch(apiUrl, {
		method: 'POST',
		headers: {page:"resizeimages",filter:guid,
			imagetype:"thumbnail",
			token:jwtoken}
	})
	.then(response => response.json())
	.then(response => {
		const guid = window.location.href.split("/").slice(-2, -1)[0]
		document.getElementById("gallery").src = "https://s3.us-east-2.amazonaws.com/structuralab.com/"+guid+"/fullSizedPicture.png?t=" + new Date().getTime();
	})
}
function fixIconSize(jwtoken){
	fetch(apiUrl, {
		method: 'POST',
		headers: {page:"resizeimages",filter:"None",
			imagetype:"profileIcon",
			token:jwtoken}
	})
	.then(response => response.json())
	.then(response => {
		document.getElementById("userProfileIcon").src = "https://s3.us-east-2.amazonaws.com/structuralab.com/Profiles/"+credentials.user.username+"/profilePic.png?t=" + new Date().getTime();
	})
	
}

function makeStructura(jwtoken){
	const guid = window.location.href.split("/").slice(-2, -1)[0]
	console.log(guid)
	fetch(structuraURL, {
		method: 'POST',
		headers: {
			guid:guid,
			name:document.getElementById("editTitle").value,
			token:jwtoken}
	})
	.then(response => response.json())
	.then(response => {
		reload()
	})
}

function deleteItem(jwtoken){
	const guid  = window.location.href.split("/").slice(-2, -1)[0]
	fetch(apiUrl, {
		method: 'POST',
		headers: {page:"deleteitem",filter:guid,token:jwtoken}
	})
	.then(response => response.json())
	.then(response => {
		window.location.href = "https://structuralab.com"
	})
	
}

function postUserProfile(jwtoken){
	let youtube = document.getElementById("userProfileYoutubeInput").value;
	let discord = document.getElementById("userProfileDiscordInput").value;
	let patreon = document.getElementById("userProfilePatreonInput").value;
	let kofi = document.getElementById("userProfileKoFiInput").value;
	let twitch = document.getElementById("userProfileTwitchInput").value;
	fetch(apiUrl, {
		method: 'POST',
		headers: {page:"profileupdate",filter:"None",
			token:jwtoken,
			youtube:youtube,
			discord:discord,
			patreon:patreon,
			kofi:kofi,
			twitch:twitch}
	})
	.then(response => response.json())
	.then(response => {
		if ("iconURL" in response){
			let file = document.getElementById('uploadProfilePicture').files[0];
			if(file){
				postFileWithCallback(file,response["iconURL"],fixIconSize)
			}else{
				alert(response["message"])
			}
		}else{
			alert(response)
		}
	})
}
function postEdit(jwtoken){
	let itemData={}
	itemData.name = document.getElementById("editTitle").value
	itemData.description = document.getElementById("editDescription").value
	itemData.visibility = document.getElementById("editVisibility").checked 
	itemData.category = document.getElementById("editCategory").value
	itemData.youtubelink = document.getElementById("setYoutubeLink").value 
	const guid = window.location.href.split("/").slice(-2, -1)[0]
	console.log(guid)
	itemData=JSON.stringify(itemData)
	fetch(apiUrl, {
		method: 'POST',
		headers: {page:"updateItem",filter:guid,token:jwtoken,data:itemData}
	})
	.then(response => response.json())
	.then(response => {
		if ("thumbnailURL" in response){
			let file = document.getElementById('thumbnailUpload').files[0];
			if(file){
				postFileWithCallback(file,response["thumbnailURL"],fixThumnailSize)
			}else{
				//note sucess
			}
		}else{
			alert(response)
		}
		completeEditing()
	})
}
function completeEditing(){
	hideMain()
	reload()
}
var reloadReady=false
function reload(){
	if(reloadReady){
		location.reload()
		return
	}
	reloadReady=true
}

//public data fetches 
function getItemData(itemGuid){//gets item data if and only if the data isnt cached
	let item={}
	if(itemGuid in cachedItems){
		makeItemPage(cachedItems[itemGuid])
	}else{
		fetch(apiUrl, {
			method: 'POST',
			headers: {page:"item",filter:itemGuid}
		})
		.then(response => response.json())
		.then(response => {
			item=response["item"]
			cachedItems[item["GUID"]]=item
			makeItemPage(item)
		})
	}
}

function getBulkItemData(page_value,filter_value){//
	showGrid();
	fetch(apiUrl, {
		method: 'POST',
		headers: {page:page_value,filter:filter_value}
	})
	.then(response => response.json())
	.then(response => {
		setupGrid(response["items"])
	})
}

//Helper functions
function dynamicSort(property) {
    var sortOrder = 1;
    if(property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a,b) {
        /* next line works with strings and numbers, 
         * and you may want to customize it to your needs
         */
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }
}
function sortItems(key,data){
	
	let newArrayDataOfOjbect = Object.values(data)
	newArrayDataOfOjbect.sort(dynamicSort(key))
	return newArrayDataOfOjbect
}
function validateUsername(usrName){
	return /\s/g.test(usrName);
}