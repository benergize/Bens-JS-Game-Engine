function GameEngine(canvas, fps=24) {
	
	this.rooms = [];
	this.sprites = [];
	this.resources = [];
	this.objects = [];
	this.sounds = [];
	this.tiles = [];

	this.currentRoom =  -1,
	this.status = "active",
	this.fps = fps,

	this.timing = {fps:fps, currentTime:0, lastUpdate:0},

	this.debug = { showCBoxes: false },

	this.registry = 0,

	this.generateID = function() {
		this.registry++;
		return this.registry;
	},
	
	this.update = function(test) {

		let self = this; 
		requestAnimationFrame(function() { self.update(); });

		this.timing.currentTime = Date.now();

		if(this.timing.currentTime - this.timing.lastUpdate > 1000/this.timing.fps || this.timing.lastUpdate === 0) {
			this.timing.lastUpdate = this.timing.currentTime;
		}
		else { return false; }
		
		this.engine.ctx.fillRect(0,0,this.engine.canvas.width,this.engine.canvas.height);

		
		let room = this.rooms[this.currentRoom];
	
		if(typeof room === "undefined") { return false; }
		
		room.draw();
		
		room.roomObjects.forEach(obj=>{
			
			if(obj.active) {
			
				obj.builtInPhysics();
				if(typeof obj.onstep === "function") { obj.onstep(); }
				
				if(obj.visible && obj.x >= room.view.x && obj.x <= room.view.x + room.view.width && obj.y >= room.view.y && obj.y <= room.view.y + room.view.height) {

					if(typeof obj.ondraw === "function") { obj.ondraw(); }
					if(typeof obj.sprite === "object") { obj.sprite.draw(obj.x, obj.y); }
					
					if(this.debug.showCBoxes) { this.engine.ctx.strokeRect(-room.view.x + obj.x+obj.collisionBox[0], -room.view.y + obj.y+obj.collisionBox[1], obj.collisionBox[2],obj.collisionBox[3]); }
				}
			}
			
		});
	},

	this.addRoom = function(room) {

		if(typeof room !== "object") { return false; }

		this.rooms.push(room);
	}
	
	this.getRoom = function(ind) {
		
		if(typeof ind === "number") { return typeof this.rooms[ind] === "object" ? this.rooms[ind] : false; }
		else if(typeof ind === "string") {
			
			let filteredRoom = rooms.filter(room => { return room.name === ind; })[0];
			
			return typeof filteredRoom === "object" ? filterRoom : false;
		}
		else { return false; }
	},
	
	this.getCurrentRoom = function(ind) {
		
		return typeof this.rooms[this.currentRoom] !== "undefined" ? this.rooms[this.currentRoom] : false;
	},

	this.setCurrentRoom = function(ind) {

		let newRoom = -1;

		if(typeof ind === "number" && typeof this.rooms[ind] === "object") { newRoom = ind; }
		else if(typeof ind === "string") {
			for(let i = 0; i < this.rooms.length; i++) { if(this.rooms[i].name === ind) { newRoom = i; } }
		}
		else if(typeof ind === "object") {
			for(let i = 0; i < this.rooms.length; i++) { if(this.rooms[i].id === ind.id) { newRoom = i; } }
		}
		
		if(newRoom !== -1) { this.currentRoom = newRoom; return true; }
		else { return false; }
	}

	this.addSprite = function(sprite) {
	
		return this.sprites.push(sprite);
	},
	
	this.importTiles = function(tiles) {

		let croom = this.getCurrentRoom();

		tiles.forEach(tile=>{

			for(let i = 0; i < this.sprites.length; i++) {

				let ref = this.sprites[i];
				let sprite = tile.sprite;
				let props = ["fileName", "sheetX", "sheetY", "sheetWidth", "sheetHeight", "drawWidth", "drawHeight"];
				let match = true;

				props.forEach(prop=>{
					if(ref[prop] !== sprite[prop]) { match = false; }
				});

				if(match) { tile.sprite = this.sprites[i]; break; }
			}

			tile.sprite = new Sprite(tile.sprite.fileName,tile.sprite.sheetX,tile.sprite.sheetY,tile.sprite.sheetWidth,tile.sprite.sheetHeight,tile.sprite.drawWidth,tile.sprite.drawHeight);
			this.addSprite(tile.sprite);

			croom.tiles.push(tile);
		});
		//{"sprite":{"fileName":"game/sprites/tilese2.png","resource":{},"sheetX":0,"sheetY":0,"sheetWidth":32,"sheetHeight":48,"drawWidth":32,"drawHeight":48,"id":38},"x":288,"y":240,"solid":true,"properties":[],"id":39}
	}



	this.begin = function() { 
		//setInterval(fn=>{this.update();}, 1000 / this.fps); 
		let self = this;
		requestAnimationFrame(function() { self.update(); });
	}

	this.getIntersecting = function(ax1,ay1,ax2,ay2,bx1,by1,bx2,by2) {

		return (
			(
				((ax1 >= bx1 && ax1 <= bx2) || (ax2 >= bx1 && ax2 <= bx2) || (ax2 <= bx1 && ax2 >= bx2) || (ax1 <= bx1 && ax2 >= bx2)) && 
				((ay1 >= by1 && ay1 <= by2) || (ay2 >= by1 && ay2 <= by2) || (ay1 <= by1 && ay2 >= by2) || (ay1 <= by1 && ay2 >= by2))
			)
		);
	}



	this.engine = {};
	this.engine.canvas = typeof canvas === "object" ? canvas : document.querySelector(canvas);
	this.engine.ctx =  this.engine.canvas.getContext("2d");

	this.engine.localFilter = function(input) {
		return typeof input === "string" ? input.replace("file:///","").replace(/\\/g,"/") : false;
	}

	this.engine.ris = function(input, fallback) {

		return typeof input !== "undefined" ? input : fallback;
	}

	this.engine.importResource = function(fileName, forceNewResource = false) {
		
		let resource;
		fileName = GAME_ENGINE_INSTANCE.engine.localFilter(fileName);

		try {
			
			if(!forceNewResource) {
	
				let filteredResources = GAME_ENGINE_INSTANCE.resources.filter(res=>{ return res.src === fileName; });
	
				if(filteredResources.length > 0) {
	
					resource = filteredResources[0];
				}
				else { forceNewResource = true; }
			}
	
			//Do not change this to an else or else if.
			if(forceNewResource) {
				
	
				if(fileName.match(/\.(png|tiff|bmp|jpg|jpeg|gif|jpg2000|jpeg2000|raw|webm|svg|tga|apng|ico)/i) != null) {
					
					resource = document.createElement("img");
					resource.src = fileName;
				}
				else if(fileName.match(/\.(wav|mp3|ogg|midi|mid|flac|wma|m3u)/i) != null) {

					resource = new Audio(fileName);
				}
				else { return false; }


				GAME_ENGINE_INSTANCE.resources.push(resource);
			}

			return resource;
	
		}
		catch(error) {
			
			console.error("Engine Error", error);
			return false;
		}
	}
	

	window.GAME_ENGINE_INSTANCE = this;

	return this;
};
 
["keydown","keyup","keypress","mousedown","mouseup","mousemove","contextmenu"].forEach(event=>{
	window.addEventListener(event, e=>{ 

		if(typeof GAME_ENGINE_INSTANCE === "undefined") { return false; }

		let croom = GAME_ENGINE_INSTANCE.getCurrentRoom(); 
		if(typeof croom === "object") { 

			croom.roomObjects.forEach(obj=>{ if(typeof obj["on" + event] === "function") { 

				obj["on" + event](e); 
			} });  
		}
	});
});