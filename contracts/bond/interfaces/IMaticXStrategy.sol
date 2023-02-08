// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IMaticXStrategy {
  event ClaimMaticXSwap(address indexed _from, uint256 indexed _idx, uint256 _amountClaimed);
  event CollectedInstantWithdrawalFees(uint256 _fees);
  event Paused(address account);
  event RequestMaticXSwap(
    address indexed _from,
    uint256 _amountMaticX,
    uint256 _amountMatic,
    uint256 userSwapRequestsIndex
  );
  event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole);
  event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);
  event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);
  event SetFxStateChildTunnel(address _address);
  event SetInstantPoolOwner(address _address);
  event SetInstantWithdrawalFeeBps(uint256 _feeBps);
  event SetMaticXSwapLockPeriodEvent(uint256 _hours);
  event SetTreasury(address _address);
  event SetTrustedForwarder(address _address);
  event SetVersion(string _version);
  event Unpaused(address account);

  function DEFAULT_ADMIN_ROLE() external view returns (bytes32);

  function INSTANT_POOL_OWNER() external view returns (bytes32);

  function claimMaticXSwap(uint256 _idx) external;

  function claimedMatic() external view returns (uint256);

  function convertMaticToMaticX(uint256 _balance)
    external
    view
    returns (
      uint256,
      uint256,
      uint256
    );

  function convertMaticXToMatic(uint256 _balance)
    external
    view
    returns (
      uint256,
      uint256,
      uint256
    );

  function getAmountAfterInstantWithdrawalFees(uint256 _amount) external view returns (uint256, uint256);

  function getContracts()
    external
    view
    returns (
      address _fxStateChildTunnel,
      address _maticX,
      address _trustedForwarder
    );

  function getMaticXSwapLockPeriod() external view returns (uint256);

  function getRoleAdmin(bytes32 role) external view returns (bytes32);

  function getUserMaticXSwapRequests(address _address) external view returns (IChildPool.MaticXSwapRequest[] memory);

  function grantRole(bytes32 role, address account) external;

  function hasRole(bytes32 role, address account) external view returns (bool);

  function initialize(
    address _fxStateChildTunnel,
    address _maticX,
    address _manager,
    address _instantPoolOwner,
    address _treasury,
    uint256 _instantWithdrawalFeeBps
  ) external;

  function instantPoolMatic() external view returns (uint256);

  function instantPoolMaticX() external view returns (uint256);

  function instantPoolOwner() external view returns (address);

  function instantWithdrawalFeeBps() external view returns (uint256);

  function instantWithdrawalFees() external view returns (uint256);

  function isTrustedForwarder(address _address) external view returns (bool);

  function maticXSwapLockPeriod() external view returns (uint256);

  function paused() external view returns (bool);

  function provideInstantPoolMatic() external payable;

  function provideInstantPoolMaticX(uint256 _amount) external;

  function renounceRole(bytes32 role, address account) external;

  function requestMaticXSwap(uint256 _amount) external returns (uint256);

  function revokeRole(bytes32 role, address account) external;

  function setFxStateChildTunnel(address _address) external;

  function setInstantPoolOwner(address _address) external;

  function setInstantWithdrawalFeeBps(uint256 _feeBps) external;

  function setMaticXSwapLockPeriod(uint256 _hours) external;

  function setTreasury(address _address) external;

  function setTrustedForwarder(address _address) external;

  function setVersion(string memory _version) external;

  function supportsInterface(bytes4 interfaceId) external view returns (bool);

  function swapMaticForMaticXViaInstantPool() external payable;

  function swapMaticXForMaticViaInstantPool(uint256 _amount) external;

  function togglePause() external;

  function treasury() external view returns (address);

  function version() external view returns (string memory);

  function withdrawInstantPoolMatic(uint256 _amount) external;

  function withdrawInstantPoolMaticX(uint256 _amount) external;

  function withdrawInstantWithdrawalFees(uint256 _amount) external;
}

interface IChildPool {
  struct MaticXSwapRequest {
    uint256 amount;
    uint256 requestTime;
    uint256 withdrawalTime;
  }
}
