var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var width = 1000;
var height = 500;

var elastic = 0.95;
var magnet = 300;
var spinCoefficient = 0.3;
var friction = 0;
var spinFriction = 0;

var poisonFactor = 0.3;

var photonSpawnRate = 6;

var minBabyMove = 0.6;
var minBabySpin = 0.3;
var timeToBreed = 1;

var lastTime=Date.now();
var nowTime=0;
var dTime;
var chips = [];
var photons = [];
function loop(){
    nowTime = Date.now();
    dTime = (nowTime-lastTime)/1000;
    lastTime = nowTime;

    if(chips.length<1){
        chips.push(getRandChip());
    }

    if(Math.random()<photonSpawnRate*dTime){    
        photons.push(getRandPhoton());
    }

    ploop: for (i = photons.length-1; i >= 0; i--){
        p = photons[i];
        p.x += p.dx * dTime;
        p.y += p.dy * dTime;
        for(n = 0; n < chips.length; n++){
            c = chips[n];
            count=0;
            for(yOff = -c.size; yOff<=c.size; yOff += c.size){
                for(xOff = -c.size; xOff<=c.size; xOff += c.size){
                    if(touching(c.x+xOff*Math.cos(c.theta)-yOff*Math.sin(c.theta),c.y+xOff*Math.sin(c.theta)+yOff*Math.cos(c.theta),c.size,p.x,p.y,p.size)){
                        if(c.dna[count]==1){
                            c.energy += 0.5;
                        }
                        photons.splice(i,1);
                        continue ploop;
                    }
                    count++;
                }
            }            
        }
        if(photons[i].y>height+10){
            photons.splice(i,1);
        }
    }


    cloop: for (i = chips.length-1; i >= 0; i--){

        c = chips[i];
        c.x += c.dx * dTime;
        c.y += c.dy * dTime;
        c.theta += c.dtheta * dTime;

        c.dx = c.dx * (1-(friction*dTime));
        c.dy = c.dy * (1-(friction*dTime));
        c.dtheta = c.dtheta * (1-(spinFriction*dTime));

        c.energy -= c.energyDecay * dTime;

        for(yOff = -c.size; yOff<=c.size; yOff += c.size){
            for(xOff = -c.size; xOff<=c.size; xOff += c.size){
                if(outside(c.x+xOff*Math.cos(c.theta)-yOff*Math.sin(c.theta),c.y+xOff*Math.sin(c.theta)+yOff*Math.cos(c.theta),c.size)){
                    c.dx = -c.dx;
                    c.dy = -c.dy;
                }
            }
        }

        if(c.energy<0){
            chips.splice(i,1);
            continue cloop;
        }else if(c.energy>1){
            if((nowTime-c.birthTime)/1000>timeToBreed){
                c.energy /= 2;
                c.birthTime = nowTime;
                chips.push(c.getBaby(c.energy));
            }
        }

        cloop2: for(n = i-1; n>=0; n--){
            c2 = chips[n];

            count = -1;
            for(yOff = -c.size; yOff<=c.size; yOff += c.size){
            first: for(xOff = -c.size; xOff<=c.size; xOff += c.size){
                    count++;
                    if(xOff==0 && yOff==0){
                        continue first;
                    }
                    x = c.x+xOff*Math.cos(c.theta)-yOff*Math.sin(c.theta);
                    y = c.y+xOff*Math.sin(c.theta)+yOff*Math.cos(c.theta);
                    count2=-1;
                    for(yOff2 = -c2.size; yOff2<=c2.size; yOff2 += c2.size){
                        second: for(xOff2 = -c2.size; xOff2<=c2.size; xOff2 += c2.size){
                            count2++;
                            if(xOff2==0 && yOff2==0){
                                continue second;
                            }
                            x2 = c2.x+xOff2*Math.cos(c2.theta)-yOff2*Math.sin(c2.theta);
                            y2 = c2.y+xOff2*Math.sin(c2.theta)+yOff2*Math.cos(c2.theta);
                            if(touching(x,y,c.size,x2,y2,c2.size)){
                                dx = (c.dx+c2.dx)/2;
                                dy = (c.dy+c2.dy)/2;
                                c.dx = dx*(1-elastic)-c.dx*(elastic);
                                c2.dx = dx*(1-elastic)-c2.dx*(elastic);
                                c.dy = dy*(1-elastic)-c.dy*(elastic);
                                c2.dy = dy*(1-elastic)-c2.dy*(elastic);

                                dtheta = (c.dtheta+c2.dtheta)/2;
                                c.dtheta = dtheta*(1-elastic)-c.dtheta*(elastic);
                                c2.dtheta = dtheta*(1-elastic)-c2.dtheta*(elastic);

                                if(c.dna[count]==4 && c2.dna[count2]!=4){
                                    c.energy += Math.min(poisonFactor,c2.energy);
                                    c2.energy -= poisonFactor;
                                }else if (c.dna[count]!=4 && c2.dna[count2]==4){
                                    c.energy -= poisonFactor;
                                    c2.energy += Math.min(poisonFactor,c.energy);                                    
                                }
                               
                            }else if(c.dna[count]==2 && c2.dna[count2]==3 || c.dna[count]==3 && c2.dna[count2]==2){
                                strength = magnet / dist(x,y,x2,y2);
                                angle = Math.atan2((y2-y),(x2-x));
                                c.dx += strength*Math.cos(angle) * dTime;
                                c.dy += strength*Math.sin(angle) * dTime;
                                c2.dx -= strength*Math.cos(angle) * dTime;
                                c2.dy -= strength*Math.sin(angle) * dTime;

                                cellAngle=Math.atan2(y-c.y,x-c.x);
                                cellAngle2=Math.atan2(y2-c2.y,x2-c2.x);
                                c.dtheta -= spinCoefficient*strength*Math.sin(cellAngle-angle) * dTime;
                                c2.dtheta -= spinCoefficient*strength*Math.sin(cellAngle2-(Math.PI+angle)) * dTime;
                            } else if(c.dna[count]==2 && c2.dna[count2]==2 || c.dna[count]==3 && c2.dna[count2]==3){
                                strength = magnet / dist(x,y,x2,y2);
                                angle = Math.atan2((y2-y),(x2-x));
                                c.dx -= strength*Math.cos(angle) * dTime;
                                c.dy -= strength*Math.sin(angle) * dTime;
                                c2.dx += strength*Math.cos(angle) * dTime;
                                c2.dy += strength*Math.sin(angle) * dTime;

                                cellAngle=Math.atan2(y-c.y,x-c.x);
                                cellAngle2=Math.atan2(y2-c2.y,x2-c2.x);
                                c.dtheta += spinCoefficient*strength*Math.sin(cellAngle-angle) * dTime;
                                c2.dtheta += spinCoefficient*strength*Math.sin(cellAngle2-(Math.PI+angle)) * dTime;

                            }
                        }
                    }
                }
            }            
        }
    }

    draw();
}

