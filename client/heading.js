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