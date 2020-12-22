'use strict';

const axios = require('axios');
const FormData = require('form-data');

module.exports = {
  init(providerOptions) {
    const { root = 'strapi', hapikey } = providerOptions;

    const hs = axios.create({
      baseURL: 'https://api.hubapi.com/filemanager/api/v3/files/upload',
    });

    hs.interceptors.request.use((config) => {
      config.params = config.params || {};
      config.params.hapikey = hapikey;
      return config;
    });

    return {
      upload: async (file, customParams = {}) => {
        const path = file.path ? `${file.path}/` : '';
        const formData = new FormData();
        const {
          buffer,
          hash,
          mime,
        } = file;

        const options = {
          access: 'PUBLIC_NOT_INDEXABLE',
          overwrite: true,
          ...customParams,
        }

        formData.append('options', JSON.stringify(options));
        formData.append('file', buffer, { filename: hash, contentType: mime });
        formData.append('fileName', hash);
        formData.append('folderPath', `${root}/${path}`);

        const { data } = await hs({
          method: 'post',
          headers: formData.getHeaders(),
          data: formData.getBuffer(),
        });

        const uploadedFile = data.objects[0];
        file.url = uploadedFile.friendly_url;
        file.provider_metadata = {
          id: uploadedFile.id,
        };
        return;
      },
      delete: async (file) => {
        const fileId = file.provider_metadata.id;
        await hs.delete(`/${fileId}`);
        return;
      },
    };
  },
};
