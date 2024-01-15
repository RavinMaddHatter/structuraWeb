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
// check if user is logged in
checkLogin();//verifies user login state to keep experience uniform
// begin loading website
load();//Check hash and start loading website

//Processing Hash information
function load(){
	hideMain();
	pagenum=0;
	switch(window.location.hash){
		case "#Farms":
			metaTitle = "Structura Lab: Farms"
			Description.setAttribute("content","A collection of Minecraft Bedrock Farm Structura files. Browse for your favorite farms.")
		case "#Buildings":
			metaTitle = "Structura Lab: Buildings"
			Description.setAttribute("content","A collection of Minecraft Bedrock Builiding Structura Files. Browse for your favorite Building Designs.")
		case "#Terrain":
			metaTitle = "Structura Lab: Terrain/Terraforming"
			Description.setAttribute("content","A collection of Terraforming Structura files. Browse what others have done in their worlds")
		case "#Villager":
			metaTitle = "Structura Lab: Villager Tech"
			Description.setAttribute("content","A collection of Villager bases Structura files. ")
		case "#Storage":
			metaTitle = "Structura Lab: Storage Systems"
			Description.setAttribute("content","A collection of Item storage solutions for Minecraft Bedrock. Browses for your favorite Structura files.")
		case "#Flying":
			metaTitle = "Structura Lab: Flying Machines"
			Description.setAttribute("content","A collection of Flying Machine Structura Files for Minecraft Bedrock Edition.")
		case "#Furnaces":
			metaTitle = "Structura Lab: Furnaces/Smelting Tech"
			Description.setAttribute("content","A collection of Smelter Super Smelters, or other furnace tech for Minecraft Bedrock Edition.")
		case "#Redstone":
			metaTitle = "Structura Lab: Redstone Stuff"
			Description.setAttribute("content","A collection of Redstone Structura Files for Minecraft Bedrock Edition.")
		case "#Statues":
			metaTitle = "Structura Lab: Statues/Decorations"
			Description.setAttribute("content","A collection of Statues, Monuements, and other decorations for Minecraft Bedrock Edition")
		case "#Misc":
			metaTitle = "Structura Lab: Miscellaneous Stuff"
			Description.setAttribute("content","A collection of Structura files for you to discover. ")
		case "#data"://not implemented
		case "#date-old"://not implemented
		case "#popular"://not implemented
		case "#rated"://not implemented
		case "#random"://not implemented
			previousPage=window.location.hash
			getBulkItemData(window.location.hash,previousEndKey);
			break;
		case "#TOS":
			metaTitle = "Structura Lab: Terms Of Service"
			Description.setAttribute("content","The terms of serivce for using Structura Lab.")
			showTOS();
			break;
		case "#restpass":
			case "#restpass":
			previousPage="#userprofile"
			showResetPassword();
			break;
		case "#"://home/default
		case ""://home/default
			metaTitle = "Structura Lab"
			Description.setAttribute("content",defaultDescription)
			getBulkItemData("default",previousEndKey);
			break;
		case "#login":
			metaTitle = "Structura Lab: Login"
			Description.setAttribute("content","Login to your account")
			showLogin();
			break;
		case "#signup":
			metaTitle = "Structura Lab: Signup"
			Description.setAttribute("content","Signup for an account")
			showSignup();
			break;
		case "#userprofile":
			metaTitle = "Structura Lab: Your Profile"
			Description.setAttribute("content","Edit your profile")
			previousPage=window.location.hash
			loadUserProfilePage();
			break;
		case "#signout":
			metaTitle = "Structura Lab: Signout"
			Description.setAttribute("content","Signout")
			signOut();
			break;
		case "#upload":
			metaTitle = "Structura Lab: Upload New"
			Description.setAttribute("content","Upload a new file")
			previousPage=window.location.hash
			showUpload();
			break;
		default://processing fall through. particulary double hashed items
			metaTitle = "Structura Lab"
			Description.setAttribute("content",defaultDescription)
			previousPage=""
			processHash(window.location.hash);
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
			goHome();//If the hash cannot be found clear the hash and go home
			break;

	}
}

