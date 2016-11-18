$(document).ready(function(){
/********** range slider for post-request page *********/
	$( function() {
		$( "#slider_range_amount" ).slider({
			range: true,
			min: 32,
			max: 526,
			values: [ 32, 526 ],
			slide: function( event, ui ) {
				$( "#pr_amount" ).val( "$" + ui.values[ 0 ] + " - $" + ui.values[ 1 ] );
			}
		});
		$( "#pr_amount" ).val( "$" + $( "#slider_range_amount" ).slider( "values", 0 ) + " - $" + $( "#slider_range_amount" ).slider( "values", 1 ) );

		$( "#slider_range_review" ).slider({
			range: true,
			min: 0,
			max: 290,
			values: [ 0, 290 ],
			slide: function( event, ui ) {
				$( "#pr_review" ).val( ui.values[ 0 ] + " - " + ui.values[ 1 ] + " reviews");
			}
		});
		$( "#pr_review" ).val($( "#slider_range_review" ).slider( "values", 0 ) + " - " + $( "#slider_range_review" ).slider( "values", 1 ) + " reviews");

		$( "#slider_range_rating" ).slider({
			range: true,
			min: 0,
			max: 5,
			values: [ 0, 5 ],
			slide: function( event, ui ) {
				$( "#pr_rating" ).val( ui.values[ 0 ] + " - " + ui.values[ 1 ] + " stars");
			}
		});
		$( "#pr_rating" ).val($( "#slider_range_rating" ).slider( "values", 0 ) + " - " + $( "#slider_range_rating" ).slider( "values", 1 ) + " stars");

		$( "#slider_range_complete" ).slider({
			range: true,
			min: 0,
			max: 12,
			values: [ 0, 12 ],
			slide: function( event, ui ) {
				$( "#pr_complete" ).val( ui.values[ 0 ] + " - " + ui.values[ 1 ] + " days");
			}
		});
		$( "#pr_complete" ).val($( "#slider_range_complete" ).slider( "values", 0 ) + " - " + $( "#slider_range_complete" ).slider( "values", 1 ) + " days");

		$( "#slider_range_milestone" ).slider({
			range: true,
			min: 32,
			max: 526,
			values: [ 32, 526 ],
			slide: function( event, ui ) {
				$( "#pr_milestone" ).val( "$" + ui.values[ 0 ] + " - $" + ui.values[ 1 ] );
			}
		});
		$( "#pr_milestone" ).val( "$" + $( "#slider_range_milestone" ).slider( "values", 0 ) + " - $" + $( "#slider_range_milestone" ).slider( "values", 1 ) );
		
	} );
/********** end range slider for post-request page *********/

	
});