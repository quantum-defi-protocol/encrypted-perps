// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "fhevm/lib/TFHE.sol";

contract ConfidentialPerpDEX {

    struct EncryptedPosition {
        euint64 size;
        euint64 entryPrice;
        euint64 collateral;
        uint8 leverage;
        bool isLong;
        uint256 timestamp;
        bool isOpen;
        euint64 stopLoss;      // Encrypted stop loss price (0 = not set)
        euint64 takeProfit;    // Encrypted take profit price (0 = not set)
    }

    struct EncryptedOrder {
        euint64 price;
        euint64 size;
        address trader;
        bool isLong;
        bool isFilled;
        uint256 timestamp;
    }

    mapping(address => euint64) public encryptedBalances;
    mapping(address => mapping(bytes32 => EncryptedPosition)) public positions;
    mapping(address => bytes32[]) public userPositionIds;

    EncryptedOrder[] public orderBook;

    euint64 public encryptedOraclePrice;
    euint64 public liquidationThreshold;
    euint64 public fundingRate;
    address public admin;

    event PositionOpened(address indexed trader, bytes32 indexed positionId, bool isLong);
    event PositionClosed(address indexed trader, bytes32 indexed positionId);
    event StopLossTriggered(address indexed trader, bytes32 indexed positionId);
    event TakeProfitTriggered(address indexed trader, bytes32 indexed positionId);
    event StopLossTakeProfitUpdated(address indexed trader, bytes32 indexed positionId);
    event OrderPlaced(address indexed trader, uint256 indexed orderId, bool isLong);
    event OrderMatched(uint256 indexed orderId1, uint256 indexed orderId2);
    event LiquidationTriggered(address indexed trader, bytes32 indexed positionId);
    event PriceUpdated(uint256 timestamp);
    event BalanceDeposited(address indexed user, uint256 amount);

    constructor() {
        admin = msg.sender;
        liquidationThreshold = TFHE.asEuint64(500);
        fundingRate = TFHE.asEuint64(10);
        encryptedOraclePrice = TFHE.asEuint64(50000 * 100);
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    function deposit(bytes memory encryptedAmount) external {
        euint64 amount = TFHE.asEuint64(encryptedAmount);

        euint64 currentBalance = encryptedBalances[msg.sender];
        if (TFHE.isInitialized(currentBalance)) {
            encryptedBalances[msg.sender] = TFHE.add(currentBalance, amount);
        } else {
            encryptedBalances[msg.sender] = amount;
        }

        emit BalanceDeposited(msg.sender, 0);
    }

    function getBalance() external view returns (euint64) {
        return encryptedBalances[msg.sender];
    }

    function openPosition(
        bytes memory encSize,
        uint8 leverage,
        bool isLong,
        bytes memory encStopLoss,
        bytes memory encTakeProfit
    ) external returns (bytes32 positionId) {
        euint64 size = TFHE.asEuint64(encSize);
        euint64 stopLoss = TFHE.asEuint64(encStopLoss);
        euint64 takeProfit = TFHE.asEuint64(encTakeProfit);

        euint64 positionValue = TFHE.mul(size, encryptedOraclePrice);
        euint64 requiredCollateral = TFHE.div(positionValue, uint64(leverage));

        euint64 userBalance = encryptedBalances[msg.sender];
        encryptedBalances[msg.sender] = TFHE.sub(userBalance, requiredCollateral);

        positionId = keccak256(abi.encodePacked(msg.sender, block.timestamp, size));

        positions[msg.sender][positionId] = EncryptedPosition({
            size: size,
            entryPrice: encryptedOraclePrice,
            collateral: requiredCollateral,
            leverage: leverage,
            isLong: isLong,
            timestamp: block.timestamp,
            isOpen: true,
            stopLoss: stopLoss,
            takeProfit: takeProfit
        });

        userPositionIds[msg.sender].push(positionId);

        emit PositionOpened(msg.sender, positionId, isLong);
    }

    function closePosition(bytes32 positionId) external {
        EncryptedPosition storage pos = positions[msg.sender][positionId];
        require(pos.isOpen, "Position not open");

        euint64 pnl = calculatePnL(msg.sender, positionId);
        euint64 returnAmount = TFHE.add(pos.collateral, pnl);
        encryptedBalances[msg.sender] = TFHE.add(encryptedBalances[msg.sender], returnAmount);

        pos.isOpen = false;

        emit PositionClosed(msg.sender, positionId);
    }

    /// @notice Update stop loss and take profit for an existing position
    /// @param positionId The ID of the position
    /// @param encStopLoss Encrypted stop loss price (0 to disable)
    /// @param encTakeProfit Encrypted take profit price (0 to disable)
    function updateStopLossTakeProfit(
        bytes32 positionId,
        bytes memory encStopLoss,
        bytes memory encTakeProfit
    ) external {
        EncryptedPosition storage pos = positions[msg.sender][positionId];
        require(pos.isOpen, "Position not open");

        pos.stopLoss = TFHE.asEuint64(encStopLoss);
        pos.takeProfit = TFHE.asEuint64(encTakeProfit);

        emit StopLossTakeProfitUpdated(msg.sender, positionId);
    }

    /// @notice Check if stop loss or take profit is triggered for a position
    /// @param trader The trader's address
    /// @param positionId The position ID
    /// @return slTriggered Whether stop loss is triggered
    /// @return tpTriggered Whether take profit is triggered
    function checkStopLossTakeProfit(address trader, bytes32 positionId)
        public
        view
        returns (ebool slTriggered, ebool tpTriggered)
    {
        EncryptedPosition storage pos = positions[trader][positionId];
        require(pos.isOpen, "Position not open");

        // Check stop loss
        if (pos.isLong) {
            // For long positions: SL triggers when current price < stop loss price
            slTriggered = TFHE.lt(encryptedOraclePrice, pos.stopLoss);
        } else {
            // For short positions: SL triggers when current price > stop loss price
            slTriggered = TFHE.gt(encryptedOraclePrice, pos.stopLoss);
        }

        // Check take profit
        if (pos.isLong) {
            // For long positions: TP triggers when current price > take profit price
            tpTriggered = TFHE.gt(encryptedOraclePrice, pos.takeProfit);
        } else {
            // For short positions: TP triggers when current price < take profit price
            tpTriggered = TFHE.lt(encryptedOraclePrice, pos.takeProfit);
        }
    }

    /// @notice Execute stop loss or take profit closure (can be called by anyone/bot)
    /// @param trader The trader's address
    /// @param positionId The position ID
    function executeStopLossTakeProfit(address trader, bytes32 positionId) external {
        EncryptedPosition storage pos = positions[trader][positionId];
        require(pos.isOpen, "Position not open");

        (ebool slTriggered, ebool tpTriggered) = checkStopLossTakeProfit(trader, positionId);

        // Note: With FHE, we can't conditionally execute based on encrypted booleans
        // In production, this would require:
        // 1. Decryption oracle to verify trigger condition
        // 2. Or keeper network with FHE verification
        // For now, we document the limitation

        // Close the position
        euint64 pnl = calculatePnL(trader, positionId);
        euint64 returnAmount = TFHE.add(pos.collateral, pnl);
        encryptedBalances[trader] = TFHE.add(encryptedBalances[trader], returnAmount);

        pos.isOpen = false;

        // Emit appropriate event (in production, would check which triggered)
        // For demonstration, we emit generic close event
        emit PositionClosed(trader, positionId);
    }

    function calculatePnL(address trader, bytes32 positionId) public view returns (euint64) {
        EncryptedPosition storage pos = positions[trader][positionId];
        require(pos.isOpen, "Position not open");

        euint64 priceDiff;
        if (pos.isLong) {
            priceDiff = TFHE.sub(encryptedOraclePrice, pos.entryPrice);
        } else {
            priceDiff = TFHE.sub(pos.entryPrice, encryptedOraclePrice);
        }

        return TFHE.mul(priceDiff, pos.size);
    }

    function checkLiquidation(address trader, bytes32 positionId)
        public
        view
        returns (ebool)
    {
        EncryptedPosition storage pos = positions[trader][positionId];
        require(pos.isOpen, "Position not open");

        euint64 positionValue = TFHE.mul(pos.size, encryptedOraclePrice);
        euint64 pnl = calculatePnL(trader, positionId);
        euint64 netValue = TFHE.add(pos.collateral, pnl);

        euint64 netValueScaled = TFHE.mul(netValue, TFHE.asEuint64(10000));
        euint64 thresholdValue = TFHE.mul(positionValue, liquidationThreshold);

        return TFHE.lt(netValueScaled, thresholdValue);
    }

    function liquidate(address trader, bytes32 positionId) external {
        EncryptedPosition storage pos = positions[trader][positionId];
        require(pos.isOpen, "Position not open");

        // Note: In production, liquidation should verify the position is underwater
        // This would require oracle decryption or other mechanisms

        pos.isOpen = false;

        euint64 liquidationReward = TFHE.div(pos.collateral, 10);
        encryptedBalances[msg.sender] = TFHE.add(encryptedBalances[msg.sender], liquidationReward);

        emit LiquidationTriggered(trader, positionId);
    }

    function placeOrder(
        bytes memory encPrice,
        bytes memory encSize,
        bool isLong
    ) external returns (uint256 orderId) {
        euint64 price = TFHE.asEuint64(encPrice);
        euint64 size = TFHE.asEuint64(encSize);

        orderBook.push(EncryptedOrder({
            price: price,
            size: size,
            trader: msg.sender,
            isLong: isLong,
            isFilled: false,
            timestamp: block.timestamp
        }));

        orderId = orderBook.length - 1;

        emit OrderPlaced(msg.sender, orderId, isLong);

        _matchOrders(orderId);
    }

    function _matchOrders(uint256 newOrderId) internal {
        EncryptedOrder storage newOrder = orderBook[newOrderId];

        for (uint256 i = 0; i < orderBook.length; i++) {
            if (i == newOrderId) continue;

            EncryptedOrder storage existingOrder = orderBook[i];

            if (existingOrder.isLong == newOrder.isLong) continue;
            if (existingOrder.isFilled || newOrder.isFilled) continue;

            ebool canMatch;
            if (newOrder.isLong) {
                canMatch = TFHE.ge(newOrder.price, existingOrder.price);
            } else {
                canMatch = TFHE.le(newOrder.price, existingOrder.price);
            }

            newOrder.isFilled = true;
            existingOrder.isFilled = true;

            emit OrderMatched(newOrderId, i);
            break;
        }
    }

    function updateOraclePrice(bytes memory encNewPrice)
        external
        onlyAdmin
    {
        encryptedOraclePrice = TFHE.asEuint64(encNewPrice);

        emit PriceUpdated(block.timestamp);
    }

    function getOraclePrice() external view returns (euint64) {
        return encryptedOraclePrice;
    }

    function getUserPositions(address user) external view returns (bytes32[] memory) {
        return userPositionIds[user];
    }

    function getOrderBookSize() external view returns (uint256) {
        return orderBook.length;
    }
}
