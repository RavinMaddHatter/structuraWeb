
const apiUrl="https://9gfs7b30ea.execute-api.us-east-2.amazonaws.com/default/structurawebpage";
const structuraURL = "https://q8d2yjlbd3.execute-api.us-east-2.amazonaws.com/default/structura"
var cachedItems={}

const poolData = {
	UserPoolId: 'us-east-2_F8JCwtZAa', // Your user pool id here
	ClientId: 'tese5jomgf225lrvescg5o96l', // Your client id here
};
var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);//user pool data for account management
var cognitoUser=null
var credentials = null;//current login credentials. Gets set by cognito.
var moderator
checkLogin();


function resizeGrid(size){
	var height = document.body.clientHeight;
	var width = document.body.clientWidth;
	var cols = Math.floor(width/290)
	var rows = Math.ceil(size/cols)
	var gridTempCol = ""
	var gridTempRow = ""
	for (var x = 0; x < cols; x++){
		gridTempCol += "auto "
	}
	for (var x = 0; x < rows; x++){
		gridTempRow += "290px "
	}
	document.getElementById("grid").style.gridTemplateColumns = gridTempCol;
	document.getElementById("grid").style.gridTemplateRows = gridTempRow;
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
// display grid stuff
function setupGrid(items, cache=true){
	
	if (Object.keys(cachedItems).length>10000){//one item averages about 1kB limiting memory use to about 10MB
		cachedItems={}
	}
	resizeGrid(items.length)
	for(var i=0; i<items.length; i++){
		if(cache){
			cachedItems[items[i]["GUID"]]=items[i]
		}
		addElement(items[i]);
	}
}
function showGrid(){
	document.getElementById("grid").classList.remove("hide")
	document.getElementById("grid").classList.add("showGrid")
}
function addElement(data){
	let div = document.createElement("div");
	div.classList.add("item") ;
	let head = document.createElement("div");
	head.classList.add("head");
	let profile = document.createElement("a");
	profile.href = "#profile#"+data["Creator"]
	let icon = document.createElement("img");
	profile.classList.add("profileIcon")
	icon.src = "https://structuralab.com/Profiles/"+data["Creator"]+"/profilePic.png"
	icon.setAttribute("onerror","noProfPic(this)")
	let headText = document.createElement("div");
	headText.classList.add("headText");
	let profileName = document.createElement("a");
	profileName.classList.add("profName");
	profileName.href = "#profile#"+data["Creator"]
	profileName.innerText = data["Creator"].slice(0,25)	;
	let demoteButton = document.createElement("BUTTON")

	demoteButton.classList.add("demote");
	demoteButton.guid = data["GUID"]
	demoteButton.innerText="demote";
	demoteButton.addEventListener("click", demote);
	
	let itemName = document.createElement("a")
	//itemName.href = "https://structuralab.com/"+data["GUID"]+"/item.html"
	itemName.href = "https://structuralab.com/"+data["GUID"]+"/item"+data["edits"].toFixed(0)+".html"
	itemName.classList.add("itemNameGrid")
	itemName.innerText = data["Name"].slice(0,40)	
	let imgContainer = document.createElement("div");
	let itemLink = document.createElement("a");
	let itemImg = document.createElement("img");
	if("youtube" in data && data["youtube"].length>0){
		let videoguid = data["youtube"].split("/").pop()
		if(videoguid.includes("v=")){
			videoguid = videoguid.split("v=").pop()
		}
		if(videoguid.includes("?")){
			videoguid = videoguid.split("?")[0]
		}
		if(videoguid.includes("&")){
			videoguid = videoguid.split("&")[0]
		}
		//videoguid = videoguid.split("&").shift()
		const youtubeThumb = "https://img.youtube.com/vi/"+videoguid+"/0.jpg"
		itemImg.src = youtubeThumb
	}
	else{
		itemImg.src = "https://structuralab.com/"+data["GUID"]+"/thumbnail.png"
	}
	let profileSpan = document.createElement("span");
	profileSpan.classList.add("headText");
	itemImg.setAttribute("onerror","noThumbnail(this)")
	itemImg.classList.add("itemPicture");
	itemLink.href="https://structuralab.com/"+data["GUID"]+"/item"+data["edits"].toFixed(0)+".html"
	itemLink.classList.add("itemImgContainer")
	itemLink.appendChild(itemImg);
	headText.appendChild(itemName);
	profileSpan.appendChild(profileName);
	headText.appendChild(profileSpan);
	profileSpan.appendChild(demoteButton);
	if (moderator){
		demoteButton.classList.add("show");
	}
	else{
		demoteButton.classList.add("hide");
	}
	profile.appendChild(icon);
	head.appendChild(profile);
	head.appendChild(headText);
	div.appendChild(head);
	div.appendChild(itemLink)
	document.getElementById("grid").appendChild(div);
}
// button responses
function sortGrid(key){
	let sortedItems=[]
	switch(key){
		case 'newest':
			sortedItems = sortItems("date",cachedItems).reverse()
			break;
		case 'rank':
			sortedItems = sortItems("rank",cachedItems).reverse();
			break;
		case 'name':
			sortedItems = sortItems("Name",cachedItems);
			break;
		case 'oldest':
			sortedItems = sortItems("date",cachedItems);
			break;
		case 'random':
			sortedItems = Object.values(cachedItems).sort( () => .5 - Math.random() );
			break;
		default:
			sortedItems = sortItems("rank",cachedItems).reverse()
			
	}
	clearChildElements(document.getElementById("grid"));//clears the grid elements
	setupGrid(sortedItems, cache=false)
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

// Default on error functions
function noProfPic(element){
	element.src='https://structuralab.com/Profiles/Default_pfp.png'
}
function noThumbnail(element){
	element.src = "https://structuralab.com/default.png"
}
function noImage(element){
	element.src = "https://structuralab.com/default.png"
}
//cognito stuff 
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
	check_mod(username);
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
function deleteUser(callback){
	cognitoUser.deleteUser(function(e,r) {
		if(e){
			alert(e.message||JSON.strigify(e))
		}
		callback()
	})
}

//Signed Event Callbacks typically called after a getToken
function signFiles(jwtoken){// called from the file upload button as callback. needs addition args
	getSignedS3Urls(uploadFileBatch,Object.keys(fileUploadObjects),jwtoken)
	//consider refactor of call back to incldue addtional args to remove function
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
function check_mod(profile){
	fetch(apiUrl, {
		method: 'POST',
		headers: {page:"profile",filter:profile}
	})
	.then(response => response.json())
	.then(response => {
		profile=response["profile"]
		if (profile["admin"]){
			moderator = profile["admin"]
			for(const button of document.getElementsByClassName("demote")){
				button.classList.remove("hide")
				button.classList.add("show")
			}
		}
	})
}
//Cognito user functions
function signOut(){
	credentials.user.signOut()
	checkLogin();
	window.location.href = "https://structuralab.com/login.html";
}
// moderation stuff
var postDemoteGuid = ""
function demote(evt){
	if (moderator){
		postDemoteGuid = evt.currentTarget.guid
		getToken(demotePost)
	}
}
function demotePost(jwtoken){
	let url = window.location.href
	let itemGuid = url.split("/").reverse()[1]
	fetch(apiUrl, {
		method: 'POST',
		headers: {page:"demotepost",
				filter:postDemoteGuid,
				token:jwtoken}
	}).then(response => response.json())
	.then(response => {
		
		console.log("post demoted: " + postDemoteGuid)
		postDemoteGuid=""
	})
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
	window.location.hash="#edititem#"+headder.guid
    //for when i pull out all of the item page stuff.
	//window.location.pathname = "https://structuralab.com/"+headder.guid+"/item1.html"
}

function fixThumnailSize(jwtoken){
	const guid = window.location.hash.split("#")[2].split("&")[0]
	fetch(apiUrl, {
		method: 'POST',
		headers: {page:"resizeimages",filter:guid,
			imagetype:"thumbnail",
			token:jwtoken}
	})
	.then(response => response.json())
	.then(response => {
		const guid = window.location.hash.split("#")[2].split("&")[0]
		document.getElementById("gallery").src = "https://structuralab.com/"+guid+"/fullSizedPicture.png?t=" + new Date().getTime();
	})
}
function loadMore(){
	getBulkItemData(previousPage,previousEndKey)
}
function getBulkItemData(page_value,prev_key){//
	showGrid();
	loadCookies("rank")
	sortGrid();
	let headers = {page:page_value}
	if (prev_key){
		headers["lastevaluated"]=JSON.stringify(prev_key)
	}
	fetch(apiUrl, {
		method: 'POST',
		headers: headers
	})
	.then(response => response.json())
	.then(response => {
		if (prev_key){
			cachedItems=cachedItems.concat(response["items"])
		}
		else{
			cachedItems=response["items"]
		}
		if (response.hasOwnProperty("lastevaluated")){
			previousEndKey=response["lastevaluated"]
			for(const button of document.getElementsByClassName("grid-more")){
				button.classList.remove("hide")
				button.classList.add("show")
			}
		}
		else{
			previousEndKey=null
			
			for(const button of document.getElementsByClassName("grid-more")){
				button.classList.remove("show")
				button.classList.add("hide")
			}
		}
		sortGrid("rank")
		saveCookies(cachedItems);
		
	})
}
