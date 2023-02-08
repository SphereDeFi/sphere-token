// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

import "../../interface/IERC20.sol";
import "../../interface/IERC721Metadata.sol";
import "../../interface/IPair.sol";
import "../../interface/IFactory.sol";
import "../../interface/ICallee.sol";
import "../../interface/IUnderlying.sol";
import "./PairFees.sol";
import "../../lib/Math.sol";
import "../../lib/SafeERC20.sol";
import "../Reentrancy.sol";

// The base pair of pools, either stable or volatile
contract DystPair is IERC20, IPair, Reentrancy {
  using SafeERC20 for IERC20;

  string public name;
  string public symbol;
  uint8 public constant decimals = 18;

  /// @dev Used to denote stable or volatile pair
  bool public immutable stable;

  uint public override totalSupply = 0;

  mapping(address => mapping(address => uint)) public override allowance;
  mapping(address => uint) public override balanceOf;

  bytes32 public immutable DOMAIN_SEPARATOR;
  // keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
  bytes32 public constant PERMIT_TYPEHASH = 0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9;
  uint internal constant _FEE_PRECISION = 1e32;
  mapping(address => uint) public nonces;
  uint public immutable chainId;

  uint internal constant MINIMUM_LIQUIDITY = 10 ** 3;
  /// @dev 0.05% swap fee
  uint internal constant SWAP_FEE = 2000;
  /// @dev 50% of swap fee
  uint internal constant TREASURY_FEE = 2;
  /// @dev Capture oracle reading every 30 minutes
  uint internal constant PERIOD_SIZE = 1800;

  address public immutable override token0;
  address public immutable override token1;
  address public immutable fees;
  address public immutable factory;
  address public immutable treasury;

  Observation[] public observations;

  uint internal immutable decimals0;
  uint internal immutable decimals1;

  uint public reserve0;
  uint public reserve1;
  uint public blockTimestampLast;

  uint public reserve0CumulativeLast;
  uint public reserve1CumulativeLast;

  // index0 and index1 are used to accumulate fees,
  // this is split out from normal trades to keep the swap "clean"
  // this further allows LP holders to easily claim fees for tokens they have/staked
  uint public index0 = 0;
  uint public index1 = 0;

  // position assigned to each LP to track their current index0 & index1 vs the global position
  mapping(address => uint) public supplyIndex0;
  mapping(address => uint) public supplyIndex1;

  // tracks the amount of unclaimed, but claimable tokens off of fees for token0 and token1
  mapping(address => uint) public claimable0;
  mapping(address => uint) public claimable1;

  event Treasury(address indexed sender, uint amount0, uint amount1);
  event Fees(address indexed sender, uint amount0, uint amount1);
  event Mint(address indexed sender, uint amount0, uint amount1);
  event Burn(address indexed sender, uint amount0, uint amount1, address indexed to);
  event Swap(
    address indexed sender,
    uint amount0In,
    uint amount1In,
    uint amount0Out,
    uint amount1Out,
    address indexed to
  );
  event Sync(uint reserve0, uint reserve1);
  event Claim(address indexed sender, address indexed recipient, uint amount0, uint amount1);

  constructor() {
    factory = msg.sender;
    treasury = IFactory(msg.sender).treasury();
    (address _token0, address _token1, bool _stable) = IFactory(msg.sender).getInitializable();
    (token0, token1, stable) = (_token0, _token1, _stable);
    fees = address(new PairFees(_token0, _token1));
    if (_stable) {
      name = string(abi.encodePacked("StableV1 AMM - ", IERC721Metadata(_token0).symbol(), "/", IERC721Metadata(_token1).symbol()));
      symbol = string(abi.encodePacked("sAMM-", IERC721Metadata(_token0).symbol(), "/", IERC721Metadata(_token1).symbol()));
    } else {
      name = string(abi.encodePacked("VolatileV1 AMM - ", IERC721Metadata(_token0).symbol(), "/", IERC721Metadata(_token1).symbol()));
      symbol = string(abi.encodePacked("vAMM-", IERC721Metadata(_token0).symbol(), "/", IERC721Metadata(_token1).symbol()));
    }

    decimals0 = 10 ** IUnderlying(_token0).decimals();
    decimals1 = 10 ** IUnderlying(_token1).decimals();

    observations.push(Observation(block.timestamp, 0, 0));

    DOMAIN_SEPARATOR = keccak256(
      abi.encode(
        keccak256('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)'),
        keccak256(bytes(name)),
        keccak256('1'),
        block.chainid,
        address(this)
      )
    );
    chainId = block.chainid;
  }

  function observationLength() external view returns (uint) {
    return observations.length;
  }

  function lastObservation() public view returns (Observation memory) {
    return observations[observations.length - 1];
  }

  function metadata() external view returns (
    uint dec0,
    uint dec1,
    uint r0,
    uint r1,
    bool st,
    address t0,
    address t1
  ) {
    return (decimals0, decimals1, reserve0, reserve1, stable, token0, token1);
  }

  function tokens() external view override returns (address, address) {
    return (token0, token1);
  }

  /// @dev Claim accumulated but unclaimed fees (viewable via claimable0 and claimable1)
  function claimFees() external override returns (uint claimed0, uint claimed1) {
    _updateFor(msg.sender);

    claimed0 = claimable0[msg.sender];
    claimed1 = claimable1[msg.sender];

    if (claimed0 > 0 || claimed1 > 0) {
      claimable0[msg.sender] = 0;
      claimable1[msg.sender] = 0;

      PairFees(fees).claimFeesFor(msg.sender, claimed0, claimed1);

      emit Claim(msg.sender, msg.sender, claimed0, claimed1);
    }
  }

  /// @dev Accrue fees on token0
  function _update0(uint amount) internal {
    uint toTreasury = amount / TREASURY_FEE;
    uint toFees = amount - toTreasury;

    // transfer the fees out to PairFees and Treasury
    IERC20(token0).safeTransfer(treasury, toTreasury);
    IERC20(token0).safeTransfer(fees, toFees);
    // 1e32 adjustment is removed during claim
    uint _ratio = toFees * _FEE_PRECISION / totalSupply;
    if (_ratio > 0) {
      index0 += _ratio;
    }
    // keep the same structure of events for compatability
    emit Treasury(msg.sender, toTreasury, 0);
    emit Fees(msg.sender, toFees, 0);
  }

  /// @dev Accrue fees on token1
  function _update1(uint amount) internal {
    uint toTreasury = amount / TREASURY_FEE;
    uint toFees = amount - toTreasury;

    IERC20(token1).safeTransfer(treasury, toTreasury);
    IERC20(token1).safeTransfer(fees, toFees);
    uint _ratio = toFees * _FEE_PRECISION / totalSupply;
    if (_ratio > 0) {
      index1 += _ratio;
    }
    // keep the same structure of events for compatability
    emit Treasury(msg.sender, 0, toTreasury);
    emit Fees(msg.sender, 0, toFees);
  }

  /// @dev This function MUST be called on any balance changes,
  ///      otherwise can be used to infinitely claim fees
  //       Fees are segregated from core funds, so fees can never put liquidity at risk
  function _updateFor(address recipient) internal {
    uint _supplied = balanceOf[recipient];
    // get LP balance of `recipient`
    if (_supplied > 0) {
      uint _supplyIndex0 = supplyIndex0[recipient];
      // get last adjusted index0 for recipient
      uint _supplyIndex1 = supplyIndex1[recipient];
      uint _index0 = index0;
      // get global index0 for accumulated fees
      uint _index1 = index1;
      supplyIndex0[recipient] = _index0;
      // update user current position to global position
      supplyIndex1[recipient] = _index1;
      uint _delta0 = _index0 - _supplyIndex0;
      // see if there is any difference that need to be accrued
      uint _delta1 = _index1 - _supplyIndex1;
      if (_delta0 > 0) {
        uint _share = _supplied * _delta0 / _FEE_PRECISION;
        // add accrued difference for each supplied token
        claimable0[recipient] += _share;
      }
      if (_delta1 > 0) {
        uint _share = _supplied * _delta1 / _FEE_PRECISION;
        claimable1[recipient] += _share;
      }
    } else {
      supplyIndex0[recipient] = index0;
      // new users are set to the default global state
      supplyIndex1[recipient] = index1;
    }
  }

  function getReserves() public view override returns (
    uint112 _reserve0,
    uint112 _reserve1,
    uint32 _blockTimestampLast
  ) {
    _reserve0 = uint112(reserve0);
    _reserve1 = uint112(reserve1);
    _blockTimestampLast = uint32(blockTimestampLast);
  }

  /// @dev Update reserves and, on the first call per block, price accumulators
  function _update(uint balance0, uint balance1, uint _reserve0, uint _reserve1) internal {
    uint blockTimestamp = block.timestamp;
    uint timeElapsed = blockTimestamp - blockTimestampLast;
    // overflow is desired
    if (timeElapsed > 0 && _reserve0 != 0 && _reserve1 != 0) {
    unchecked {
      reserve0CumulativeLast += _reserve0 * timeElapsed;
      reserve1CumulativeLast += _reserve1 * timeElapsed;
    }
    }

    Observation memory _point = lastObservation();
    timeElapsed = blockTimestamp - _point.timestamp;
    // compare the last observation with current timestamp,
    // if greater than 30 minutes, record a new event
    if (timeElapsed > PERIOD_SIZE) {
      observations.push(Observation(blockTimestamp, reserve0CumulativeLast, reserve1CumulativeLast));
    }
    reserve0 = balance0;
    reserve1 = balance1;
    blockTimestampLast = blockTimestamp;
    emit Sync(reserve0, reserve1);
  }

  /// @dev Produces the cumulative price using counterfactuals to save gas and avoid a call to sync.
  function currentCumulativePrices() public view returns (
    uint reserve0Cumulative,
    uint reserve1Cumulative,
    uint blockTimestamp
  ) {
    blockTimestamp = block.timestamp;
    reserve0Cumulative = reserve0CumulativeLast;
    reserve1Cumulative = reserve1CumulativeLast;

    // if time has elapsed since the last update on the pair, mock the accumulated price values
    (uint _reserve0, uint _reserve1, uint _blockTimestampLast) = getReserves();
    if (_blockTimestampLast != blockTimestamp) {
      // subtraction overflow is desired
      uint timeElapsed = blockTimestamp - _blockTimestampLast;
    unchecked {
      reserve0Cumulative += _reserve0 * timeElapsed;
      reserve1Cumulative += _reserve1 * timeElapsed;
    }
    }
  }

  /// @dev Gives the current twap price measured from amountIn * tokenIn gives amountOut
  function current(address tokenIn, uint amountIn) external view returns (uint amountOut) {
    Observation memory _observation = lastObservation();
    (uint reserve0Cumulative, uint reserve1Cumulative,) = currentCumulativePrices();
    if (block.timestamp == _observation.timestamp) {
      _observation = observations[observations.length - 2];
    }

    uint timeElapsed = block.timestamp - _observation.timestamp;
    uint _reserve0 = (reserve0Cumulative - _observation.reserve0Cumulative) / timeElapsed;
    uint _reserve1 = (reserve1Cumulative - _observation.reserve1Cumulative) / timeElapsed;
    amountOut = _getAmountOut(amountIn, tokenIn, _reserve0, _reserve1);
  }

  /// @dev As per `current`, however allows user configured granularity, up to the full window size
  function quote(address tokenIn, uint amountIn, uint granularity)
  external view returns (uint amountOut) {
    uint [] memory _prices = sample(tokenIn, amountIn, granularity, 1);
    uint priceAverageCumulative;
    for (uint i = 0; i < _prices.length; i++) {
      priceAverageCumulative += _prices[i];
    }
    return priceAverageCumulative / granularity;
  }

  /// @dev Returns a memory set of twap prices
  function prices(address tokenIn, uint amountIn, uint points)
  external view returns (uint[] memory) {
    return sample(tokenIn, amountIn, points, 1);
  }

  function sample(address tokenIn, uint amountIn, uint points, uint window)
  public view returns (uint[] memory) {
    uint[] memory _prices = new uint[](points);

    uint length = observations.length - 1;
    uint i = length - (points * window);
    uint nextIndex = 0;
    uint index = 0;

    for (; i < length; i += window) {
      nextIndex = i + window;
      uint timeElapsed = observations[nextIndex].timestamp - observations[i].timestamp;
      uint _reserve0 = (observations[nextIndex].reserve0Cumulative - observations[i].reserve0Cumulative) / timeElapsed;
      uint _reserve1 = (observations[nextIndex].reserve1Cumulative - observations[i].reserve1Cumulative) / timeElapsed;
      _prices[index] = _getAmountOut(amountIn, tokenIn, _reserve0, _reserve1);
      index = index + 1;
    }
    return _prices;
  }

  /// @dev This low-level function should be called from a contract which performs important safety checks
  ///      standard uniswap v2 implementation
  function mint(address to) external lock override returns (uint liquidity) {
    (uint _reserve0, uint _reserve1) = (reserve0, reserve1);
    uint _balance0 = IERC20(token0).balanceOf(address(this));
    uint _balance1 = IERC20(token1).balanceOf(address(this));
    uint _amount0 = _balance0 - _reserve0;
    uint _amount1 = _balance1 - _reserve1;

    uint _totalSupply = totalSupply;
    // gas savings, must be defined here since totalSupply can update in _mintFee
    if (_totalSupply == 0) {
      liquidity = Math.sqrt(_amount0 * _amount1) - MINIMUM_LIQUIDITY;
      // permanently lock the first MINIMUM_LIQUIDITY tokens
      _mint(address(0), MINIMUM_LIQUIDITY);
    } else {
      liquidity = Math.min(_amount0 * _totalSupply / _reserve0, _amount1 * _totalSupply / _reserve1);
    }
    require(liquidity > 0, 'DystPair: INSUFFICIENT_LIQUIDITY_MINTED');
    _mint(to, liquidity);

    _update(_balance0, _balance1, _reserve0, _reserve1);
    emit Mint(msg.sender, _amount0, _amount1);
  }

  /// @dev This low-level function should be called from a contract which performs important safety checks
  ///      standard uniswap v2 implementation
  function burn(address to) external lock override returns (uint amount0, uint amount1) {
    (uint _reserve0, uint _reserve1) = (reserve0, reserve1);
    (address _token0, address _token1) = (token0, token1);
    uint _balance0 = IERC20(_token0).balanceOf(address(this));
    uint _balance1 = IERC20(_token1).balanceOf(address(this));
    uint _liquidity = balanceOf[address(this)];

    // gas savings, must be defined here since totalSupply can update in _mintFee
    uint _totalSupply = totalSupply;
    // using balances ensures pro-rata distribution
    amount0 = _liquidity * _balance0 / _totalSupply;
    // using balances ensures pro-rata distribution
    amount1 = _liquidity * _balance1 / _totalSupply;
    require(amount0 > 0 && amount1 > 0, 'DystPair: INSUFFICIENT_LIQUIDITY_BURNED');
    _burn(address(this), _liquidity);
    IERC20(_token0).safeTransfer(to, amount0);
    IERC20(_token1).safeTransfer(to, amount1);
    _balance0 = IERC20(_token0).balanceOf(address(this));
    _balance1 = IERC20(_token1).balanceOf(address(this));

    _update(_balance0, _balance1, _reserve0, _reserve1);
    emit Burn(msg.sender, amount0, amount1, to);
  }

  /// @dev This low-level function should be called from a contract which performs important safety checks
  function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data) external override lock {
    require(!IFactory(factory).isPaused(), "DystPair: PAUSE");
    require(amount0Out > 0 || amount1Out > 0, 'DystPair: INSUFFICIENT_OUTPUT_AMOUNT');
    (uint _reserve0, uint _reserve1) = (reserve0, reserve1);
    require(amount0Out < _reserve0 && amount1Out < _reserve1, 'DystPair: INSUFFICIENT_LIQUIDITY');
    uint _balance0;
    uint _balance1;
    {// scope for _token{0,1}, avoids stack too deep errors
      (address _token0, address _token1) = (token0, token1);
      require(to != _token0 && to != _token1, 'DystPair: INVALID_TO');
      // optimistically transfer tokens
      if (amount0Out > 0) IERC20(_token0).safeTransfer(to, amount0Out);
      // optimistically transfer tokens
      if (amount1Out > 0) IERC20(_token1).safeTransfer(to, amount1Out);
      // callback, used for flash loans
      if (data.length > 0) ICallee(to).hook(msg.sender, amount0Out, amount1Out, data);
      _balance0 = IERC20(_token0).balanceOf(address(this));
      _balance1 = IERC20(_token1).balanceOf(address(this));
    }
    uint amount0In = _balance0 > _reserve0 - amount0Out ? _balance0 - (_reserve0 - amount0Out) : 0;
    uint amount1In = _balance1 > _reserve1 - amount1Out ? _balance1 - (_reserve1 - amount1Out) : 0;
    require(amount0In > 0 || amount1In > 0, 'DystPair: INSUFFICIENT_INPUT_AMOUNT');
    {// scope for reserve{0,1}Adjusted, avoids stack too deep errors
      (address _token0, address _token1) = (token0, token1);
      // accrue fees for token0 and move them out of pool
      if (amount0In > 0) _update0(amount0In / SWAP_FEE);
      // accrue fees for token1 and move them out of pool
      if (amount1In > 0) _update1(amount1In / SWAP_FEE);
      // since we removed tokens, we need to reconfirm balances,
      // can also simply use previous balance - amountIn/ SWAP_FEE,
      // but doing balanceOf again as safety check
      _balance0 = IERC20(_token0).balanceOf(address(this));
      _balance1 = IERC20(_token1).balanceOf(address(this));
      // The curve, either x3y+y3x for stable pools, or x*y for volatile pools
      require(_k(_balance0, _balance1) >= _k(_reserve0, _reserve1), 'DystPair: K');
    }

    _update(_balance0, _balance1, _reserve0, _reserve1);
    emit Swap(msg.sender, amount0In, amount1In, amount0Out, amount1Out, to);
  }

  /// @dev Force balances to match reserves
  function skim(address to) external lock {
    (address _token0, address _token1) = (token0, token1);
    IERC20(_token0).safeTransfer(to, IERC20(_token0).balanceOf(address(this)) - (reserve0));
    IERC20(_token1).safeTransfer(to, IERC20(_token1).balanceOf(address(this)) - (reserve1));
  }

  // force reserves to match balances
  function sync() external lock {
    _update(
      IERC20(token0).balanceOf(address(this)),
      IERC20(token1).balanceOf(address(this)),
      reserve0,
      reserve1
    );
  }

  function _f(uint x0, uint y) internal pure returns (uint) {
    return x0 * (y * y / 1e18 * y / 1e18) / 1e18 + (x0 * x0 / 1e18 * x0 / 1e18) * y / 1e18;
  }

  function _d(uint x0, uint y) internal pure returns (uint) {
    return 3 * x0 * (y * y / 1e18) / 1e18 + (x0 * x0 / 1e18 * x0 / 1e18);
  }

  function _getY(uint x0, uint xy, uint y) internal pure returns (uint) {
    for (uint i = 0; i < 255; i++) {
      uint yPrev = y;
      uint k = _f(x0, y);
      if (k < xy) {
        uint dy = (xy - k) * 1e18 / _d(x0, y);
        y = y + dy;
      } else {
        uint dy = (k - xy) * 1e18 / _d(x0, y);
        y = y - dy;
      }
      if (Math.closeTo(y, yPrev, 1)) {
        break;
      }
    }
    return y;
  }

  function getAmountOut(uint amountIn, address tokenIn) external view override returns (uint) {
    (uint _reserve0, uint _reserve1) = (reserve0, reserve1);
    // remove fee from amount received
    amountIn -= amountIn / SWAP_FEE;
    return _getAmountOut(amountIn, tokenIn, _reserve0, _reserve1);
  }

  function _getAmountOut(uint amountIn, address tokenIn, uint _reserve0, uint _reserve1) internal view returns (uint) {
    if (stable) {
      uint xy = _k(_reserve0, _reserve1);
      _reserve0 = _reserve0 * 1e18 / decimals0;
      _reserve1 = _reserve1 * 1e18 / decimals1;
      (uint reserveA, uint reserveB) = tokenIn == token0 ? (_reserve0, _reserve1) : (_reserve1, _reserve0);
      amountIn = tokenIn == token0 ? amountIn * 1e18 / decimals0 : amountIn * 1e18 / decimals1;
      uint y = reserveB - _getY(amountIn + reserveA, xy, reserveB);
      return y * (tokenIn == token0 ? decimals1 : decimals0) / 1e18;
    } else {
      (uint reserveA, uint reserveB) = tokenIn == token0 ? (_reserve0, _reserve1) : (_reserve1, _reserve0);
      return amountIn * reserveB / (reserveA + amountIn);
    }
  }

  function _k(uint x, uint y) internal view returns (uint) {
    if (stable) {
      uint _x = x * 1e18 / decimals0;
      uint _y = y * 1e18 / decimals1;
      uint _a = (_x * _y) / 1e18;
      uint _b = ((_x * _x) / 1e18 + (_y * _y) / 1e18);
      // x3y+y3x >= k
      return _a * _b / 1e18;
    } else {
      // xy >= k
      return x * y;
    }
  }

  //****************************************************************************
  //**************************** ERC20 *****************************************
  //****************************************************************************

  function _mint(address dst, uint amount) internal {
    // balances must be updated on mint/burn/transfer
    _updateFor(dst);
    totalSupply += amount;
    balanceOf[dst] += amount;
    emit Transfer(address(0), dst, amount);
  }

  function _burn(address dst, uint amount) internal {
    _updateFor(dst);
    totalSupply -= amount;
    balanceOf[dst] -= amount;
    emit Transfer(dst, address(0), amount);
  }

  function approve(address spender, uint amount) external override returns (bool) {
    require(spender != address(0), "DystPair: Approve to the zero address");
    allowance[msg.sender][spender] = amount;

    emit Approval(msg.sender, spender, amount);
    return true;
  }

  function permit(
    address owner,
    address spender,
    uint value,
    uint deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) external override {
    require(deadline >= block.timestamp, 'DystPair: EXPIRED');
    bytes32 digest = keccak256(
      abi.encodePacked(
        '\x19\x01',
        DOMAIN_SEPARATOR,
        keccak256(abi.encode(PERMIT_TYPEHASH, owner, spender, value, nonces[owner]++, deadline))
      )
    );
    address recoveredAddress = ecrecover(digest, v, r, s);
    require(recoveredAddress != address(0) && recoveredAddress == owner, 'DystPair: INVALID_SIGNATURE');
    allowance[owner][spender] = value;

    emit Approval(owner, spender, value);
  }

  function transfer(address dst, uint amount) external override returns (bool) {
    _transferTokens(msg.sender, dst, amount);
    return true;
  }

  function transferFrom(address src, address dst, uint amount) external override returns (bool) {
    address spender = msg.sender;
    uint spenderAllowance = allowance[src][spender];

    if (spender != src && spenderAllowance != type(uint).max) {
      require(spenderAllowance >= amount, "DystPair: Insufficient allowance");
    unchecked {
      uint newAllowance = spenderAllowance - amount;
      allowance[src][spender] = newAllowance;
      emit Approval(src, spender, newAllowance);
    }
    }

    _transferTokens(src, dst, amount);
    return true;
  }

  function _transferTokens(address src, address dst, uint amount) internal {
    require(dst != address(0), "DystPair: Transfer to the zero address");

    // update fee position for src
    _updateFor(src);
    // update fee position for dst
    _updateFor(dst);

    uint srcBalance = balanceOf[src];
    require(srcBalance >= amount, "DystPair: Transfer amount exceeds balance");
  unchecked {
    balanceOf[src] = srcBalance - amount;
  }

    balanceOf[dst] += amount;

    emit Transfer(src, dst, amount);
  }
}
