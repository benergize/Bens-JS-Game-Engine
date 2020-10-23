function GameObject(arg0, x = 0, y = 0, sprite = -1, step = -1, draw = -1, destroy = -1, visible = true, active = true, collisionBox = false, depth = 0) {
	
	let argObj = typeof arg0 === "object";
	
	this.name = argObj ? arg0.name : arg0;
	this.x = argObj ? arg0.x : x;
	this.y = argObj ? arg0.y : y;
	this.sprite = argObj ? arg0.sprite : sprite;

	this.depth = depth;
	
	this.visible = argObj ? arg0.visible : visible;
	this.active = argObj ? arg0.active : active;
	
	this.onstep = argObj ? arg0.step : step;
	this.ondraw = argObj ? arg0.draw : draw;
	this.ondestroy = argObj ? arg0.destroy : destroy;
	
	this.hspeed = 0;
	this.vspeed = 0;
	this.friction = 0;
	this.gravity = 0;
	this.gravityDirection = 0;

	this.collisionBox = collisionBox === false ? typeof this.sprite === "object" ? [0,0,this.sprite.drawWidth,this.sprite.drawHeight] : [0,0,16,16] : collisionBox;
	
	this.id = GAME_ENGINE_INSTANCE.generateID();


	this.builtInPhysics = function() {
		this.x += this.hspeed;
		this.y += this.vspeed;
		
		//this.hspeed = Math.max(0,this.hspeed-this.friction);
		//this.vspeed = Math.max(0,this.vspeed-this.friction);
	}
	
	this.generatePath = function(dx,dy,gridX,gridY,path) {

		let startX = Math.floor(this.x / gridX);
		let startY = Math.floor(this.y / gridY);

		let destX = Math.floor(dx / gridX);
		let destY = Math.floor(dy / gridY); 

		let croom = GAME_ENGINE_INSTANCE.getCurrentRoom();

		let gridWidth = Math.floor(croom.width / gridX);
		let gridHeight = Math.floor(croom.height / gridY);

		let map = [];
		let mapNodes = {};

		for(let x = 0; x < gridWidth; x++) {

			map[x] = [];

			for(let y = 0; y < gridHeight; y++) {

				map[x][y] = croom.getTilesAt(x*gridX,y*gridY,true).length > 0 ? "A" : " ";

				let newNode = {exits:[]};

				for(let px = -1; px < 2; px++) {

					for(let py = -1; py < 2; py++) {
 
						if(croom.getTilesAt((x + px) * gridX, (y + py) * gridY, true).length == 0 && x+px >= 0 && y+py >= 0 && (px+x + py+y != 0 || px+x==0 || py+y==0)) { newNode.exits.push((x+px) + "," + (y+py)); }

					}
				}

				mapNodes[x+","+y] = (newNode);
			}
		} 

		let allPaths = [[startX+","+startY]];
		let masterPath = [];
		let victoryPath = -1;

		let pathsActive = false;

		for(let panic = 0; panic < 150; panic++) {

			let newPaths = [];

			for(let i = 0; i < allPaths.length; i++) {

				let path = allPaths[i];

				if(path.length < victoryPath.length || victoryPath === -1) {

					let currentNode = path[path.length-1]; 

					//engine.ctx.strokeRect(currentNode.split(",")[0]*gridX,currentNode.split(",")[1]*gridY,gridX,gridY);

					if(typeof mapNodes[currentNode] !== "undefined") { 


						if(currentNode === (destX+","+destY) && (victoryPath.length < path.length || victoryPath === -1)) {

							victoryPath = path;
						}

						else {

							mapNodes[currentNode].exits.forEach(exit=>{

								if(path.indexOf(exit) === -1 && masterPath.indexOf(exit) === -1) {

									pathsActive = true;

									let newPath = path.concat(exit);
									newPaths.push(newPath);
									masterPath.push(exit);
								}
							});
						}
					}
				}

			}


			
			if(!pathsActive) { break; }
			else { 
				allPaths = Array.from(newPaths); 
			}
		}

		this.path = {path:victoryPath,gridX:gridX,gridY:gridY};

		return victoryPath;
	}

	this.path = {path:[],gridX:32,gridY:32};

	this.pathStep = function(speed=0) {

		if(this.path.path.length === 0 || this.path.path === -1) { return false; }

		console.log(this.path);

		let path = this.path.path;
		let thisStep = path[0].split(","); 

		let dest = [thisStep[0] * this.path.gridX, thisStep[1] * this.path.gridY];

		if(speed === 0) {
			this.x = thisStep[0] * this.path.gridX;
			this.y = thisStep[1] * this.path.gridY;
		}
		else {

			this.moveTowardsPoint(dest[0],dest[1],speed);
		}

		console.log(Math.abs(this.x - dest[0]) + Math.abs(this.y - dest[1]));
  
		let roughDist = Math.sqrt((Math.abs(this.x - dest[0]) ** 2) + (Math.abs(this.y - dest[1]) ** 2));
 
		if(roughDist < speed) { this.path.path = this.path.path.slice(1); }
		if(this.path.path.length === 0) { this.x = dest[0]; this.y = dest[1]; }

		return true;
	}

	this.moveTowardsPoint = function(x, y, speed) {
		
		let distance = Math.sqrt(((x - this.x)**2) + ((y - this.y)**2));

		if(distance > 0){
			this.x += ((x - this.x) * speed) / distance;
			this.y += ((y - this.y) * speed) / distance;

			return true;
		}
		return false;
	}

	this.moveInDirection = function(direction, speed) {
		 
		var rad = (-direction) * .01745329251;
		this.x = this.x + (Math.cos(rad) * speed);
		this.y = this.y + (Math.sin(rad) * speed);
		return true
 
	}

	this.setDepth = function(depth) {

		this.depth = depth;

		let croom = game.getCurrentRoom();
		if(croom) {
			croom.sortDepth();
		}
	}
	
	this.destroy = function() {
 
		let croom = GAME_ENGINE_INSTANCE.getCurrentRoom()

		let newObjArray = croom.roomObjects.filter(obj=>{ return obj.id !== this.id; });
		croom.roomObjects = newObjArray;

		if(typeof this.ondestroy === 'function') { this.ondestroy(); }

		return delete this;
	}

	this.deactivate = function() { return this.active = false; }
	this.activate = function() { return this.active = true; }
	
	GAME_ENGINE_INSTANCE.objects.push(this);
	
	return this;
}