firebase.initializeApp({
    apiKey: "AIzaSyDpvmkXx5v0ENYQCxebKpbVSdDk0Z36558",
    authDomain: "isogame-643a1.firebaseapp.com",
    databaseURL: "https://isogame-643a1.firebaseio.com",
    projectId: "isogame-643a1",
    storageBucket: "isogame-643a1.appspot.com",
    messagingSenderId: "861518658200"
});

function randomShuffle(a) {
    var j, x, i;
    for (var i = 1; i < a.length; ++i) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
}

function getGraph(n) {
    var edges = [];
    for (var i = 0; i < n; ++i) {
        for (var j = i + 1; j < n; ++j) {
            edges.push({from: i, to: j});
        }
    }
    var m = Math.floor(Math.pow(n, 1.2) - 3);
    randomShuffle(edges);
    edges = edges.slice(0, m);
    edges.sort(function(a, b) {
        if ((a.from < b.from) || (a.from == b.from && a.to < b.to))
            return -1;
        return 1;
    });
    return edges;
}

function checkIsomorpismFastWithFalsePositive(g1, g2, n) {
    if (g1.length != g2.length)
        return false;
    /*for (var i = 0; i < g1.length; ++i) {
        if (!(g1[i].from == g2[i].from && g1[i].to == g2[i].to))
            return false;
    }*/

    deg1 = [];
    deg2 = [];
    for (var i = 0; i < n; ++i) {
        deg1.push(0);
        deg2.push(0);
    }
    for (var i = 0; i < g1.length; ++i) {
        deg1[g1[i].from]++;
        deg1[g1[i].to]++;
        deg2[g2[i].from]++;
        deg2[g2[i].to]++;
    }
    cmpInt = function(a, b) {
        if (a < b)
            return -1;
        if (a > b)
            return 1;
        return 0;
    }
    deg1.sort(cmpInt);
    deg2.sort(cmpInt);
    for (var i = 0; i < n; ++i) {
        if (deg1[i] != deg2[i])
            return false;
    }

    return true;
}

function getRandomCoord() {
    return Math.floor((Math.random() * 0.96 + 0.02) * 300);
}

function alignGraph(edges, n, el) {
    el.empty();
    nodes = [];
    /*for (var i = 0; i < n; ++i) {
        while (1) {
            var xc = getRandomCoord();
            var yc = getRandomCoord();
            var j;
            for (j = 0; j < nodes.length; ++j) {
                if ((nodes[j].x - xc) * (nodes[j].x - xc) + (nodes[j].y - yc) * (nodes[j].y - yc) < 30 * 30)
                    break;
            }
            if (j == nodes.length) {
                nodes.push({x: xc, y: yc});
                break;
            }
        }
    }*/
    var offset = Math.random() * Math.PI;
    for (var i = 0; i < n; ++i) {
        var phi = offset + 2.0 * Math.PI * i / n;
        var R = 120;
        nodes.push({x: 150 + Math.floor(R * Math.cos(phi)), y: 150 + Math.floor(R * Math.sin(phi))});
    }
    randomShuffle(nodes);
    for (var i = 0; i < edges.length; ++i) {
        el.append("<line x1=\"" + nodes[edges[i].from].x + "\" y1=\"" + nodes[edges[i].from].y + "\" x2=\"" + nodes[edges[i].to].x + "\" y2=\"" + nodes[edges[i].to].y + "\" class=\"graph-edge\" />");
    }
    for (var i = 0; i < nodes.length; ++i) {
        el.append("<circle cx=\"" + nodes[i].x + "\" cy=\"" + nodes[i].y + "\" r=\"5\" fill=\"#008aff\" stroke=\"#000\" stroke-width=\"1\" />");
    }
    $("#selectors").html($("#selectors").html());
    $("#graph-reference").html($("#graph-reference").html());
}

var timeout = 0;
var intervalFunID = 0;
var score = 0;
var currentN = 0;
var currentStep = 0;
var playerName = null;
var database = firebase.database();

function gameOver() {
    clearInterval(intervalFunID);
    intervalFunID = 0;
    $("#score").html(score + " — Game over! Click again to restart.");
    $(".correct").addClass("correct-show");
    $(".graph-display").unbind("click");
    $(".graph-display").click(reloadGame);
    database.ref('leaderboard').push().set({'name': playerName, 'score': score});
}

function decreaseCounter() {
    --timeout;
    $("#time").html(timeout);
    if (timeout <= 0)
        gameOver();
}

function updateGame(n) {
    edges = [getGraph(n), getGraph(n), getGraph(n)];
    var ansPerm = [0, 1, 2];
    randomShuffle(ansPerm);
    while (checkIsomorpismFastWithFalsePositive(edges[ansPerm[0]], edges[ansPerm[1]], n))
        edges[ansPerm[1]] = getGraph(n);
    while (checkIsomorpismFastWithFalsePositive(edges[ansPerm[0]], edges[ansPerm[2]], n))
        edges[ansPerm[2]] = getGraph(n);
    alignGraph(edges[0], n, $("#sel-0"));
    alignGraph(edges[1], n, $("#sel-1"));
    alignGraph(edges[2], n, $("#sel-2"));
    alignGraph(edges[ansPerm[0]], n, $("#graph-example"));
    $("#sel-0").removeClass("correct");
    $("#sel-1").removeClass("correct");
    $("#sel-2").removeClass("correct");
    $("#sel-0").removeClass("correct-show");
    $("#sel-1").removeClass("correct-show");
    $("#sel-2").removeClass("correct-show");
    $("#sel-" + ansPerm[0]).addClass("correct");
}

function onChoose() {
    clearInterval(intervalFunID);

    if ($(this).hasClass("correct")) {
        intervalFunID = setInterval(decreaseCounter, 1000);
        score += currentN * timeout;
        timeout = 5;
        ++currentStep;
        if (currentStep % 5 == 0)
            ++currentN;
        $("#time").html(timeout);
        $("#score").html(score);
        updateGame(currentN);
        $(".graph-display").unbind("click");
        $(".graph-display").click(onChoose);
    }
    else {
        gameOver();
    }
}

function startGame() {
    currentN = 5;
    currentStep = 0;
    updateGame(currentN);

    intervalFunID = setInterval(decreaseCounter, 1000);
    timeout = 5;
    score = 0;
    $("#time").html(timeout);
    $("#score").html(score);
    $(".graph-display").unbind("click");
    $(".graph-display").click(onChoose);
}

function nameEscape(name) {
    return name.replace(/[^a-zA-Z0-9 ]+/g, '').replace(/[a-zA-Z0-9]{16,}/g, '').replace(/[ ]+/g, ' ').slice(0, 32);
}

function showLeaderboard(limit) {
    database.ref('leaderboard').orderByChild('score').limitToLast(limit).once('value').then(function(snapshot) {
        $('#leaderboard table').html('');
        snapshot.forEach(function(snapshot) {
            var name = nameEscape(snapshot.val().name);
            var score = snapshot.val().score;
            score = typeof(score) == 'number' ? score : 'TBD';
            $('#leaderboard table').prepend('<tr><td>' + name + '</td><td>' + score + '</td></tr>');
        });
    });
}

function reloadGame() {
    showLeaderboard(25);
    playerName = $.cookie('isogame-name');
    if (playerName == undefined) {
        while (1) {
            playerName = prompt("Please enter your name", "Guest on " + navigator.platform);
            if (playerName != null)
                break;
        }
        playerName = nameEscape(playerName);
        $.cookie('isogame-name', playerName, { expires: 7, path: '/' });
    }
    startGame();
}

$(reloadGame);
