// Let's wait for the DOM to complete loading before we try to run any DOM-related JavaScript on it
// this will also allow us to set variables without bleeding into the "global" scope
window.addEventListener('DOMContentLoaded', function() {

  // Save the form element to a variable for later use
  // If we had multiple forms on the page, we could be using CSS classes with `document.querySelector()` instead
  var formEl = document.getElementById('search-form');
  var searchInputEl = document.getElementById('search-form-input');
  var searchResultsEl = document.getElementById('search-results');
  var itemDetailsEl = document.getElementById('item-detail');
  var favoritesEl = document.getElementById('favorites');
  var favoritesListEl = document.getElementById('favorites-list');

  // We will store our favorite movies under a variable so we can cache them, reducing the number of requests we have to make
  var FavoriteMovies = [];

  // A common practice for start-up code is to create an initialization function
  // In this app we call it right away, but in other apps you might want to call it at a different time, such as after a user authenticates
  initialize();

  // Initialization code to be run when we want to start our app
  // This code will pull our favorites from the server and automatically focus the input box for us
  function initialize() {
    getFavoriteMovies();
    searchInputEl.focus();
  }
  
  // Add an event listener for any form submission
  formEl.addEventListener('submit', function(event) {
    // We'll prevent the default form action so we aren't redirected to a new page
    // `event` is taken in our arguments of the function
    // you will often see this written as `e` for abbreviation
    event.preventDefault();
    
    // Since we added HTML5 `required` validation, we don't need to run validation manually
    // This means we can skip checking if the field is empty, but if we wanted to run additional validation we could do so here

    // We can pass along the value the user input by using the `value` property of the element
    getSearchResults(searchInputEl.value);
  });
  
  // Function for getting search results from a specific term
  function getSearchResults(term) {
    // `fetch` is used to make AJAX requests to receive data from other servers on the web
    // We're generating our search URL which would end up similar to "http://www.omdbapi.com/?type=movie&s=Frozen"
    fetch('http://www.omdbapi.com/?type=movie&s=' + term)
      // First we must format the response so we can work with it
      .then(function(response) {
        return response.json();
      })
      // Then we're ready to play with it!
      .then(function(responseData) {
        // A great way to see how the response data is formatted is to use a `console.log()` statement
        // APIs will return the data on varying property names
        // Try opening the developer console in Chrome and inspecting the result by clicking down arrows on various data objects
        console.log('responseData', responseData)
        
        // This response has all of its results on a `Search` property
        var results = responseData.Search;
        
        renderResults(results);
      });
  }
  
  // Render our results to the page
  // By breaking our code out into separate functions, we can easily reuse and test it
  function renderResults(results) {
    // Our `results` will be an array, allowing us to use `.map()`
    // `map()` will run a callback for each item, and return the result as an item into a new array
    // We can work with the current result by taking in the argument `result` within our callback function
    var htmlOutput = results.map(function(result) {
      // Templating in JavaScript can get messy. An easy way to deal with it is to write it in your HTML, then load it into JS with `document.getElementById()` and working with its `innerHTML`
      var template = document.getElementById('search-result-template').innerHTML;
      
      // An easy way to replace the value placeholders is to use `.replace()` on our template string
      // This allows us to easily modify our HTML template without having to change our JavaScript code
      // also making it much easier to read
      return template.replace('{title}', result.Title)
                     .replace('{year}', result.Year)
                     .replace('{imdbID}', result.imdbID)
                     .replace('{posterUrl}', result.Poster === 'N/A' ? 'https://goo.gl/Vz99Lf' : result.Poster);
                     // ^ above is a "ternary operator", a shorthand "if else" statement for inline use
                     // We're using it to replace "N/A" images with a default "Not Available" image
    });
    
    // Finally, let's output our HTML to the search results element
    // `searchResultsEl` is our variable we stored the element in earlier in the script
    // `.join()` is a function on arrays that will join all items into one string with the delimiter you pass
    // in this case, we don't need anything between it so we will pass an empty string
    searchResultsEl.innerHTML = htmlOutput.join('');

    // Let's also clear out any movie details in case they linger
    itemDetailsEl.innerHTML = '';
  }

  // We need to listen for clicks on all search results so we can show their details
  // In order to do this, we need to use Event Delegation
  // Event Delegation allows us to listen for events that will happen on elements that aren't currently on the page
  // otherwise when we add new elements, they won't have listeners attached to them
  searchResultsEl.addEventListener('click', function(event) {
    // Just like before, we will cancel our click event since we are loading the details into this page and not redirecting
    event.preventDefault();
    
    // We're going to store a reference to the delegate target to test against later
    var delegateTarget = event.currentTarget;
    // And store the target we are going to be testing
    var target = event.target;
    
    // Now let's check to see if what we clicked on was actually the element we want to match
    // We'll be going up the DOM to see if what we clicked is a child element of the target we want
    // Since the events bubble up, we could have clicked a <span>, <strong> or similar inside the target element
    while (delegateTarget !== target) {
      // If the element we're testing matches our selector, then we want to trigger our action
      if (target.matches('.search-results-item')) {
        // We can grab the data from our element using the `getAttribute()` function
        getItemDetails(target.getAttribute('data-imdbID'));
        // Make sure to return after we've found a match or we will continue searching for a match and hang
        return;
      }
      // Otherwise, set our target to the parent to continue up the DOM
      else {
        target = target.parentNode;
      }
    }
    
    // If we've reached down here, we didn't find any matches and can simply ignore
  });
  
  // Get details for a specific movie
  function getItemDetails(imdbID) {
    // Using an imdbID we can get the exact item we want
    fetch('http://www.omdbapi.com/?i=' + imdbID)
      .then(function(response) {
        return response.json();
      })
      .then(function(responseData) {
        // Again, inspecting the result to see what properties are available
        console.log('responseData', responseData)

        // This response has all of its properties directly on the object, so let's just pass that
        renderItemDetails(responseData);
      });
  }
  
  // Rendering movie details onto the page
  // You may have noticed how we name our functions with specific actions: "getXXX", "renderXXX"
  // This is to ensure we can easily understand what this code does without deciphering it
  // Functions should serve a single purpose. If you're mixing getting and rendering into the same function, you might be doing too much
  function renderItemDetails(result) {
    var template = document.getElementById('item-detail-template').innerHTML;

    // Using our placeholder replacement technique, we can easily modify our HTML to include more or less data as necessary
    // The `.replace()` method only changes the first instance of the match, if you want to replace all use `new RegExp(string, 'g')` to imply global replacement
    // We're also going to set it directly to the element this time since we don't need to loop over values and join
    itemDetailsEl.innerHTML = template.replace(new RegExp('{title}', 'g'), result.Title)
                                      .replace(new RegExp('{year}', 'g'), result.Year)
                                      .replace(new RegExp('{posterUrl}', 'g'), result.Poster)
                                      .replace('{rated}', result.Rated)
                                      .replace('{runtime}', result.Runtime)
                                      .replace('{plot}', result.Plot)
                                      .replace('{imdbID}', result.imdbID)
                                      .replace('{imdbRating}', result.imdbRating)
                                      .replace('{imdbVotes}', result.imdbVotes)
                                      .replace('{favoritesButtonText}', isMovieInFavorites(result.imdbID) ? 'In Favorites' : 'Add to Favorites');
  }

  // We'll need an event listener for showing our favorites overlay
  document.getElementById('favorites-link').addEventListener('click', function(event) {
    // Don't forget to prevent default to ensure we aren't linking elsewhere
    event.preventDefault();

    // We can modify the styles on an element by changing any of the `element.style` properties
    favoritesEl.style.display = 'block';
    renderFavorites();
  });

  // We'll also want a way to hide our favorites overlay
  document.getElementById('favorites-link-close').addEventListener('click', function(event) {
    event.preventDefault();
    favoritesEl.style.display = 'none';
  });
  
  // To add an item to favorites, you can click on a button inside the movie data section
  // This listener will be our event delegate to trigger adding a new favorite
  itemDetailsEl.addEventListener('click', function(event) {
    // Make sure they clicked on the add to favorites button, and we don't already have it in favorites (we don't want duplicates)
    if (event.target.matches('.add-to-favorites') && event.target.innerHTML !== 'In Favorites') {
      // We're storing basic information of the movie so we don't need to re-request it each time we load our favorites
      // All this data is coming from data attributes we created in our HTML template
      addToFavorites({
        Poster: event.target.getAttribute('data-poster-url'),
        imdbID: event.target.getAttribute('data-imdbID'),
        Title: event.target.getAttribute('data-title'),
        Year: event.target.getAttribute('data-year')
      });
      // Don't forget to adjust the button once we've added to our favorites
      event.target.innerHTML = 'In Favorites';
    }
  });
  
  // Add a movie to our favorites
  function addToFavorites(movieData) {
    // POSTing with fetch is slightly different
    // We need to pass additional configuration so it knows we want to POST instead of GET as well as passing along "body" data
    // This is the data saved on the server. It will need to be run through `JSON.stringify()` to convert to a string format
    // On the server side we convert it back to JSON and save
    // We'll also need to tell the server we are sending JSON data with the request headers
    fetch('/favorites', {
      method: 'POST',
      body: JSON.stringify(movieData),
      headers: new Headers({
        'Content-Type': 'application/json'
      })
    })
      .then(function(response) {
        return response.json();
      })
      .then(function(responseData) {
        // Let's add it to our internal favorite movies list so we don't have to re-request the full list
        FavoriteMovies.push(movieData);
      });
  }
  
  // Get the list of favorite movies from the server
  // Any time we want to get the latest, we could call this
  function getFavoriteMovies() {
    fetch('/favorites')
      .then(function(response) {
        return response.json();
      })
      .then(function(responseData) {
        // We created this API so we know the response data is exactly what we want
        FavoriteMovies = responseData;
      });
  }
  
  // Helper function to see if a movie is already in our favorites
  function isMovieInFavorites(imdbID) {
    // `.filter()` is a method on arrays
    // It allows us to go through each item on the array, and return true or false
    // In the end we will get a new array with the filtered items
    // We'll test our new array to see if more than one movie exists, meaning it's in our list already
    return FavoriteMovies.filter(function(movie) {
      return movie.imdbID === imdbID;
    }).length > 0;
  }
  
  // Render the elements inside the favorites list
  function renderFavorites() {
    // Most of this code will be similar to what we did for our search results
    // The differences are using a different set of data, and outputting to a different element
    var htmlOutput = FavoriteMovies.map(function(result) {
      // We can use the same template since we want the same style
      var template = document.getElementById('search-result-template').innerHTML;
      
      return template.replace('{title}', result.Title)
                     .replace('{year}', result.Year)
                     .replace('{posterUrl}', result.Poster)
                     .replace('{imdbID}', result.imdbID);
    });
    
    favoritesListEl.innerHTML = htmlOutput.join('');
  }
  
});