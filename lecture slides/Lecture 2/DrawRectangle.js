//DrawRectangle.js
function main(){
	//Retrieve <canvas> element
	var canvas = document.getElementById('example');
	if (!canvas){
		console.log('Failed to retrieve the <canvas> element');
		return;
	}
	
	//Get the rendering context for 2DCG
	var ctx = canvas.getContext('2d');
	
	//Draw a blue rectangle
	ctx.fillStyle = 'rgba(0,0,255,1.0)'; // Set a blue color
	ctx.fillRect(120,10,150,150); //Fill a rectangle with the color
}