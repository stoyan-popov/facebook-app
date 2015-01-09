$(document).ready(function() {
	$('#loading, #limit-alert, #no-friends-alert, #permission-alert, #login-alert').hide();
	friendsRequest();
	addIDs();
	shareWithFriends();
	copyText();
	disableButton();
	$('#search').hideseek({
		ignore: '#loading'
	});
});

var friendsIDarray = [];
var user_friend_list;

//Facebook Login Dialog call and permission requests 
function friendsRequest() {
	$('#tag-friends').click(function(e) {
		e.stopPropagation();
		$(this).prop('disabled', true)
		$('.results .name').remove();
		$("#loading").show();
		FB.getLoginStatus(function(response) {
		  if (response.status === 'connected') {
		    console.log('Logged in.');
		    $('#modal').modal('show');
		  	getTaggableFriends();
		  }
		  else {
		    FB.login(function(response){
		    	 if (response.authResponse)
			      {
			        $('#modal').modal('show');
		  			getTaggableFriends();
			      } 
			      else
			      {
			        console.log(response);
			        $('#login-alert').addClass("fadeInDown").show();
			      }
		    }, {scope: 'user_friends'})
		  }
		});
	});
}

//Calls for the users tagable friends and appends them to the DOM
function getTaggableFriends() {
	FB.api(
	    "/me/taggable_friends",
	    function (response) {
	      if (response && !response.error) {
	        console.log(response);
	        for (var i = 0; i < response.data.length; i++) {
				var data = response.data;
				var names = showList(data[i]);
				$("#loading").hide();
				$('.results').append(names);
	        };
	        onMessageText();
	        selectFriend();
	        selectNone();
	        $('#tag-friends').prop('disabled', false);
	      }
	    }
	);
}

//Takes friends that are checked and adds them to friendsIDArray
function addIDs() {
	$('input[type=checkbox]').each(function() {
		 if ($(this).is(':checked')) {
            friendsIDarray.push($(this).val());
			}
	})
};

//Takes data, parses it and assigns it to the right DOM elements.  
function showList(data) {
	var result = $('.names .name').clone();
	
	//adds friends name
	var newName = result.find('.checkbox-inline');
	newName.text(data.name);

	//adds friends image
	var newImage = result.find('.image');
	newImage.attr('src', data.picture.data.url)

	//adds friends token
	result.find('input').val(data.id);
	return result;
}

//Takes friends tokens and returns them in the correct format for the message
function getIDs(data) {
	var result = ""
	for (var i = 0; i < friendsIDarray.length; i++) {
		var newID = " @[" + friendsIDarray[i] + "]"
		result = result + newID
	}
	return result;
}

var successful_shares_count = 0,
	total_number_of_shares = 0;

function track_progress(fb_response) {
	total_number_of_shares++;
	
	if (!fb_response.error) {
    	successful_shares_count++;
    } 

	if (total_number_of_shares == friendsIDarray.length) {		
		//Last friend is processed
		if (successful_shares_count > 0) {
			$('#share-page').prop('disabled', true).removeClass("btn-primary").addClass("btn-default").text("Page shared with " + successful_shares_count + " friends");
		} else {
			$('#permission-alert').addClass("fadeInDown").show();
	    	$('#share-page').text('Share with friends').prop('disabled', false);
		}
	}
}

//Generates FB post with tagged friends an message. 
function shareWithFriends() {
	$('#share-page').click(function(e) {
		e.stopPropagation();
		$('#share-page').text("Sharing page...")
		addIDs();
		var message = getMessage(),
		url = window.location.href;

		//Request public permissions
		FB.login(function(response){
			console.log(response);
			if (response.authResponse) {
				
				$('#share-page').prop('disabled', true).removeClass("btn-primary").addClass("btn-default").text("Sending ...");
				
		      	//Post to Facebook	
				for (var i = 0; i < friendsIDarray.length; i++) {
			        FB.api(
					  'me/testappavaaz_:sign',
					  'post',
					  {
					  	campaign: url,
					  	message: message + " @[" + friendsIDarray[i] + "]",	  	
					  },	
					  function(response) {
						  console.log(response);
						  track_progress(response);    
					});	
				}			
		      } else {
		        console.log(response);
		      }
		}, {scope: 'publish_actions'})
			
	});
}

