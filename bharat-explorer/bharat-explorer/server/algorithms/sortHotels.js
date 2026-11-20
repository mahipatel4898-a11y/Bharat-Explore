/**
 * Sorting algorithms for hotels
 */

// Merge Sort by price (ascending)
function mergeSortByPrice(arr) {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSortByPrice(arr.slice(0, mid));
  const right = mergeSortByPrice(arr.slice(mid));
  return merge(left, right, 'pricePerNight', true);
}

// Merge Sort by rating (descending)
function mergeSortByRating(arr) {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSortByRating(arr.slice(0, mid));
  const right = mergeSortByRating(arr.slice(mid));
  return merge(left, right, 'rating', false);
}

function merge(left, right, key, asc) {
  const result = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length) {
    const cond = asc ? left[i][key] <= right[j][key] : left[i][key] >= right[j][key];
    if (cond) result.push(left[i++]);
    else result.push(right[j++]);
  }
  return [...result, ...left.slice(i), ...right.slice(j)];
}

// Sort by distance from a reference point
function sortByDistance(hotels, refLat, refLng) {
  const { haversine } = require('./dijkstra');
  return hotels
    .map(h => ({
      ...h._doc,
      distance: haversine(refLat, refLng, h.coordinates.lat, h.coordinates.lng).toFixed(1)
    }))
    .sort((a, b) => a.distance - b.distance);
}

// Bubble Sort (for demo/viva purposes - inefficient but educational)
function bubbleSortByPrice(arr) {
  const data = [...arr];
  for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < data.length - i - 1; j++) {
      if (data[j].pricePerNight > data[j + 1].pricePerNight) {
        [data[j], data[j + 1]] = [data[j + 1], data[j]];
      }
    }
  }
  return data;
}

module.exports = { mergeSortByPrice, mergeSortByRating, sortByDistance, bubbleSortByPrice };
