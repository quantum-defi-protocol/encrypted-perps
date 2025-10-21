# Confidential Perp DEX - Frontend

A privacy-focused web interface for trading perpetual futures with fully encrypted positions and orders.

## Features

### 🔐 Privacy-First Design

All sensitive trading data is encrypted before being sent to the blockchain:
- **Balances**: Your account balance is encrypted
- **Positions**: Position size, entry price, and collateral are encrypted
- **Orders**: Limit order prices and sizes are encrypted
- **PnL**: Profit and loss calculations happen on encrypted values

### 🎨 User Interface

**Clean & Intuitive**
- Dark theme optimized for trading
- Responsive design works on all devices
- Real-time updates via blockchain events
- Clear encryption status indicators

**Key Sections:**
1. **Deposit**: Add encrypted collateral to your account
2. **Trade**: Open leveraged long/short positions
3. **Positions**: View and manage your open positions
4. **Orders**: Browse the encrypted order book

## Getting Started

### Prerequisites

1. **MetaMask** or any Web3-compatible wallet
2. **Python 3** (for local development server)
3. Funds on Zama devnet (for testing)

### Run Locally

```bash
# From the project root
npm run dev
```

Open `http://localhost:3000` in your browser.

### Connect Wallet

1. Click "Connect Wallet" in the header
2. Approve the connection in MetaMask
3. Ensure you're connected to Zama devnet
4. Your wallet address will appear in the header

## How to Use

### 1. Deposit Funds

Navigate to the **Deposit** tab:

1. Enter the amount you want to deposit
2. Click "🔒 Encrypt & Deposit"
3. The amount will be encrypted client-side
4. Confirm the transaction in MetaMask
5. Wait for blockchain confirmation

**Privacy**: The deposited amount is encrypted and not visible on-chain.

### 2. Open a Position

Navigate to the **Trade** tab:

1. Select position type (LONG or SHORT)
2. Enter position size (e.g., 0.1 BTC)
3. Adjust leverage using the slider (1x-20x)
4. Review the position summary
5. Click "🔒 Encrypt & Open Position"
6. Confirm in MetaMask

**Privacy**: Position size is encrypted. Only leverage is public.

### 3. Place Limit Orders

Scroll down in the **Trade** tab:

1. Select order type (BUY or SELL)
2. Enter limit price (e.g., $50,000)
3. Enter order size (e.g., 0.05 BTC)
4. Click "🔒 Encrypt & Place Order"
5. Confirm in MetaMask

**Privacy**: Both price and size are encrypted.

### 4. View Positions

Navigate to the **Positions** tab:

- See all your open positions
- Position details are encrypted (shown as 🔒)
- Click "Close Position" to exit a position
- Positions update automatically when events occur

### 5. View Order Book

Navigate to the **Orders** tab:

- View total orders in the book
- See buy/sell order counts
- Order details are encrypted for privacy
- Book updates in real-time

## Privacy Indicators

Throughout the interface, you'll see these indicators:

- **🔒 Encrypted**: This data is encrypted on-chain
- **✅ Public**: This data is visible on-chain
- **⚠️ Public (not encrypted)**: Reminder that this field is not encrypted

## Technical Details

### Encryption Flow

1. **Client-Side Encryption**
   - User enters values in the UI
   - Values are encrypted using FHE before sending
   - Encrypted data is sent to the smart contract

2. **On-Chain Operations**
   - Contract performs homomorphic operations
   - Results remain encrypted throughout
   - No plaintext values are exposed

3. **Decryption (Optional)**
   - Users can request decryption
   - Requires FHE decryption keys
   - In production, would use oracle service

### Mock vs Production

**Current Implementation (Demo)**:
- Uses mock FHE encryption
- Simulates encryption for demonstration
- Works without actual FHE infrastructure

**Production Requirements**:
- Real fhevmjs library integration
- Decryption oracle service
- Proper key management
- Network-specific FHE setup

## Architecture

### Frontend Stack

```
Technology Stack:
├── HTML5 (Semantic markup)
├── CSS3 (Custom properties, Grid, Flexbox)
├── Vanilla JavaScript (ES6+ modules)
├── Ethers.js v5 (Blockchain interaction)
└── Web3 Provider (MetaMask integration)
```

### File Structure

```
public/
├── index.html          # Main application page
├── css/
│   └── styles.css     # Complete styling (no frameworks)
├── js/
│   └── app.js         # Application logic
└── README.md          # This file
```

### Key Components

**app.js** contains:
- `ConfidentialPerpDEXApp`: Main application class
- Wallet connection management
- FHE encryption simulation
- Contract interaction logic
- Event listeners and UI updates
- Real-time blockchain event handling

## Troubleshooting

### Wallet Not Connecting

1. Ensure MetaMask is installed
2. Unlock your wallet
3. Check you're on the correct network
4. Refresh the page and try again

### Transactions Failing

1. Check you have sufficient funds
2. Verify contract address is set
3. Ensure you're connected to the right network
4. Check browser console for errors

### Encryption Errors

1. Current implementation uses mock encryption
2. For production, implement real fhevmjs
3. Check console for detailed error messages

### Display Issues

1. Clear browser cache
2. Try a different browser
3. Check browser console for JavaScript errors
4. Ensure JavaScript is enabled

## Development

### Modify Styling

Edit `css/styles.css` to customize:
- Colors (CSS custom properties in `:root`)
- Layout and spacing
- Responsive breakpoints
- Animations and transitions

### Extend Functionality

Edit `js/app.js` to add:
- New trading features
- Additional data visualization
- Enhanced encryption methods
- More contract interactions

### Add New Pages

1. Create new HTML files in `public/`
2. Link to them from `index.html`
3. Share common CSS and JS
4. Update navigation as needed

## Security Considerations

### Client-Side Security

- Never store private keys in localStorage
- Always verify transaction details before signing
- Use HTTPS in production
- Implement CSP headers

### Smart Contract Interaction

- Verify contract address before transactions
- Double-check transaction parameters
- Monitor gas fees
- Use hardware wallets for production

### Privacy Best Practices

- Understand what data is encrypted vs public
- Use VPN when trading
- Clear browser data regularly
- Be aware of on-chain analysis

## Browser Support

**Recommended Browsers:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Required Features:**
- ES6+ JavaScript support
- CSS Grid and Flexbox
- Web3 provider (MetaMask)
- LocalStorage

## Performance

**Optimizations:**
- No external CSS/JS frameworks (faster load)
- Minimal dependencies
- Efficient DOM manipulation
- Event delegation for dynamic content
- Lazy loading where possible

## Contributing

To contribute to the frontend:

1. Follow existing code style
2. Test across multiple browsers
3. Ensure responsive design works
4. Update this README with changes
5. Submit pull request

## License

MIT

## Support

For issues or questions:
- Check browser console for errors
- Review smart contract events
- Verify wallet connection
- Check network status

---

**⚠️ Demo Notice**: This is a proof-of-concept implementation. Not for production use without proper security audits and real FHE integration.
