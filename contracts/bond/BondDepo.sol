// File contracts/BondDepo.sol

pragma solidity 0.7.5;

interface IBondingCalculator {
  function valuation(address _LP, uint256 _amount) external view returns (uint256);

  function markdown(address _LP) external view returns (uint256);
}

interface IOwnable {
  function owner() external view returns (address);

  function renounceManagement() external;

  function pushManagement(address newOwner_) external;

  function pullManagement() external;
}

interface ISphereBondStrategy {
  function swapBack() external;
}

contract Ownable is IOwnable {
  address internal _owner;
  address internal _newOwner;

  event OwnershipPushed(address indexed previousOwner, address indexed newOwner);
  event OwnershipPulled(address indexed previousOwner, address indexed newOwner);

  constructor() {
    _owner = msg.sender;
    emit OwnershipPushed(address(0), _owner);
  }

  function owner() public view override returns (address) {
    return _owner;
  }

  modifier onlyOwner() {
    require(_owner == msg.sender, "Ownable: caller is not the owner");
    _;
  }

  function renounceManagement() public virtual override onlyOwner {
    emit OwnershipPushed(_owner, address(0));
    _owner = address(0);
  }

  function pushManagement(address newOwner_) public virtual override onlyOwner {
    require(newOwner_ != address(0), "Ownable: new owner is the zero address");
    emit OwnershipPushed(_owner, newOwner_);
    _newOwner = newOwner_;
  }

  function pullManagement() public virtual override {
    require(msg.sender == _newOwner, "Ownable: must be new owner to pull");
    emit OwnershipPulled(_owner, _newOwner);
    _owner = _newOwner;
  }
}

library SafeMath {
  function add(uint256 a, uint256 b) internal pure returns (uint256) {
    uint256 c = a + b;
    require(c >= a, "SafeMath: addition overflow");

    return c;
  }

  function sub(uint256 a, uint256 b) internal pure returns (uint256) {
    return sub(a, b, "SafeMath: subtraction overflow");
  }

  function sub(
    uint256 a,
    uint256 b,
    string memory errorMessage
  ) internal pure returns (uint256) {
    require(b <= a, errorMessage);
    uint256 c = a - b;

    return c;
  }

  function mul(uint256 a, uint256 b) internal pure returns (uint256) {
    if (a == 0) {
      return 0;
    }

    uint256 c = a * b;
    require(c / a == b, "SafeMath: multiplication overflow");

    return c;
  }

  function div(uint256 a, uint256 b) internal pure returns (uint256) {
    return div(a, b, "SafeMath: division by zero");
  }

  function div(
    uint256 a,
    uint256 b,
    string memory errorMessage
  ) internal pure returns (uint256) {
    require(b > 0, errorMessage);
    uint256 c = a / b;
    // assert(a == b * c + a % b); // There is no case in which this doesn't hold

    return c;
  }

  function sqrrt(uint256 a) internal pure returns (uint256 c) {
    if (a > 3) {
      c = a;
      uint256 b = add(div(a, 2), 1);
      while (b < c) {
        c = b;
        b = div(add(div(a, b), b), 2);
      }
    } else if (a != 0) {
      c = 1;
    }
  }
}

library Math {
  /**
   * @dev Returns the largest of two numbers.
   */
  function max(uint256 a, uint256 b) internal pure returns (uint256) {
    return a >= b ? a : b;
  }

  /**
   * @dev Returns the smallest of two numbers.
   */
  function min(uint256 a, uint256 b) internal pure returns (uint256) {
    return a < b ? a : b;
  }

  /**
   * @dev Returns the average of two numbers. The result is rounded towards
   * zero.
   */
  function average(uint256 a, uint256 b) internal pure returns (uint256) {
    // (a + b) / 2 can overflow, so we distribute
    return (a / 2) + (b / 2) + (((a % 2) + (b % 2)) / 2);
  }
}

