pause = false;
name = "";

firstNames = [];
lastNames = [];
money = 0;
income = 0;
expense = 0;
net = 0;
day = 0;

var f=$('#console').terminal();

$(document).keyup(function(e) {
     if (e.key === "Escape") {
        pause = !pause;
    }
});

function init(){
    money = 1000000;
    $.get("first-names.txt", function(data){
        firstNames = data.split(/\r?\n/);
    });

    $.get("names.txt", function(data){
        lastNames = data.split(/\r?\n/);
    });

    f.push(
    function(command, term) {
        num = Number(command);
        if(Number.isInteger(num)){
            option = num;
        }
    }, {
        greetings: 'GeeksForGeeks - A place to'
            + ' learn DS, Algo and Computer '
            + 'Science for free',
        history: true
    });
}


dayUpdated = false;
option = -1;
optionStage=0;
pollInput = '';
pollStage = 0; // 0 is inactive, 1 is waiting on user input, 2 is waiting to process
wait = false;
state = 'name';
lastState = 'null';

function poll(msg){
    f.echo("[[b;;]"+msg+"]");
    pollStage = 1;
    f.push(function(command){
        pollInput = command;
        pollStage = 2;
        f.pop();
    });
}

function w(msg){
    f.echo(msg);
}

function rand(mean, std) {
    let u = 0, v = 0;
    while(u === 0) u = Math.random() //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random()
    let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v )
      
    num = num / 10.0 // Translate to -0.5 -> 0.5 
      
    skew = 1;
    num = Math.pow(num, skew) // Skew
    num *= 10 * std // Stretch to fill range
    num += mean // offset to mean
    return num
}
profs = [];
potProfs = [];

function generateProf(){
    prof = {};
    prof.firstName = firstNames[Math.floor(Math.random()*firstNames.length)];
    prof.lastName = lastNames[Math.floor(Math.random()*firstNames.length)];
    prof.salary = rand(75000,20000);
    prof.teach = Math.random();
    return prof;
}


init();
lastTime = Date.now();
const startDate = new Date(1969,8,1);
setInterval(gameLoop, 16);

function gameLoop() {
    time = Date.now();
    if(time-lastTime>1000 && !pause){
        day = day + 1;
        dayUpdated = false;
        lastTime = time;
    }

    if(!dayUpdated){
        dayUpdated = true;
        if(day%30==0){
            potProfs = [];
            for(i=0; i<3; i++){
                potProfs.push(generateProf());
            }
        }
    }

    expense = 0;
    for(i=0; i<profs.length;i++){
        expense += profs[i].salary;
    }

    if(state != lastState){
        wait = false;
        option = -1;
    }else{
        wait = true;
    }
    lastState = state;

    switch(state){
        case 'name':
        if(pollStage == 0){
            poll("What should the name of your university be?");
        }else if (pollStage == 2){
            name = pollInput;
            pollStage = 0;
            state = 'main';
        }
        break;

        case 'main':
        if(!wait){
            w("1. Professors");
            w("2. Change Name");          
        }
        switch(option){
            case 1:
            state = 'hire';
            break;
            case 2:
            state = 'name';
            break;
        }
        break;

        case 'hire':
        if(!wait){
            w("1. Back");
            for(i=0; i < potProfs.length; i++){
                name = (potProfs[i].firstName+" "+potProfs[i].lastName).padEnd(16);
                w((i+2)+". "+ name+" Teaching Skill: "+potProfs[i].teach.toFixed(3)+" Salary: $"+Math.round(potProfs[i].salary));
            }
        }
        switch(option){
            case 1:
            state = 'main';
            break;
            default:
            if(option>0 && option-2<potProfs.length){
                profs.push(potProfs[option-2]);
                potProfs.splice(option-2,1);
                lastState="null";
            }
        }
        break;  
    }

    $("#name").text(name);
    $("#money").text("Funds:".padEnd(10)+'$'+Math.round(money));
    $("#income").text("Income:".padEnd(10)+'$'+Math.round(income));
    $("#expense").text("Expenses:".padEnd(10)+'$'+Math.round(expense));
    var date = new Date(startDate.getTime());
    date.setDate(day+1);
    $("#day").text(date.toDateString());
}

