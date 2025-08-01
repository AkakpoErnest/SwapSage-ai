# API Setup Guide - Fixing "Failed to get swap quote" Error

## Quick Fix Steps

### 1. Get a Free 1inch API Key
1. Go to [1inch Developer Portal](https://portal.1inch.dev/)
2. Sign up for a free account
3. Create a new API key
4. Copy the API key

### 2. Configure Environment Variables
1. Open `.env.local` file (already created)
2. Replace `your_1inch_api_key_here` with your actual API key:
   ```
   VITE_1INCH_API_KEY=your_actual_api_key_here
   ```

### 3. Restart Development Server
```bash
npm run dev
# or
yarn dev
```

## Alternative: Use Demo Mode (No API Key Required)

If you don't want to get an API key right now, the app will automatically use demo mode with simulated swap quotes.

## Troubleshooting

### Common Issues:

1. **"Invalid or missing 1inch API key"**
   - Solution: Set `VITE_1INCH_API_KEY` in `.env.local`

2. **"Failed to fetch" network error**
   - Check internet connection
   - Try refreshing the page
   - Check browser console for CORS errors

3. **"Missing required parameters"**
   - Make sure wallet is connected
   - Ensure all swap fields are filled

4. **API rate limiting**
   - Free tier has limits
   - Consider upgrading API plan

## Testing the Fix

1. Connect your wallet
2. Select tokens (ETH → USDC)
3. Enter amount (e.g., 0.01)
4. Check if quote loads without error
5. Verify "You'll Receive" shows a value

## Debug Information

The app now provides detailed console logs:
- API request URLs
- Response status codes
- Error details

Check browser console (F12) for debugging information.

## Next Steps

Once the API is working:
1. Test with small amounts first
2. Verify token addresses are correct
3. Test cross-chain swaps
4. Monitor transaction status 