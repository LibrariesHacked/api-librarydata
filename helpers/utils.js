module.exports.convertJsonToGeoJson = (json, longitudeField, latitudeField) => {
  const features = []
  json.forEach(item => {
    const feature = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [item[longitudeField], item[latitudeField]]
      },
      properties: item
    }
    features.push(feature)
  })
  return {
    type: 'FeatureCollection',
    features
  }
}
