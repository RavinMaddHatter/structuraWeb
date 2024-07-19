//global Constants
const apiUrl="https://9gfs7b30ea.execute-api.us-east-2.amazonaws.com/default/structurawebpage";
const structuraURL = "https://q8d2yjlbd3.execute-api.us-east-2.amazonaws.com/default/structura"
const defaultDescription = "Community site for Minecraft Bedrock users. Discover and share Minecraft Bedrock tutorials, builds, redstone, decorations and more."
const poolData = {
	UserPoolId: 'us-east-2_F8JCwtZAa', // Your user pool id here
	ClientId: 'tese5jomgf225lrvescg5o96l', // Your client id here
};
//Global Variables
var previousEndKey = "";//used in dynamoDB querry to get next MB of data
var cachedItems = {}//cache of all items from fetch to reduce needless API querries
var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);//user pool data for account management
var credentials = null;//current login credentials. Gets set by cognito.
var fileUploadObjects={}//place holder for items being uploaded during callbacks.
var previousPage=""//holds the previous hash for during login events
var metaTitle = document.querySelector('title').textContent//title of SEO purpases
var Description = document.getElementById("metaDescription")//Description handle for SEO purposes
var pageType = ""
var guid = "";
// check if user is logged in
checkLogin();//verifies user login state to keep experience uniform
// begin loading website
initialLoad();//Check hash and start loading website
function initialLoad(){
	if (window.location.hash.length>2){
		pageType = window.location.hash
	}
	load()
}
//Processing Hash information
function load(){
	hideMain();
	pagenum=0;
	if (window.location.hash.length>2){
		pageType = window.location.hash.split("&")[0]
	}
	console.log(pageType);
	switch(pageType){
	
		case "#signout":
			window.location.href = "https://structuralab.com/login.html";
			signOut();
		case "#login":
			window.location.href = "https://structuralab.com/login.html";
			break;
		case "#timeoutError":
			document.getElementById("timeoutError").classList.add("show")
			document.getElementById("timeoutError").classList.remove("hide")
			break;
		case "#makingPost":
			document.getElementById("makingPost").classList.add("show")
			document.getElementById("makingPost").classList.remove("hide")
			break;
		case "#convertInProgress":
			document.getElementById("convertInProgress").classList.add("show")
			document.getElementById("convertInProgress").classList.remove("hide")
			break;
		case "#uploadInProgress":
			document.getElementById("uploadInProgress").classList.add("show")
			document.getElementById("uploadInProgress").classList.remove("hide")
			break;
		case "#"://home/default
		case "#upload"://home/default
		case ""://home/default
			document.getElementById("uploadStep1").classList.remove("hide")
			document.getElementById("uploadStep1").classList.add("show")
			break;
		case "#userprofile":
			window.location.href = "https://structuralab.com/#userprofile";
			break;
		default://processing fall through. particulary double hashed items
			break;
	}
}



//Event Listeners
window.onhashchange = function(){//checks if the hash has changed to refresh user views
	pageType=window.location.hash
	load();//determine what should happen on this hash refreshe
}

function loadUserProfilePage(){
	getToken(fetchProfile)
}
function uploadButton(){
	if(cognitoUser){
		window.location.href = 'https://structuralab.com/upload.html';
		return
	}
	window.location.href = "https://structuralab.com/login.html";
}
function uploadMcstructure(){
	window.location.hash = "#uploadInProgress"
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
		window.location.href = "https://structuralab.com/login.html"
		showElement(document.getElementById("loginFormDiv"));
	}else{
		element.classList.remove("hide")
		element.classList.add("show")
	}
}

function completeEditing(url){
	//needs work
	//const guid = window.location.hash.split("#")[2].split("&")[0]
	//window.location.hash="#item#"+guid
	window.location.href = url
}
function showGrid(){
	document.getElementById("grid").classList.remove("hide")
	document.getElementById("grid").classList.add("showGrid")
}



//Clearing and default form functions
function clearChildElements(hostElement){//Removes all childern from element
	while (hostElement.firstChild) {
		hostElement.removeChild(hostElement.lastChild);
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
function clearForms(){//reset all form values to empty
	let inputs = document.getElementsByTagName('input');
	for (index = 0; index < inputs.length; ++index) {
		if(inputs[index].type!="submit"&&inputs[index].type!="button"){
			inputs[index].value="";
		}
	}	
}

//Cognito user functions
function signOut(){
	credentials.user.signOut()
	checkLogin();
	window.location.href = "https://structuralab.com/login.html";
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
function uploadFileBatch(headder){
	signedURLs=headder.urls
	fileUploadObjects
	for (const fileName in signedURLs){
		postFile(fileUploadObjects[fileName].Body,signedURLs[fileName])
	}
	window.location.hash = "#convertInProgress"
	guid = headder.guid

	getToken(makeStructura)
}
//Credentials checker using AWS Cognito Identities
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
	var timeRemaining = 300;
	var intervalID = setInterval(function () {
		document.getElementById("countdown").innerHTML = timeRemaining
		console.log(timeRemaining)
		--timeRemaining
		if (timeRemaining <= 0) {
			window.clearInterval(intervalID);
			window.location.hash = "#timeoutError"
		}
	}, 1000);
	fetch(structuraURL, {
		method: 'POST',
		headers: {
			guid:guid,
			name:"Name Not Set",
			token:jwtoken}
	})
	.then(response => response.json())
	.then(response => {
		window.clearInterval(intervalID);
		window.location.hash = "#makingPost"
		getToken(postEdit)
	})
}

function deleteItem(jwtoken){
	const guid = window.location.hash.split("#")[2].split("&")[0]
	fetch(apiUrl, {
		method: 'POST',
		headers: {page:"deleteitem",filter:guid,token:jwtoken}
	})
	.then(response => response.json())
	.then(response => {
		window.location.hash=previousPage
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
	itemData.name = "Name Not Set"
	itemData.description = ""
	itemData.visibility = false
	itemData.category = "Misc"
	itemData.youtubelink = ""
	console.log(guid)
	itemData=JSON.stringify(itemData)
	fetch(apiUrl, {
		method: 'POST',
		headers: {page:"updateItem",filter:guid,token:jwtoken,data:itemData}
	})
	.then(response => response.json())
	.then(response => {		
		completeEditing(response["url"])
	})
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
		cachedItems=response["items"]
		sortGrid("rank")
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
	for(let i of newArrayDataOfOjbect){
		if(i["GUID"]=="7cb41d1f-4966-44ae-8b80-50fd67644c19"){
		}
	}
	return newArrayDataOfOjbect
}