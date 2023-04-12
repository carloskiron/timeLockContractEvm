pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IMyERC20 is IERC20 {
    function mint(address to, uint256 amount) external;

    function burnFrom(address from, uint256 amount) external;
}

interface IMyERC721 is IERC721 {
    function safeMint(address to, uint256 amount) external;

    function burn(uint256 tokenId) external;
}

contract TokenSale is Ownable {
    /// @notice Purachase ration between Sale ERC20 and Ether
    uint256 public ratio;
    uint256 public tokenPrice;
    IMyERC20 public paymentToken;
    IMyERC721 public nftToken;

    uint256 public adminPool;
    uint256 public publicPool;

    constructor(
        uint256 _ratio,
        address _paymentToken,
        uint256 _tokenPrice,
        address _nftToken
    ) {
        ratio = _ratio;
        paymentToken = IMyERC20(_paymentToken);
        nftToken = IMyERC721(_nftToken);
        tokenPrice = _tokenPrice;
    }

    function purchaseTokens() public payable {
        uint256 etherReceived = msg.value;
        uint256 tokensToBeEarned = etherReceived / ratio;
        paymentToken.mint(msg.sender, tokensToBeEarned);
    }

    function burnTokens(uint256 amount) public {
        paymentToken.burnFrom(msg.sender, amount);
        uint256 etherToBeRefunded = amount * ratio;
        payable(msg.sender).transfer(etherToBeRefunded);
    }

    function purchaseNFT(uint256 tokenId) public {
        uint256 charge = tokenPrice / 2;
        adminPool += charge;
        publicPool += tokenPrice - charge;
        paymentToken.transferFrom(msg.sender, address(this), tokenPrice);
        nftToken.safeMint(msg.sender, tokenId);
    }

    function burnNft(uint256 tokenId) public {
        nftToken.burn(tokenId);
        paymentToken.transfer(msg.sender, tokenPrice / 2);
    }

    function withdraw(uint256 amount) public {
        require(amount < adminPool);
        adminPool -= amount;
        //TODO: transfer amount
    }
}
