Polymer({

  is: 'bikolor-generate',

  ready: function() {

  	this.canvas = document.getElementById("bkCanvas");
  	this.height = this.canvas.height = parseInt(d3.select(this.canvas).style("height"));
  	this.width = this.canvas.width = parseInt(d3.select(this.canvas).style("width"));
	this.ctx = this.canvas.getContext("2d");

	var that = this;
	this.patterns = [];
	d3.text("./data/patterns.txt", function(e, text) {

		var isEnd = false;
		while(isEnd == false) {

			var rows = [];
			while(true) {

				var index = text.indexOf("\n");
				if(index == -1) {

					isEnd = true;
					that.patterns.push(rows);
					break;
				}
				var row = text.slice(0, index);
				text = text.substr(index + 1);
				if(row == "") {

					that.patterns.push(rows);
					break;
				}
				else {

					rows.push(row);
				}
			}
		}

		that.generateConfig();

		that.ctx.lineWidth = that.config.colorWheelLineWidth;
		that.drawColorWheels();

		that.ctx.lineWidth = that.config.pathLineWidth;
		that.drawPaths();

		that.imageUrl = that.canvas.toDataURL('image/png');
	});
  },

  printConfig: function(e) {

	console.log(JSON.stringify(this.config, null, '\t'));
  },

  generateConfig: function() {

  	this.config = {};
  	this.config.theme = "dark";
  	this.config.width = this.width;
  	this.config.height = this.height;

    this.config.colorWheels = [];
	this.config.numColorWheels = 12;
	this.config.colorWheelLineWidth = (this.width + this.height) / 1000;
	this.generateColorWheels();

	this.config.paths = [];
	this.config.numPaths = 60;
	this.config.pathLineWidth = 1;
	this.config.pathWidth = (this.width + this.height) / 250;
	this.generatePaths();
  },

  generatePaths: function() {

  	// initialize paths
  	for(var i = 0; i < this.config.numPaths; i++) {

  		this.config.paths.push({cX: this.width * Math.random(),
  							    cY: this.height * Math.random(),
  							    pX: this.width * Math.random(),
  							    pY: this.height * Math.random(),
  							    pattern: this.patterns[Math.floor(Math.random() * this.patterns.length)]});

  		// move path's center to outside the canvas
  		var path = this.config.paths[this.config.paths.length - 1];
  		var moveSpec = Math.random();
	  	if(moveSpec < 0.66) {

		  	path.cX = (path.cX <= this.width / 2) ? path.cX - this.width / 2 : path.cX + this.width / 2;
		}
		if(moveSpec > 0.33) {

		  	path.cY = (path.cY <= this.height / 2) ? path.cY - this.height / 2 : path.cY + this.height / 2;
		}
  	}
  },

  generateColorWheels: function() {

  	// initialize color wheels
  	for(var i = 0; i < this.config.numColorWheels; i++) {

  		this.config.colorWheels.push({cX: this.width * Math.random(),
  							          cY: this.height * Math.random(),
  							          radius: 0});
  	}

    // expand color wheels as much as possible
    var inc = 0.001;
    while(true) {

    	var progressed = false;
    	// expand each color wheel if possible 
    	for(var i = 0; i < this.config.colorWheels.length; i++) {

    		var cw = this.config.colorWheels[i];

    		if(this.hasCollision(i, cw.cX, cw.cY, cw.radius + inc) == false) {

    			cw.radius += inc;
    			progressed = true;
    			continue;
    		}

    		var dx = [-1, -1, -1, 0, 0, 1, 1, 1],
    		    dy = [-1, 0, 1, -1, 1, -1, 0, 1],
    		    moved = false;

    		for(var j = 0; j < 8; j++) {

    			if(this.hasCollision(i, cw.cX + dx[j] * inc, cw.cY + dy[j] * inc, cw.radius + 0.1 * inc) == false) {

    				cw.cX += (dx[j] * inc);
    				cw.cY += (dy[j] * inc);
    				cw.radius += (0.1 * inc);
    				moved = true;
    				break;
    			}
    		}

    		if(moved == true) {

    			progressed = true;
    			continue;
    		}
    	}

    	if(progressed == false) {

    		break;
    	}
    }
  },

  hasCollision: function(cwIndex, cX, cY, radius) {

  	// check borders
	if(cX - radius >= 0 &&
	   cX + radius < this.width &&
	   cY - radius >= 0 &&
	   cY + radius < this.height) {

		// check against other color wheels
		var collide = false;
		for(var j = 0; j < this.config.colorWheels.length; j++) {

			if(cwIndex === j) {

				continue;
			}

			var ocw = this.config.colorWheels[j];
			if(this.distance(cX, cY, ocw.cX, ocw.cY) <= radius + ocw.radius) {

				collide = true;
				break;
			}
		}

		return collide;
	}

	return true;
  },

  drawColorWheels: function() {

  	var inc = 0.001;
	for(var j = 0; j < this.config.colorWheels.length; j++) {

		var cw = this.config.colorWheels[j];
		for(var i = 0.0; i <= 2 * Math.PI; i += inc) {

			this.ctx.beginPath();
			this.ctx.arc(cw.cX, cw.cY, cw.radius, i, i + inc);

			this.ctx.strokeStyle = "hsl(" + Math.round(i * 180 / Math.PI, 0).toString() + ", 100%, 50%)";
			
			this.ctx.stroke();
			this.ctx.closePath();
		}
	}
  },

  distance: function(tx, ty, fx, fy) {

  	return Math.sqrt((tx - fx) * (tx - fx) + (ty - fy) * (ty - fy));
  },

  drawPaths: function() {

  	for(var i = 0; i < this.config.paths.length; i++) {

  		var path = this.config.paths[i];
	  	var inc = 0.005, pIndex = 0;
	  	var radius = this.distance(path.cX, path.cY, path.pX, path.pY);
	  	for(var angle = 0.0; angle <= 2 * Math.PI; angle += inc) {

	  		var curX = path.cX + radius * Math.cos(angle);
	  		var curY = path.cY + radius * Math.sin(angle);
	  		if(curX < 0 || curX > this.width || curY < 0 || curY > this.height) {

	  			continue;
	  		}
	  		this.drawStep(path.cX, path.cY, radius, angle, angle + inc, path.pattern[pIndex]);
	  		pIndex = (pIndex + 1) % path.pattern.length;
	  	}
	}
  },

  drawStep: function(cX, cY, radius, fromAngle, toAngle, pattern) {

  	var pWidth = this.config.pathWidth;
  	for(var delta = -pWidth; delta < pWidth; delta++) {

  		var pIndex = Math.floor((delta + pWidth) * pattern.length / (pWidth * 2));
  		if(pattern[pIndex] === '0') {

  			continue;
  		}
  		this.ctx.beginPath();
		this.ctx.arc(cX, cY, radius + delta, fromAngle, toAngle);

		var pX = cX + (radius + delta) * Math.cos(fromAngle),
		    pY = cY + (radius + delta) * Math.sin(fromAngle);

		var inside = false;
		for(var i = 0; i < this.config.colorWheels.length; i++) {

			var cw = this.config.colorWheels[i],
		        pRadius = this.distance(pX, pY, cw.cX, cw.cY),
		        pAngle = Math.atan2(pY - cw.cY, pX - cw.cX);

		    if(pRadius < cw.radius) {

		    	inside = true;
				if(pAngle < 0) {

					pAngle += 2 * Math.PI;
				}
	   			this.ctx.strokeStyle = "hsl(" + Math.round(pAngle * 180 / Math.PI, 0).toString() + ", 100%, 50%)";
	   		}
		}

   		if(inside == false) {

   			this.ctx.strokeStyle = (this.config.theme == "dark"? "#CCCCCC": "#444444");
   		}

		this.ctx.stroke();
		this.ctx.closePath();
  	}
  },

});
