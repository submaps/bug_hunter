
import { apple } from './apple.js';
import { player } from './player.js';
import { wall } from './wall.js';


// import apple from 'apple.js';
// import player from 'player.js';
// import wall from 'wall.js';

/*
	Fruit Hunter Game
	Made using Box2d and Jquery on the Html5 Canvas element
	
	Author : Silver Moon
	m00n.silv3r@gmail.com
	
	Enjoy!!
*/


//Global game object
var global_game = null;

//start game once page has finished loaded
$(function() { 
	start_game();
});

function start_game()
{
	var g = new game();
	
	//store game pointer in a global object
	global_game = g;
	
	$(window).resize(function() {
		g.resize();
	});
	
	g.start();
}

function game()
{
	this.fps = 60;
	this.scale = 50;
	
	//global array of all objects to manage
	this.game_objects = [];
	
	this.points = 0;
	this.to_destroy = [];
	this.time_elapsed = 0;
}

game.prototype.resize = function()
{
	var canvas = this.canvas;
	
	//Set the canvas dimensions to match the window dimensions
	var w = $(window).outerWidth();
	var h = $(window).outerHeight();
	
	canvas.width(w);
	canvas.height(h);
	
	canvas.attr('width' , w * 0.75);
	canvas.attr('height' , h * 0.75);
	
	this.canvas_width = canvas.attr('width');
	this.canvas_height = canvas.attr('height');
	
	this.screen_height = 10;
	this.scale = this.canvas_height / this.screen_height;
	this.screen_width = this.canvas_width / this.scale;
}

game.prototype.setup = function()
{
	this.ctx = $('#canvas').get(0).getContext('2d');
	
	// this.ctx = ctx = $('#canvas').get(0).getContext('2d');
	var canvas = $('#canvas');
	this.canvas = canvas;
	
	//resize to correct size
	this.resize();
	
	//dimensions in metres
	var w = this.screen_width;
	var h = this.screen_height;
		
	//create the box2d world
	this.create_box2d_world();
	
	//lower slab
	this.game_objects.push(new wall({x : w/2 - 3.5, y: 1, width : 2, height:1, game : this}));
	this.game_objects.push(new wall({x : w/2 , y: 1, width : 2, height:1, game : this}));
	this.game_objects.push(new wall({x : w/2 + 3.5, y: 1, width : 2, height:1, game : this}));
	
	var player1_img = 'monkey.png';
	var player2_img = 'monkey_neo.png';

	//the player
	this.player = new player({x : w/2+w/5, y: h/2 , game : this, player_name: "player", player_img: player1_img});
	this.game_objects.push(this.player);
	
	this.player2 = new player({x : w/2-w/5, y: h/2 , game : this, player_name: "neo", player_img: player2_img});
	this.game_objects.push(this.player2);
	

	//attach event handlers for key presses
	this.start_handling();
	
	//setup collision handler too
	this.setup_collision_handler();
}

game.prototype.create_box2d_world = function()
{
	//10m/s2 downwards, cartesian coordinates remember - we shall keep slightly lesser gravity
	var gravity = new b2Vec2(0, -10);
	
	/*
		very important to do this, otherwise player will not move.
		basically dynamic bodies trying to slide over static bodies will go to sleep
	*/
	var doSleep = false;
	var world = new b2World(gravity , doSleep);
	
	//save in global object
	this.box2d_world = world;
}

//Start the game :) Setup and start ticking the clock
game.prototype.start = function()
{
	this.on = true;
	this.total_points = 0;
	
	this.setup();
	this.is_paused = false;
	
	//Start the Game Loop - TICK TOCK TICK TOCK TICK TOCK TICK TOCK
	this.tick();
}