//page generators
function makeItemPage(item){
	showItem();
	metaTitle = "Structura Lab: " + item["Name"]
	Description.setAttribute("content",item["Description"])
	document.getElementById("editPageButtonDiv").classList.add("hide")
	if(credentials){
		if (credentials.user.username == item["Creator"]){
		document.getElementById("editPageButtonDiv").classList.remove("hide")
		document.getElementById("editPageButtonDiv").classList.add("show")
		}
	}
	if("youtube" in item && item["youtube"].length>0){
		const videoguid = item["youtube"].split("/").pop()
		const youtubeLink = "https://www.youtube.com/embed/"+videoguid
		
		document.getElementById("youtubeEmbed").src=youtubeLink
		document.getElementById("youtubeEmbed").classList.add("showinline")
		document.getElementById("youtubeEmbed").classList.remove("hide")
		document.getElementById("itemImg").classList.add("hide")
	}
	else{
		document.getElementById("itemImg").src = "https://s3.us-east-2.amazonaws.com/structuralab.com/"+item["GUID"]+"/fullSizedPicture.png"
		document.getElementById("itemImg").classList.add("showinline")
		document.getElementById("itemImg").classList.remove("hide")
		document.getElementById("youtubeEmbed").classList.add("hide")
	}
	document.getElementById("itemName").innerText = item["Name"]
	document.getElementById("description").innerText = item["Description"]
	document.getElementById("itemProfile").innerText = item["Creator"]
	document.getElementById("itemProfile").href = "#profile#"+item["Creator"]
	let listFiles = document.getElementById("structureFileDiv")
	listFiles.innerHTML=""
	for (const fileName in item["structureFiles"]){
		let link = document.createElement("a");
		link.innerText=fileName
		link.href=item["structureFiles"][fileName]
		listFiles.appendChild(link)
	}
	if("StructuraFile" in item){
		document.getElementById("structurapack").innerText = item["Name"]+".mcpack"
		document.getElementById("structurapack").href = item["StructuraFile"]
	}
	else{
		document.getElementById("structurapack").innerText = ""
		document.getElementById("structurapack").href = ""
	}
	let date = new Date(item["date"]*1000);
	document.getElementById("itemDate").innerText = date
	clearChildElements(document.getElementById("materialsList"));
	const sortable = Object.entries(item["MaterialsList"])
    .sort(([,a],[,b]) => b-a)
    .reduce((r, [k, v]) => ({ ...r, [k]: v }), {});
	for (const [key, value] of Object.entries(sortable)) {
		addItemToMatlist(key,value)
	}
}

function addItemToMatlist(key,value){
	let itemName = document.createElement("p");
	itemName.classList.add("itemName");
	itemName.innerText = key;
	let itemCount = document.createElement("p");
	itemCount.classList.add("itemCount");
	itemCount.innerText = value;
	document.getElementById("materialsList").appendChild(itemName);
	document.getElementById("materialsList").appendChild(itemCount);
}
//Event Listeners
window.onhashchange = function(){//checks if the hash has changed to refresh user views
	load();//determine what should happen on this hash refreshe
}
window.onclick = function(event) {//clicking the dropdowns
  if (!event.target.matches('.dropbtn')) {
    hideDropdowns();
  }
}

