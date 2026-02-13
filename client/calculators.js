
document.getElementById("borderX").addEventListener("change", chunkedges);
document.getElementById("borderZ").addEventListener("change", chunkedges);
document.getElementById("guardianX").addEventListener("change", calcGuardians);
document.getElementById("guardianZ").addEventListener("change", calcGuardians);

document.getElementById("guardianX").value = 0
document.getElementById("guardianZ").value = 0
document.getElementById("borderX").value = 0
document.getElementById("borderZ").value = 0
chunkedges()
calcGuardians()
function calcGuardians(){
	let locx = document.getElementById("guardianX").value
	let locz = document.getElementById("guardianZ").value
	let cornerx=locx-locx%16
	let cornerz=locz-locz%16
	if (cornerx<0){
		cornerx-=16
	}
	if (cornerz<0){
		cornerz-=16
	}
	console.log(cornerx,cornerz)
	let xpos=[cornerx + 34,
			cornerx + 24,
			cornerx + 8,
			cornerx - 8,
			cornerx - 19]
	let zpos=[cornerz + 34,
			cornerz + 24,
			cornerz + 8,
			cornerz -8,
			cornerz -19]
	for (let x=0;x<5;x++){
		for (let z=0;z<5;z++){
			let xstr="guardianx"+(x+1).toString()+"-"+(z+1).toString()
			let zstr="guardianz"+(x+1).toString()+"-"+(z+1).toString()
			document.getElementById(xstr).innerText = xpos[x]
			document.getElementById(zstr).innerText = zpos[z]
		}
	}
}

function chunkedges(){
	let locx = document.getElementById("borderX").value
	let locz = document.getElementById("borderZ").value
	
	let corner1x = locx-locx%16
	let corner1z = locz-locz%16
	if (corner1x<0){
		corner1x-=16
	}
	if (corner1z<0){
		corner1z-=16
	}
	let corner2x = corner1x + 15
	let corner2z = corner1z + 15
	document.getElementById("borderx1").innerText = corner1x
	document.getElementById("borderx2").innerText = corner2x 
	document.getElementById("borderz1").innerText = corner1z
	document.getElementById("borderz2").innerText = corner2z
}