game.prototype.redraw_world = function()
{
	//1. clear the canvas first - not doing this will cause tearing at world ends
	this.ctx.clearRect(0 , 0 , this.canvas_width , this.canvas_height);
	
	//dimensions in metres
	var w = this.screen_width;
	var h = this.screen_height;
	
	var img = img_res('orange_hills.png');
	this.ctx.drawImage(img, 0 , 0 , this.canvas_width, this.canvas_height);
	
	img = img_res('tree.png');
	this.ctx.drawImage(img,  (w/2 - 4.5) * this.scale , h/2 , 10 * this.scale, this.canvas_height);
	
	write_text({x : 25 , y : 25 , font : 'bold 15px arial' , color : '#fff' , text : 'Fruits ' + this.points , ctx : this.ctx})
	
	//Draw each object one by one , the tiles , the cars , the other objects lying here and there
	for(var i in this.game_objects)
	{
		this.game_objects[i].draw();
	}
}

game.prototype.tick = function(cnt)
{
	if(!this.is_paused && this.on)
	{
		this.time_elapsed += 1;
		
		//create a random fruit on top
		if(this.time_elapsed % 50 == 0)
		{
			var xc = Math.random() * 8 + this.screen_width/2 - 4;
			var yc = this.screen_height/2 + 2.5;
			
			this.game_objects.push(new apple({x : xc ,y : yc,game:this}));
		}
		
		//tick all objects, if dead then remove
		for(var i in this.game_objects)
		{
			if(this.game_objects[i].dead == true)
			{
				delete this.game_objects[i];
				continue;
			}
			
			this.game_objects[i].tick();
		}
		
		//garbage collect dead things
		this.perform_destroy();
		
		//Step the box2d engine ahead
		this.box2d_world.Step(1/20 , 8 , 3);
		
		//important to clear forces, otherwise forces will keep applying
		this.box2d_world.ClearForces();
		
		//redraw the world
		this.redraw_world();
		
		if(!this.is_paused && this.on)
		{
			var that = this;
			//game.fps times in 1000 milliseconds or 1 second
			this.timer = setTimeout( function() { that.tick(); }  , 1000/this.fps);
		}
	}
}

game.prototype.perform_destroy = function()
{
	for(var i in this.to_destroy)
	{
		this.to_destroy[i].destroy();
	}
}

game.prototype.get_offset = function(vector)
{
	return new b2Vec2(vector.x - 0, Math.abs(vector.y - this.screen_height));
}

game.prototype.start_handling = function()
{
	var that = this;
	
	$(document).on('keydown.game' , function(e)
	{
		that.key_down(e);
		return false;
	});
	
	$(document).on('keyup.game' ,function(e)
	{
		that.key_up(e);
		return false;
	});
}

game.prototype.key_down = function(e)
{
	var code = e.keyCode;
	
	//LEFT
	if(code == 37)
	{
		this.player.do_move_left = true;
	}
	//UP
	else if(code == 38)
	{
		this.player.jump();
	}
	//RIGHT
	else if(code == 39)
	{
		this.player.do_move_right = true;
	}
}

game.prototype.key_up = function(e)
{
	var code = e.keyCode;
	
	//UP KEY
	if(code == 38)
	{
		this.player.do_move_up = false;
		this.player.can_move_up = true;
	}
	//LEFT
	else if(code == 37)
	{
		this.player.do_move_left = false;
	}
	//RIGHT
	else if(code == 39)
	{
		this.player.do_move_right = false;
	}
}

//Setup collision handler
game.prototype.setup_collision_handler = function()
{
	var that = this;
	
	//Override a few functions of class b2ContactListener
	b2ContactListener.prototype.BeginContact = function (contact) 
	{
		//now come action time
		var a = contact.GetFixtureA().GetUserData();
		var b = contact.GetFixtureB().GetUserData();
		
		if(a instanceof player && b instanceof apple)
		{
			that.destroy_object(b);
			that.points++;
		}
		
		else if(b instanceof player && a instanceof apple)
		{
			that.destroy_object(a);
			that.points++;
		}
		//apple hits a wall
		else if(a instanceof apple && b instanceof wall)
		{
			that.destroy_object(a);
		}
	}
}

//schedule an object for destruction in next tick
game.prototype.destroy_object = function(obj)
{
	this.to_destroy.push(obj);
}




