// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

import "./interfaces/ISphereSettings.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract SphereSettings is Ownable, ISphereSettings {
  using Counters for Counters.Counter;
  Counters.Counter private buyFeeRevision;
  Counters.Counter private sellFeeRevision;
  Counters.Counter private transferFeeRevision;
  Counters.Counter private gameFeeRevision;
  Counters.Counter private feeRevision;

  // *** CONSTANTS ***

  /// @notice Version of the contract
  /// @dev Should be incremented when contract changed
  string public constant SPHERE_SETTINGS_VERSION = "1.0.0";
  uint256 private constant MAX_TAX_BRACKET_FEE_RATE = 50;
  uint256 private constant MAX_TOTAL_BUY_FEE_RATE = 250;
  uint256 private constant MAX_TOTAL_SELL_FEE_RATE = 250;
  uint256 private constant MAX_PARTY_ARRAY = 491;

  mapping(uint => BuyFees) public buyFees;
  mapping(uint => SellFees) public sellFees;
  mapping(uint => TransferFees) public transferFees;
  mapping(uint => Fees) public fees;
  mapping(uint => GameFees) public gameFees;

  constructor() {
    setInitialFees();
  }

  function setInitialFees() internal {
    BuyFees memory initialBuyFees = BuyFees({
      liquidityFee: 50,
      treasuryFee: 30,
      riskFreeValueFee: 50,
      totalFees: 0
    });
    setBuyFees(initialBuyFees);

    SellFees memory initialSellFees = SellFees({
      liquidityFee: 50,
      treasuryFee: 50,
      riskFreeValueFee: 100,
      totalFees: 0
    });
    setSellFees(initialSellFees);

    TransferFees memory initialTransferFees = TransferFees({
      liquidityFee: 50,
      treasuryFee: 30,
      riskFreeValueFee: 50,
      totalFees: 0
    });
    setTransferFees(initialTransferFees);

    Fees memory initialFees = Fees({
      burnFee: 0,
      galaxyBondFee: 0,
      realFeePartyArray: 490,
      isTaxBracketEnabledInMoveFee: false
    });
    setFees(initialFees);

    GameFees memory initialGameFees = GameFees({
      stakeFee: 10,
      depositLimit: 200
    });
    setGameFees(initialGameFees);
  }

  function setBuyFees(BuyFees memory _buyFees) public onlyOwner {
    buyFeeRevision.increment();

    buyFees[buyFeeRevision.current()] = BuyFees({
      liquidityFee: _buyFees.liquidityFee,
      treasuryFee: _buyFees.treasuryFee,
      riskFreeValueFee: _buyFees.riskFreeValueFee,
      totalFees: _buyFees.liquidityFee +  _buyFees.treasuryFee + _buyFees.riskFreeValueFee
    });

    require(buyFees[buyFeeRevision.current()].totalFees < MAX_TOTAL_BUY_FEE_RATE, "Max buy fee rate");

    emit SetBuyFees(buyFees[buyFeeRevision.current()]);
  }

  function currentBuyFees() external view override returns (BuyFees memory) {
    return buyFees[buyFeeRevision.current()];
  }

  function setSellFees(SellFees memory _sellFees) public onlyOwner {
    sellFeeRevision.increment();

    sellFees[sellFeeRevision.current()] = SellFees({
      liquidityFee: _sellFees.liquidityFee,
      treasuryFee: _sellFees.treasuryFee,
      riskFreeValueFee: _sellFees.riskFreeValueFee,
      totalFees: _sellFees.liquidityFee + _sellFees.treasuryFee + _sellFees.riskFreeValueFee
    });

    require(sellFees[sellFeeRevision.current()].totalFees < MAX_TOTAL_SELL_FEE_RATE, "Max sell fee rate");

    emit SetSellFees(sellFees[sellFeeRevision.current()]);
  }

  function currentSellFees() external view override returns (SellFees memory) {
    return sellFees[sellFeeRevision.current()];
  }

  function setTransferFees(TransferFees memory _transferFees) public onlyOwner {
    transferFeeRevision.increment();

    transferFees[transferFeeRevision.current()] = TransferFees({
      liquidityFee: _transferFees.liquidityFee,
      treasuryFee: _transferFees.treasuryFee,
      riskFreeValueFee: _transferFees.riskFreeValueFee,
      totalFees: _transferFees.liquidityFee +  _transferFees.treasuryFee + _transferFees.riskFreeValueFee
    });

    emit SetTransferFees(transferFees[transferFeeRevision.current()]);
  }

  function currentTransferFees() external view override returns (TransferFees memory) {
    return transferFees[transferFeeRevision.current()];
  }

  function setGameFees(GameFees memory _gameFees) public onlyOwner {
    gameFeeRevision.increment();

    gameFees[gameFeeRevision.current()] = GameFees({
      stakeFee: _gameFees.stakeFee,
      depositLimit: _gameFees.depositLimit
    });

    emit SetGameFees(gameFees[gameFeeRevision.current()]);
  }

  function currentGameFees() external view override returns (GameFees memory) {
    return gameFees[gameFeeRevision.current()];
  }

  function setFees(Fees memory _fees) public onlyOwner {
    feeRevision.increment();

    fees[feeRevision.current()] = Fees({
      burnFee: _fees.burnFee,
      galaxyBondFee: _fees.galaxyBondFee,
      realFeePartyArray: _fees.realFeePartyArray,
      isTaxBracketEnabledInMoveFee: _fees.isTaxBracketEnabledInMoveFee
    });

    require(fees[feeRevision.current()].realFeePartyArray < MAX_PARTY_ARRAY, "Max party array rate");

    emit SetFees(fees[feeRevision.current()]);
  }

  function currentFees() external view override returns (Fees memory) {
    return fees[feeRevision.current()];
  }

  function allCurrentFees() external view override returns (
    BuyFees memory,
    SellFees memory,
    GameFees memory,
    Fees memory
  ) {
    return (
      buyFees[buyFeeRevision.current()],
      sellFees[sellFeeRevision.current()],
      gameFees[gameFeeRevision.current()],
      fees[feeRevision.current()]
    );
  }
}
