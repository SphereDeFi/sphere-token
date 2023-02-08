// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./interfaces/IDystopiaRouter.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ISphereBondTreasurySwapper {
    function swapBack() external;
}

contract SphereBondTreasurySwapper is OwnableUpgradeable, ISphereBondTreasurySwapper {
    address public routerAddress;

    address public constant DEAD = 0x000000000000000000000000000000000000dEaD;

    address public assetAddress;
    address public sphereAddress = 0x62F594339830b90AE4C084aE7D223fFAFd9658A7;

    address public liquidityReceiver;

    uint256 public burnFees;
    uint256 public liquidityFees;
    uint256 public constant FEE_DENOMINATOR = 100;
    IRouter router = IRouter(routerAddress);


    mapping(address => bool) public swapBacker;

    function init() public initializer {
        __Ownable_init();
    }

    receive() external payable {}

    function setAssetAddress(address _assetAddress) external onlyOwner {
        require(_assetAddress != address(0x0), "asset address can not be 0x0");
        assetAddress = _assetAddress;
    }

    function setFeeReceivers(
        address _liquidityReceiver
    ) external onlyOwner {
        liquidityReceiver = _liquidityReceiver;
    }

    function setFees(
        uint256 _burnFees,
        uint256 _liquidityFees
    ) external onlyOwner {
        burnFees = _burnFees;
        liquidityFees = _liquidityFees;
    }

    function setRouter(address _routerAddress) external onlyOwner {
        require(_routerAddress != address(0x0), "Router can not be null");
        routerAddress = _routerAddress;

        IERC20 fromToken = IERC20(assetAddress);
        fromToken.approve(routerAddress, type(uint256).max);

        IERC20 toToken = IERC20(sphereAddress);
        toToken.approve(routerAddress, type(uint256).max);
        router = IRouter(routerAddress);
    }

    function addSwapBacker(address _swapBacker) external onlyOwner {
        require(_swapBacker != address(0x0), "swap backer can not be 0x0");
        require(swapBacker[_swapBacker] != true, "swap backer already set");

        swapBacker[_swapBacker] = true;

        emit AddSwapBacker(_swapBacker);
    }

    function removeSwapBacker(address _swapBacker) external onlyOwner {
        require(_swapBacker != address(0x0), "swap backer can not be 0x0");
        require(swapBacker[_swapBacker], "swap backer is not set");

        swapBacker[_swapBacker] = false;

        emit RemoveSwapBacker(_swapBacker);
    }

    modifier onlySwapBacker() {
        require(swapBacker[msg.sender], "not allowed to swap back");
        _;
    }

    function swapBack()
    external
    override
    onlySwapBacker
    {
        require(liquidityReceiver != address(0x0), "uninitialized liquidity receiver");

        uint256 balance = IERC20(assetAddress).balanceOf(address(this));


        uint256 amountToBurn = balance * burnFees / FEE_DENOMINATOR;
        uint256 amountToLiquify = balance - amountToBurn;


        address[] memory path = new address[](2);
        path[0] = assetAddress;
        path[1] = sphereAddress;

        _burnSphere(amountToBurn, path);
        _swapSphereToLiquidity(amountToLiquify, path);

    }

    function withdrawToken(address tokenAddress) external onlyOwner {
        IERC20 token = IERC20(tokenAddress);
        require(token.balanceOf(address(this)) > 0, "nothing to withdraw");

        token.transfer(msg.sender, token.balanceOf(address(this)));
    }

    function withdrawNativeToken() external onlyOwner {
        require(address(this).balance > 0, "nothing to withdraw");

        uint256 balance = address(this).balance;
        (bool success, bytes memory data) = address(msg.sender).call{value : balance}("");
    }

    function _burnSphere(uint256 amountToBurn, address[] memory path) internal {
        router.swapExactTokensForTokensSimple(
            amountToBurn,
            0,
            path[0],
            path[1],
            false,
            DEAD,
            block.timestamp
        );
    }

    function _buySphere(uint256 amountToBurn, address[] memory path) internal {
        router.swapExactTokensForTokensSimple(
            amountToBurn,
            0,
            path[0],
            path[1],
            false,
            address(this),
            block.timestamp
        );
    }

    function _swapSphereToLiquidity(uint256 amountToLiquify, address[] memory path) internal {

        uint256 toSwap = amountToLiquify / 2;
        amountToLiquify -= toSwap;

        _buySphere(toSwap, path);

        uint256 sphereBalance = IERC20(sphereAddress).balanceOf(address(this));

        router.addLiquidity(
            assetAddress,
            sphereAddress,
            false,
            amountToLiquify,
            sphereBalance,
            0,
            0,
            liquidityReceiver,
            block.timestamp
        );
    }

    event AddSwapBacker(address swapBacker);
    event RemoveSwapBacker(address swapBacker);
    event SwapBack(uint256 amount);
}