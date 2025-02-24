export const convertJsonToGeoJson = async (
  json,
  longitudeField,
  latitudeField
) => {
  const features = []
  json.forEach(item => {
    if (
      !item[longitudeField] ||
      !item[latitudeField] ||
      item[longitudeField] === '' ||
      item[latitudeField] === ''
    ) {
      return null
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
