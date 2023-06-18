const { developmentChains, networkConfig } = require('../hardhat-config-helper');
const { verify } = require('../utils/verify');
const {ethers} = require("hardhat");
const { storeNFTs } = require('../utils/uploadToNftStorage')
const path = require("path");

const FUND_AMOUNT = ethers.utils.parseEther('50');

const generatedTokenURI = [
    'ipfs://bafyreif4zieo5ypuzynouu2crh4qdwnrnhaoaiy6ea4c2x3yilwyubpsmm/metadata.json',
    'ipfs://bafyreiehq2yg6pkmbwtey2osrfdoelvj5m5fpzonf6bm6jlky6rm7szeem/metadata.json',
    'ipfs://bafyreig6shgydpkas2uim5tp7xoywl4fzkor4alw2gzqgvustcdglez65i/metadata.json'
];

module.exports = async ({ getNamedAccounts, deployments, network}) => {
    const {deploy, log} = deployments;
    const {deployer} = await getNamedAccounts();
    const chainId = network.config.chainId;

    let vrfCoordinatorAddress, vrfCoordinatorMock, subId, tokenUris;

    if(process.env.UPLOAD_NFT === 'true') {
        tokenUris = await storeNFTs([
            path.resolve(__dirname, '..', 'img', 'pug.png'),
            path.resolve(__dirname, '..', 'img', 'shiba-inu.png'),
            path.resolve(__dirname, '..', 'img', 'st-bernard.png'),
        ])

        console.log(tokenUris);
    } else {
        tokenUris = generatedTokenURI;
    }

    if(developmentChains.includes(network.name)) {
        vrfCoordinatorMock = await ethers.getContract('VRFCoordinatorV2Mock', deployer)
        const tx = await vrfCoordinatorMock.createSubscription();
        const txReceipt = await tx.wait(1);
        subId = txReceipt.events[0].args.subId
        vrfCoordinatorAddress = vrfCoordinatorMock.address
        await vrfCoordinatorMock.fundSubscription(subId, FUND_AMOUNT);
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
    } else {
        await vrfCoordinatorMock.addConsumer(
            subId,
            randomIPFSNFT.address
        );
        console.log("Consumer added to the mock")
    }
    log('------------');
}

module.exports.tags = ['all', 'random-nft', 'main'];