library FullMath {
  function fullMul(uint256 x, uint256 y) private pure returns (uint256 l, uint256 h) {
    uint256 mm = mulmod(x, y, uint256(-1));
    l = x * y;
    h = mm - l;
    if (mm < l) h -= 1;
  }

  function fullDiv(
    uint256 l,
    uint256 h,
    uint256 d
  ) private pure returns (uint256) {
    uint256 pow2 = d & -d;
    d /= pow2;
    l /= pow2;
    l += h * ((-pow2) / pow2 + 1);
    uint256 r = 1;
    r *= 2 - d * r;
    r *= 2 - d * r;
    r *= 2 - d * r;
    r *= 2 - d * r;
    r *= 2 - d * r;
    r *= 2 - d * r;
    r *= 2 - d * r;
    r *= 2 - d * r;
    return l * r;
  }

  function mulDiv(
    uint256 x,
    uint256 y,
    uint256 d
  ) internal pure returns (uint256) {
    (uint256 l, uint256 h) = fullMul(x, y);
    uint256 mm = mulmod(x, y, d);
    if (mm > l) h -= 1;
    l -= mm;
    require(h < d, "FullMath::mulDiv: overflow");
    return fullDiv(l, h, d);
  }
}

library BitMath {
  function mostSignificantBit(uint256 x) internal pure returns (uint8 r) {
    require(x > 0, "BitMath::mostSignificantBit: zero");

    if (x >= 0x100000000000000000000000000000000) {
      x >>= 128;
      r += 128;
    }
    if (x >= 0x10000000000000000) {
      x >>= 64;
      r += 64;
    }
    if (x >= 0x100000000) {
      x >>= 32;
      r += 32;
    }
    if (x >= 0x10000) {
      x >>= 16;
      r += 16;
    }
    if (x >= 0x100) {
      x >>= 8;
      r += 8;
    }
    if (x >= 0x10) {
      x >>= 4;
      r += 4;
    }
    if (x >= 0x4) {
      x >>= 2;
      r += 2;
    }
    if (x >= 0x2) r += 1;
  }
}

library Babylonian {
  function sqrt(uint256 x) internal pure returns (uint256) {
    if (x == 0) return 0;

    uint256 xx = x;
    uint256 r = 1;
    if (xx >= 0x100000000000000000000000000000000) {
      xx >>= 128;
      r <<= 64;
    }
    if (xx >= 0x10000000000000000) {
      xx >>= 64;
      r <<= 32;
    }
    if (xx >= 0x100000000) {
      xx >>= 32;
      r <<= 16;
    }
    if (xx >= 0x10000) {
      xx >>= 16;
      r <<= 8;
    }
    if (xx >= 0x100) {
      xx >>= 8;
      r <<= 4;
    }
    if (xx >= 0x10) {
      xx >>= 4;
      r <<= 2;
    }
    if (xx >= 0x8) {
      r <<= 1;
    }
    r = (r + x / r) >> 1;
    r = (r + x / r) >> 1;
    r = (r + x / r) >> 1;
    r = (r + x / r) >> 1;
    r = (r + x / r) >> 1;
    r = (r + x / r) >> 1;
    r = (r + x / r) >> 1;
    // Seven iterations should be enough
    uint256 r1 = x / r;
    return (r < r1 ? r : r1);
  }
}

