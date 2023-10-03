
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

music = new Audio('assets/main2.wav');
empSound0 = new Audio('assets/emp.wav');
empSound1 = new Audio('assets/emp.wav');
empSound2 = new Audio('assets/emp.wav');
empSound3 = new Audio('assets/emp.wav');
empSound4 = new Audio('assets/emp.wav');
empSound5 = new Audio('assets/emp.wav');
var empSoundCount = 0;
shootSound0 = new Audio('assets/shoot.wav');
shootSound1 = new Audio('assets/shoot.wav');
shootSound2 = new Audio('assets/shoot.wav');
shootSound3 = new Audio('assets/shoot.wav');
shootSound4 = new Audio('assets/shoot.wav');
shootSound5 = new Audio('assets/shoot.wav');
var shootSoundCount = 0;
loseSound = new Audio('assets/lose.wav');
music.loop = true;


var width = 1000;
var height = 1000;

var left = false;
var right = false;
var space = false;

var textMode = true;
var finishedIntro = false;
var usernameEntered = false;
var initStarted = false;
var shouldLoop = true;
var gameOver = false;

var name = '';

var maxViewWidth = 1000;
var maxViewHeight = maxViewWidth * (canvas.height/canvas.width);
var minViewWidth = 300; // for when player is disabled
var minViewHeight = minViewWidth * (canvas.height/canvas.width);

var viewWidth = maxViewWidth;
var viewHeight = maxViewHeight;


const playerDisabledTime = 500;
const playerChargeTime = 750;

const gravitationalConstant = 0.75;

const planetNums = [1,2,2,3,4,4,4];
const baseNums = [[1],[1,1],[2,1],[2,1,1],[2,2,1,1],[2,2,2,1],[3,2,2,2]];
const planetRadius = 256;
const planetVarience = 0.35;
const planetColors = ['#00FF95','#009759','#002F1D','#68FFC1','#D0FFED'];

const bombSpeed = 450;
const bombRadius = 5;
const bombMass = 3;

const boomTimeToLive = 1000;
const boomRadius = 50;

const baseSide = 75;
const baseShootTime = 2000;

const empSpeed = 500;
const empRadius = 5;

const empBoomTimeToLive = 750;
const empBoomRadius = 40;


var player = {};
var planets = [];
var bombs = [];
var booms = [];
var bases = [];
var emps = [];
var empBooms = [];
var level = 0;

function initLevel(){
    bombs = [];
    booms = [];
    bases = [];
    emps = [];
    empBooms = [];
    player.x = -500;
    player.y = 500; 
    player.vx = 0;
    player.vy = 0;
    player.width = 32;
    player.height = 16;
    player.speed = 350;
    player.angularSpeed = Math.PI/0.75;
    player.angle = 0;
    player.disabled = false;
    player.lastShot = 0;

    planets = [];
    planetLoop:
    for(var i=0; i<planetNums[Math.min(planetNums.length-1,level)];i++){
        var p = {};
        p.x = Math.random() * width;
        p.y = Math.random() * height;
        var randIndex = Math.floor(Math.random()*planetColors.length);
        p.color = planetColors[randIndex];
        p.radius = planetRadius + planetRadius * (1-2*Math.random()) * planetVarience;
        p.mass = 4/3 * Math.PI * p.radius * p.radius;
        
        // resets parameters if any overlapping planets
        var valid = true;
        for(var n = 0; n<planets.length;n++){
            otherPlanet = planets[n];
            if(dist(p.x,p.y,otherPlanet.x,otherPlanet.y)<p.radius+otherPlanet.radius){
                valid = false;
            }
        }
        if(valid){
            planets.push(p);            
        }else{
            i--;
            continue planetLoop;
        }
        for(var r = 0; r < baseNums[Math.min(planetNums.length-1,level)][i]; r++){
            b = {};
            mAngle = Math.random() * (Math.random()<0.5?1:-1) * Math.PI;
            dAngle = baseSide/(2*p.radius);
            lAngle = mAngle - dAngle;
            rAngle = mAngle + dAngle;

            b.lx = p.x + p.radius * Math.cos(lAngle);
            b.ly = p.y + p.radius * Math.sin(lAngle);

            b.rx = p.x + p.radius * Math.cos(rAngle);
            b.ry = p.y + p.radius * Math.sin(rAngle);

            b.mx = p.x + ((Math.sqrt(3)/2) * baseSide + p.radius) * Math.cos(mAngle);
            b.my = p.y + ((Math.sqrt(3)/2) * baseSide + p.radius) * Math.sin(mAngle);

            b.nextShot = Date.now() + (1+Math.random()*baseShootTime);

            bases.push(b);
        }
    }
    lastTime = Date.now();
    nowTIme = lastTime+1;
}

