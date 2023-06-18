const { developmentChains } = require('../hardhat-config-helper');
const { verify } = require('../utils/verify');

module.exports = async ({ getNamedAccounts, deployments, network}) => {
    const {deploy, log} = deployments;
    const {deployer} = await getNamedAccounts();

    log('------------');
    const args = [];

    const basicNft = await deploy('BasicNFT', {
        from: deployer,
        args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })

    if(!developmentChains.includes(network.name) && process.env.ETHERSCAN_KEY) {
        log('Verifying Contract...')
        await verify(basicNft.address, args);
    }
    log('------------');
}

module.exports.tags = ['all', 'basic-nft', 'main'];