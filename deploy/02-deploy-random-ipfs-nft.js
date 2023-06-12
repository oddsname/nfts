const { developmentChains, networkConfig } = require('../hardhat-config-helper');
const { verify } = require('../utils/verify');
const {ethers} = require("hardhat");
const { storeNFTs } = require('../utils/uploadToNftStorage')
const path = require("path");

module.exports = async ({ getNamedAccounts, deployments, network}) => {
    const {deploy, log} = deployments;
    const {deployer} = await getNamedAccounts();
    const chainId = network.config.chainId;

    let vrfCoordinatorAddress, subId, tokenUris;

    if(process.env.UPLOAD_NFT === 'true') {
        tokenUris = await storeNFTs([
            path.resolve(__dirname, '..', 'img', 'pug.png'),
            path.resolve(__dirname, '..', 'img', 'shiba-inu.png'),
            path.resolve(__dirname, '..', 'img', 'st-bernard.png'),
        ])
    }

    if(developmentChains.includes(network.name)) {
        const vrfCoordinatorMock = await ethers.getContract('VRFCoordinatorV2Mock', deployer)
        const tx = await vrfCoordinatorMock.createSubscription();
        const txReceipt = await tx.wait(1);
        subId = txReceipt.events[0].args.subId
        vrfCoordinatorAddress = vrfCoordinatorMock.address
    } else {
        vrfCoordinatorAddress = networkConfig[chainId].vrfCoordinatorV2;
        subId = networkConfig[chainId].subscriptionId;
    }

    log('------------');
    const args = [
        vrfCoordinatorAddress,
        subId,
        networkConfig[chainId].gasLane,
        networkConfig[chainId].gasLimit,
        tokenUris,
        networkConfig[chainId].mintFee
    ];

    const randomIPFSNFT = await deploy('RandomIPFS_NFT', {
        from: deployer,
        args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1
    })

    log('RandomNFT deployed');
    if(!developmentChains.includes(network.name) && process.env.ETHERSCAN_KEY) {
        log('Verifying Contract...')
        await verify(randomIPFSNFT.address, args);
        log('Contract verified')
    }
    log('------------');
}

module.exports.tags = ['all', 'random-nft'];