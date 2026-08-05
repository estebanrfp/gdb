# 🌍 Geo-spatial Module for GenosDB

![Geolocation Query Visualization](https://github.com/user-attachments/assets/1bdc3856-c780-47e2-8b15-7dcb66946ad9)

This document explains the purpose of the Geo-spatial module in `GenosDB`, which provides the `$near` and `$bbox` operators. These operators are designed to simplify and accelerate queries involving geographic data, such as finding nodes near a specific location or within a defined area.

---

## **Purpose of Geo-spatial Operators**

Geo-spatial operators allow you to filter nodes based on their geographic coordinates (latitude and longitude). This functionality is essential for applications that involve maps, location-based services, or any form of spatial data analysis.

### **Key Use Cases**

1.  **Find Nearby Nodes**: Identify all data points within a certain radius of a given location (e.g., "find all cafes within 2 km").
2.  **Filter by Area**: Retrieve nodes that fall within a rectangular bounding box (e.g., "show all landmarks within Manhattan").
3.  **Real-Time Location Queries**: Dynamically query nodes based on a user's changing location, with live updates.

---

## **Enabling the Module**

The Geo-spatial module is not imported separately but is activated when you initialize your GenosDB instance. To use the `$near` and `$bbox` operators, enable the `geo` option.

```javascript
import { gdb } from "genosdb";

// Enable the Geo-spatial module during database initialization
const db = await gdb("my-geo-database", { geo: true });

console.log("Geo-spatial operators are now active.");
```

### Flexible Coordinate Handling

The operators are designed to be flexible. They can automatically find coordinate data within a node's `value` whether it is stored in a flat structure or nested inside another object (like `location`).

-   **Flat Structure:** `await db.put({ name: "Point A", latitude: 40.7, longitude: -74.0 });`
-   **Nested Structure:** `await db.put({ name: "Point B", location: { latitude: 40.8, longitude: -73.9 } });`

Both formats will be correctly processed by `$near` and `$bbox` queries.

---

## **Operator Details**

### 1. `$near`

The `$near` operator finds nodes whose geographic coordinates are within a specified radius (in kilometers) of a central point.

#### **Syntax**

The field name used in the query (e.g., `location` below) is a placeholder; the operator searches the entire node `value` for coordinate fields.

```javascript
// Find nodes within a 50km radius
const { results } = await db.map({
  query: {
    location: {
      $near: { latitude: 40.7128, longitude: -74.006, radius: 50 }
    }
  }
});

console.log("Nearby nodes:", results);
```

#### **Example: Find Landmarks Near a User**

First, let's add some geo-tagged landmarks in New York City.

```javascript
await db.put({ name: "Times Square", type: "Landmark", location: { latitude: 40.7580, longitude: -73.9855 } });
await db.put({ name: "Central Park", type: "Park", location: { latitude: 40.7850, longitude: -73.9682 } });
await db.put({ name: "Statue of Liberty", type: "Landmark", location: { latitude: 40.6892, longitude: -74.0445 } });
```

Now, find all landmarks within a 5 km radius of Times Square.

```javascript
const userLocation = { latitude: 40.7580, longitude: -73.9855 };

const { results } = await db.map({
  query: {
    location: {
      $near: { ...userLocation, radius: 5 } // Radius in kilometers
    }
  }
});

// This will return Times Square and Central Park, but not the Statue of Liberty.
console.log("Nearby places:", results);
```

---

### 2. `$bbox`

The `$bbox` operator finds nodes whose geographic coordinates fall within a rectangular "bounding box" defined by minimum and maximum latitude and longitude values.

#### **Syntax**

```javascript
// Find nodes within a specific rectangular area
const { results } = await db.map({
  query: {
    location: {
      $bbox: {
        minLat: 40.70, maxLat: 40.88,
        minLng: -74.02, maxLng: -73.93
      }
    }
  }
});

console.log("Nodes within the area:", results);
```

#### **Example: Filter Nodes within Manhattan**

Using the same data as before, let's find all nodes within the approximate boundaries of Manhattan.

```javascript
const manhattanBounds = {
  minLat: 40.70, maxLat: 40.88,
  minLng: -74.02, maxLng: -73.93
};

const { results } = await db.map({
  query: {
    location: {
      $bbox: manhattanBounds
    }
  }
});

// This will return Times Square and Central Park.
console.log("Nodes in Manhattan:", results);
```

---

## **Advanced Usage**

### Combining with Standard Filters

You can combine geo-spatial operators with other standard query filters to create highly specific searches.

#### **Example: Find Parks in a Specific Area**

Find nodes that are within the Manhattan bounding box AND have a `type` of "Park".

```javascript
const manhattanBounds = {
  minLat: 40.70, maxLat: 40.88,
  minLng: -74.02, maxLng: -73.93
};

const { results } = await db.map({
  query: {
    location: { $bbox: manhattanBounds }, // Geo-spatial filter
    type: "Park"                         // Standard value filter
  }
});

// This will only return the "Central Park" node.
console.log("Parks in Manhattan:", results);
```

### Real-Time Updates with Callbacks

Leverage GenosDB's real-time capabilities to monitor geo-queries live. The callback will be triggered for initial results and any subsequent changes (nodes entering or leaving the query area).

#### **Example: Monitor Nearby Nodes in Real-Time**

```javascript
const userLocation = { latitude: 40.7580, longitude: -73.9855 };

const { unsubscribe } = await db.map(({ id, value, action }) => {
  // Destructure the event object to get node details and the event type
  if (action === "initial" || action === "added") {
    console.log(`[NODE NEARBY] ${value.name} (${id}) has appeared.`);
  }
  if (action === "removed") {
    // This fires when a node no longer matches the query
    console.log(`[NODE NO LONGER NEARBY] A node with ID ${id} is now out of range.`);
  }
}, {
  query: {
    location: {
      $near: { ...userLocation, radius: 5 } // 5 km radius
    }
  }
});

// To stop listening for updates later:
// unsubscribe();
```

---

## **Live Example**

To see the geo-spatial operators in action, visit the interactive example:
[**Geolocation with GenosDB**](https://estebanrfp.github.io/gdb/examples/geo.html)

## **Conclusion**

The Geo-spatial module provides powerful and easy-to-use tools for querying spatial data in `GenosDB`. It enables you to:

-   Find nodes near a specific point with `$near`.
-   Filter nodes within a defined rectangular area with `$bbox`.
-   Combine geo-queries with other filters for precise results.
-   Build dynamic, location-aware applications with real-time updates.

These operators are ideal for mapping services, logistics platforms, social networks, and location-based games.