const { developmentChains } = require('../hardhat-config-helper');
const { verify } = require('../utils/verify');

module.exports = async ({ getNamedAccounts, deployments, network, ethers}) => {
    const {deploy, log} = deployments;
    const {deployer} = await getNamedAccounts();

    const BASE_FEE = ethers.utils.parseEther('0.25'); //link per request
    const GAS_PRICE_LINK = 1e9; // link per gas

    if(developmentChains.includes(network.name)) {
        log('Started to deploy mocks');
        await deploy('VRFCoordinatorV2Mock', {
            from: deployer,
            args: [BASE_FEE, GAS_PRICE_LINK],
            log: true,
        });
        log("Mocks are deployed");
        log('-------------------');
    }
}

module.exports.tags = ['all', 'mocks'];