function loseSound(){
    console.log('LOSE');
    loseSound.play();
}

function boomSound(){
                sSound=null;
                switch(shootSoundCount%6){
                    case 0:
                    sSound = shootSound0;
                    break;
                    case 1:
                    sSound = shootSound1;
                    break;
                    case 2:
                    sSound = shootSound2;
                    break;
                    case 3:
                    sSound = shootSound3;
                    break;
                    case 4:
                    sSound = shootSound4;
                    break;
                    case 5:
                    sSound = shootSound5;
                }
                shootSoundCount++;
                sSound.play();
}

var lastTime;
var nowTime;
function loop(){
    if(!shouldLoop){return;}
    nowTime = Date.now();
    var dTime = (nowTime-lastTime)/1000;
    lastTime = nowTime;

    bombLoop:
    for(var i = bombs.length-1; i >=0; i--){
        b = bombs[i];
        b.x += b.vx * dTime;
        b.y += b.vy * dTime;
 
        for(var n = 0; n<bases.length;n++){
            base = bases[n];
            if(insideTriangle(b.x,b.y,base.lx,base.ly,base.rx,base.ry,base.mx,base.my)){
                boom = {};
                boom.x = b.x;
                boom.y = b.y;
                boom.birth = nowTime;
                boom.startTime = nowTime;
                boom.endTime = nowTime + boomTimeToLive;
                boom.radius = boomRadius;
                booms.push(boom);
                boomSound();
                bombs.splice(i,1);
                continue bombLoop;                
            }
        }

        dvx = 0;
        dvy = 0;
        for(var n = 0; n < planets.length; n++){
            p = planets[n];
            var d = dist(b.x,b.y,p.x,p.y);
            if(d < p.radius){
                boom = {};
                boom.x = b.x;
                boom.y = b.y;
                boom.birth = nowTime;
                boom.startTime = nowTime;
                boom.endTime = nowTime + boomTimeToLive;
                boom.radius = boomRadius;
                booms.push(boom);
                boomSound();
                bombs.splice(i,1);
                continue bombLoop;
            }
            acel = dTime* gravitationalConstant * p.mass / d;
            angle = Math.atan2((p.y-b.y),(p.x-b.x));
            dvx += Math.cos(angle)*acel;
            dvy += Math.sin(angle)*acel;
        }
        b.vx += dvx;
        b.vy += dvy;
    }

    for(var i = booms.length-1; i >= 0;i--){
        b = booms[i];
        if(nowTime>=b.endTime){
            booms.splice(i,1);
        }
    }

    // go to next level
    if(bases.length==0){
        shouldLoop = false;
        level++;
        clearInterval(loopInterval);
        setTimeout(startTextMode,200);
        setTimeout(nextLevelText,400);
    }

    baseLoop:
    for(var i = bases.length-1; i>=0;i--){
        b = bases[i];
        for(var n=0; n<booms.length;n++){
            boom = booms[n];
            if(dist(b.lx,b.ly,boom.x,boom.y)<boom.radius || dist(b.rx,b.ry,boom.x,boom.y)<boom.radius || dist(b.mx,b.my,boom.x,boom.y)<boom.radius){
                bases.splice(i,1);
                continue baseLoop;
            }
        }
        if(nowTime>b.nextShot){
            b.nextShot = b.nextShot + baseShootTime;
            e = {};
            e.x = b.mx;
            e.y = b.my;
            angle = Math.atan2(player.y-e.y,player.x-e.x);
            e.vx = empSpeed * Math.cos(angle);
            e.vy = empSpeed * Math.sin(angle);
            e.radius = empRadius;
            emps.push(e);
        }
    }

    for(var i = emps.length-1; i >= 0; i--){
        var e = emps[i];
        var d = dist(e.x,e.y,player.x,player.y);
        e.x += e.vx * dTime;
        e.y += e.vy * dTime;
        var d2 = dist(e.x,e.y,player.x,player.y);
        // getting further away from player
        if((d2)>(d)){
            var empBoom = {};
            empBoom.x = e.x;
            empBoom.y = e.y;
            empBoom.radius = empBoomRadius;
            empBoom.startTime = nowTime;
            empBoom.endTime = nowTime + empBoomTimeToLive;
            empBooms.push(empBoom);
            eSound=null;
            switch(empSoundCount%6){
                case 0:
                eSound = empSound0;
                break;
                case 1:
                eSound = empSound1;
                break;
                case 2:
                eSound = empSound2;
                break;
                case 3:
                eSound = empSound3;
                break;
                case 4:
                eSound = empSound4;
                break;
                case 5:
                eSound = empSound5;
                break;

            }
            empSoundCount++;
            eSound.play();
            emps.splice(i,1);
            if(dist(empBoom.x,empBoom.y,player.x,player.y)<empBoom.radius){
                if(!player.disabled){
                    player.disabled=true;
                    player.vx = player.speed * Math.cos(player.angle);
                    player.vy = player.speed * Math.sin(player.angle);
                }
                player.disabledEndTime = nowTime + playerDisabledTime;
            }
        }
    }

    for(var i = empBooms.length-1; i >=0; i--){
        var e = empBooms[i];
        if(nowTime>e.endTime){
            empBooms.splice(i,1);
        }
    }
    if(player.disabled){
        viewWidth = minViewWidth;
        viewHeight = minViewHeight;
        if(nowTime > player.disabledEndTime){
            console.log('POWER UP');
            player.disabled = false;
            player.vx = 0;
            player.vy = 0;
            player.lastShot = nowTime;
            player.charge = 0.0;
        }else {
            var dvx = 0;
            var dvy = 0;
            for(var n = 0; n < planets.length; n++){
                p = planets[n];
                var d = dist(player.x,player.y,p.x,p.y);
                acel = dTime * gravitationalConstant * p.mass / d;
                angle = Math.atan2((p.y-player.y),(p.x-player.x));
                dvx += Math.cos(angle)*acel;
                dvy += Math.sin(angle)*acel;
            }

            player.vx += dvx;
            player.vy += dvy;


            player.x += dTime * player.vx;
            player.y += dTime * player.vy;
        }
    }else{
        viewWidth = maxViewWidth;
        viewHeight = maxViewHeight;
        if(left){
            player.angle -= player.angularSpeed * dTime;
        }
        if(right){
            player.angle += player.angularSpeed * dTime;
        }

        player.charge = Math.min(1.0,(nowTime-player.lastShot)/playerChargeTime); // proportion the cannon is charged
        if(space && player.charge>=1.0){
            player.lastShot = nowTime;
            space = false;
            b = {};
            b.x = player.x + player.width * Math.cos(player.angle);
            b.y = player.y + player.height * Math.sin(player.angle);
            b.vx = bombSpeed * Math.cos(player.angle);
            b.vy = bombSpeed * Math.sin(player.angle);
            b.radius = bombRadius;
            b.mass = bombMass;
            bombs.push(b);
        }
        player.x += player.speed * dTime * Math.cos(player.angle);
        player.y += player.speed * dTime * Math.sin(player.angle);         
    }
    for(var i = 0; i < planets.length; i++){
        p = planets[i];
        var d = dist(player.x,player.y,p.x,p.y);
        if(d<p.radius){
            clearInterval(loopInterval);
            setTimeout(endGame,300);
           // setTimeout(loseSound,50);
        }
    }
    draw();
}

