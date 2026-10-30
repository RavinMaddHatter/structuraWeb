//global Constants
//import {resizeGrid }from './utilities.js'

//Global Variables
var previousEndKey = null;//used in dynamoDB querry to get next MB of data
var credentials = null;//current login credentials. Gets set by cognito.
var fileUploadObjects={}//place holder for items being uploaded during callbacks.
var previousPage=""//holds the previous hash for during login events
var curPage="#"
var metaTitle = document.querySelector('title').textContent//title of SEO purpases
//var Description = document.getElementById("metaDescription")//Description handle for SEO purposes
var pageType = ""
// setup events 
window.addEventListener("resize", resizeGrid);

// check if user is logged in
checkLogin();//verifies user login state to keep experience uniform
var moderator = false // for those looking to exploit, this just shows buttons, server side checks handle the permissions for mod...
// begin loading website

initialLoad();//Check hash and start loading website
function initialLoad(){
	let path = window.location.pathname;
	let page = path.split("/").pop().replace(".html","");
	pageType="#"+page
	if (window.location.hash.length>2){
		pageType = window.location.hash
	}
	load()
}
//Processing Hash information
function load(){
	hideMain();
	pagenum=0;
	pageType=pageType.split("&")[0]
	if (window.location.hash.length>2){
		pageType = window.location.hash.split("&")[0]
	}
	previousEndKey=null
	console.log(pageType)
	switch(pageType){
		case "#Farms":
		case "#Buildings":
		case "#Terrain":
		case "#Villager":
		case "#Storage":
		case "#Flying":
		case "#Statues":
		case "#Furnaces":
		case "#Redstone":
		case "#Misc":
		case "#data"://not implemented
		case "#date-old"://not implemented
		case "#popular"://not implemented
		case "#rated"://not implemented
		case "#random"://not implemented
		case "#index"://not implemented
			previousPage=pageType
			getBulkItemData(pageType,previousEndKey);
			break;
		case "#signout":
			window.location.href = "https://structuralab.com/login.html";
			signOut();
		case "#gsc.tab=0"://home/default
		case "#"://home/default
		case "index'"://home/default
		case ""://home/default

			document.getElementById("homeText").classList.add("show")
			document.getElementById("homeText").classList.remove("hide")
			metaTitle = "Structura Lab"
			//Description.setAttribute("content",defaultDescription)
			getBulkItemData("default",previousEndKey);
			break;
		case "#userprofile":
			window.location.href = "https://structuralab.com/#userprofile";
			metaTitle = "Structura Lab: Your Profile"
			//Description.setAttribute("content","Edit your profile")
			previousPage="#userprofile"
			loadUserProfilePage();
			break;
		case "#upload":
			if(cognitoUser!=null){
				window.location.href = 'https://structuralab.com/upload.html';
				return
			}
			window.location.href = "https://structuralab.com/login.html";
			break;
		default://processing fall through. particulary double hashed items
			processHash(pageType);
			break;
	}
}
function processHash(hash){
	let hashArray = hash.split("#");//double hashed items for things like user/items lookups
	switch(hashArray[1]){
		case "item":
			getItemData(hashArray[2])
			break;
		case "profile":
			showProfilePage(hashArray[2])
			break;
		case "edititem":
			showEditItem(hashArray[2])
			break;
		default:
			let path = window.location.pathname;
			let page = path.split("/").pop().replace(".html","");
			if (page.length>0){
				document.getElementById("homeText").classList.add("hide")
				document.getElementById("homeText").classList.remove("show")
			}
			else{
				document.getElementById("homeText").classList.remove("hide")
				document.getElementById("homeText").classList.add("show")
			}
			break;

	}
}


//Event Listeners
window.onhashchange = function(){//checks if the hash has changed to refresh user views
	pageType=window.location.hash
	load();//determine what should happen on this hash refreshe
}



function send_demote(callback,jwtoken){
	fetch(apiUrl, {
		method: 'POST',
		headers: {page:"upload1",filter:"None",token:jwtoken,files:fileNameList}
	})
	.then(response => response.json())
	.then(response => {
		callback(response)
	})
}
//

function editItemForm(item){
	document.getElementById("editThumnail").src = "https://structuralab.com/"+item["GUID"]+"/thumbnail.png"
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





function submitItemEdit(){
	getToken(makeStructura)
}
function editItemButton(){
	//Needs work
	const guid = window.location.hash.split("#")[2].split("&")[0]
	window.location.hash="#edititem#"+guid
}
function delteItemButton(){
	if(confirm("Pressing Okay will delete this post.\nThis cannot be undone.\nPressing Cancel will return.")){
		getToken(deleteItem)
	}
}

function uploadButton(){
	
	if(cognitoUser!=null){
		window.location.href = "https://structuralab.com/upload.html";
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

function showlink(element,url){
	if(url==""){
		element.href = "#";
		element.innerText = "None";
		element.classList.add("hide")
		element.classList.remove("showinline")
	}else{
		element.href = url;
		element.innerText = url;
		element.classList.remove("hide")
		element.classList.add("showinline")
		
	}
}
//Clearing and default form functions
function clearChildElements(hostElement){//Removes all childern from element
	while (hostElement.firstChild) {
		hostElement.removeChild(hostElement.lastChild);
	}
}

function makeStructura(jwtoken){
	const guid = window.location.hash.split("#")[2].split("&")[0]
	fetch(structuraURL, {
		method: 'POST',
		headers: {
			guid:guid,
			name:document.getElementById("editTitle").value,
			token:jwtoken}
	})
	.then(response => response.json())
	.then(response => {
		cachedItems={}
		let hashArray = window.location.hash.split("#");//double hashed items for things like user/items lookups
		delete cachedItems[hashArray[2]]
		getItemData(hashArray[2])
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


function postEdit(jwtoken){
	let itemData={}
	itemData.name = document.getElementById("editTitle").value
	itemData.description = document.getElementById("editDescription").value
	itemData.visibility = document.getElementById("editVisibility").checked 
	itemData.category = document.getElementById("editCategory").value
	itemData.youtubelink = document.getElementById("setYoutubeLink").value 
	const guid = window.location.hash.split("#")[2].split("&")[0]
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



function saveCookies(items){
	if(items.length>1){
		localStorage.setItem("structuraItems",JSON.stringify(items))
	}
}
function loadCookies(){
	try {
		let loadedValue=localStorage.getItem("structuraItems")
		cachedItems =  JSON.parse(loadedValue)
	}catch(e){
		console.log("not JSON")
		cachedItems={}
	}	
	if(cachedItems===null){
		cachedItems={}
	}
}
