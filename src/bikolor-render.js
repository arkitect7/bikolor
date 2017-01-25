Polymer({

  is: 'bikolor-render',

  ready: function() {

  	this.canvas = document.getElementById("bkCanvas");
  	this.marginLeft = document.getElementById("margin-left");
  	this.marginRight = document.getElementById("margin-right");
  	this.width = window.innerWidth;
  	this.height = window.innerHeight;
	this.ctx = this.canvas.getContext("2d");

	var that = this;
	this.patterns = [];

	d3.json("./data/config.json", function(data) {

		that.config = data;
		var canvasWidthPerc = 0.9,
		    canvasHeightPerc = 0.8;

		if(that.width * canvasWidthPerc * that.config.height < that.height * canvasHeightPerc * that.config.width) {
			
			that.canvas.width = that.width * canvasWidthPerc;
			that.canvas.height = that.canvas.width * that.config.height / that.config.width;
		}
		else {

			that.canvas.height = that.height * canvasHeightPerc;
			that.canvas.width = that.canvas.height * that.config.width / that.config.height;
		}
		that.marginLeft.style.width = that.marginRight.style.width = Math.round((that.width - that.canvas.width) / 2, 0).toString() + "px";

		for(var i = 0; i < that.config.colorWheels.length; i++) {

			var cw = that.config.colorWheels[i];
			cw.cX = cw.cX * that.canvas.width / that.config.width;
			cw.cY = cw.cY * that.canvas.height / that.config.height;
			cw.radius = cw.radius * that.canvas.width / that.config.width;
		}
		that.config.colorWheelLineWidth = that.config.colorWheelLineWidth * that.canvas.width / that.config.width;

		for(var i = 0; i < that.config.paths.length; i++) {

			var path = that.config.paths[i];
			path.cX = path.cX * that.canvas.width / that.config.width;
			path.cY = path.cY * that.canvas.height / that.config.height;
			path.pX = path.pX * that.canvas.width / that.config.width;
			path.pY = path.pY * that.canvas.height / that.config.height;
		}
		that.config.pathWidth = Math.floor(that.config.pathWidth * that.canvas.width / that.config.width);

		that.ctx.lineWidth = that.config.colorWheelLineWidth;
		that.ctx.lineWidth = that.config.pathLineWidth;

		that.beginAnimation();
	});
  },

  nextStep: function () {

  	if(this.currentState.colorWheelsDrawn < this.config.colorWheels.length) {

  		this.drawColorWheelStep();
  		if(this.currentState.colorWheelStep > 2 * Math.PI) {

  			this.currentState.colorWheelStep = 0.0;
  			this.currentState.colorWheelsDrawn++;
  		}
  	}
  	else if(this.currentState.pathsDrawn < this.config.paths.length) {

  		this.drawPathStep();
  		if(this.currentState.pathStep > 2 * Math.PI) {

  			this.currentState.pathStep = 0.0;
  			this.currentState.pathsDrawn++;
  		}
  	}
  	else if(this.currentState.waitsDone < this.reqdWaits) {

  		this.currentState.waitsDone++;
  	}
  	else {

  		this.initState();
  	}
  },

  initState: function() {

  	this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  	this.currentState = {

    	colorWheelsDrawn: 0,
    	colorWheelStep: 0.0,
    	pathsDrawn: 0,
    	pathStep: 0.0,
    	waitsDone: 0
    };
  },

  beginAnimation: function() {

    var that = this;
    var callback = function() {

        that.nextStep();
    };

    this.reqdWaits = 100;
    this.colorWheelMovesPerStep = 250;
    this.pathMovesPerStep = 25;
    this.initState();
    this.interval = d3.interval(callback);
  },

  drawColorWheelStep: function() {

  	var inc = 0.001;
	var cw = this.config.colorWheels[this.currentState.colorWheelsDrawn];

	for(var moves = 0; moves < this.colorWheelMovesPerStep; moves++) {

		var i = this.currentState.colorWheelStep;
		this.ctx.beginPath();
		this.ctx.arc(cw.cX, cw.cY, cw.radius, i, i + inc);

		this.ctx.strokeStyle = "hsl(" + Math.round(i * 180 / Math.PI, 0).toString() + ", 100%, 50%)";

		this.ctx.stroke();
		this.ctx.closePath();

		this.currentState.colorWheelStep += inc;
		if(this.currentState.colorWheelStep > 2 * Math.PI) {

			break;
		}
	}
  },

  distance: function(tx, ty, fx, fy) {

  	return Math.sqrt((tx - fx) * (tx - fx) + (ty - fy) * (ty - fy));
  },

  drawPathStep: function() {

	var path = this.config.paths[this.currentState.pathsDrawn];
	var inc = 0.005, pIndex = 0;
	var radius = this.distance(path.cX, path.cY, path.pX, path.pY);

	for(var moves = 0; moves < this.pathMovesPerStep; moves++) {

		var angle = this.currentState.pathStep;

		var curX = path.cX + radius * Math.cos(angle);
		var curY = path.cY + radius * Math.sin(angle);
		if(curX >= 0 && curX <= this.width && curY >= 0 && curY <= this.height) {

			this.drawStep(path.cX, path.cY, radius, angle, angle + inc, path.pattern[pIndex]);
			pIndex = (pIndex + 1) % path.pattern.length;		
		}

		this.currentState.pathStep += inc;
		if(this.currentState.pathStep > 2 * Math.PI) {

			break;
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