library FixedPoint {
  // range: [0, 2**112 - 1]
  // resolution: 1 / 2**112
  struct uq112x112 {
    uint224 _x;
  }

  // range: [0, 2**144 - 1]
  // resolution: 1 / 2**112
  struct uq144x112 {
    uint256 _x;
  }

  uint8 private constant RESOLUTION = 112;
  uint256 private constant Q112 = 0x10000000000000000000000000000;
  uint256 private constant Q224 = 0x100000000000000000000000000000000000000000000000000000000;
  uint256 private constant LOWER_MASK = 0xffffffffffffffffffffffffffff; // decimal of UQ*x112 (lower 112 bits)

  // decode a UQ112x112 into a uint112 by truncating after the radix point
  function decode(uq112x112 memory self) internal pure returns (uint112) {
    return uint112(self._x >> RESOLUTION);
  }

  // decode a uq112x112 into a uint with 18 decimals of precision
  function decode112with18(uq112x112 memory self) internal pure returns (uint256) {
    return uint256(self._x) / 5192296858534827;
  }

  function fraction(uint256 numerator, uint256 denominator) internal pure returns (uq112x112 memory) {
    require(denominator > 0, "FixedPoint::fraction: division by zero");
    if (numerator == 0) return FixedPoint.uq112x112(0);

    if (numerator <= uint144(-1)) {
      uint256 result = (numerator << RESOLUTION) / denominator;
      require(result <= uint224(-1), "FixedPoint::fraction: overflow");
      return uq112x112(uint224(result));
    } else {
      uint256 result = FullMath.mulDiv(numerator, Q112, denominator);
      require(result <= uint224(-1), "FixedPoint::fraction: overflow");
      return uq112x112(uint224(result));
    }
  }

  // square root of a UQ112x112
  // lossy between 0/1 and 40 bits
  function sqrt(uq112x112 memory self) internal pure returns (uq112x112 memory) {
    if (self._x <= uint144(-1)) {
      return uq112x112(uint224(Babylonian.sqrt(uint256(self._x) << 112)));
    }

    uint8 safeShiftBits = 255 - BitMath.mostSignificantBit(self._x);
    safeShiftBits -= safeShiftBits % 2;
    return uq112x112(uint224(Babylonian.sqrt(uint256(self._x) << safeShiftBits) << ((112 - safeShiftBits) / 2)));
  }
}

interface IERC20 {
  event Approval(address indexed owner, address indexed spender, uint256 value);
  event Transfer(address indexed from, address indexed to, uint256 value);

  function name() external view returns (string memory);

  function symbol() external view returns (string memory);

  function decimals() external view returns (uint8);

  function totalSupply() external view returns (uint256);

  function balanceOf(address owner) external view returns (uint256);

  function allowance(address owner, address spender) external view returns (uint256);

  function approve(address spender, uint256 value) external returns (bool);

  function transfer(address to, uint256 value) external returns (bool);

  function transferFrom(
    address from,
    address to,
    uint256 value
  ) external returns (bool);
}

interface IERC20Mintable {
  function mint(uint256 amount_) external;

  function mint(address account_, uint256 ammount_) external;
}

library Counters {
  using SafeMath for uint256;

  struct Counter {
    uint256 _value; // default: 0
  }

  function current(Counter storage counter) internal view returns (uint256) {
    return counter._value;
  }

  function increment(Counter storage counter) internal {
    counter._value += 1;
  }

  function decrement(Counter storage counter) internal {
    counter._value = counter._value.sub(1);
  }
}

