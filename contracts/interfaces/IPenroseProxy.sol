// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

interface IPenroseProxy {
  function depositLpAndStake(address dystPoolAddress, uint256 amount) external;
  function depositLp(address dystPoolAddress) external;
  function depositLp(address dystPoolAddress, uint256 amount) external;
  function unstakeLpWithdrawAndClaim(address dystPoolAddress) external;
  function unstakeLpWithdrawAndClaim(address dystPoolAddress, uint256 amount) external;
  function unstakeLpAndWithdraw(address dystPoolAddress) external;
  function unstakeLpAndWithdraw(address dystPoolAddress, uint256 amount) external;
  function withdrawLp(address dystPoolAddress) external;
  function withdrawLp(address dystPoolAddress, uint256 amount) external;
  function stakePenLp(address penPoolAddress) external;
  function stakePenLp(address penPoolAddress, uint256 amount) external;
  function unstakePenLp(address penPoolAddress) external;
  function unstakePenLp(address penPoolAddress, uint256 amount) external;
  function claimStakingRewards(address stakingPoolAddress) external;
  function claimStakingRewards() external;
  function convertDystToPenDyst() external;
  function convertDystToPenDyst(uint256 amount) external;
  function convertDystToPenDystAndStake() external;
  function convertDystToPenDystAndStake(uint256 amount) external;
  function convertNftToPenDyst(uint256 tokenId) external;
  function convertNftToPenDystAndStake(uint256 tokenId) external;
  function stakePenDyst() external;
  function stakePenDyst(uint256 amount) external;
  function stakePenDystInPenV1() external;
  function stakePenDystInPenV1(uint256 amount) external;
  function unstakePenDyst() external;
  function unstakePenDyst(uint256 amount) external;
  function unstakePenDystInPenV1(uint256 amount) external;
  function unstakePenDyst(address stakingAddress, uint256 amount) external;
  function claimPenDystStakingRewards() external;
  function voteLockPen(uint256 amount, uint256 spendRatio) external;
  function withdrawVoteLockedPen(uint256 spendRatio) external;
  function relockVoteLockedPen(uint256 spendRatio) external;
  function claimVlPenStakingRewards() external;
  function vote(address poolAddress, int256 weight) external;
  // function vote(IUserProxy.Vote[] memory votes) external;
  function removeVote(address poolAddress) external;
  function resetVotes() external;
  function setVoteDelegate(address accountAddress) external;
  function clearVoteDelegate() external;
  function whitelist(address tokenAddress) external;
  function claimAllStakingRewards() external;
}