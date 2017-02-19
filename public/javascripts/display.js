function launchGetFavoritersInfos(fileContainingData, minReapparition) {

    console.log("fileContainingData : "+ fileContainingData);

    $.ajax({
    url: "/calculation/analyse-data",
    data: {
        filename: fileContainingData,
        minReapparition: minReapparition
    },
    success: function( result ) {
        console.log(result.ranking);

        var listDisplay = "";
        for(var i = 0; i<result.ranking.length; i++) {
            favoriter = result.ranking[i];
            listDisplay += "<span id='"+favoriter[0]+"' style='margin:5px; max-width:100ox; float:left'></span> ";
            getFavoriterInfos(favoriter[0], favoriter[1]);
        }

        $( "#ranking" ).html(listDisplay);
    }
    });
}

function getFavoriterInfos(userId, nbReapparition) {

    $.ajax({
    url: "/calculation/get-infos-favoriter",
    data: {
        userId: userId
    },
    success: function( result ) {
        console.log(result);

        var listDisplay = "";
        listDisplay += "<img src='"+result.avatar_url+"'/> ";
        listDisplay += "<a href='"+result.permalink_url+"'>"+result.username+"</a> ";
        listDisplay += "("+result.permalink+") ";
        listDisplay += "<b>"+nbReapparition+"</b>";

        $("#"+userId).html(listDisplay);
    }
    });
}