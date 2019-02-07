// Register the service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').then((reg) => {

    if (reg.waiting) {

      //console.log("sw is skipping waiting");
      self.skipWaiting();
        
      return;
      }


  // Registration was successful
  console.log('Registration Worked!', reg.scope);
}).catch(err => {
  // registration failed :(
  console.log('Registration failed!: ', err);
  });
}


let restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {  
  initMap();
});


/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {      
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'sk.eyJ1IjoicGZsYXNoIiwiYSI6ImNqbnE1YWZ5bzF6OHMzd3BrNHhkczF4bTQifQ.TgVqPWivuTQeKGOQrUNIAg',
        // 'sk.eyJ1IjoicGZsYXNoIiwiYSI6ImNqa3NkNzU3cTExN3QzcHQ5aG9sNHAxaTMifQ.ouJfUluG0rRvHT7HSk-Ghw',
        // '<your MAPBOX API KEY HERE>'
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'    
      }).addTo(newMap);

      let popup = L.popup();

      function onMapClick(e) {
        popup
          .setLatLng(e.latlng)
          .setContent("You clicked the map at " + e.latlng.toString())
          .openOn(newMap);
      }

      newMap.on('click', onMapClick);
  
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
}  

/* 
 window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
} 
*/

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;


  const image = document.getElementById('restaurant-img'); 
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.setAttribute('tabindex', 0);
  // Here you will specify the different images for display

  // the -large_2x.jpg should be your own image name you have
  const largeImageSrc = image.src.replace('.jpg', '--large_2x.jpg'); 
  // the -normal_1x.jpg should be your own image name you have
  const normalImageSrc = image.src.replace('.jpg', '--normal_1x.jpg');
  // the -small.jpg should be your own image name you have
  const smallImageSrc = image.src.replace('.jpg', '--small.jpg'); 
  // then you add a srcset attribute to the image
  image.setAttribute('media', '(' + 'min-width:' + '750px' + ')');
  image.setAttribute('srcset', largeImageSrc + ' 2x,' + normalImageSrc + ' 1x');
  image.src = smallImageSrc;
  image.setAttribute('alt', 'image for ' + restaurant.name + ' Restaurant');


  const cuisine = document.getElementById('restaurant-cuisine');
  // cuisine.setAttribute('tabindex', 0);
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');
    row.setAttribute('tabindex', 0);
    const day = document.createElement('td');
    // day.setAttribute('tabindex', 0);
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    // time.setAttribute('tabindex', 0);
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h3');
  title.setAttribute('tabindex', 0);
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.setAttribute('tabindex', 0);
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.setAttribute('tabindex', 0);
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.setAttribute('tabindex', 0);
  date.innerHTML = review.date;
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.setAttribute('tabindex', 0);
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.setAttribute('tabindex', 0);
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.setAttribute('aria-current', 'page');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

addReviewedHTML = (review) => {
  if (document.getElementById('no-review')) {
      document.getElementById('no-review').remove();
  }
  const container = document.getElementById('reviews-container');
  const ul = document.getElementById('reviews-list');

  //insert the new review on top
  ul.insertBefore(createReviewHTML(review), ul.firstChild);
  container.appendChild(ul);
}

// Form validation & submission
addReview = () => {
    event.preventDefault();

    // Getting the data from the form 
    let resId = getParameterByName('id');
    let name = document.getElementById('review-author').value;
    let rating;
    let comments = document.getElementById('review-comments').value;
    rating = document.querySelector('#selectRating option:checked').value;
    const review = [name, rating, comments, resId];

    // Adding data to the document
    const frontEndReview = {
        restaurant_id: parseInt(review[3]),
        rating: parseInt(review[1]),
        name:  review[0],
        comments: review[2].substring(0, 500),
        createdAt: new Date()
    };

    // Send the review 
    DBHelper.addReview(frontEndReview);
    addReviewedHTML(frontEndReview);
    document.getElementById('review-form').reset();
}

/*
* Create review HTML and add it to the webpage
*/
createReviewedHtml = (review) => {
    const li = document.createElement('li');
    if(!navigator.onLine){
        const connection_status = document.createElement('p');
        connection_status.classList.add('offline-label');
        connection_status.innerHTML = "offline";
        li.classList.add("reviews_offline");
        li.appendChild(connection_status);        
    }

    const name = document.createElement('p');
    name.innerHTML =`Name: ${review.name} `;
    li.appendChild(name);

    const date = document.createElement ('p');
    date.innerHTML = `Date: ${new date(review.createdAt).toLocaleString()}`;
    li.appendChild(date);

    const rating = document.createElement ('p');
    rating.innerHTML = `Rating: ${review.rating}`;
    li.appendChild(rating);

    const comments = document.createElement ('p');
    comments.innerHTML = `review.comments`;
    li.appendChild(comments);
    return li;

}