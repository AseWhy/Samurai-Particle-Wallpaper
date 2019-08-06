class Particle{
    constructor(sx, sy, mw, mh, vector, color){
        this.x = sx;
        this.y = sy;
        this.width = Math.round(mw);
        this.height = Math.round(mh);
        this.opacity = 1;
        this.vector = vector * (Math.PI / 180);
        this.color = color;
        this.speed_factor = Math.random() + 0.1;
        this.fade_rate = 0.002;
        this.variability = 10; // 10 deg
        this.start = {
            x: sx,
            y: sy,
            vector: vector * (Math.PI / 180)
        }
        this.Init();
    }

    Init(){
        this.vector = ((this.vector*(180/Math.PI))+(Math.floor(Math.random() * (this.variability - -this.variability)) + -this.variability)) * (Math.PI / 180)
        for(var i = 0;i < (1 / this.fade_rate) * 2;i++){
            this.opacity -= this.fade_rate * this.speed_factor;

            this.x += Math.cos(this.vector) * this.speed_factor;
            this.y += Math.sin(this.vector) * this.speed_factor;

            if(this.opacity <= 0 || this.x < 0 || this.y < 0){
                this.opacity = 1;
                this.x = this.start.x;
                this.y = this.start.y;
                this.vector = ((this.start.vector*(180/Math.PI))+(Math.floor(Math.random() * (this.variability - -this.variability)) + -this.variability)) * (Math.PI / 180)
            }
        }
    }

    Draw(ctx){
        this.opacity -= this.fade_rate * this.speed_factor;

        this.x += Math.cos(this.vector) * this.speed_factor;
        this.y += Math.sin(this.vector) * this.speed_factor;

        ctx.fillStyle = "rgba("+this.color.r+","+this.color.g+","+this.color.b+","+this.opacity+")";
        ctx.fillRect(this.x, this.y, this.width, this.height);

        if(this.opacity <= 0 || this.x < 0 || this.y < 0){
            this.opacity = 1;
            this.x = this.start.x;
            this.y = this.start.y;
            this.vector = ((this.start.vector*(180/Math.PI))+(Math.floor(Math.random() * (this.variability - -this.variability)) + -this.variability)) * (Math.PI / 180);
        }
    }


}