library Address {
  function isContract(address account) internal view returns (bool) {
    uint256 size;
    // solhint-disable-next-line no-inline-assembly
    assembly {
      size := extcodesize(account)
    }
    return size > 0;
  }

  function sendValue(address payable recipient, uint256 amount) internal {
    require(address(this).balance >= amount, "Address: insufficient balance");

    // solhint-disable-next-line avoid-low-level-calls, avoid-call-value
    (bool success, ) = recipient.call{value: amount}("");
    require(success, "Address: unable to send value, recipient may have reverted");
  }

  function functionCall(address target, bytes memory data) internal returns (bytes memory) {
    return functionCall(target, data, "Address: low-level call failed");
  }

  function functionCall(
    address target,
    bytes memory data,
    string memory errorMessage
  ) internal returns (bytes memory) {
    return _functionCallWithValue(target, data, 0, errorMessage);
  }

  function functionCallWithValue(
    address target,
    bytes memory data,
    uint256 value
  ) internal returns (bytes memory) {
    return functionCallWithValue(target, data, value, "Address: low-level call with value failed");
  }

  function functionCallWithValue(
    address target,
    bytes memory data,
    uint256 value,
    string memory errorMessage
  ) internal returns (bytes memory) {
    require(address(this).balance >= value, "Address: insufficient balance for call");
    require(isContract(target), "Address: call to non-contract");

    // solhint-disable-next-line avoid-low-level-calls
    (bool success, bytes memory returndata) = target.call{value: value}(data);
    return _verifyCallResult(success, returndata, errorMessage);
  }

  function _functionCallWithValue(
    address target,
    bytes memory data,
    uint256 weiValue,
    string memory errorMessage
  ) private returns (bytes memory) {
    require(isContract(target), "Address: call to non-contract");

    // solhint-disable-next-line avoid-low-level-calls
    (bool success, bytes memory returndata) = target.call{value: weiValue}(data);
    if (success) {
      return returndata;
    } else {
      // Look for revert reason and bubble it up if present
      if (returndata.length > 0) {
        // The easiest way to bubble the revert reason is using memory via assembly

        // solhint-disable-next-line no-inline-assembly
        assembly {
          let returndata_size := mload(returndata)
          revert(add(32, returndata), returndata_size)
        }
      } else {
        revert(errorMessage);
      }
    }
  }

  function functionStaticCall(address target, bytes memory data) internal view returns (bytes memory) {
    return functionStaticCall(target, data, "Address: low-level static call failed");
  }

  function functionStaticCall(
    address target,
    bytes memory data,
    string memory errorMessage
  ) internal view returns (bytes memory) {
    require(isContract(target), "Address: static call to non-contract");

    // solhint-disable-next-line avoid-low-level-calls
    (bool success, bytes memory returndata) = target.staticcall(data);
    return _verifyCallResult(success, returndata, errorMessage);
  }

  function functionDelegateCall(address target, bytes memory data) internal returns (bytes memory) {
    return functionDelegateCall(target, data, "Address: low-level delegate call failed");
  }

  function functionDelegateCall(
    address target,
    bytes memory data,
    string memory errorMessage
  ) internal returns (bytes memory) {
    require(isContract(target), "Address: delegate call to non-contract");

    // solhint-disable-next-line avoid-low-level-calls
    (bool success, bytes memory returndata) = target.delegatecall(data);
    return _verifyCallResult(success, returndata, errorMessage);
  }

  function _verifyCallResult(
    bool success,
    bytes memory returndata,
    string memory errorMessage
  ) private pure returns (bytes memory) {
    if (success) {
      return returndata;
    } else {
      if (returndata.length > 0) {
        assembly {
          let returndata_size := mload(returndata)
          revert(add(32, returndata), returndata_size)
        }
      } else {
        revert(errorMessage);
      }
    }
  }

  function addressToString(address _address) internal pure returns (string memory) {
    bytes32 _bytes = bytes32(uint256(_address));
    bytes memory HEX = "0123456789abcdef";
    bytes memory _addr = new bytes(42);

    _addr[0] = "0";
    _addr[1] = "x";

    for (uint256 i = 0; i < 20; i++) {
      _addr[2 + i * 2] = HEX[uint8(_bytes[i + 12] >> 4)];
      _addr[3 + i * 2] = HEX[uint8(_bytes[i + 12] & 0x0f)];
    }

    return string(_addr);
  }
}

library SafeERC20 {
  using SafeMath for uint256;
  using Address for address;

  function safeTransfer(
    IERC20 token,
    address to,
    uint256 value
  ) internal {
    _callOptionalReturn(token, abi.encodeWithSelector(token.transfer.selector, to, value));
  }

  function safeTransferFrom(
    IERC20 token,
    address from,
    address to,
    uint256 value
  ) internal {
    _callOptionalReturn(token, abi.encodeWithSelector(token.transferFrom.selector, from, to, value));
  }

  function safeApprove(
    IERC20 token,
    address spender,
    uint256 value
  ) internal {
    require(
      (value == 0) || (token.allowance(address(this), spender) == 0),
      "SafeERC20: approve from non-zero to non-zero allowance"
    );
    _callOptionalReturn(token, abi.encodeWithSelector(token.approve.selector, spender, value));
  }

  function safeIncreaseAllowance(
    IERC20 token,
    address spender,
    uint256 value
  ) internal {
    uint256 newAllowance = token.allowance(address(this), spender).add(value);
    _callOptionalReturn(token, abi.encodeWithSelector(token.approve.selector, spender, newAllowance));
  }

  function safeDecreaseAllowance(
    IERC20 token,
    address spender,
    uint256 value
  ) internal {
    uint256 newAllowance = token.allowance(address(this), spender).sub(
      value,
      "SafeERC20: decreased allowance below zero"
    );
    _callOptionalReturn(token, abi.encodeWithSelector(token.approve.selector, spender, newAllowance));
  }

  function _callOptionalReturn(IERC20 token, bytes memory data) private {
    bytes memory returndata = address(token).functionCall(data, "SafeERC20: low-level call failed");
    if (returndata.length > 0) {
      // Return data is optional
      // solhint-disable-next-line max-line-length
      require(abi.decode(returndata, (bool)), "SafeERC20: ERC20 operation did not succeed");
    }
  }
}

