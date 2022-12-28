	$('#contact-form').submit(function( event ) {
		event.preventDefault();
		var datastring = $("#contact-form").serialize();
		$.ajax({
			type: "POST",
			url: "../contact.php",
			data: datastring,
			success: function(data) {
                if( data == 'true')
                {
                    $('#contact-form-success').show();
                }else
                {
                    $('#contact-form-error').show();
                }
				
			}
		});
	});
