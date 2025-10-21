// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ConfidentialPerpDEXMock
 * @notice Mock version of ConfidentialPerpDEX for testing on non-FHE networks
 * @dev This contract simulates encrypted behavior using regular uint256 types
 * @dev Deploy this to Sepolia/Localhost for testing. Deploy ConfidentialPerpDEX.sol to Zama for real FHE
 */
contract ConfidentialPerpDEXMock {

    struct Position {
        uint256 size;           // Mock encrypted as uint256
        uint256 entryPrice;     // Mock encrypted as uint256
        uint256 collateral;     // Mock encrypted as uint256
        uint8 leverage;
        bool isLong;
        uint256 timestamp;
        bool isOpen;
    }

    struct Order {
        uint256 price;          // Mock encrypted as uint256
        uint256 size;           // Mock encrypted as uint256
        address trader;
        bool isLong;
        bool isFilled;
        uint256 timestamp;
    }

    mapping(address => uint256) public balances;  // Mock encrypted balances
    mapping(address => mapping(bytes32 => Position)) public positions;
    mapping(address => bytes32[]) public userPositionIds;

    Order[] public orderBook;

    uint256 public oraclePrice;
    uint256 public liquidationThreshold;
    uint256 public fundingRate;
    address public admin;

    event PositionOpened(address indexed trader, bytes32 indexed positionId, bool isLong);
    event PositionClosed(address indexed trader, bytes32 indexed positionId);
    event OrderPlaced(address indexed trader, uint256 indexed orderId, bool isLong);
    event OrderMatched(uint256 indexed orderId1, uint256 indexed orderId2);
    event LiquidationTriggered(address indexed trader, bytes32 indexed positionId);
    event PriceUpdated(uint256 timestamp);
    event BalanceDeposited(address indexed user, uint256 amount);

    constructor() {
        admin = msg.sender;
        liquidationThreshold = 500;      // 5% (500 basis points)
        fundingRate = 10;                // 0.1%
        oraclePrice = 50000 * 100;       // $50,000 with 2 decimals
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    /**
     * @notice Deposit funds (mock encrypted)
     * @dev In real FHE version, amount would be encrypted bytes
     */
    function deposit(bytes memory encryptedAmount) external {
        // Mock: decode the "encrypted" amount (in real version this would be FHE decryption)
        uint256 amount = _mockDecrypt(encryptedAmount);

        balances[msg.sender] += amount;

        emit BalanceDeposited(msg.sender, 0);  // Amount hidden
    }

    /**
     * @notice Get balance (returns mock encrypted value)
     */
    function getBalance() external view returns (uint256) {
        return balances[msg.sender];
    }

    /**
     * @notice Open a leveraged position
     */
    function openPosition(
        bytes memory encSize,
        uint8 leverage,
        bool isLong
    ) external returns (bytes32 positionId) {
        uint256 size = _mockDecrypt(encSize);

        uint256 positionValue = size * oraclePrice;
        uint256 requiredCollateral = positionValue / uint256(leverage);

        require(balances[msg.sender] >= requiredCollateral, "Insufficient balance");

        balances[msg.sender] -= requiredCollateral;

        positionId = keccak256(abi.encodePacked(msg.sender, block.timestamp, size));

        positions[msg.sender][positionId] = Position({
            size: size,
            entryPrice: oraclePrice,
            collateral: requiredCollateral,
            leverage: leverage,
            isLong: isLong,
            timestamp: block.timestamp,
            isOpen: true
        });

        userPositionIds[msg.sender].push(positionId);

        emit PositionOpened(msg.sender, positionId, isLong);
    }

    /**
     * @notice Close a position and realize PnL
     */
    function closePosition(bytes32 positionId) external {
        Position storage pos = positions[msg.sender][positionId];
        require(pos.isOpen, "Position not open");

        uint256 pnl = calculatePnL(msg.sender, positionId);
        uint256 returnAmount = pos.collateral + pnl;
        balances[msg.sender] += returnAmount;

        pos.isOpen = false;

        emit PositionClosed(msg.sender, positionId);
    }

    /**
     * @notice Calculate PnL for a position
     */
    function calculatePnL(address trader, bytes32 positionId) public view returns (uint256) {
        Position storage pos = positions[trader][positionId];
        require(pos.isOpen, "Position not open");

        uint256 priceDiff;
        if (pos.isLong) {
            if (oraclePrice > pos.entryPrice) {
                priceDiff = oraclePrice - pos.entryPrice;
            } else {
                priceDiff = 0;  // Simplified: no negative PnL in mock
            }
        } else {
            if (pos.entryPrice > oraclePrice) {
                priceDiff = pos.entryPrice - oraclePrice;
            } else {
                priceDiff = 0;
            }
        }

        return priceDiff * pos.size;
    }

    /**
     * @notice Check if position can be liquidated
     */
    function checkLiquidation(address trader, bytes32 positionId)
        public
        view
        returns (bool)
    {
        Position storage pos = positions[trader][positionId];
        require(pos.isOpen, "Position not open");

        uint256 positionValue = pos.size * oraclePrice;
        uint256 pnl = calculatePnL(trader, positionId);
        uint256 netValue = pos.collateral + pnl;

        uint256 netValueScaled = netValue * 10000;
        uint256 thresholdValue = positionValue * liquidationThreshold;

        return netValueScaled < thresholdValue;
    }

    /**
     * @notice Liquidate an undercollateralized position
     */
    function liquidate(address trader, bytes32 positionId) external {
        Position storage pos = positions[trader][positionId];
        require(pos.isOpen, "Position not open");

        // In mock version, we can actually check this
        bool isLiquidatable = checkLiquidation(trader, positionId);
        require(isLiquidatable, "Position not liquidatable");

        pos.isOpen = false;

        uint256 liquidationReward = pos.collateral / 10;  // 10% reward
        balances[msg.sender] += liquidationReward;

        emit LiquidationTriggered(trader, positionId);
    }

    /**
     * @notice Place a limit order
     */
    function placeOrder(
        bytes memory encPrice,
        bytes memory encSize,
        bool isLong
    ) external returns (uint256 orderId) {
        uint256 price = _mockDecrypt(encPrice);
        uint256 size = _mockDecrypt(encSize);

        orderBook.push(Order({
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

    /**
     * @notice Internal order matching logic
     */
    function _matchOrders(uint256 newOrderId) internal {
        Order storage newOrder = orderBook[newOrderId];

        for (uint256 i = 0; i < orderBook.length; i++) {
            if (i == newOrderId) continue;

            Order storage existingOrder = orderBook[i];

            if (existingOrder.isLong == newOrder.isLong) continue;
            if (existingOrder.isFilled || newOrder.isFilled) continue;

            bool canMatch;
            if (newOrder.isLong) {
                canMatch = newOrder.price >= existingOrder.price;
            } else {
                canMatch = newOrder.price <= existingOrder.price;
            }

            if (canMatch) {
                newOrder.isFilled = true;
                existingOrder.isFilled = true;

                emit OrderMatched(newOrderId, i);
                break;
            }
        }
    }

    /**
     * @notice Update oracle price (admin only)
     */
    function updateOraclePrice(bytes memory encNewPrice)
        external
        onlyAdmin
    {
        oraclePrice = _mockDecrypt(encNewPrice);

        emit PriceUpdated(block.timestamp);
    }

    /**
     * @notice Get current oracle price
     */
    function getOraclePrice() external view returns (uint256) {
        return oraclePrice;
    }

    /**
     * @notice Get all position IDs for a user
     */
    function getUserPositions(address user) external view returns (bytes32[] memory) {
        return userPositionIds[user];
    }

    /**
     * @notice Get order book size
     */
    function getOrderBookSize() external view returns (uint256) {
        return orderBook.length;
    }

    /**
     * @dev Mock decryption function
     * @notice In real FHE version, this would use TFHE.asEuint64()
     */
    function _mockDecrypt(bytes memory data) internal pure returns (uint256) {
        // Simple mock: convert bytes to uint256
        // In production this would be actual FHE decryption
        if (data.length == 0) return 0;
        if (data.length < 32) {
            // Pad the data
            bytes memory padded = new bytes(32);
            for (uint i = 0; i < data.length; i++) {
                padded[32 - data.length + i] = data[i];
            }
            return uint256(bytes32(padded));
        }
        return uint256(bytes32(data));
    }

    /**
     * @notice Helper to encode values for testing
     * @dev Frontend would use this to "encrypt" values
     */
    function mockEncrypt(uint256 value) external pure returns (bytes memory) {
        return abi.encodePacked(value);
    }
}
