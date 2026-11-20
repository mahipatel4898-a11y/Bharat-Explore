/**
 * Dijkstra's Algorithm for shortest route between tourist places
 * Graph: adjacency list { placeId: [{ placeId, distance }] }
 */
function dijkstra(graph, startId) {
  const distances = {};
  const visited = new Set();
  const previous = {};

  // Initialize distances
  for (const node in graph) {
    distances[node] = node === startId ? 0 : Infinity;
    previous[node] = null;
  }

  while (true) {
    // Get unvisited node with smallest distance
    let current = null;
    for (const node in distances) {
      if (!visited.has(node)) {
        if (current === null || distances[node] < distances[current]) {
          current = node;
        }
      }
    }

    if (current === null || distances[current] === Infinity) break;
    visited.add(current);

    // Update neighbors
    const neighbors = graph[current] || [];
    for (const { id, distance } of neighbors) {
      const newDist = distances[current] + distance;
      if (newDist < distances[id]) {
        distances[id] = newDist;
        previous[id] = current;
      }
    }
  }

  return { distances, previous };
}

/**
 * Build a graph from places array using haversine distance
 */
function buildPlaceGraph(places) {
  const graph = {};
  places.forEach((p) => {
    graph[p._id.toString()] = [];
  });

  for (let i = 0; i < places.length; i++) {
    for (let j = i + 1; j < places.length; j++) {
      const dist = haversine(
        places[i].coordinates.lat, places[i].coordinates.lng,
        places[j].coordinates.lat, places[j].coordinates.lng
      );
      graph[places[i]._id.toString()].push({ id: places[j]._id.toString(), distance: dist });
      graph[places[j]._id.toString()].push({ id: places[i]._id.toString(), distance: dist });
    }
  }
  return graph;
}

/**
 * Haversine formula to calculate distance in km between two coordinates
 */
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Get optimized route visiting all places (nearest neighbour heuristic)
 */
function getOptimalRoute(places) {
  if (!places || places.length === 0) return [];
  const visited = new Set();
  const route = [places[0]];
  visited.add(places[0]._id.toString());

  while (route.length < places.length) {
    const last = route[route.length - 1];
    let nearest = null;
    let minDist = Infinity;

    for (const place of places) {
      const id = place._id.toString();
      if (!visited.has(id)) {
        const d = haversine(
          last.coordinates.lat, last.coordinates.lng,
          place.coordinates.lat, place.coordinates.lng
        );
        if (d < minDist) { minDist = d; nearest = place; }
      }
    }
    if (nearest) { route.push(nearest); visited.add(nearest._id.toString()); }
  }
  return route;
}

module.exports = { dijkstra, buildPlaceGraph, getOptimalRoute, haversine };
