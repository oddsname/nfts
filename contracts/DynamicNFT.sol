// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "base64-sol/base64.sol";

contract DynamicNFT is ERC721 {
    //mint nft
    //store our SVG somewhere
    //some logic to say "show x image" or "show y image"

    string private constant base64EncodedSvgPrefix = "data:image/svg+xml;base64,";

    uint256 private s_tokenCounter;
    string private i_lowSvgUri;
    string private i_highSvgUri;

    AggregatorV3Interface internal immutable i_priceFeed;

    mapping(uint256 => int256) public s_tokenIdToValue;

    event CreatedNFT(uint256 indexed tokenId, int256 highValue);

    constructor(address priceFeed, string memory lowSvg, string memory highSvg) ERC721 ("Dynamic", "DYN") {
        s_tokenCounter = 0;

        i_lowSvgUri = svgToImageUri(lowSvg);
        i_highSvgUri = svgToImageUri(highSvg);
        i_priceFeed = AggregatorV3Interface(priceFeed);
    }

    function svgToImageUri(string memory svg) public pure returns (string memory) {
        //convert image data to base64
        string memory svgBase64Encoded = Base64.encode(
            bytes(abi.encodePacked(svg))
        );

        //string concatination
        return string(abi.encodePacked(base64EncodedSvgPrefix, svgBase64Encoded));
    }

    function _baseURI() internal pure override returns(string memory) {
        return "data:application/json;base64,";
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "URI Query for nonexistent token");

        (, int256 answer, , ,) = i_priceFeed.latestRoundData();

        string memory imgURI = i_lowSvgUri;

        if(answer >= s_tokenIdToValue[tokenId]) {
            imgURI = i_highSvgUri;
        }

        bytes memory json = abi.encodePacked(
            '{"name":"', name(), '"',
            '"description": "An NFT"',
            '"attributes": [{"trait_type": "coolnes", "value": 100}]',
            '"image": "',  imgURI, '"}'
        );

        string memory base64Json = Base64.encode(bytes(json));

        return string(abi.encodePacked(_baseURI(), base64Json));
    }

    function mintNft(int256 highValue) public {
        s_tokenCounter = s_tokenCounter + 1;
        _safeMint(msg.sender, s_tokenCounter);
        s_tokenIdToValue[s_tokenCounter] = highValue;
        emit CreatedNFT(s_tokenCounter, highValue);
    }
}