window.addEventListener("resize", resizeGrid);
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
function setupGrid(items){
	cachedItems={}
	resizeGrid(items.length)
	for(var i=0; i<items.length; i++){
		cachedItems[items[i]["GUID"]]=items[i]
		addElement(items[i]);
	}
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
	icon.src = "https://s3.us-east-2.amazonaws.com/structuralab.com/Profiles/"+data["Creator"]+"/profilePic.png"
	icon.setAttribute("onerror","noProfPic(this)")
	let headText = document.createElement("div");
	headText.classList.add("headText");
	let profileName = document.createElement("a");
	profileName.classList.add("profName");
	profileName.href = "#profile#"+data["Creator"]
	profileName.innerText = data["Creator"].slice(0,25)	;
	let itemName = document.createElement("a")
	itemName.href = "#item#"+data["GUID"]
	itemName.classList.add("itemNameGrid")
	itemName.innerText = data["Name"].slice(0,40)	
	
	let imgContainer = document.createElement("div");
	let itemLink = document.createElement("a");
	let itemImg = document.createElement("img");
	if("youtube" in data && data["youtube"].length>0){
		const videoguid = data["youtube"].split("/").pop()
		const youtubeThumb = "https://img.youtube.com/vi/"+videoguid+"/0.jpg"
		itemImg.src = youtubeThumb
	}
	else{
		itemImg.src = "https://s3.us-east-2.amazonaws.com/structuralab.com/"+data["GUID"]+"/thumbnail.png"
	}
	itemImg.setAttribute("onerror","noThumbnail(this)")
	itemImg.classList.add("itemPicture");
	itemLink.href="#item#"+data["GUID"]
	itemLink.classList.add("itemImgContainer")
	itemLink.appendChild(itemImg);
	headText.appendChild(itemName);
	headText.appendChild(profileName);
	profile.appendChild(icon);
	head.appendChild(profile);
	head.appendChild(headText);
	div.appendChild(head);
	div.appendChild(itemLink)
	document.getElementById("grid").appendChild(div);
}

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
/* When the user clicks on the button, 
toggle between hiding and showing the dropdown content */