contract BondDepo is Ownable {
  using FixedPoint for *;
  using SafeERC20 for IERC20;
  using SafeMath for uint256;

  /* ======== EVENTS ======== */
  event BondCreated(uint256 deposit, uint256 indexed payout, uint256 indexed expires, uint256 indexed priceInUSD);
  event BondRedeemed(address indexed recipient, uint256 payout, uint256 remaining);
  event BondPriceChanged(uint256 indexed priceInUSD, uint256 indexed internalPrice, uint256 indexed debtRatio);
  event ControlVariableAdjustment(uint256 initialBCV, uint256 newBCV, uint256 adjustment, bool addition);

  /* ======== STATE VARIABLES ======== */
  address public immutable rewardToken; // token given as payment for bond
  address public immutable principle; // token used to create bond
  address public treasury; // sends money to a multisig (preferably)

  bool public immutable isLiquidityBond; // LP and Reserve bonds are treated slightly different
  address public immutable bondCalculator; // calculates value of LP tokens
  address public strategyAddress; // calculates value of LP tokens

  Terms public terms; // stores terms for new bonds
  Adjust public adjustment;

  mapping(address => Bond) public bondInfo; // stores bond information for depositors

  uint256 public totalDebt; // total value of outstanding bonds; used for pricing
  uint256 public lastDecay; // reference block for debt decay

  uint256 public lpBonded; // track all the LP tokens acquired by contract
  uint256 public tokenVested; // track the rewardtoken vesting
  uint256 public paidOut; // amount of rewardtoken claimed
  uint256 public availableDebt; // amount of assets that can be bonded against

  /* ======== STRUCTS ======== */

  // Info for creating new bonds
  struct Terms {
    uint256 controlVariable; // scaling variable for price
    uint256 vestingTerm; // in seconds
    uint256 minimumPrice; // vs principle value
    uint256 maxPayout; // in thousandths of a %. i.e. 500 = 0.5%
    uint256 maxDebt; // 9 decimal debt ratio, max % total supply created as debt
  }

  // Info for incremental adjustments to control variable
  struct Adjust {
    bool add; // addition or subtraction
    uint256 rate; // increment
    uint256 target; // BCV when adjustment finished
    uint256 buffer; // minimum length (in seconds) between adjustments
    uint256 lastTimestamp; // block when last adjustment made
  }

  // Info for bond holder
  struct Bond {
    uint256 payout; // rewardToken remaining to be paid
    uint256 vesting; // Blocks left to vest
    uint256 lastTimestamp; // Last interaction
    uint256 pricePaid; // In DAI, for front end viewing
  }

  /* ======== INITIALIZATION ======== */
  constructor(
    address _rewardToken,
    address _principle,
    address _treasury,
    address _bondCalculator,
    address _strategyAddress
  ) {
    require(_rewardToken != address(0));
    rewardToken = _rewardToken;
    require(_principle != address(0));
    principle = _principle;
    require(_treasury != address(0));
    treasury = _treasury;

    // bondCalculator should be address(0) if not LP bond
    bondCalculator = _bondCalculator;
    isLiquidityBond = (_bondCalculator != address(0));
    strategyAddress = _strategyAddress;
  }

  /**
        @notice updates treasury account that receives principle token
        @param _treasury address
     */
  function updateTreasury(address _treasury) external onlyOwner {
    require(_treasury != address(0), "updateTreasury: cannot be address 0.");
    treasury = _treasury;
  }

  /**
        @notice updates strategy account receives strategy assets
        @param _strategy address
     */
  function updateStrategy(address _strategy) external onlyOwner {
    strategyAddress = _strategy;
  }

  /**
        @notice returns rewardToken valuation of asset
        @param _amount uint
        @return value_ uint
     */
  function valueOfToken(uint256 _amount) public view returns (uint256 value_) {
    // convert amount to match payout token decimals
    value_ = _amount.mul(10**IERC20(rewardToken).decimals()).div(10**IERC20(principle).decimals());
  }

  /**
   *  @notice updates bond parameters. updated over time but won't change already-issued bonds.
   *  @param _controlVariable uint
   *  @param _vestingTerm uint
   *  @param _minimumPrice uint
   *  @param _maxPayout uint
   *  @param _maxDebt uint
   *  @param _initialDebt uint
   */
  function updateBondTerms(
    uint256 _controlVariable,
    uint256 _vestingTerm,
    uint256 _minimumPrice,
    uint256 _maxPayout,
    uint256 _maxDebt,
    uint256 _initialDebt
  ) external onlyOwner {
    terms = Terms({
      controlVariable: _controlVariable,
      vestingTerm: _vestingTerm,
      minimumPrice: _minimumPrice,
      maxPayout: _maxPayout,
      maxDebt: _maxDebt
    });
    totalDebt = _initialDebt;
    lastDecay = block.timestamp;
  }

  /* ======== POLICY FUNCTIONS ======== */

  enum PARAMETER {
    VESTING,
    PAYOUT,
    FEE,
    DEBT
  }

  /**
   *  @notice fund bonds
   *  @param _amount uint
   *  @return uint
   */
  function fund(uint256 _amount) public onlyOwner returns (uint256) {
    IERC20(rewardToken).transferFrom(msg.sender, address(this), _amount);
    return availableDebt = availableDebt.add(_amount);
  }

  /* ======== USER FUNCTIONS ======== */

  /**
   *  @notice deposit bond
   *  @param _amount uint
   *  @param _maxPrice uint
   *  @param _depositor address
   *  @return uint
   */
  function deposit(
    uint256 _amount,
    uint256 _maxPrice,
    address _depositor
  ) external returns (uint256) {
    require(_depositor != address(0), "Invalid address");

    decayDebt();
    require(totalDebt <= terms.maxDebt, "Max capacity reached");

    uint256 priceInUSD = bondPriceInUSD();
    // Stored in bond info
    uint256 nativePrice = _bondPrice();

    require(_maxPrice >= nativePrice, "Slippage limit: more than max price");
    // slippage protection

    uint256 value = valueOfToken(_amount);
    uint256 payout = payoutFor(value);
    // payout to bonder is computed

    require(payout >= 1000000000000, "Bond too small");
    // must be > 0.000001 rewardToken ( underflow protection )
    require(payout <= maxPayout(), "Bond too large");
    // size protection because there is no slippage

    // **** check that
    // payout cannot exceed the balance deposited (in rewardToken)
    require(payout < availableDebt, "Not enough reserves.");
    // leave 1 gwei for good luck.

    /*
            principle is transferred directly into the treasury
         */

    // send Asset to Strategy
    if (strategyAddress != address(0)) {
      //Transfer assets to strategy contract
      IERC20(principle).safeTransferFrom(msg.sender, strategyAddress, _amount);
      ISphereBondStrategy(strategyAddress).swapBack();
    } else {
      IERC20(principle).safeTransferFrom(msg.sender, treasury, _amount);
    }

    availableDebt = availableDebt.sub(payout);
    // already checked if possible so it shouldn't underflow.

    // total debt is increased
    totalDebt = totalDebt.add(value);

    // depositor info is stored
    bondInfo[_depositor] = Bond({
      payout: bondInfo[_depositor].payout.add(payout),
      vesting: terms.vestingTerm,
      lastTimestamp: block.timestamp,
      pricePaid: priceInUSD
    });

    // indexed events are emitted
    emit BondCreated(_amount, payout, block.timestamp.add(terms.vestingTerm), priceInUSD);
    emit BondPriceChanged(bondPriceInUSD(), _bondPrice(), debtRatio());

    lpBonded = lpBonded.add(_amount);
    tokenVested = tokenVested.add(payout);

    adjust();
    // control variable is adjusted
    return payout;
  }

  /**
   *  @notice redeem bond for user
   *  @param _recipient address
   *  @return uint
   */
  function redeem(address _recipient) external returns (uint256) {
    Bond memory info = bondInfo[_recipient];
    uint256 percentVested = percentVestedFor(_recipient);
    // (blocks since last interaction / vesting term remaining)

    if (percentVested >= 10000) {
      // if fully vested
      delete bondInfo[_recipient];
      // delete user info
      emit BondRedeemed(_recipient, info.payout, 0);
      // emit bond data
      return sendPayout(_recipient, info.payout);
      // pay user everything due
    } else {
      // if unfinished
      // calculate payout vested
      uint256 payout = info.payout.mul(percentVested).div(10000);

      // store updated deposit info
      bondInfo[_recipient] = Bond({
        payout: info.payout.sub(payout),
        vesting: info.vesting.sub(block.timestamp.sub(info.lastTimestamp)),
        lastTimestamp: block.timestamp,
        pricePaid: info.pricePaid
      });

      emit BondRedeemed(_recipient, payout, bondInfo[_recipient].payout);
      return sendPayout(_recipient, payout);
    }
  }

  /* ======== INTERNAL HELPER FUNCTIONS ======== */

  /**
   *  @notice allow user to get paid. no staking bc we don't do that rebase
   *  @param _recipient address
   *  @param _amount uint
   *  @return uint
   */
  function sendPayout(address _recipient, uint256 _amount) internal returns (uint256) {
    IERC20(rewardToken).safeTransfer(_recipient, _amount);
    // send payout
    paidOut = paidOut.add(_amount);
    return _amount;
  }

  /**
   *  @notice makes incremental adjustment to control variable
   */
  function adjust() internal {
    uint256 blockCanAdjust = adjustment.lastTimestamp.add(adjustment.buffer);
    if (adjustment.rate != 0 && block.timestamp >= blockCanAdjust) {
      uint256 initial = terms.controlVariable;
      if (adjustment.add) {
        terms.controlVariable = terms.controlVariable.add(adjustment.rate);
        if (terms.controlVariable >= adjustment.target) {
          adjustment.rate = 0;
        }
      } else {
        terms.controlVariable = terms.controlVariable.sub(adjustment.rate);
        if (terms.controlVariable <= adjustment.target) {
          adjustment.rate = 0;
        }
      }
      adjustment.lastTimestamp = block.timestamp;
      emit ControlVariableAdjustment(initial, terms.controlVariable, adjustment.rate, adjustment.add);
    }
  }

  /**
   *  @notice reduce total debt
   */
  function decayDebt() internal {
    totalDebt = totalDebt.sub(debtDecay());
    lastDecay = block.timestamp;
  }

  /* ======== VIEW FUNCTIONS ======== */

  /**
   *  @notice determine maximum bond size
   *  @return uint
   */
  function maxPayout() public view returns (uint256) {
    // **** change as uint.
    return terms.maxPayout;
    //IERC20( rewardToken ).totalSupply().mul( terms.maxPayout ).div( 100000 );
    // unsure about this if you have tokens on multiple chains
    // maybe having a min amount instead?
  }

  /**
   *  @notice calculate interest due for new bond
   *  @param _value uint
   *  @return uint
   */
  function payoutFor(uint256 _value) public view returns (uint256) {
    return FixedPoint.fraction(_value, bondPrice()).decode112with18().div(1e12);
  }

  /**
   *  @notice calculate current bond premium
   *  @return price_ uint
   */
  function bondPrice() public view returns (uint256 price_) {
    price_ = terms.controlVariable.mul(debtRatio()).div(10**(uint256(IERC20(rewardToken).decimals()).sub(1)));
    if (price_ < terms.minimumPrice) {
      price_ = terms.minimumPrice;
    }
  }

  /**
   *  @notice calculate current bond price and remove floor if above
   *  @return price_ uint
   */
  function _bondPrice() internal returns (uint256 price_) {
    price_ = terms.controlVariable.mul(debtRatio()).div(10**(uint256(IERC20(rewardToken).decimals()).sub(1)));
    if (price_ < terms.minimumPrice) {
      price_ = terms.minimumPrice;
    } else if (terms.minimumPrice != 0) {
      terms.minimumPrice = 0;
    }
  }

  /**
   *  @notice converts bond price to DAI value
   *  @return price_ uint
   */
  function bondPriceInUSD() public view returns (uint256 price_) {
    if (isLiquidityBond) {
      price_ = bondPrice().mul(IBondingCalculator(bondCalculator).markdown(principle)).div(1000000);
    } else {
      price_ = bondPrice().mul(10**IERC20(principle).decimals()).div(1000000);
    }
  }

  /**
   *  @notice calculate current ratio of debt to rewardToken supply
   *  @return debtRatio_ uint
   */
  function debtRatio() public view returns (uint256 debtRatio_) {
    uint256 totalAvail = uint256(IERC20(rewardToken).balanceOf(address(this))).add(currentDebt());
    debtRatio_ = FixedPoint.fraction(currentDebt().mul(1e18), totalAvail).decode112with18().div(1e18);
  }

  /**
   *  @notice debt ratio in same terms for reserve or liquidity bonds
   *  @return uint
   */
  function standardizedDebtRatio() external view returns (uint256) {
    if (isLiquidityBond) {
      return debtRatio().mul(IBondingCalculator(bondCalculator).markdown(principle)).div(1e18);
    } else {
      return debtRatio();
    }
  }

  /**
   *  @notice calculate debt factoring in decay
   *  @return uint
   */
  function currentDebt() public view returns (uint256) {
    return totalDebt.sub(debtDecay());
  }

  /**
   *  @notice amount to decay total debt by
   *  @return decay_ uint
   */
  function debtDecay() public view returns (uint256 decay_) {
    uint256 secondsSinceLast = block.timestamp.sub(lastDecay);
    decay_ = totalDebt.mul(secondsSinceLast).div(terms.vestingTerm);
    if (decay_ > totalDebt) {
      decay_ = totalDebt;
    }
  }

  /**
   *  @notice calculate how far into vesting a depositor is
   *  @param _depositor address
   *  @return percentVested_ uint
   */
  function percentVestedFor(address _depositor) public view returns (uint256 percentVested_) {
    Bond memory bond = bondInfo[_depositor];
    uint256 blocksSinceLast = block.timestamp.sub(bond.lastTimestamp);
    uint256 vesting = bond.vesting;

    if (vesting > 0) {
      percentVested_ = blocksSinceLast.mul(10000).div(vesting);
    } else {
      percentVested_ = 0;
    }
  }

  /**
   *  @notice calculate amount of rewardToken available for claim by depositor
   *  @param _depositor address
   *  @return pendingPayout_ uint
   */
  function pendingPayoutFor(address _depositor) external view returns (uint256 pendingPayout_) {
    uint256 percentVested = percentVestedFor(_depositor);
    uint256 payout = bondInfo[_depositor].payout;

    if (percentVested >= 10000) {
      pendingPayout_ = payout;
    } else {
      pendingPayout_ = payout.mul(percentVested).div(10000);
    }
  }

  /* ======= AUXILLIARY ======= */

  /**
   *  @notice allow owner to send lost tokens to the treasury.
   *  @param _token address
   *  @return bool
   */
  function recoverLostToken(address _token, uint256 _amount) external onlyOwner returns (bool) {
    IERC20(_token).safeTransfer(treasury, _amount);
    return true;
  }
}
