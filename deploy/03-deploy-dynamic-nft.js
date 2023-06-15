const {developmentChains, networkConfig} = require('../hardhat-config-helper');
const {verify} = require('../utils/verify');
const {ethers} = require("hardhat");
const fs = require("fs-extra");
const path = require("path");

module.exports = async ({getNamedAccounts, deployments, network}) => {
    const {deploy, log} = deployments;
    const {deployer} = await getNamedAccounts();
    const chainId = network.config.chainId;

    let priceFeed;

    if (developmentChains.includes(network.name)) {
        priceFeed = (await ethers.getContract('MockV3Aggregator', deployer)).address;
    } else {
        priceFeed = networkConfig[chainId].ethUsdPriceFeed;
    }

    const lowImg = fs.readFileSync(path.resolve(__dirname, '..', 'img', 'frown.svg'), {encoding: 'utf8'});
    const highImg = fs.readFileSync(path.resolve(__dirname, '..', 'img', 'happy.svg'), {encoding: 'utf8'});

    const args = [
        priceFeed,
        lowImg,
        highImg,
    ];
    log('-----------------------');
    const dynamicNFT = await deploy('DynamicNFT', {
        from: deployer,
        args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1
    })

    log('DynamicNFT deployed');

    if(!developmentChains.includes(network.name) && process.env.ETHERSCAN_KEY) {
        log('Verifying Contract...')
        await verify(dynamicNFT.address, args);
        log('Contract verified')
    }
}

module.exports.tags = ['all', 'dynamic-nft'];