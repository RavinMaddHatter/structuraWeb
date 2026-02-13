import json
import colorsys
html='<!DOCTYPE html>\n\n<html lang="en">\n\r'
html+="""<head>
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3005750757891844" crossorigin="anonymous"></script>
<link rel="icon" type="image/png" href="/favicon.png"/>
<title id="metaTitle">Structura Lab: Map Art</title>
<meta name="description" id="metaDescription" content="Structura Lab: Create Map Art for Minecraft Bedrock"></meta>
<script src="https://structuralab.com/aws-cognito-sdk.min.js"></script>
<script src="https://structuralab.com/amazon-cognito-identity.min.js"></script>
<script src="https://sdk.amazonaws.com/js/aws-sdk-2.1.24.min.js"></script>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel = "stylesheet" href="StructuraStyle.css">
</head>
<body>
<div class="topnav">
  <h2>Structura Lab</h2>
  <div class="headLinks show" id="loginLink">
    <a href="https://structuralab.com/login.html#login" rel="nofolow">Login</a>
  </div>
  <div class="headLinks hide" id="profLink">
    <a href="https://structuralab.com/#userprofile" rel="nofolow">Profile</a>
  </div>
  <div class="headLinks hide" id="signOutButton">
    <a href="https://structuralab.com/login.html#signout" rel="nofolow">Sign Out</a>
  </div>
  <p>Your place for discovering what is possible in Minecraft Bedrock </p>
 </div>
<div class="middlenav">
  <div class="dropdown">
	<button onclick="goHome()" class="dropbtn">Home</button>
  </div>
  <div class="dropdown">
  <button onclick="clickFilter()" class="dropbtn">Category</button>
    <div id="filter" class="dropdown-content">
      <a href="https://structuralab.com/Farms.html">Farms</a>
      <a href="https://structuralab.com/Buildings.html">Buildings</a>
      <a href="https://structuralab.com/Terrain.html">Terrain</a>
      <a href="https://structuralab.com/Villager.html">Villager</a>
      <a href="https://structuralab.com/Storage.html">Storage</a>
      <a href="https://structuralab.com/Flying.html">Flying Machines</a>
      <a href="https://structuralab.com/Furnaces.html">Furnaces</a>
      <a href="https://structuralab.com/Redstone.html">Redstone</a>
      <a href="https://structuralab.com/Statues.html">Statues</a>
      <a href="https://structuralab.com/Misc.html">Misc</a>
    </div>
  </div>
  <div class="dropdown">
	<a href="https://structuralab.com/#upload" class="dropbtn">Upload</a>
  </div>
  <div class="dropdown">
  <button onclick="clickTools()" class="dropbtn">Tools</button>
    <div id="tools" class="dropdown-content">
      <a href="https://structuralab.com/ModelToMinecraft.html">Model To  Minecraft</a>
      <a href="https://github.com/bud-aj29/BE_Block_Fill_Paint/releases">Bud's Painting Pack</a>
      <a href="https://mcpedl.com/structure-block-export-button-for-mcpe/">Block Export Button (Android)</a>
      <a href="https://structuralab.com/calculators.html">Calculators</a>
    </div>
  </div>
</div>
<div class="content">"""
html+="""<div class="uploadForm1 main hide" id="processing">
	<h1 id="processingTitle">Processing</h1>
	<div id="processingText"></div>
  </div>"""
html+="""<div class="uploadForm1 main hide" id="download">
	<h1>Completed</h1>
	<div >
		<a id="downloadLink">Download Structure File</a>
	</div>
	<div class="uploadExplanationStep">ALL FILES ARE DELETED AFTER 24 HOURS</div>
	<div >
		<a href="https://structuralab.com/mapart.html">Make a new file</a>
	</div>
  </div>"""
html+="""<div class="uploadForm1 main hide" id="error">
	<h1>Error</h1>
	<div class="uploadExplanationStep" id ="errorMessage"></div>
	<div >
		<a href="https://structuralab.com/mapart.html" id="errorLink">Make a new file</a>
	</div>
  </div>"""
html+='\n\t<div class="uploadForm1 main show" id="uploadForm">'
html+='\n\t\t<h1>Map Art Maker</h1>'
html+='\n\t\t<div class="uploadExplanationStep">Please upload an image and select your block types.</div>'
html+='\n\t\t<div class="uploadExplanationStep">If you have blocks that are hard to obtain you can select alternatives with the same color or disable the color below.</div>'
html+='\n\t\t\t<div id="name">'
html+='\n\t\t\t\t<span>Name:</span>'
html+='\n\t\t\t\t<input id="name_input" value="No Name Entered"></input>'
html+='\n\t\t\t</div>'
html+='\n\t\t<div>'
html+='\n\t\t\t<input type="file" id="fileUpload" accept="image/*">  </input>'
html+='\n\t\t</div>'
html+='\n\t\t<div id= "loginError" class="loginError main show">'
html+='\n\t\t\t<a href="https://structuralab.com/login.html" id="loginErrorLink">Login to submit files</a>'
html+='\n\t\t</div>'
html+='\n\t\t<button type="make" class="" onclick="makeMapArt()" id="submitButton">Make Structure</button>'
html+='\n\t\t<h2>Per Color Settings</h2>'

html+='\n\t\t<div class="blocksettings show">\n'

def get_hsv(color):
    """
    Converts a hex color string to an HSV color tuple.
    """
    # Convert hex to normalized RGB values (0.0 to 1.0)
    r, g, b = map(int,color.split(","))
    r=r/255
    g=g/255
    b=b/255
    # Convert RGB to HSV and return the tuple
    return colorsys.rgb_to_hsv(r, g, b)
with open('blockLookups.json', 'r') as f:
    colors_lookup = json.load(f)
color_keys =list(colors_lookup.keys())
color_keys.sort(key=get_hsv)
for color in color_keys:
    html+='\t\t\t<div class="colors show">\n'
    r,g,b=color.split(",")
    html+=f'\t\t\t<span style="color:rgb({r}, {g}, {b});font-size: 30px;display:inline;">&#9632;</span>\n'
    html+='\t\t\t<span class="blocksettings show" style="display:inline">\n'
    html+=f'\t\t\t<input type="checkbox" class="blockenable show" id="{color}-enable" name="{color}" checked="checked" value="{color}" style="display:inline">\n'
    html+=f'\t\t\t<select class="blockselect show" name="{color}" id="{color}-select"style="display:inline">\n'
    for block in colors_lookup[color]:
        html+=f'\t\t\t\t<option value="{block}">{block}</option>\n'
    html+=f'\t\t\t</select>\n\t\t\t</span>\n\t</div>\n'
html+='\n\t\t</div>'
html+='\n\t</div>'
html+='\n</div>'
#html+='\n<script src="StructuraBasicScripts.js"></script>'
html+='\n<script src="heading.js"></script>\n'
html+='\n<script src="mapart.js"></script>\n'
html+='\n</html>'
with open("mapart.html","w+") as f:
    f.write(html)