function clickSort() {
	
  show = !document.getElementById("sort").classList.contains("show");
  hideDropdowns();
  if(show){
	document.getElementById("sort").classList.add("show");
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

// button responses
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
	const guid = window.location.hash.split("#")[2]
	window.location.hash="#edititem#"+guid
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
		window.location.hash = '#upload';
		return
	}
	window.location.hash = '#login';
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
function goHome(){
	window.location.hash="";
}
function showUpload(){
	if(credentials=null){
		window.location.hash = '#login';
		showLogin();
	}
	hideMain();
	document.getElementById("uploadStep1").classList.remove("hide")
	document.getElementById("uploadStep1").classList.add("show")
	
}
function completeEditing(){
	const guid = window.location.hash.split("#")[2]
	window.location.hash="#item#"+guid
}
function showGrid(){
	document.getElementById("grid").classList.remove("hide")
	document.getElementById("grid").classList.add("showGrid")
}
function showItem(){
	hideMain();
	document.getElementById("itemPage").classList.remove("hide")
	document.getElementById("itemPage").classList.add("show")
}
function showLogin(){
	hideMain();
	document.getElementById("loginFormDiv").classList.remove("hide")
	document.getElementById("loginFormDiv").classList.add("show")
}
function showResetPassword(){
	hideMain();
	document.getElementById("ResetPasswordDiv").classList.remove("hide")
	document.getElementById("ResetPasswordDiv").classList.add("show")
	
}
function showTOS(){
	hideMain();
	document.getElementById("TOS").classList.remove("hide")
	document.getElementById("TOS").classList.add("show")
}
function showSignup(){
	hideMain();
	document.getElementById("user").value = "";
	document.getElementById("pass").value = "";
	document.getElementById("passConf").value = "";
	document.getElementById("email").value = "";
	document.getElementById("signupFormDiv").classList.remove("hide")
	document.getElementById("signupFormDiv").classList.add("show")
	
}
function showConfirmPage(){
	hideMain();
	document.getElementById("confirmDiv").classList.remove("hide")
	document.getElementById("confirmDiv").classList.add("show")
	
}
function showEditItem(guid){
	hideMain();
	document.getElementById("editItem").classList.remove("hide")
	document.getElementById("editItem").classList.add("show")
	let item={}
	if(guid in cachedItems){
		editItemForm(cachedItems[guid])
	}else{
		fetch(apiUrl, {
			method: 'POST',
			headers: {page:"item",filter:guid}
		})
		.then(response => response.json())
		.then(response => {
			item=response["item"]
			cachedItems[item["GUID"]]=item
			editItemForm(item)
		})
	}
}
function showProfilePage(profile){
	hideMain()
	document.getElementById("Profile").classList.remove("hide")
	document.getElementById("Profile").classList.add("show")
	fetch(apiUrl, {
		method: 'POST',
		headers: {page:"profile",filter:profile}
	})
	.then(response => response.json())
	.then(response => {
		metaTitle = "Structura Lab: " + response["profile"]["name"]
		Description.setAttribute("content",response["profile"]["name"]+" user profile. Find all of the cool things this user has posted on Structura Lab.")
		document.getElementById("profileName").innerText = response["profile"]["name"]
		if (response["profileIcon"]){
			document.getElementById("profileIcon").src = "https://s3.us-east-2.amazonaws.com/structuralab.com/Profiles/"+response["profile"]["name"]+"/profilePic.png"
		}
		else{
			document.getElementById("profileIcon").src = 'https://s3.us-east-2.amazonaws.com/structuralab.com/Profiles/Default_pfp.png'
		}
		showlink(document.getElementById("youtubeLink"),response["profile"]["Youtube"])
		showlink(document.getElementById("discordLink"),response["profile"]["Discord"])
		showlink(document.getElementById("patreonLink"),response["profile"]["Paetron"])
		showlink(document.getElementById("twitchLink"),response["profile"]["Twitch"])
		showlink(document.getElementById("kofiLink"),response["profile"]["Ko-Fi"])		
		showGrid();
		setupGrid(response["items"])
	})
}
function showlink(element,url){
	if(url==""){
		element.href = "#";
		element.innerText = "None";
		element.classList.add("hide")
		element.classList.remove("show")
	}else{
		element.href = url;
		element.innerText = url;
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
	clearForms();//removes all default entry data from forms
	clearChildElements(document.getElementById("grid"));//clears the grid elements
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
		if(inputs[index].type!="submit"){
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
		showConfirmPage()
	});
}
let changePassForm = document.getElementById("changePasswordForm");
changePassForm.addEventListener("submit", (e) => {
	e.preventDefault();
	let oldpass = document.getElementById("oldPass").value;
	let pass = document.getElementById("changePass").value;
	let passConf = document.getElementById("changePassConf").value;
	if(!validatePassword(pass)){
		document.getElementById("changeProblems").innerText = "Password must be atleast 8 charaters and contain: upper case, lower case, number and special character"
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
			checkLogin()
			window.location.hash = previousPage;
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
// profile editing
function saveUserProfile(){
	getToken(postUserProfile)
}
// Posting/uploading files (pre-signed S3 URLS)
function postFile(file,signedRequest){
	console.log(file)
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
		console.log(fileUploadObjects)
		postFile(fileUploadObjects[fileName].Body,signedURLs[fileName])
	}
		window.location.hash="#edititem#"+headder.guid
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
function signFiles(jwtoken){
	getSignedS3Urls(uploadFileBatch,Object.keys(fileUploadObjects),jwtoken)
}
function fetchProfile(jwtoken){
	if (credentials==null){
		showLogin();
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
	const guid = window.location.hash.split("#")[2]
	fetch(apiUrl, {
		method: 'POST',
		headers: {page:"resizeimages",filter:guid,
			imagetype:"thumbnail",
			token:jwtoken}
	})
	.then(response => response.json())
	.then(response => {
		const guid = window.location.hash.split("#")[2]
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
	const guid = window.location.hash.split("#")[2]
	fetch(structuraURL, {
		method: 'POST',
		headers: {
			guid:guid,
			name:document.getElementById("editTitle").value,
			token:jwtoken}
	})
	.then(response => response.json())
	.then(response => {
		//consider adding update when complete
	})
}

function deleteItem(jwtoken){
	const guid = window.location.hash.split("#")[2]
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
	itemData.name = document.getElementById("editTitle").value
	itemData.description = document.getElementById("editDescription").value
	itemData.visibility = document.getElementById("editVisibility").checked 
	itemData.category = document.getElementById("editCategory").value
	itemData.youtubelink = document.getElementById("setYoutubeLink").value 
	const guid = window.location.hash.split("#")[2]
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
//public data fetches 
function getItemData(itemGuid){
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

function getBulkItemData(page_value,filter_value){
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