function draw() {
    ctx.fillStyle = '#262626';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.globalAlpha = 1;

    renderPlanets();
    renderBases();
    renderPlayer();
    renderBombs();
    renderEmps();
    renderBooms();
    renderEmpBooms();
    if(!player.disabled){
        renderUI();        
    }
}

function renderPlayer(){
    ctx.save();
    ctx.beginPath();
    ctx.translate(canvas.width/2,canvas.height/2);
    ctx.rotate(player.angle);
    var dw = drawWidth(player.width);
    var dh = drawHeight(player.height);
    // ctx.moveTo(dw/2,0);
    // ctx.lineTo(-dw/2,-dh/2);
    // ctx.lineTo(0,-dw/3);
    // ctx.lineTo(-dw/2,dh/2);
    // ctx.lineTo(dw/2,0);
       ctx.moveTo(dw/2,0);
       ctx.lineTo(-dw/2,-dh/2);
       ctx.lineTo(-dw/3,0);
       ctx.lineTo(-dw/2,dh/2);
       ctx.closePath();
    ctx.fillStyle = "#FFA500";
    ctx.fill();
    ctx.restore();
}

function renderPlanets(){
    for(var i = 0; i < planets.length; i++){
        var p = planets[i];
        renderCircle(p.x,p.y,p.radius,p.color);
    }
}

function renderBases(){
    for(var i =0; i < bases.length; i++){
        var b = bases[i];
        ctx.save();
        ctx.lineWidth = 7;
        ctx.strokeStyle = "#FF00B3";
        ctx.beginPath();

        ctx.moveTo(drawX(b.lx),drawY(b.ly));        
        ctx.lineTo(drawX(b.rx),drawY(b.ry));
        ctx.lineTo(drawX(b.mx),drawY(b.my));
        ctx.lineTo(drawX(b.lx),drawY(b.ly));
        ctx.stroke();
        ctx.restore();
    }
}