function getRandChip(){
    let c = new chip(width/2+(Math.random()*width/3-width/6), height/4,0 ,0);
    c.dx = Math.random()*50-25;
    c.dy = Math.random()*50-25;
    return c;
}

function getRandPhoton(){
    let p = new photon(Math.random()*width, -5, rand(-2,2), 50);
    return p;
}

class chip {
    x=0;
    y=0;
    size=10;
    dx=0;
    dy=0;
    theta = 0;
    dtheta = 0.5;
    dna=[0,1,0,1,0,1,0,1,0];
    energy = 1;
    energyDecay = 0.02; // 0.0
    birthTime = 0;

    constructor(x,y,dx,dy){
        this.x = x;
        this.y = y;
        this.dx = (minBabyMove+dx)*rand(-2,2);
        this.dy = (minBabyMove+dy)*rand(-2,2);
        this.birthTime = Date.now();
    }

    getBaby(energy){
        let c = new chip(this.x, this.y, this.dx, this.dy);
        c.energy = energy;
        c.theta = this.theta;
        c.dtheta= (minBabySpin+this.dtheta)* rand(-2,2);
        c.dna = this.dna.slice();
        let dist = 4.25;
        switch(randInt(0,3)){
            case 0:
            c.x = this.x - dist*this.size;
            break;
            case 1:
            c.x = this.x + dist*this.size;
            break;
            case 2:
            c.y = this.y - dist*this.size;
            break;
            case 3:
            c.y = this.y + dist*this.size;
            break;
        }

        c.dna[randInt(0,8)] = randInt(0,4);
        return c;
    }
}

class photon {
    x=0;
    y=0;
    size=5;
    dx=0;
    dy=0;

    constructor(x,y,dx,dy){
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
    }
}

function draw(){
    ctx.fillStyle = '#abe0de';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.globalAlpha = 1;

    for (i = 0; i < chips.length; i++){
        c = chips[i];
        index = 0;
        for(yOff = -c.size; yOff<=c.size; yOff += c.size){
            for(xOff = -c.size; xOff<=c.size; xOff += c.size){
                if((xOff==0 && yOff==0)){
                    ctx.fillStyle = 'rgb('+255*(1-c.energy)+','+255*c.energy+',0)';                                        
                    ctx.beginPath();
                    ctx.arc(c.x+xOff*Math.cos(c.theta)-yOff*Math.sin(c.theta), c.y+xOff*Math.sin(c.theta)+yOff*Math.cos(c.theta), c.size/2, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.stroke();                     
                } else {
                    switch(c.dna[index]){
                        case 0: // white nothing
                            ctx.fillStyle = '#FFFFFF';
                        break;
                        case 1: // green photosynthesis
                            ctx.fillStyle = '#008000';                    
                        break;            
                        case 2: // red magnet N
                            ctx.fillStyle = '#FF0000';   
                        break;             
                        case 3: // blue magnet S
                            ctx.fillStyle = '#0000FF';
                        break;                
                        case 4: // purple poison
                            ctx.fillStyle = '#800080';            
                        break;
                        case 5:
                            ctx.fillStyle = '#000000';            

                    }
                    //context.lineWidth = 5;
                    //context.strokeStyle = "black";
                    ctx.beginPath();
                    ctx.arc(c.x+xOff*Math.cos(c.theta)-yOff*Math.sin(c.theta), c.y+xOff*Math.sin(c.theta)+yOff*Math.cos(c.theta), c.size/2, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.stroke();   
                } 
                index++;                  
            }            
        }
    }

    for (i = 0; i < photons.length; i++){
        ctx.fillStyle = '#FFFF00';
        ctx.beginPath();
        ctx.arc(photons[i].x, photons[i].y, photons[i].size/2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
    }
}

function rand(min,max){
    return Math.random()*(max-min) + min;
}

function randInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function dist(x1,y1,x2,y2) {
    return Math.sqrt(Math.pow(x1-x2,2)+Math.pow(y1-y2,2));
}

function touching(x1,y1,s1,x2,y2,s2) {
    return Math.abs(x1-x2)<(s1+s2)/2 && Math.abs(y1-y2)<(s1+s2)/2;
}

function outside(x,y,s) {
    return x-s/2<0||x+s/2>width||y-s/2<0||y+s/2>height;
}

var loopInterval;
function init(){
    loopInterval= setInterval(loop,5);
}
init();

// green - chlorophyll
// red - magnetic north
// blue - magnetic south
// purple - poison
// white - light
// black - heavy