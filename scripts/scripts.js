var nutritionLabel = {};

nutritionLabel.apiKey = 'lTtQbMlAOHR8LyJlB6yDqXPcEgMymnvpW9yyyEyH';

nutritionLabel.data = { macros: {}, minerals: {}, vitamins: {}, lipids: {}, aminoAcids: {}, other: {} };

/* Initialize the functions that need to be ready on start, 
so far it's just event handlers because everything is triggered because by user input
*/

nutritionLabel.init = function() {
	nutritionLabel.eventHandlers();
}

nutritionLabel.eventHandlers = function() {

	// stores the users input data(query string, branded vs. generic and food group)
	// Passes that data to searchforFood which does the first Ajax request
	$('#usersFoodChoice').on('submit', function(e) {
		e.preventDefault();
		let usersQuery = $('.usersFoodChoice').val();
		let usersPreference = $('input[name="userPreference"]:checked').val();
		let usersFoodGroup = $('#foodGroups option:selected').data('fg');
		console.log(usersQuery, usersPreference, usersFoodGroup);
		nutritionLabel.searchForFood(usersQuery, usersPreference, usersFoodGroup);
		$('body').animate({scrollTop: window.pageYOffset + $(window).height()}, 300);
	});
	// When the user selects an option from the drop down menu pass the 
	// ndbno to the second ajax request for detailed nutritional data
	$('#foodOptions').on('change', function() {
		$('.dataDisplay').empty();
		let usersChoice = $('#foodOptions option:selected').data('ndbno');
		console.log(usersChoice);
		nutritionLabel.getNutrientData(usersChoice);
		$('body').animate({scrollTop: window.pageYOffset + $(window).height()}, 300);
	});

	$('.viewBasic').on('click', function() {
		$('.dataDisplay').empty();
		nutritionLabel.displayGroup('macros');
	});

	$('.viewMinerals').on('click', function() {
		$('.dataDisplay').empty();
		nutritionLabel.displayGroup('minerals');
	});

	$('.viewVitamins').on('click', function() {
		$('.dataDisplay').empty();
		nutritionLabel.displayGroup('vitamins');
	});

	$('.viewLipids').on('click', function() {
		$('.dataDisplay').empty();
		nutritionLabel.displayGroup('lipids');
	});

	$('.viewAminoAcids').on('click', function() {
		$('.dataDisplay').empty();
		nutritionLabel.displayGroup('aminoAcids');
	});

	$('.viewOther').on('click', function() {
		$('.dataDisplay').empty();
		nutritionLabel.displayGroup('other');
	});

}

// the ajax request for a list of foods, takes three user inputs to return potential foods
nutritionLabel.searchForFood = function(query, preference, foodGroup) {

	$.ajax({
		url: 'https://api.nal.usda.gov/ndb/search/',
		type:'GET',
		datatype: 'jsonp',
		data: {
			format: 'JSON',
			api_key: nutritionLabel.apiKey,
			sort: 'r',
			q: query,
			ds: preference,
			fg: foodGroup,
			max: 50,
			offset: 0
		}
		// Populates the options in a select element with potential food choices, 
		// their value is their corresponding ndbno
	}).then(function(result) {

		if  (result.list !== undefined && result.errors === undefined) {

			$('.errorBox').html('');
			$('#foodOptions').html('');
			$('input[type="radio"]').prop('checked', false);
			let dummyOption = $('<option>').text('Select an option below');
			$('#foodOptions').append(dummyOption);

			result.list.item.forEach(function(foodOption) {
				let potentialFood = $(`<option>`).text(foodOption.name).data('ndbno', foodOption.ndbno);
				$('#foodOptions').append(potentialFood);
			});
		}
		else if (result.list === undefined && result.errors !== undefined) {

			$('.errorBox').html('');
			let errorMessage = $('<h4>').text(result.errors.error[0].message)
			$('.errorBox').append(errorMessage);
		} 
	});
};

// The seconds ajax request takes the ndbno from the selected option and returns nutrient data
nutritionLabel.getNutrientData = function(userNDBNO) {

	$.ajax({
		url: 'https://api.nal.usda.gov/ndb/reports/',
		type: 'GET',
		datatype: 'jsonp',
		data: {
			api_key: nutritionLabel.apiKey,
			ndbno: userNDBNO,
			type: 's',
			format: 'JSON'
		}
		// stores the data on the big object and passes it to the parseData function
	}).then (function(result) {
		var nutritionData = result.report.food;
		nutritionLabel.rawData = nutritionData;
		nutritionLabel.parseData();
		console.log(nutritionData);
	});
}

// Goes through the sourcedata and reorganizes it into categories
nutritionLabel.parseData = function() {

	nutritionLabel.data = { macros: {}, minerals: {}, vitamins: {}, lipids: {}, aminoAcids: {}, other: {} };

	var sourceData = nutritionLabel.rawData.nutrients;
	
	for (var key in sourceData) {

		if (sourceData[key].group === "Proximates") {
			nutritionLabel.data.macros[`${sourceData[key].nutrient_id}`] = {
				name: sourceData[key].name,
				value: sourceData[key].value,
				unit: sourceData[key].unit
			}
		}

		else if (sourceData[key].group === "Minerals") {
			nutritionLabel.data.minerals[`${sourceData[key].nutrient_id}`] = {
				name: sourceData[key].name,
				value: sourceData[key].value,
				unit: sourceData[key].unit
			}
		} 

		else if (sourceData[key].group === "Vitamins") {
			nutritionLabel.data.vitamins[`${sourceData[key].nutrient_id}`] = {
				name: sourceData[key].name,
				value: sourceData[key].value,
				unit: sourceData[key].unit
			}
		}

		else if (sourceData[key].group === "Lipids") {
			nutritionLabel.data.lipids[`${sourceData[key].nutrient_id}`] = {
				name: sourceData[key].name,
				value: sourceData[key].value,
				unit: sourceData[key].unit
			}
		}

		else if (sourceData[key].group === "Amino Acids") {
			nutritionLabel.data.aminoAcids[`${sourceData[key].nutrient_id}`] = {
				name: sourceData[key].name,
				value: sourceData[key].value,
				unit: sourceData[key].unit
			}
		}

		else if (sourceData[key].group === "Other") {
			nutritionLabel.data.other[`${sourceData[key].nutrient_id}`] = {
				name: sourceData[key].name,
				value: sourceData[key].value,
				unit: sourceData[key].unit
			}
		}
	}
	console.log(nutritionLabel.data);
	nutritionLabel.displayGroup('macros');
}



nutritionLabel.displayGroup = function(group) {

	for (let key in nutritionLabel.data[group]) {

		let displayItem = $('<p>').addClass('displayItem');
		let value = nutritionLabel.data[group][key].value;
		let unit = nutritionLabel.data[group][key].unit;
		let name = nutritionLabel.data[group][key].name;

		if (value !== '0.000' && value !== '0.00' && value !== '0.0' && value !== '0'  && name !='Ash') {
			displayItem.text(`${name} : ${value} ${unit}`);
			$('.dataDisplay').append(displayItem);
		}
	}
}

// once the page is loaded run the initialize function
$(document).ready(function() {
	nutritionLabel.init();
}); 