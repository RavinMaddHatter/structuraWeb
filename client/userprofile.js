//import {resizeGrid }from './utilities.js'
// setup events 
window.addEventListener("resize", resizeGrid);

checkLogin();//verifies user login state to keep experience uniform
var pageType
var pagenum

initialLoad();
function initialLoad(){
	let path = window.location.pathname;
	let page = path.split("/").pop().replace(".html","");
	pageType=page
	if (window.location.hash.length>2){
		pageType = window.location.hash
	}
	load()
}
function load(){
	hideMain();
	pagenum=0;
	if (credentials){
		loadUserProfilePage()
	}
	else{
		document.getElementById("noLogin").classList.remove("hide")
		document.getElementById("noLogin").classList.add("show")
	}
}
function loadUserProfilePage(){
	getToken(fetchProfile)
}
function confirmDeleteWindow(){
	hideMain();
	document.getElementById("DeleteConfirm").classList.remove("hide")
	document.getElementById("DeleteConfirm").classList.add("show")
}
function deleteAccount(){
	hideMain()
	document.getElementById("DeleteInProgress").classList.remove("hide")
	document.getElementById("DeleteInProgress").classList.add("show")
	getToken(deleteAccountSigned)
}
function deleteAccountSigned(jwtoken){
	console.log(jwtoken)
	fetch(apiUrl, {
		method: 'POST',
		headers: {page:"deleteAccount",filter:credentials.user.username,token:jwtoken}
	}).then(response => response.json())
	.then(response => {
		console.log(response)
		deleteUser(deleteComplete)
	})
}
function deleteComplete(){
	hideMain()
	document.getElementById("DeleteCompleted").classList.remove("hide")
	document.getElementById("DeleteCompleted").classList.add("show")
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
		console.log(response)
		document.getElementById("userProfileIcon").src = "https://structuralab.com/Profiles/"+credentials.user.username+"/profilePic.png"
		document.getElementById("userProfileYoutubeInput").value = response["profile"]["Youtube"];
		document.getElementById("userProfileDiscordInput").value = response["profile"]["Discord"];
		document.getElementById("userProfilePatreonInput").value = response["profile"]["Paetron"];
		document.getElementById("userProfileKoFiInput").value = response["profile"]["Ko-Fi"];
		document.getElementById("userProfileTwitchInput").value = response["profile"]["Twitch"];
		showGrid();
		setupGrid(response["items"])
		let linkArea=document.getElementById("likesArea")
		for (const [key, value] of Object.entries(response["links"])) {
			let entry = document.createElement("a");
			entry.classList.add("likelink")
			entry.href=value["link"]
			
			entry.innerText=value["name"]
			linkArea.appendChild(entry)
			
		}
	})
}

function showProfilePage(profile){
	showElement(document.getElementById("Profile"));
	fetch(apiUrl, {
		method: 'POST',
		headers: {page:"profile",filter:profile}
	})
	.then(response => response.json())
	.then(response => {
		metaTitle = "Structura Lab: " + response["profile"]["name"]
		Description.setAttribute("content",response["profile"]["name"]+" user profile. Find all of the cool things this user has posted on Structura Lab.")
		document.getElementById("profileName").innerText = response["profile"]["name"]
		document.getElementById("profileIcon").src = "https://structuralab.com/Profiles/"+response["profile"]["name"]+"/profilePic.png"
		showlink(document.getElementById("youtubeLink"),response["profile"]["Youtube"])
		showlink(document.getElementById("discordLink"),response["profile"]["Discord"])
		showlink(document.getElementById("patreonLink"),response["profile"]["Paetron"])
		showlink(document.getElementById("twitchLink"),response["profile"]["Twitch"])
		showlink(document.getElementById("kofiLink"),response["profile"]["Ko-Fi"])		
		showGrid();
		setupGrid(response["items"])
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
		document.getElementById("userProfileIcon").src = "https://structuralab.com/Profiles/"+credentials.user.username+"/profilePic.png?t=" + new Date().getTime();
	})
	
}
// profile editing
function saveUserProfile(){
	getToken(postUserProfile)
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
