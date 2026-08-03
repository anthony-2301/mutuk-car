export default {
  name: 'car',
  title: 'Véhicules',
  type: 'document',
  fields: [
    { name: 'name', title: 'Nom du véhicule', type: 'string' },
    { 
      name: 'cat', 
      title: 'Catégorie', 
      type: 'string',
      options: {
        list: [
          { title: 'SUV 4x4', value: 'suv' },
          { title: 'Berline', value: 'berline' },
          { title: 'Luxe & VIP', value: 'luxe' },
          { title: 'Utilitaire & Bus', value: 'utilitaire' }
        ]
      }
    },
    { name: 'luxe', title: 'Modèle Luxe / VIP', type: 'boolean' },
    { name: 'price', title: 'Tarif (ex: 350$ ou Sur Devis)', type: 'string' },
    { name: 'img', title: 'Photo du véhicule', type: 'image', options: { hotspot: true } },
    { name: 'seats', title: 'Nombre de places', type: 'number' },
    { name: 'tag', title: 'Badge (ex: Blindé, VIP)', type: 'string' }
  ]
}