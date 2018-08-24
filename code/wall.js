//Wall object
export function wall(options)
{
	this.x = options.x;
	this.y = options.y;
	
	this.height = options.height;
	this.width = options.width;
	
	this.game = options.game;
	this.age = 0;
	//create a box2d static object - one that does not move, but does collide with dynamic objects
	
	var info = { 
		'density' : 10 ,
		'fixedRotation' : true ,
		'userData' : this ,
		'type' : b2Body.b2_staticBody ,
	};
	
	var body = create_box(this.game.box2d_world , this.x, this.y, this.width, this.height, info);
	this.body = body;
}

wall.img = img_res('wall.png');
wall.prototype.tick = function()
{
	this.age++;
}

//Draw bricks
wall.prototype.draw = function()
{
	//draw_body(this.body, this.game.ctx);
	
	var x1 = this.x - this.width/2;
	var x2 = this.x + this.width/2;
	
	var y1 = this.y + this.height/2;
	var y2 = this.y - this.height/2;
	
	var scale = this.game.scale;
	
	var width = 1.0 * scale;
	var height = 1.0 * scale;
	
	for(var i = x1 ; i < x2; i++)
	{
		for(var j = y1; j > y2; j--)
		{
			//get canvas coordinates
			var c = this.game.get_offset(new b2Vec2(i,j));
			this.game.ctx.drawImage(wall.img , c.x * scale, c.y * scale, width, height);
		}
	}
}