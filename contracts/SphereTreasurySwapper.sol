// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ISphereTreasurySwapper {
    function swapBack() external;
}

contract SphereTreasurySwapper is OwnableUpgradeable, ISphereTreasurySwapper {
    address public routerAddress;

    address public constant DEAD = 0x000000000000000000000000000000000000dEaD;

    address public sphereAddress;
    address public swapbackTokenAddress;

    address public liquidityReceiver;
    address public treasuryReceiver;
    address public riskFreeValueReceiver;
    address public galaxyBondReceiver;

    uint256 public burnFees;
    uint256 public liquidityFees;
    uint256 public treasuryFees;
    uint256 public rfvFees;
    uint256 public galaxyBondFees;
    uint256 public constant FEE_DENOMINATOR = 1000;

    uint256 public maxSwapbackAmount = type(uint256).max;

    mapping(address => bool) public swapBacker;

    function init() public initializer {
        __Ownable_init();
        maxSwapbackAmount = type(uint256).max;
    }

    receive() external payable {}

    function setSphereAddress(address _sphereAddress) external onlyOwner {
        require(_sphereAddress != address(0x0), "sphere address can not be 0x0");
        sphereAddress = _sphereAddress;
    }

    function setSwapbackTokenAddress(address _swapbackTokenAddress) external onlyOwner {
        require(_swapbackTokenAddress != address(0x0), "swapback address can not be 0x0");
        swapbackTokenAddress = _swapbackTokenAddress;
    }

    function setMaxSwapbackAmount(uint256 _maxSwapbackAmount) external onlyOwner {
        if(_maxSwapbackAmount == 0) {
            maxSwapbackAmount = type(uint256).max;
        } else {
            maxSwapbackAmount = _maxSwapbackAmount;
        }
    }

    function setFeeReceivers(
        address _liquidityReceiver,
        address _treasuryReceiver,
        address _riskFreeValueReceiver,
        address _galaxyBondReceiver
    ) external onlyOwner {
        liquidityReceiver = _liquidityReceiver;
        treasuryReceiver = _treasuryReceiver;
        riskFreeValueReceiver = _riskFreeValueReceiver;
        galaxyBondReceiver = _galaxyBondReceiver;
    }

    function setFees(
        uint256 _burnFees,
        uint256 _liquidityFees,
        uint256 _treasuryFees,
        uint256 _rfvFees,
        uint256 _galaxyBondFees
    ) external onlyOwner {
        require(
            (_burnFees + _liquidityFees + _treasuryFees + _rfvFees + _galaxyBondFees) == 1000,
            "Total fees should be 1000"
        );

        burnFees = _burnFees;
        liquidityFees = _liquidityFees;
        treasuryFees = _treasuryFees;
        rfvFees = _rfvFees;
        galaxyBondFees = _galaxyBondFees;
    }

    function setRouter(address _routerAddress) external onlyOwner {
        require(_routerAddress != address(0x0), "Router can not be null");
        routerAddress = _routerAddress;

        IERC20 fromToken = IERC20(sphereAddress);
        fromToken.approve(routerAddress, type(uint256).max);

        IERC20 toToken = IERC20(swapbackTokenAddress);
        toToken.approve(routerAddress, type(uint256).max);
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
        require(treasuryReceiver != address(0x0), "uninitialized liquidity receiver");
        require(riskFreeValueReceiver != address(0x0), "uninitialized liquidity receiver");
        require(galaxyBondReceiver != address(0x0), "uninitialized liquidity receiver");

        uint256 balance = IERC20(sphereAddress).balanceOf(address(this));

        if(balance > maxSwapbackAmount) {
            balance = maxSwapbackAmount;
        }

        uint256 amountToBurn = balance * burnFees / FEE_DENOMINATOR;
        uint256 amountToLiquidify = balance * liquidityFees / 2 / FEE_DENOMINATOR;

        balance -= amountToBurn + amountToLiquidify * 2;

        IERC20(sphereAddress).transfer(address(DEAD), amountToBurn);

        IUniswapV2Router02 router = IUniswapV2Router02(routerAddress);

        address[] memory path = new address[](2);
        path[0] = sphereAddress;
        path[1] = swapbackTokenAddress;

        router.swapExactTokensForTokensSupportingFeeOnTransferTokens(
            balance,
            0,
            path,
            address(this),
            block.timestamp
        );

        uint256 amount = IERC20(swapbackTokenAddress).balanceOf(address(this));
        uint256 amountForTreasury = amount * treasuryFees / FEE_DENOMINATOR;
        uint256 amountForRFV = amount * rfvFees / FEE_DENOMINATOR;
        uint256 amountForGalaxyBonds = amount * galaxyBondFees / FEE_DENOMINATOR;
        uint256 amountToLiquidate = amount - (amountForTreasury + amountForRFV + amountForGalaxyBonds);

        IERC20(swapbackTokenAddress).transfer(treasuryReceiver, amountForTreasury);
        IERC20(swapbackTokenAddress).transfer(riskFreeValueReceiver, amountForRFV);
        IERC20(swapbackTokenAddress).transfer(galaxyBondReceiver, amountForGalaxyBonds);

        router.addLiquidity(
            sphereAddress,
            swapbackTokenAddress,
            amountToLiquidify,
            amountToLiquidate,
            0,
            0,
            liquidityReceiver,
            block.timestamp
        );

        emit SwapBack(balance);
    }

    function withdrawToken(address tokenAddress) external onlyOwner {
        IERC20 token = IERC20(tokenAddress);
        require(token.balanceOf(address(this)) > 0, "nothing to withdraw");

        token.transfer(msg.sender, token.balanceOf(address(this)));
    }

    function withdrawNativeToken() external onlyOwner {
        require(address(this).balance > 0, "nothing to withdraw");

        uint256 balance = address(this).balance;
        (bool success, bytes memory data) = address(msg.sender).call{value: balance}("");
    }

    event AddSwapBacker(address swapBacker);
    event RemoveSwapBacker(address swapBacker);
    event SwapBack(uint256 amount);
}