function renderBombs(){
    for(var i = 0; i < bombs.length; i++){
        var b = bombs[i];
        renderCircle(b.x,b.y,b.radius,"#976100");
    }    
}

function renderEmps(){
    for(var i = 0; i < emps.length; i++){
        var e = emps[i];
        renderCircle(e.x,e.y,e.radius,"#FFD0F3");
    }        
}

function renderBooms(){
    for(var i = 0; i < booms.length; i++){
        var b = booms[i];
        ctx.globalAlpha = 1-(nowTime-b.startTime)/(b.endTime-b.startTime);
        renderCircle(b.x,b.y,b.radius,"#FFC968");
        ctx.globalAlpha = 1;
    }
}

function renderEmpBooms(){
    for(var i = 0; i < empBooms.length; i++){
        var b = empBooms[i];
        ctx.globalAlpha = 1-(nowTime-b.startTime)/(b.endTime-b.startTime);
        renderCircle(b.x,b.y,b.radius,"#FF68D3");
        ctx.globalAlpha = 1;
    }    
}

function renderCircle(x,y,radius,color){
        ctx.save();
        ctx.beginPath();
        ctx.translate(drawX(x),drawY(y));
        ctx.arc(0, 0, drawWidth(radius), 0, Math.PI*2, false);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.restore();
}

function renderUI(){
    ctx.fillStyle = textColor;
    ctx.textFont = textFont;
    ctx.fillText("ZONE: "+level,10,30);
    var chargeText = 'CHARGE ';
    var fillNum = Math.floor(10*player.charge);
    for(var i = 0; i < fillNum; i++){
        chargeText+='\u{25a9}';
    }
    for(var i =0; i < 10-fillNum; i++){
        chargeText+='\u{25a4}';
    }
    ctx.fillText(chargeText,10,canvas.height-15);
}

function drawX(x){
    return canvas.width/2 + (x-player.x) * (canvas.width/viewWidth);
}

function drawY(y){
    return canvas.height/2 + (y-player.y) * (canvas.height/viewHeight);
}

function drawWidth(width){
    return canvas.width * (width/viewWidth); 
}

function drawHeight(height){
    return canvas.height * (height/viewHeight); 
}

function dist(a,b,x,y){
    return Math.sqrt(Math.pow(a-x,2)+Math.pow(b-y,2));
}

function insideTriangle(x,y,x1,y1,x2,y2,x3,y3)
{
    as_x = x-x1;
    as_y = y-y1;

    s_ab = (x2-x1)*as_y-(y2-y1)*as_x > 0;

    if((x3-x1)*as_y-(y3-y1)*as_x > 0 == s_ab) return false;

    if((x3-x2)*(y-y2)-(y3-y2)*(x-x2) > 0 != s_ab) return false;

    return true;
}


document.onkeydown = checkKeyDown;
function checkKeyDown(e) {
    e = e || window.event;

    if (e.keyCode == '38') {
        // up arrow
    }
    else if (e.keyCode == '40') {
        // down arrow
    }
    else if (e.keyCode == '37') {
       left = true;
    }
    else if (e.keyCode == '39') {
        right = true;
    }else if(e.keyCode == '13'){
        if(usernameEntered && !initStarted ){
            returnInTextMode();
        }
        if(textMode && !gameOver){
            enterUserName();
        }
    }
    else if(e.keyCode>=65 && e.keyCode<=90){
        if(textMode){
            printUserKey(e.keyCode);
        }
    }
    if((e.keyCode=='27'||finishedIntro) && !initStarted ){
        returnInTextMode();
    } 
}

// pressed return in teext mode to leave it
function returnInTextMode(){
        if(gameOver){
            textMode = true;
            initStarted = false;
            level = 0;
            boot();
        }else{
            textMode = false;
            initStarted = true;
            finishedIntro=true;
            init();
        }    
}


function mouseDown(e) {
    var eX = e.touches[0].clientX;
    var w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    if(eX<w/3){
        left = true;
    }
    if(eX>2*w/3){
        right = true;
    }
    if(eX>w/3 && eX<2*w/3){
        if(!textMode){
            space = true;
        }else if(finishedIntro && !initStarted){
            returnInTextMode();
        }else if(!initStarted){
            enterUserName();
        }
    }
}

function mouseUp(e){
    left = false;
    right = false;
}

