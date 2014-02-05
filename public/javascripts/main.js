$(document).ready(function() {

  $('#leftColumn').height($(document).height());

  // Automatically log the user in if the login cookie is present
  if ($.cookie('myData') !== undefined) {
    var data = $.param(JSON.parse($.cookie('myData')));

    makeAjaxRequest('/cookieLogin', data, function (res) {
      loginRoutine(res);
    });
  }

  $("form#login").on("submit", function(event) {
    event.preventDefault();

    if (nullFieldsCheck($(this))) {
      var data = $(this).serialize();
      makeAjaxRequest('/login', data, function (res) {
        loginRoutine(res);
      });
    } else {
      displayError("Warning! No fields may be left blank");
    }

  });

  $("form#signUp").on("submit", function(event) {
    event.preventDefault();

    if (nullFieldsCheck($(this))) {
      var data = $(this).serialize();
      makeAjaxRequest('/signUp', data, function (res) {
        loginRoutine(res);
      });
    } else {
      displayError("Warning! No fields may be left blank");
    }
  });

  $("form#statusUpdate").on("submit", function(event) {
    event.preventDefault();

    if (nullFieldsCheck($(this))) {
      var data = $(this).serialize();

      makeAjaxRequest('/statusUpdate', data, function (res) {
        var res = JSON.parse(res);

        $('.noNews').parent().empty();
        $('#wall').append('<div class="wallItem"><p><b>Me: </b>' + res.body.body + '</p></div>');
      });
    } else {
      displayError("Warning! Status update cannot be null");
    }
  });

  $('#logOut').on("click", function(event) {
    event.preventDefault();
    $.removeCookie('authToken');
    $('#innerPages').hide();
    $('#splashPage').show();
  });

  $('#viewDirectory').on("click", function(event) {
    event.preventDefault();

    $("#newsItems").hide();
    $("#directoryItems").show();
    $("#profilePage").hide();
    $('#friendProfile').hide();

  });

  $('.viewMyProfile').on("click", function(event) {
    event.preventDefault();

    var data = {'user_id': $(this).attr('href').split('/')[2]};
    var currentId = JSON.parse($.cookie('myData')).id;

    makeAjaxRequest('/friendsPage', data, function (res) {
      var res = JSON.parse(res);
      $('#wall').empty();
      
      if (res.body.news.length > 0) {
        for (var i = 0; i < res.body.news.length; i++) {
          if (res.body.news[i].user_id === currentId) {
            $('#wall').append('<div class="wallItem"><p><b>Me: </b>' + res.body.news[i].body + '</p></div>');
          } else {
            $('#wall').append('<div class="wallItem"><p><b>' + res.body.news[i].firstName + ' ' + res.body.news[i].lastName + ': </b>' + res.body.news[i].body + '</p></div>');
          }
        }        
      } else {
        $('#wall').append('<div class="wallItem noNews"><p>No news</p></div>');
      }

      $("#newsItems").hide();
      $("#directoryItems").hide();
      $("#profilePage").show();
      $('#friendProfile').hide();
    });
  });

  $('.viewNewsFeed').on("click", function(event) {
    event.preventDefault();

    makeAjaxRequest('/viewNews', null, function (res) {
      var res = JSON.parse(res);
      fillNewsFeed(res.body.news);
      $("#newsItems").show();
      $("#directoryItems").hide();
      $("#profilePage").hide();
      $('#friendProfile').hide();
    });

  });

  $('.friendMe').on("click", function(event) {
    event.preventDefault();
    var data = {'friend_one': JSON.parse($.cookie('myData')).id, 'friend_two': $(this).attr('href').split('/')[2]};

    makeAjaxRequest('/createFriendship', data, function (res) {
      var res = JSON.parse(res);
      if (res.statusCode === 200) {
        displayNotification("Friendship pending!");
      } else if (res.statusCode === 404) {
        displayError(res.message);
      } else if (res.statusCode === 500) {
        displayError(res.message);
      }
    });
  });

  $(document).on('click', '.viewFriendProfile', function(event) {
    event.preventDefault();

    var data = {'user_id': $(this).attr('href').split('/')[2]};
    makeAjaxRequest('/friendsPage', data, function (res) {
      
      var res = JSON.parse(res);
      var fullName = res.body.user.firstName + " " + res.body.user.lastName;
      $('#friendName').text(fullName);
      $('.friendMe').attr('href', '/users/' + res.body.user.id);

      $('.friendWall').empty();
      if (res.body.news.length > 0) {
        for (var i = 0; i < res.body.news.length; i++) {
          $('.friendWall').append('<div class="wallItem"><p><b>' + res.body.news[i].firstName + " " + res.body.news[i].lastName + ':</b> ' + res.body.news[i].body + '</p></div>');
        }        
      } else {
        $('.friendWall').append('<div class="wallItem"><p>No news</p></div>');
      }

      $("#newsItems").hide();
      $("#directoryItems").hide();
      $("#profilePage").hide();
      $('#friendProfile').show();

    });

  });
});

function displayError (text) {
  $("#errors").show();
  $('#errors p.alert').text(text);
  $("#errors").fadeOut(2500);
}

function displayNotification (text) {
  
  $("#notifications").show();
  $('#notifications p.alert').text(text);
  $("#notifications").fadeOut(2500);
}

function nullFieldsCheck(formObject) {
  var serializedForm = $(formObject).serializeArray();
  var validity = true;
  for (var i = 0; i < serializedForm.length; i++) {
    if (serializedForm[i]['value'] === "") {
      validity = false;
    }
  }
  return validity;
}

function fillNewsFeed(news) {
  $('#newsWrapper').empty();

  for (var i = 0; i < news.length; i++) {
    $('#newsWrapper').append('<div class="newsItem"><p><b>' + news[i].firstName + ' ' + news[i].lastName + ':</b> ' + news[i].body + '</p></div>');
  }
}

function fillDirectory(users) {
  $('#directoryWrapper').empty();

  var currentId = JSON.parse($.cookie('myData')).id;
  for (var i = 0; i < users.length; i++) {
    if (currentId !== users[i].id) {
      $('#directoryWrapper').append('<div class="directoryItem"><p><a href="/users/' + users[i].id + '" class="viewFriendProfile">' + users[i].firstName + " " + users[i].lastName + '</a></p></div>');  
    }
  }
}

function fillLeftBar(myData) {
  $('input.user_id').val(myData.id);
  $('.heavy.viewMyProfile').text(myData.firstName + " " + myData.lastName);
  $('.heavy.viewMyProfile').attr('href', '/users/' + myData.id);
  $('.viewMyProfile.link').attr('href', '/users/' + myData.id);
}

function makeAjaxRequest (url, data, callback) {
  request = $.ajax({
    url: url,
    type: "post",
    data: data
  });

  request.done(function (response, textStatus, jqXHR) {
    callback(response);
  });

  request.fail(function (jqXHR, textStatus, errorThrown) {
    displayError("The following error occured: " + textStatus + " " + errorThrown);
  });
}

function loginRoutine (res) {
  var res = JSON.parse(res);
  if (res.statusCode === 200) {
    $.cookie('myData', JSON.stringify(res.body.myData));
    fillLeftBar(res.body.myData);
    fillNewsFeed(res.body.news);
    fillDirectory(res.body.users);

    $('#splashPage').hide();
    $('#innerPages').show();
    $("#newsItems").show();
    $("#directoryItems").hide();
    $("#profilePage").hide();
    $('#friendProfile').hide();
  } else {
    displayError(res.message);    
  }
}