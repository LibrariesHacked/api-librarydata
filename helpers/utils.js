export const convertJsonToGeoJson = (json, longitudeField, latitudeField) => {
  const features = []
  json.forEach(item => {
    if (
      !item[longitudeField] ||
      !item[latitudeField] ||
      item[longitudeField] === '' ||
      item[latitudeField] === ''
    ) {
      // Do nothing
    } else {
      const feature = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [
            parseFloat(item[longitudeField]),
            parseFloat(item[latitudeField])
          ]
        },
        properties: item
      }
      features.push(feature)
    }
  })
  return {
    type: 'FeatureCollection',
    features
  }
}
