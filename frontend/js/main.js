function greeting() {
    var greetings = ["Good Morning, What Will Your Day Look Like?", "Feeling Tired? Don't Stop Now.", "Today Is A New Chance, Use It."];
    greeting = greetings[Math.floor(Math.random() * greetings.length)];
    return greeting;
}

function time() {
    var d = new Date();
    var weekday = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    var month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    var date = [3];
    date[0] = weekday[d.getDay()-1];
    date[1] = d.getDate() + " " + month[d.getMonth()];
    date[2] = d.getFullYear();

    return date;
}

$(function(){
    $(".greeting").html(greeting());
    $(".date").html(time().join(", "));
});


