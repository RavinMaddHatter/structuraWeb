onLoadHeadder()
function onLoadHeadder(){
	let profile = document.getElementById("profLink")
	while (profile.firstChild) {
		profile.removeChild(profile.lastChild);
	}
	let profileLink = document.createElement("a");
	profileLink.innerText = "Profile"
	profileLink.href="https://structuralab.com/userprofile.html"
	profile.appendChild(profileLink)
	let tools = document.getElementById("tools")
	while (tools.firstChild) {
		tools.removeChild(tools.lastChild);
	}
	let modelToMC = document.createElement("a");
	modelToMC.href= "https://structuralab.com/ModelToMinecraft.html"
	modelToMC.innerText="Model To  Minecraft"
	tools.appendChild(modelToMC)
	let mapart = document.createElement("a");
	mapart.innerText="Map Art Maker"
	mapart.href="https://structuralab.com/mapart.html"
	tools.appendChild(mapart)
	let extractor = document.createElement("a");
	extractor.innerText="Structure Extractor"
	extractor.href="https://structuralab.com/ModelExtractor.html"
	tools.appendChild(extractor)
	let calculators = document.createElement("a");
	calculators.innerText="Calculators"
	calculators.href="https://structuralab.com/calculators.html"
	tools.appendChild(calculators)
	let budPaint = document.createElement("a");
	budPaint.innerText="Bud's Painting Pack"
	budPaint.href="https://github.com/bud-aj29/BE_Block_Fill_Paint/releases"
	tools.appendChild(budPaint)
}

function signOut(){
	credentials.user.signOut()
	checkLogin();
	window.location.href = "https://structuralab.com/login.html";
}
function goHome(){
	window.location.href="https://structuralab.com";
}
function clickSort() {
  show = !document.getElementById("sort").classList.contains("show");
  hideDropdowns();
  if(show){
	document.getElementById("sort").classList.add("show");
  }
}
function clickFilter() {
  show = !document.getElementById("filter").classList.contains("show");
  hideDropdowns();
  if(show){
	document.getElementById("filter").classList.add("show");
  }
}
function clickTools() {
  show = !document.getElementById("tools").classList.contains("show");
  hideDropdowns();
  if(show){
	document.getElementById("tools").classList.add("show");
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
window.onclick = function(event) {//clicking the dropdowns
  if (!event.target.matches('.dropbtn')) {
    hideDropdowns();
  }
}