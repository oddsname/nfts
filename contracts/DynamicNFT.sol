// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "base64-sol/base64.sol";

contract DynamicNFT is ERC721 {
    //mint nft
    //store our SVG somewhere
    //some logic to say "show x image" or "show y image"

    uint256 private s_tokenCounter;
    string private immutable i_lowSvgUri;
    string private immutable i_highSvgUri;

    string private constant base64EncodedSvgPrefix = "data:image/svg+xml;base64,";

    constructor(string memory lowSvg, string memoryHighSvg) ERC721 ("Dynamic", "DYN") {
        s_tokenCounter = 0;


    }

    function svgToImageUri(string memory svg) public pure returns (string memory) {
        //convert image data to base64
        string memory svgBase64Encoded = Base64.encode(
            bytes(abi.encodePacked(svg))
        );

        //string concatination
        return string(abi.encodedPacked(base64EncodedSvgPrefix, svgBase64Encoded));
    }

    function _baseURI() internal pure override returns(string memory) {
        return "data:application/json;base64,";
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "URI Query for nonexistent token");
        string imgURI = '';

        string json = abi.encodePacked(
            '{"name":"', name(), '"',
            '"description": "An NFT"',
            '"attributes": [{"trait_type": "coolnes", "value": 100}]',
            '"image": "',  imgURI, '"}'
        );

        string base64Json = Base64.encode(bytes(json));

        return string(abi.encodePacked(_baseURI(), base64Json));
    }

    function mintNft() public {
        _safeMint(msg.sender, s_tokenCounter);
        s_tokenCounter = s_tokenCounter + 1;
    }
}