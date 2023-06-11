// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error RandomIPFS_NFT_RangeOutOfBounds();
error RandomIPFS_NFT_NeedMoreETH();
error RandomIPFS_NFT_WithdrawFailed();

contract RandomIPFS_NFT is VRFConsumerBaseV2, ERC721URIStorage, Ownable {
    //when we mint and NFT, we will trigger a chainlink VRF call to get us a random number
    //using  that number, we will get a random NFT
    //PUG, Shiba Inu, St. Bernard
    //Pug super rare, Shiba sorf of rare, Bernard is common

    //users have to pay to mint NFT
    //the owner of the contract can withdraw funds

    enum Breed {
        PUG,
        SHiBA_INU,
        BERNARD
    }

    event NftRequested(uint256 indexed requestId, address requester);
    event NftMinted(Breed dogBreed, address minter);

    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;
    uint256 internal i_mintFee;

    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    mapping(uint256 => address) public s_requestToSender;
    string[] internal s_dogTokenUri;

    uint256 public s_tokenCounter;

    constructor(
        address vrfCoordinator,
        uint64 subscriptionId,
        bytes32 gasLane,
        uint32 callbackGasLimit,
        string[3] memory dogTokenUri,
        uint256 mintFee
    ) VRFConsumerBaseV2(vrfCoordinator) ERC721("Random NFT", "RNFT")  {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinator);
        i_subscriptionId = subscriptionId;
        i_gasLane = gasLane;
        i_callbackGasLimit = callbackGasLimit;
        s_tokenCounter = 0;
        s_dogTokenUri = dogTokenUri;
        i_mintFee = mintFee;
    }

    function getMintFee() public view returns(uint256) {
        return i_mintFee;
    }

    function getTokenUri(uint256 index) public view returns(string memory) {
        return s_dogTokenUri[index];
    }

    function getTokenCounter() public view returns(uint256) {
        return s_tokenCounter;
    }

    function requestNft() public payable {
        if(msg.value < i_mintFee) {
            revert RandomIPFS_NFT_NeedMoreETH();
        }

        uint256 requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );

        s_requestToSender[requestId] = msg.sender;
        emit NftRequested(requestId, msg.sender);
    }

    function withdraw() public onlyOwner {
        uint256 amount = address(this).balance;
        (bool success, ) = payable(msg.sender).call{value: amount}("");

        if(!success) {
            revert RandomIPFS_NFT_WithdrawFailed();
        }
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        address dogOwner = s_requestToSender[requestId];
        uint256 newTokenId = s_tokenCounter;

        //moddedRng is number between 0 and 99
        uint256 moddedRng = randomWords[0] % 100;

        Breed dogBreed = getBreedFromModdedRng(moddedRng);
        _safeMint(dogOwner, newTokenId);
        _setTokenURI(newTokenId, s_dogTokenUri[uint256(dogBreed)]);

        emit NftMinted(dogBreed, dogOwner);
    }

    function getBreedFromModdedRng(uint256 moddedRng) public pure returns (Breed) {
        uint256 cumulativeSum = 0;
        uint8[3] memory chanceArray = getChanceArray();

        for(uint256 i = 0; i< chanceArray.length; i++) {
            if(moddedRng >= cumulativeSum && moddedRng < cumulativeSum + chanceArray[i]) {
                return Breed(i);
            }
            cumulativeSum += chanceArray[i];
        }

        revert RandomIPFS_NFT_RangeOutOfBounds();
    }

    function getChanceArray() public pure returns (uint8[3] memory) {
        return [10, 40, 100];
    }
}