// document.onmousedown = mouseDown;
// document.onmouseup = mouseUp;
canvas.addEventListener('touchstart', function(e){mouseDown(e)}, false);
canvas.addEventListener('touchend', function(e){mouseUp(e)}, false);

document.onkeyup = checkKeyUp;
function checkKeyUp(e) {
    e = e || window.event;

    if(e.keyCode == '32' && !textMode){
        // space
        console.log(textMode);
        space = true;
    }

    if (e.keyCode == '38') {
        // up arrow
    }
    else if (e.keyCode == '40') {
        // down arrow
    }
    else if (e.keyCode == '37') {
       left = false;
    }
    else if (e.keyCode == '39') {
       right = false;
    }
}


var charSpace = 15;
var lineSpace = 25;
var initX = 10;
var initY = 30;
var textX = initX;
var textY = initY;
var textColor = '#FFC968';
var textFont = '900 25px monospace';
var normalFontSpeed = 5;
var messageFontSpeed = 67;

function displayText(str,callback){
    ctx.fillStyle = textColor;
    ctx.font = textFont;
    var x = initX;
    var y = initY;
    var n = 0;
    function printNextChar(){
        if(n>=str.length || finishedIntro){
            clearInterval(cInterval);
            callback();
        }else{
            c = str[n++];
            if(c=='\n'){
                textY += lineSpace;
                textX = initX;
            }else
            {
                ctx.fillText(c,textX,textY);
                textX+=charSpace;
            }         
        }
    }
    var cInterval = setInterval(printNextChar,normalFontSpeed);    
}

function displayMsgText(str,callback){
    ctx.fillStyle = textColor;
    ctx.font=textFont;
    var n = 0;
    function printNextChar(){
        // intro skipped if finishedIntro is true
        if(n>=str.length || finishedIntro){
            clearInterval(cInterval);
            callback();
        }else{
            c = str[n++];
            if(c=='\n'){
                textY += lineSpace;
                textX = initX;
            }else if(c=='@'){
                clearInterval(cInterval);
                cInterval = setInterval(printNextChar,5);
            }else
            {
                ctx.fillText(c,textX,textY);
                textX+=charSpace;
            }         
        }
    }
    var cInterval=setInterval(printNextChar,67);
}

function printUserKey(val){
    c = String.fromCharCode(val);
    name += c;
    displayText(c,function(){});
}

function enterUserName(){
    usernameEntered=true;
    displayText('\nWELCOME '+ name+'\n\n---START OF TRANSMISSION---\n\n',function(){
        displayMsgText(msgText,function(){
            finishedIntro = true;
        });        
    });
}


var startText = 
'INCOMING TRANSMISSION.\n'+
'ENTER USER TO LOG IN:';

var msgText =
'SCOUTS,\n\n'+
'FLEET IS UNDER ATTACK BY ZAMPI STRIKE FORCE.\nDESTRUCTION IMMINENT. '+
'DO NOT RETURN.\nWE HAVE TRANSMITTED THE COORDINATES OF MAJOR ENEMY\nMILITARY BASES.'+
' YOUR FINAL MISSION IS TO WARP TO\nTHESE LOCATIONS AND DESTORY ANY STRUCTURES.\n'+
'NO HELP CAN BE PROVIDED. YOU ARE ALONE.\nEARTH IS COUNTING ON YOU.\n@\n\n---END OF TRANSMISSION---\n\nCOORDINATES LOADED.\n\nUSE RETURN TO WARP TO FIRST TARGET.\n';

var levelFinishedText='NO HOSTILES DETECTED.\n\nPREPARE TO WARP TO NEXT TARGET.\n'

function nextLevelText(){
    textX = initX;
    textY = initY;
    displayText(levelFinishedText,function(){
        shouldLoop = true;
        finishedIntro = true;
    });
}

function startTextMode(){
    initStarted = false;
    textMode = true;
    finishedIntro = false;


   ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='#976100';

    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fill();
}

function endGame(){
    gameOver=true;
    usernameEntered = false;
    textX = initX;
    textY = initY;
    startTextMode();
    displayText('IMMINENT CRASH DETECTED.\n\nTRANSFERING COMBAT DATA TO EARTH COMMAND.',function(){
        shouldLoop = true;
        finishedIntro = true;
    });
}

function boot(){
    name = '';
    gameOver = false;
    level = 0;
    textX = initX;
    textY = initY;
    startTextMode();
    displayText(startText,function(){});
}

boot();

var loopInterval;
function init(){
    music.play();
    initStarted = true;
    initLevel();
    loopInterval= setInterval(loop,10);
}