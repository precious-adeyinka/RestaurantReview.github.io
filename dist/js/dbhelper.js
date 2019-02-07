//check for support
(function () {
  if (!('indexedDB' in window)) {
  console.log('This browser doesn\'t support IndexedDB');
  return;
  }
})()

/*
const dbPromise = idb.open("restaurant-details", 1, upgradeDB => {
  switch(upgradeDB.oldVersion){
    case 0:
      upgradeDB.createObjectStore("restaurants", {keyPath:'id'});
  }
});
*/

// Offline Database Schema 
const dbPromise = idb.open("offline-database", 2, (upgradeDB) => {
  switch(upgradeDB.oldVersion){
    case 0:
      upgradeDB.createObjectStore("restaurants", {keyPath:'id'});
    case 1:
      const storeReviews = upgradeDB.createObjectStore("reviews", {keyPath: 'id'});
      storeReviews.createIndex("restaurant", "restaurant_id");
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
    const port = 1337 ; // Change this to your server port
    // return `http://localhost:${port}/data/restaurants.json`;
    return `http://localhost:${port}/restaurants`;
  }


  // Send Status Uppdate 
  static updateFavStatus(resID, isFav) {
    console.log('Changing status to: ', isFav);

    fetch(`http://localhost:1337/restaurants/${resID}/?is_favorite=${isFav}`, {
        method: 'PUT'
    })
    .then(() => {
      console.log('Changed');
      dbPromise
        .then(db => {
          const tx = db.transaction('restaurants', 'readwrite');
          const restaurantsStore = tx.objectStore('restaurants');
          restaurantsStore.get(resID)
              .then(restaurant => {
                  restaurant.is_favorite = isFav;
                  restaurantsStore.put(restaurant)
              });
      })
    })
  }

  static fetchRevsByRestId (id) {
    return fetch(`${DBHelper.DATABASE_URL}reviews/?restaurant_id=${id}`)
      .then(response => response.json())
      .then(reviews => {
        dbPromise.then(db => {
          if(!db) return;

          let tx = db.transaction('reviews', 'readwrite');
          if(Array.isArray(reviews)){
            reviews.forEach(function(review){
                store.put(review);
            });
          }
          else {
              store.put(reviews)
          }
        });
        console.log(' Restaurant Reviews are: ',  reviews);
        return Promise.resolve(reviews);
      })
      .catch(err => {
        return DBHelper.getStoredObjectById('reviews', 'restaurant', id)
          .then((storedReviews) => {
            console.log("Looking for offline stored reviews");
            return Promise.resolve(storedReviews);
          })
      });
  }

  /* Get stored Reviews Objects */
  static getStoredObjectById(dbTable, indx, id) {
      dbPromise.then(function (db){
        if(!db) return;

        const store = db.transaction(dbTable).objectStore(dbTable);
        const indexId = store.index(indx);
        return indexId.getAll(id);
      });
  }

  // Add review Logic
  static addReview(review) {
    let offline_obj = {
      name: 'addReview',
      data: review,
      object_type: 'review'
    };

    // Check if online
     if (!navigator.onLine && (offline_obj.name === 'addReview') ) {
      DBHelper.sendDataWhenOnline(offline_obj);
      return;
     }
     let reviewSend = {
       "name": review.name,
       "rating": parseInt(review.rating),
       "comments": review.comments,
       "restaurant-id": parseInt(review.restaurant_id)
     };
     console.log('Sending Review: ', reviewSend);
     let fetch_options = {
      method: 'POST',
      body: JSON.stringify(reviewSend),
      headers: new Headers({
        'Content-Type': 'application/json'
        })
     };
     fetch(`http://localhost:1337/reviews`, fetch_options).then((response)=> {
        const contentType = response.headers.get('content-type');
        if(contentType &&  contentType.indexOf('application/json') !== -1) {
          return response.json();
        } else {
          return 'API call successful'
        }
     })
     .then((data)=>{
        console.log('Fetch successful!')
     })
     .catch(err => {console.log('error: ', err)});
  }

  // Send data when online
  static sendDataWhenOnline(offline_obj) {
    console.log('Offline Object: ', offline_obj);
    localStorage.setItem('data', JSON.stringify(offline_obj.data));
    console.log(`Local Storage: ${offline_obj.Object_type} stored`);
    window.addEventListener('online', (event)=>{
      console.log('Browser: Online Again');
      let data = JSON.parse(localStorage.getItem('data'))
      console.log('Updating and cleaning UI');
      [...document.querySelectorAll(".reviews_offline")]
      .forEach(el => {
        el.classList.remove("reviews_offline");
        el.querySelector(".offline_label").remove()
      }); 
      if (data !== null) {
        console.log(data)
        if (offline_obj.name == 'addReview') {
          DBHelper.addReview(offline_obj.data);
        }
        console.log('Local State: data sent to API');

        localStorage.removeItem('data');
        console.log(`Local Storage: ${offline_obj.Object_type} removed`);
      }
    });
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
      let DATABASE_URL = "http://localhost:1337/restaurants";
      // let restaurants;
      fetch(DATABASE_URL, {method:'GET'})
      .then(response => {
        return response.json()
      })
      .then(restaurants => {
          dbPromise.then(dbObj => {
            const tx = dbObj.transaction("restaurants", "readwrite")
            .objectStore("restaurants");
            restaurants.forEach(restaurant => {
              tx.put(restaurant);
              //return tx.complete;
            });
          });
          callback(null, restaurants);
       })
      .catch(error => {
        // Oops!. The server returned an error.
        callback(error, null);
        });
    }  
    else {
      return dbPromise
      .then(dbObj => {
        if(!dbObj)return;
        return dbObj
        .transaction("restaurants")
        .objectStore("restaurants")
        .getAll();
      })
      .then(restaurants => {
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
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
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
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
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
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
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
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`./img-dist/${restaurant.photograph}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
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