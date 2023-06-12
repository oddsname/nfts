const { NFTStorage, File } = require('nft.storage');
const fs = require('fs-extra');
const path = require('path');

require('dotenv').config();

const { NFT_STORAGE_KEY } = process.env;

const storeNFTs = async (imagePaths) => {
    const nftStorage = new NFTStorage({ token: NFT_STORAGE_KEY });
    const responses = [];

   for(index in imagePaths) {
       const filePath = imagePaths[index];

       if(!fs.existsSync(filePath)) {
           throw new Error(`File ${filePath} doesn't exist`);
       }

       const fileContent = await fs.readFileSync(filePath);

       const file = new File([fileContent], path.basename(filePath), { type: 'png' })

       const fileName = filePath.split('/').pop().replace('.png', '');

       const response = await nftStorage.store({
           image: file,
           name: fileName,
           description: "file " + fileName
       })

       responses.push(response.url);
   }

   return responses;
}

module.exports = {
    storeNFTs
}