const {developmentChains} = require("../../hardhat-config-helper");
const {network, getNamedAccounts, deployments, ethers} = require("hardhat");
const {assert, expect} = require("chai");

!developmentChains.includes(network.name)
    ? describe.skip('')
    : describe('Random IPFS NFT tests', () => {
        let deployer, randomNFT, vrfCoordinator;

        beforeEach(async () => {
            deployer = (await getNamedAccounts()).deployer;

            await deployments.fixture(['all']);

            randomNFT = await ethers.getContract('RandomIPFS_NFT', deployer);
            vrfCoordinator = await ethers.getContract('VRFCoordinatorV2Mock', deployer);
        })

        describe('constructor', async () => {
            it('initializes the contract correctly', async () => {
                const tokenCounter = await randomNFT.getTokenCounter();

                assert.equal(tokenCounter.toString(), '0', "on init token counter must be 0");
            })
        })

        describe('getBreedFromModdedRng function tests', async () => {
            const Breed = {PUG: '0', SHIBA: '1', BERNARD: '2'};

            it('should get pug', async () => {
                //if value moddedRng value is from 0-9 it should return pug
                for (let i = 0; i < 10; i++) {
                    const result = await randomNFT.getBreedFromModdedRng(i);
                    assert.equal(Breed.PUG, result.toString());
                }
            })

            it('should get shiba', async () => {
                //if value moddedRng value is from 10-39 it should return pug
                for (let i = 10; i < 40; i++) {
                    const result = await randomNFT.getBreedFromModdedRng(i);
                    assert.equal(Breed.SHIBA, result.toString());
                }
            })

            it('should get bernard', async () => {
                //if value moddedRng value is from 10-39 it should return pug
                for (let i = 40; i < 100; i++) {
                    const result = await randomNFT.getBreedFromModdedRng(i);
                    assert.equal(Breed.BERNARD, result.toString());
                }
            })

            it('should be out of bounds', async () => {
                //if value moddedRng value is from 10-39 it should return pug
                await expect(randomNFT.getBreedFromModdedRng(-1)).to.be.reverted;
                await expect(randomNFT.getBreedFromModdedRng(-2)).to.be.reverted;
                await expect(randomNFT.getBreedFromModdedRng(100)).to.be.revertedWith('RandomIPFS_NFT_RangeOutOfBounds');
                await expect(randomNFT.getBreedFromModdedRng(101)).to.be.revertedWith('RandomIPFS_NFT_RangeOutOfBounds')
            })
        });

        describe('requestNft function test', async () => {
            it('check enter fee', async () => {
                await expect(randomNFT.requestNft({value: ethers.utils.parseEther("0.001")})).to.be.revertedWith('RandomIPFS_NFT_NeedMoreETH');
                await expect(randomNFT.requestNft({value: ethers.utils.parseEther("0.0099")})).to.be.revertedWith('RandomIPFS_NFT_NeedMoreETH');
            })

            it('should add sender to the mapping and check the balance', async () => {
                const accounts = await ethers.getSigners();
                const entranceFee = ethers.utils.parseEther('0.01');

                let contractBalance = await randomNFT.provider.getBalance(randomNFT.address);

                for (const index in accounts) {
                    if (index === 0) {
                        //skip deployer
                        continue;
                    }

                    const account = accounts[index];
                    const accountInitialBalance = await account.getBalance();

                    const randomNFTConnected = await randomNFT.connect(account);

                    const tx = await randomNFTConnected.requestNft({value: entranceFee});
                    const txReceipt = await tx.wait(1);

                    const {gasUsed, effectiveGasPrice} = txReceipt;
                    const gasCost = gasUsed.mul(effectiveGasPrice); //calculate gas cost for transaction

                    const accountEndBalance = await account.getBalance();

                    const requestId = txReceipt.events[1].args.requestId;
                    const requester = txReceipt.events[1].args.requester

                    const addressByRequestId = await randomNFTConnected.getSender(requestId.toNumber());

                    assert.equal(requester, account.address);
                    assert.equal(addressByRequestId, account.address);

                    assert.equal(
                        accountInitialBalance.toString(),
                        accountEndBalance
                            .add(gasCost.toString())
                            .add(entranceFee.toString())
                            .toString()
                    );

                    const updatedContractBalance = await randomNFTConnected.provider.getBalance(randomNFT.address);

                    assert.equal(
                        updatedContractBalance.toString(),
                        contractBalance
                            .add(entranceFee.toString())
                            .toString()
                    );

                    contractBalance = updatedContractBalance;
                }
            });
        })

        describe('withdraw function test', async () => {
            it('should be rejected if not owner', async () => {
                const account = (await ethers.getSigners())[1]; //deployer is 0 account

                const connectedRandomNFT = await randomNFT.connect(account);
                await expect(connectedRandomNFT.withdraw()).to.be.revertedWith('Ownable: caller is not the owner');
            });

            it('owner should be able to withdraw', async () => {
                const accounts = await ethers.getSigners();
                const entranceFee = ethers.utils.parseEther('0.01');

                for (const index in accounts) {
                    if (index === 0) {
                        //skip deployer
                        continue;
                    }

                    const account = accounts[index];
                    const randomNFTConnected = await randomNFT.connect(account);

                    const tx = await randomNFTConnected.requestNft({value: entranceFee});
                    await tx.wait(1);
                }

                const contractBalance = await randomNFT.provider.getBalance(randomNFT.address);
                const deployerBalance = await randomNFT.provider.getBalance(deployer);

                const tx = await randomNFT.withdraw();
                const txReceipt = await tx.wait(1);

                const balanceAfterWithdraw = await randomNFT.provider.getBalance(randomNFT.address);
                const deployerEndBalance = await randomNFT.provider.getBalance(deployer)

                const {gasUsed, effectiveGasPrice} = txReceipt;
                const gasCost = gasUsed.mul(effectiveGasPrice); //calculate gas cost for transaction

                assert.equal(balanceAfterWithdraw.toString(), '0');
                assert.equal(
                    deployerBalance.add(contractBalance.toString()).toString(),
                    deployerEndBalance.add(gasCost.toString()).toString()
                );
            })
        });

        describe('fulfillRandomWords test', async () => {
            it('check counter increment and dog owner', async () => {
                const account = (await ethers.getSigners())[1];
                const entranceFee = ethers.utils.parseEther('0.01');

                const randomNFTConnected = await randomNFT.connect(account);
                const tx = await randomNFTConnected.requestNft({value: entranceFee, from: account.address});
                const txReceipt = await tx.wait(1);

                const requestId = txReceipt.events[1].args.requestId;
                const requester = txReceipt.events[1].args.requester;

                await new Promise(async (resolve, reject) => {
                    const tokenCounter = await randomNFT.getTokenCounter()

                    assert.equal(tokenCounter.toString(), '0');

                    randomNFT.once('NftMinted', async (dogBreed, dogOwner) => {
                        try {
                            const tokeUri = await randomNFT.tokenURI(tokenCounter);
                            assert.equal(tokeUri.includes('ipfs://'), true);

                            const updatedTokenCounter = await randomNFT.getTokenCounter();
                            assert.equal(updatedTokenCounter.toString(), '1');

                            assert.equal(dogOwner, requester);

                            resolve();
                        }
                        catch (e) {
                            reject(e);
                        }
                    });

                    await vrfCoordinator.fulfillRandomWords(requestId, randomNFT.address);
                })
            })
        });
    });