//Returns value of message box 
function getMessage() {
	var message = $('#message-box').val();
	console.log(message);
	return message;
}

//Copies text into message box
function copyText() {
	$('#copy-text').click(function(e){
		e.stopPropagation();
		var cnt = $("input[type='checkbox']:checked").length;
		var text = $('#text').text()
		var currentText = $('#message-box').val();
		$('#message-box').val(currentText + " " + text);
		$('#copy').hide();
		$('#message-box').addClass("increaseSize");
		$('#friend-cnt').text(cnt);
		if (cnt == 1) {
			$('#share-page').prop('disabled', false).removeClass("btn-default").addClass("btn-primary");
			$('#friends-word').text("friend");
		}
		else if (cnt > 1) {
			$('#share-page').prop('disabled', false).removeClass("btn-default").addClass("btn-primary");
			$('#friends-word').text("friends");
		}
	})
	
}

function onMessageText() {
	$('#message-box').change(function() {
		var messageText = $('#message-box').val();
		var cnt = $("input[type='checkbox']:checked").length;
		if (messageText == "") {
			$('#share-page').prop('disabled', true).removeClass("btn-primary").addClass("btn-default");
			$('#friend-cnt').text(cnt);
			$('#friends-word').text("friends");
		}
		else if (messageText !== "" && cnt == 1) {
			$('#share-page').prop('disabled', false).removeClass("btn-default").addClass("btn-primary");
			$('#friends-word').text("friend");
		}
		else if (messageText !== "" && cnt > 1) {
			$('#share-page').prop('disabled', false).removeClass("btn-default").addClass("btn-primary");
			$('#friends-word').text("friends");
		}
	});
}

function disableButton() {
	var cnt = $("input[type='checkbox']:checked").length;
	var messageText = $('#message-box').val();
	if (cnt == 0) {
		$('#share-page').prop('disabled', true).removeClass("btn-primary").addClass("btn-default");
	}
}


function selectFriend() {

	//On friend div click 
	$('.friend').click(function(e) {
		e.preventDefault();
		$(this).toggleClass("checked");

		var hasClass = $(this).hasClass("checked");

		//Change checked prop
		if (hasClass) {
			$(this).find("input[type='checkbox']").prop("checked", true);
		}
		else {
			$(this).find("input[type='checkbox']").prop("checked", false);
		}

		//variables used

		var maxAllowed = 10;
		var cnt = $("input[type='checkbox']:checked").length;
		var messageText = $('#message-box').val();

		$('#friend-cnt').text(cnt);

		//button changes
		if (cnt > maxAllowed) {
	        $(this).find("input[type='checkbox']").prop("checked", "");
			$(this).toggleClass("checked");	       
	        $('#limit-alert').addClass("fadeInDown").show();
		}
		else if (cnt == 0 || messageText == "") {
			$('#share-page').prop('disabled', true).removeClass("btn-primary").addClass("btn-default");
			$('#friends-word').text("friends");

		}	    
		else if (cnt == 1) {
			$('#share-page').prop('disabled', false).removeClass("btn-default").addClass("btn-primary");
			$('#friends-word').text("friend");	
		}
		else if (cnt > 1) {
			$('#share-page').prop('disabled', false).removeClass("btn-default").addClass("btn-primary");
			$('#friends-word').text("friends");	
		}
	});

}

function selectNone() {
	$('#none').click(function(e) {
		e.preventDefault();
		$("input[type='checkbox']:checked").prop("checked", false).parent().removeClass("checked");
	})
}



