//check for support
(function () {
  if (!('indexedDB' in window)) {
    console.log('This browser doesn\'t support IndexedDB');
    return;
  }
})();

const dbPromise = idb.open("restaurant-details", 1, upgradeDB => {
  switch (upgradeDB.oldVersion) {
    case 0:
      upgradeDB.createObjectStore("restaurants", {
        keyPath: 'id'
      });
  }
});
/**
 * Common database helper functions.
 */

class DBHelper {
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337; // Change this to your server port
    // return `http://localhost:${port}/data/restaurants.json`;

    return `http://localhost:${port}/restaurants`;
  }
  /**
   * Fetch all restaurants.
   */


  static fetchRestaurants(callback, id) {
    let fetchURL;

    if (!id) {
      fetchURL = DBHelper.DATABASE_URL;
    } else {
      fetchURL = DBHelper.DATABASE_URL + '/' + id;
    }

    if (!navigator.serviceWorker.controller) {
      let DATABASE_URL = "http://localhost:1337/restaurants"; // let restaurants;

      fetch(DATABASE_URL, {
        method: 'GET'
      }).then(response => {
        return response.json();
      }).then(restaurants => {
        //const objKey = Object.keys(restaurants)[0];
        // console.log(restaurants);
        dbPromise.then(dbObj => {
          const tx = dbObj.transaction("restaurants", "readwrite").objectStore("restaurants");
          restaurants.forEach(restaurant => {
            tx.put(restaurant); //return tx.complete;
          });
        }); // callback(null, restaurants[objKey]);
        //console.log(restaurants);

        callback(null, restaurants);
      }).catch(error => {
        // Oops!. The server returned an error.
        callback(error, null);
      });
    } else {
      return dbPromise.then(dbObj => {
        if (!dbObj) return;
        return dbObj.transaction("restaurants").objectStore("restaurants").getAll();
      }).then(restaurants => {
        // return restaurants.json()
        callback(null, restaurants);
      });
    }
  }
  /**
   * Fetch a restaurant by its ID.
   */


  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);

        if (restaurant) {
          // Got the restaurant
          callback(null, restaurant);
        } else {
          // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }
  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */


  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }
  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */


  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }
  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */


  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants;

        if (cuisine != 'all') {
          // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }

        if (neighborhood != 'all') {
          // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }

        callback(null, results);
      }
    });
  }
  /**
   * Fetch all neighborhoods with proper error handling.
   */


  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood); // Remove duplicates from neighborhoods

        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
        callback(null, uniqueNeighborhoods);
      }
    });
  }
  /**
   * Fetch all cuisines with proper error handling.
   */


  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type); // Remove duplicates from cuisines

        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
        callback(null, uniqueCuisines);
      }
    });
  }
  /**
   * Restaurant page URL.
   */


  static urlForRestaurant(restaurant) {
    return `./restaurant.html?id=${restaurant.id}`;
  }
  /**
   * Restaurant image URL.
   */


  static imageUrlForRestaurant(restaurant) {
    return `./img-dist/${restaurant.photograph}.jpg`;
  }
  /**
   * Map marker for a restaurant.
   */


  static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng], {
      title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
    });
    marker.addTo(newMap);
    return marker;
  }
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */


}
// Register the service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').then(reg => {
    if (reg.waiting) {
      //console.log("sw is skipping waiting");
      self.skipWaiting();
      return;
    } // Registration was successful


    console.log('Registration Worked!', reg.scope);
  }).catch(err => {
    // registration failed :(
    console.log('Registration failed!: ', err);
  });
}

let restaurants, neighborhoods, cuisines;
var newMap;
var markers = [];
/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */

document.addEventListener('DOMContentLoaded', event => {
  initMap(); // added 

  fetchNeighborhoods();
  fetchCuisines();
});
/**
 * Fetch all neighborhoods and set their HTML.
 */

fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) {
      // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
};
/**
 * Set neighborhoods HTML.
 */


fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
};
/**
 * Fetch all cuisines and set their HTML.
 */


fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
};
/**
 * Set cuisines HTML.
 */


fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');
  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
};
/**
 * Initialize leaflet map, called from HTML.
 */


initMap = () => {
  self.newMap = L.map('map', {
    center: [40.722216, -73.987501],
    zoom: 12,
    scrollWheelZoom: false
  });
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
    mapboxToken: 'sk.eyJ1IjoicGZsYXNoIiwiYSI6ImNqa3NkNzU3cTExN3QzcHQ5aG9sNHAxaTMifQ.ouJfUluG0rRvHT7HSk-Ghw',
    //'<your MAPBOX API KEY HERE>',
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' + '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' + 'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
  }).addTo(newMap);
  updateRestaurants();
};
/*
window.initMap = () => {
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(document.getElementById('map'), {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
} 
*/

/**
 * Update page and map for current restaurants.
 */


updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');
  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;
  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;
  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  });
};
/**
 * Clear current restaurants, their HTML and remove their map markers.
 */


resetRestaurants = restaurants => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = ''; // Remove all map markers

  if (self.markers) {
    self.markers.forEach(marker => marker.remove());
  }

  self.markers = [];
  self.restaurants = restaurants;
};
/**
 * Create all restaurants HTML and add them to the webpage.
 */


fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
};
/**
 * Create restaurant HTML.
 */


createRestaurantHTML = restaurant => {
  const li = document.createElement('li');
  /*
    const image = document.createElement('img');
    image.className = 'restaurant-img';
    image.src = DBHelper.imageUrlForRestaurant(restaurant);
    li.append(image);
  */

  /**
  * Create picture elements, and add source child elements to the html 
  */
  // create a picture element. This picture element will allow source tag for your image

  const picture = document.createElement('picture');
  li.append(picture); // Here you will specify the different images for display

  const imageSrc = DBHelper.imageUrlForRestaurant(restaurant); // the -large_2x.jpg should be your own image name you have

  const largeImageSrc = imageSrc.replace('.jpg', '--large_2x.jpg'); // the -normal_1x.jpg should be your own image name you have

  const normalImageSrc = imageSrc.replace('.jpg', '--normal_1x.jpg'); // the -small.jpg should be your own image name you have

  const smallImageSrc = imageSrc.replace('.jpg', '--small.jpg'); // then you create two source elements

  const source1 = document.createElement('source');
  source1.setAttribute('type', 'image/jpg');
  source1.setAttribute('media', '(' + 'min-width:' + '750px' + ')');
  source1.setAttribute('srcset', largeImageSrc + ' 2x,' + normalImageSrc + ' 1x');
  const source2 = document.createElement('source');
  source1.setAttribute('type', 'image/jpg');
  source1.setAttribute('media', '(' + 'min-width:' + '320px' + ')');
  source1.setAttribute('srcset', normalImageSrc + ' 1x,' + largeImageSrc + ' 2x');
  picture.append(source1);
  picture.append(source2); // then you create another img element and add tag and other attributes to it

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.src = smallImageSrc; // image.src = imageSrc ;

  image.setAttribute('tabindex', 0);
  image.setAttribute('alt', 'image for ' + restaurant.name + ' Restaurant');
  picture.append(image);
  const name = document.createElement('h2');
  name.innerHTML = restaurant.name;
  name.setAttribute('tabindex', 0);
  name.setAttribute('aria-label', `${restaurant.name}`);
  li.append(name);
  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  neighborhood.setAttribute('tabindex', 0);
  neighborhood.setAttribute('aria-label', `${restaurant.neighborhood}`);
  li.append(neighborhood);
  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  address.setAttribute('tabindex', 0);
  address.setAttribute('aria-label', `${restaurant.address}`);
  li.append(address);
  const more = document.createElement('button');
  more.setAttribute('type', 'button');
  more.setAttribute('aria-label', `view details, 
    click this to visit ${name.innerHTML} 
    restaurant review page, 
    note press tab once and hit enter to visit 
    ${name.innerHTML} review page`); // more.setAttribute('aria-label', 'view details');

  let anchorForMore = document.createElement('a'); // anchorForMore.setAttribute('aria-label', 'view details button');

  anchorForMore.setAttribute('aria-hidden', 'true');
  anchorForMore.innerHTML = 'View Details'; // more.innerHTML = 'View Details';
  // more.href = DBHelper.urlForRestaurant(restaurant);

  anchorForMore.href = DBHelper.urlForRestaurant(restaurant); // more.href = DBHelper.urlForRestaurant(restaurant);
  // more.setAttribute("href", DBHelper.urlForRestaurant(restaurant));

  more.append(anchorForMore);
  li.append(more);
  return li;
};
/**
 * Add markers for current restaurants to the map.
 */


addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on("click", onClick);

    function onClick() {
      window.location.href = marker.options.url;
    }

    self.markers.push(marker);
  });
};
/*
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}
*/
// Register the service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').then(reg => {
    if (reg.waiting) {
      //console.log("sw is skipping waiting");
      self.skipWaiting();
      return;
    } // Registration was successful


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

document.addEventListener('DOMContentLoaded', event => {
  initMap();
});
/**
 * Initialize leaflet map
 */

initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) {
      // Got an error!
      console.error(error);
    } else {
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'sk.eyJ1IjoicGZsYXNoIiwiYSI6ImNqa3NkNzU3cTExN3QzcHQ5aG9sNHAxaTMifQ.ouJfUluG0rRvHT7HSk-Ghw',
        // '<your MAPBOX API KEY HERE>',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' + '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' + 'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'
      }).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
};
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


fetchRestaurantFromURL = callback => {
  if (self.restaurant) {
    // restaurant already fetched!
    callback(null, self.restaurant);
    return;
  }

  const id = getParameterByName('id');

  if (!id) {
    // no id found in URL
    error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;

      if (!restaurant) {
        console.error(error);
        return;
      }

      fillRestaurantHTML();
      callback(null, restaurant);
    });
  }
};
/**
 * Create restaurant HTML and add it to the webpage
 */


fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;
  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;
  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.setAttribute('tabindex', 0); // Here you will specify the different images for display
  // the -large_2x.jpg should be your own image name you have

  const largeImageSrc = image.src.replace('.jpg', '--large_2x.jpg'); // the -normal_1x.jpg should be your own image name you have

  const normalImageSrc = image.src.replace('.jpg', '--normal_1x.jpg'); // the -small.jpg should be your own image name you have

  const smallImageSrc = image.src.replace('.jpg', '--small.jpg'); // then you add a srcset attribute to the image

  image.setAttribute('media', '(' + 'min-width:' + '750px' + ')');
  image.setAttribute('srcset', largeImageSrc + ' 2x,' + normalImageSrc + ' 1x');
  image.src = smallImageSrc;
  image.setAttribute('alt', 'image for ' + restaurant.name + ' Restaurant');
  const cuisine = document.getElementById('restaurant-cuisine'); // cuisine.setAttribute('tabindex', 0);

  cuisine.innerHTML = restaurant.cuisine_type; // fill operating hours

  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  } // fill reviews


  fillReviewsHTML();
};
/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */


fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');

  for (let key in operatingHours) {
    const row = document.createElement('tr');
    row.setAttribute('tabindex', 0);
    const day = document.createElement('td'); // day.setAttribute('tabindex', 0);

    day.innerHTML = key;
    row.appendChild(day);
    const time = document.createElement('td'); // time.setAttribute('tabindex', 0);

    time.innerHTML = operatingHours[key];
    row.appendChild(time);
    hours.appendChild(row);
  }
};
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
};
/**
 * Create review HTML and add it to the webpage.
 */


createReviewHTML = review => {
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
};
/**
 * Add restaurant name to the breadcrumb navigation menu
 */


fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.setAttribute('aria-current', 'page');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
};
/**
 * Get a parameter by name from page URL.
 */


getParameterByName = (name, url) => {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
        results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};