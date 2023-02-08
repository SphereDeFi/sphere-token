// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./VaultProxy.sol";
import "./Vault.sol";
import "../interfaces/IDystRouter.sol";
import "../interfaces/IPenroseProxy.sol";
import "../interfaces/IVault.sol";
import "../interfaces/IVaultManager.sol";
import "../interfaces/IVaultProxy.sol";

contract VaultManager is IVaultManager {
  struct Vault {
    address addr;
    uint256 token0Balance;
    uint256 token1Balance;
    uint256 lpAmount;
  }

  mapping(address => Vault) public vaults;
  mapping(uint256 => address) public vaultAddressByIndex;
  uint256 public vaultCount;

  address public owner;
  address public vaultImplementationAddress;

  address public router;
  address public penroseProxy;
  address public token0;
  address public token1;
  address public pen;
  address public dyst;

  string public constant VERSION = "0.0.2";

  modifier onlyOwner {
    require(owner == msg.sender, "Not allowed here");
    _;
  }

  function initialize(
    address _router,
    address _penroseProxy,
    address _token0,
    address _token1,
    address _pen,
    address _dyst
  ) public {

    require(owner == address(0), "Already initialized");
    owner = msg.sender;

    require(_router != address(0), "Router address set to zero");
    router = _router;

    require(_penroseProxy != address(0), "Penrose proxy to zero");
    penroseProxy = _penroseProxy;

    require(_token0 != address(0), "Token 0 set to zero");
    token0 = _token0;

    require(_token1 != address(0), "Token 1 set to zero");
    token1 = _token1;

    require(_pen != address(0), "Pen set to zero");
    pen = _pen;

    require(_dyst != address(0), "Dyst set to zero");
    dyst = _dyst;

    IERC20(token0).approve(router, type(uint256).max);
    IERC20(token1).approve(router, type(uint256).max);

    address lpToken = IDystRouter(router).pairFor(token0, token1, false);
    IERC20(lpToken).approve(router, type(uint256).max);
  }

  function setVaultImplementationAddress(address _addr) external override onlyOwner {
    require(_addr != address(0), "Vault implementation address to zero");
    require(_addr != vaultImplementationAddress, "No new vault implementation");
    vaultImplementationAddress = _addr;

    updateVaults();
  }

  function updateVaults() internal {
    for(uint256 i = 0; i < vaultCount; i++) {
      IVaultProxy(vaultAddressByIndex[i]).updateImplementationAddress(vaultImplementationAddress);
    }
  }

  function transferOwnership(address _newOwner) external override onlyOwner {
    require(_newOwner != owner, "Owner did not changed");
    owner = _newOwner;
  }

  function createVault() external override returns (address) {
    require(vaultImplementationAddress != address(0), "Vault implementation not set");
    require(vaults[msg.sender].addr == address(0), "Vault already exists");

    vaults[msg.sender] = Vault({
      addr: address(new VaultProxy(vaultImplementationAddress, address(this))),
      token0Balance: 0,
      token1Balance: 0,
      lpAmount: 0
    });

    address lpToken = IDystRouter(router).pairFor(token0, token1, false);

    IVault(vaults[msg.sender].addr).initialize(
      lpToken,
      msg.sender,
      penroseProxy,
      pen,
      dyst
    );

    IERC20(lpToken).approve(vaults[msg.sender].addr, type(uint256).max);

    vaultAddressByIndex[vaultCount] = vaults[msg.sender].addr;
    vaultCount++;

    return vaults[msg.sender].addr;
  }

  function addLiquidity(uint256 _amount0, uint256 _amount1) external override returns (uint256) {
    require(vaults[msg.sender].addr != address(0), "No vault");
    Vault storage vault = vaults[msg.sender];

    (uint256 amountA, uint256 amountB, ) =
      IDystRouter(router).quoteAddLiquidity(token0, token1, false, _amount0, _amount1);

    IERC20(token0).transferFrom(msg.sender, address(this), amountA);
    IERC20(token1).transferFrom(msg.sender, address(this), amountB);

    (uint256 rAmountA, uint256 rAmountB, uint256 lpAmount) =
      IDystRouter(router).addLiquidity(
        token0, token1, false,
        amountA, amountB,
        amountA, 0,
        address(this), block.timestamp + 5 minutes
      );

    vault.token0Balance += rAmountA;
    vault.token1Balance += rAmountB;

    IVault(vault.addr).depositLP(lpAmount);

    vault.lpAmount += lpAmount;

    IERC20(token0).transfer(msg.sender, amountA - rAmountA);
    IERC20(token1).transfer(msg.sender, amountB - rAmountB);

    emit AddLiquidity(msg.sender, lpAmount);

    return lpAmount;
  }

  function removeLiquidity(uint256 _lpAmount) external override {
    require(vaults[msg.sender].addr != address(0), "No vault");
    Vault storage vault = vaults[msg.sender];

    require(vaults[msg.sender].lpAmount >= _lpAmount, "Not enough LP");

    IVault(vault.addr).withdrawLP(_lpAmount);

    (uint256 amount0, uint256 amount1) =
      IDystRouter(router).quoteRemoveLiquidity(token0, token1, false, _lpAmount);

    (uint256 amountA, uint256 amountB) = IDystRouter(router).removeLiquidity(
      token0, token1, false,
      _lpAmount, amount0, amount1,
      address(this), block.timestamp + 5 minutes);

    vault.token0Balance -= amountA;
    vault.token1Balance -= amountB;
    vault.lpAmount -= _lpAmount;

    IERC20(token0).transfer(msg.sender, amountA);
    IERC20(token1).transfer(msg.sender, amountB);

    emit RemoveLiquidity(msg.sender, _lpAmount);
  }

  function claimRewards() external override {
    require(vaults[msg.sender].addr != address(0), "No vault");
    IVault(vaults[msg.sender].addr).claimRewards();
  }

  function unstakeAndClaim() external override {
    require(vaults[msg.sender].addr != address(0), "No vault");
    IVault(vaults[msg.sender].addr).unstakeAndClaim();
  }

  function balanceOfSphere(address _vaultOwner) external view returns (uint256) {
    if(vaults[_vaultOwner].addr == address(0)) {
      return 0;
    }

    return vaults[_vaultOwner].token0Balance;
  }

  function liquidityBalanceOf(address _vaultOwner) external view returns (uint256) {
    if(vaults[_vaultOwner].addr == address(0)) {
      return 0;
    }

    return vaults[_vaultOwner].lpAmount;
  }
}