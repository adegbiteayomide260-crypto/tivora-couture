(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', async function () {
    console.log('Tivora image loader started');

    if (!window.TivoraFirestore) {
      console.error('TivoraFirestore is NOT available');
      return;
    }

    try {
      const settings = await window.TivoraFirestore.getSettings();

      console.log('Tivora settings:', settings);
      console.log('Atelier Image 1:', settings && settings.atelierImage1);

      if (!settings) {
        console.error('No settings document found');
        return;
      }

      for (let i = 1; i <= 5; i++) {
        const image = document.getElementById('atelierImage' + i);
        const url = settings['atelierImage' + i];

        console.log('Image ' + i, {
          elementFound: !!image,
          savedURL: url || null
        });

        if (image && url) {
          image.src = url;
        }
      }
    } catch (err) {
      console.error('Could not load atelier images:', err);
    }
  });
})();
