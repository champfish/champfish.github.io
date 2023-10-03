function poll(msg){
    f.echo("[[guib;red;<BACKGROUND>]"+msg+"]");
    f.push(function(command){
        f.pop();
        return command;
    });
}

$('body').terminal({
    iam: function (name) {
        this.echo('Hello, ' + name +
            '. Welcome to GeeksForGeeks');
    },
    founder: function () {
        this.echo('Sandeep Jain');
    },
    help: function () {
        this.echo('iam - iam command and '
        + 'pass your name as argument\n'
        + 'founder to know the founder');
    },
}, {
    greetings: 'GeeksForGeeks - A place to'
        + ' learn DS, Algo and Computer '
        + 'Science for free'
});