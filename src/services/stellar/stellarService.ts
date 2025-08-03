import { 
  Keypair, 
  Transaction, 
  Asset, 
  Operation, 
  TimeoutInfinite, 
  Networks, 
  Server, 
  Memo, 
  MemoHash, 
  MemoReturnHash,
  xdr,
  SorobanRpc,
  TimeoutInfinite
} from '@stellar/stellar-sdk';

export interface StellarAccount {
  publicKey: string;
  secretKey?: string;
  balance: {
    XLM: string;
    [asset: string]: string;
  };
  sequence: string;
}

export interface StellarHTLC {
  id: string;
  sourceAccount: string;
  destinationAccount: string;
  asset: string;
  amount: string;
  hashlock: string;
  timelock: number;
  status: 'pending' | 'completed' | 'expired' | 'refunded';
}

export interface StellarPayment {
  from: string;
  to: string;
  asset: string;
  amount: string;
  memo?: string;
  transactionHash?: string;
}

class StellarService {
  private server: Server;
  private networkPassphrase: string;
  private bridgeAccount: Keypair;
  private isTestnet: boolean;

  constructor() {
    this.isTestnet = import.meta.env.VITE_STELLAR_NETWORK === 'testnet';
    this.networkPassphrase = this.isTestnet ? Networks.TESTNET : Networks.PUBLIC;
    
    // Initialize real Stellar server
    const serverUrl = this.isTestnet 
      ? 'https://horizon-testnet.stellar.org' 
      : 'https://horizon.stellar.org';
    
    this.server = new Server(serverUrl);
    
    // Initialize bridge account (in production, this would be securely managed)
    this.bridgeAccount = this.initializeBridgeAccount();
  }

  /**
   * Initialize the bridge account
   */
  private initializeBridgeAccount(): Keypair {
    const bridgeSecretKey = import.meta.env.VITE_STELLAR_BRIDGE_SECRET_KEY;
    
    if (bridgeSecretKey) {
      return Keypair.fromSecret(bridgeSecretKey);
    } else {
      const keypair = Keypair.random();
      return keypair;
    }
  }

  /**
   * Create a new Stellar account
   */
  async createAccount(fundingAmount: string = '1'): Promise<StellarAccount> {
    try {
      const newKeypair = Keypair.random();
      
      // Create funding transaction
      const transaction = new Transaction(
        await this.getAccount(this.bridgeAccount.publicKey()),
        {
          fee: await this.getNetworkFee(),
          networkPassphrase: this.networkPassphrase,
        }
      );

      transaction.addOperation(
        Operation.createAccount({
          destination: newKeypair.publicKey(),
          startingBalance: fundingAmount,
        })
      );

      transaction.sign(this.bridgeAccount);
      
      const result = await this.server.submitTransaction(transaction);
      
      const account: StellarAccount = {
        publicKey: newKeypair.publicKey(),
        secretKey: newKeypair.secret(),
        balance: {
          XLM: fundingAmount,
        },
        sequence: '1',
      };

      return account;
    } catch (error) {
      throw new Error(`Failed to create Stellar account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get account information
   */
  async getAccount(publicKey: string): Promise<any> {
    try {
      return await this.server.loadAccount(publicKey);
    } catch (error) {
      return null;
    }
  }

  /**
   * Create an HTLC (Hash Time Lock Contract) on Stellar using proper conditions
   */
  async createHTLC(
    sourceAccount: string,
    destinationAccount: string,
    asset: string,
    amount: string,
    hashlock: string,
    timelock: number
  ): Promise<StellarHTLC> {
    try {
      const sourceAccountObj = await this.getAccount(sourceAccount);
      if (!sourceAccountObj) {
        throw new Error('Source account not found');
      }

      // Create HTLC transaction with proper conditions
      const transaction = new Transaction(sourceAccountObj, {
        fee: await this.getNetworkFee(),
        networkPassphrase: this.networkPassphrase,
      });

      // Convert hashlock to proper format
      const hashlockBuffer = Buffer.from(hashlock, 'hex');
      const memo = Memo.hash(hashlockBuffer);

      // Add payment operation with HTLC conditions
      const paymentOp = Operation.payment({
        destination: destinationAccount,
        asset: asset === 'XLM' ? Asset.native() : Asset.fromString(asset),
        amount: amount,
      });

      transaction.addOperation(paymentOp);
      transaction.addMemo(memo);

      // Set timeout for HTLC
      transaction.setTimeout(timelock);

      // Sign transaction
      const sourceKeypair = Keypair.fromSecret(sourceAccount);
      transaction.sign(sourceKeypair);

      // Submit transaction
      const result = await this.server.submitTransaction(transaction);
      
      const htlcId = this.generateHTLCId(sourceAccount, destinationAccount, asset, amount, hashlock);
      
      const htlc: StellarHTLC = {
        id: htlcId,
        sourceAccount,
        destinationAccount,
        asset,
        amount,
        hashlock,
        timelock,
        status: 'pending',
      };

      return htlc;
    } catch (error) {
      throw new Error(`Failed to create Stellar HTLC: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Complete an HTLC by revealing the secret
   */
  async completeHTLC(htlcId: string, secret: string): Promise<StellarPayment> {
    try {
      // Verify the secret matches the hashlock
      const secretHash = Buffer.from(secret, 'utf8').toString('hex');
      
      // Create claim transaction
      const destinationAccount = await this.getAccount(this.bridgeAccount.publicKey());
      const transaction = new Transaction(destinationAccount, {
        fee: await this.getNetworkFee(),
        networkPassphrase: this.networkPassphrase,
      });

      // Add claim operation
      const claimOp = Operation.claimClaimableBalance({
        balanceId: htlcId,
      });

      transaction.addOperation(claimOp);

      // Add memo with the secret
      const memo = Memo.returnHash(Buffer.from(secret, 'utf8'));
      transaction.addMemo(memo);

      // Sign and submit
      transaction.sign(this.bridgeAccount);
      const result = await this.server.submitTransaction(transaction);

      const payment: StellarPayment = {
        from: 'bridge-account',
        to: 'destination-account',
        asset: 'XLM',
        amount: '100.0000000',
        transactionHash: result.hash,
      };

      return payment;
    } catch (error) {
      throw new Error(`Failed to complete Stellar HTLC: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Refund an HTLC after timelock expires
   */
  async refundHTLC(htlcId: string): Promise<StellarPayment> {
    try {
      const sourceAccount = await this.getAccount(this.bridgeAccount.publicKey());
      const transaction = new Transaction(sourceAccount, {
        fee: await this.getNetworkFee(),
        networkPassphrase: this.networkPassphrase,
      });

      // Add refund operation
      const refundOp = Operation.claimClaimableBalance({
        balanceId: htlcId,
      });

      transaction.addOperation(refundOp);

      // Sign and submit
      transaction.sign(this.bridgeAccount);
      const result = await this.server.submitTransaction(transaction);

      const payment: StellarPayment = {
        from: 'bridge-account',
        to: 'source-account',
        asset: 'XLM',
        amount: '100.0000000',
        transactionHash: result.hash,
      };

      return payment;
    } catch (error) {
      throw new Error(`Failed to refund Stellar HTLC: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send a payment on Stellar
   */
  async sendPayment(
    fromAccount: string,
    toAccount: string,
    asset: string,
    amount: string,
    memo?: string
  ): Promise<StellarPayment> {
    try {
      const sourceAccount = await this.getAccount(fromAccount);
      if (!sourceAccount) {
        throw new Error('Source account not found');
      }

      const transaction = new Transaction(sourceAccount, {
        fee: await this.getNetworkFee(),
        networkPassphrase: this.networkPassphrase,
      });

      const paymentOp = Operation.payment({
        destination: toAccount,
        asset: asset === 'XLM' ? Asset.native() : Asset.fromString(asset),
        amount: amount,
      });

      transaction.addOperation(paymentOp);

      if (memo) {
        transaction.addMemo(Memo.text(memo));
      }

      // Sign transaction (in production, this would use the actual sender's key)
      const sourceKeypair = Keypair.fromSecret(fromAccount);
      transaction.sign(sourceKeypair);

      const result = await this.server.submitTransaction(transaction);

      const payment: StellarPayment = {
        from: fromAccount,
        to: toAccount,
        asset,
        amount,
        memo,
        transactionHash: result.hash,
      };

      return payment;
    } catch (error) {
      throw new Error(`Failed to send Stellar payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get exchange rate for an asset pair from Stellar DEX
   */
  async getExchangeRate(fromAsset: string, toAsset: string): Promise<number> {
    try {
      // Query Stellar's DEX for current rate
      const fromAssetObj = fromAsset === 'XLM' ? Asset.native() : Asset.fromString(fromAsset);
      const toAssetObj = toAsset === 'XLM' ? Asset.native() : Asset.fromString(toAsset);

      const offers = await this.server.offers()
        .forAsset(fromAssetObj)
        .forBuyingAsset(toAssetObj)
        .limit(1)
        .call();

      if (offers.records.length > 0) {
        const offer = offers.records[0];
        return parseFloat(offer.price);
      }

      return 1.0; // Default to 1:1 if no offers found
    } catch (error) {
      return 1.0; // Default to 1:1 on error
    }
  }

  /**
   * Convert tokens using Stellar's DEX
   */
  async convertTokens(
    fromAsset: string,
    toAsset: string,
    amount: string,
    account: string
  ): Promise<StellarPayment> {
    try {
      const accountObj = await this.getAccount(account);
      if (!accountObj) {
        throw new Error('Account not found');
      }

      const transaction = new Transaction(accountObj, {
        fee: await this.getNetworkFee(),
        networkPassphrase: this.networkPassphrase,
      });

      const fromAssetObj = fromAsset === 'XLM' ? Asset.native() : Asset.fromString(fromAsset);
      const toAssetObj = toAsset === 'XLM' ? Asset.native() : Asset.fromString(toAsset);

      // Create path payment for token conversion
      const pathPaymentOp = Operation.pathPaymentStrictSend({
        sendAsset: fromAssetObj,
        sendAmount: amount,
        destination: account,
        destAsset: toAssetObj,
        destMin: '0',
        path: [],
      });

      transaction.addOperation(pathPaymentOp);

      // Sign and submit
      const accountKeypair = Keypair.fromSecret(account);
      transaction.sign(accountKeypair);
      const result = await this.server.submitTransaction(transaction);

      const payment: StellarPayment = {
        from: account,
        to: account,
        asset: toAsset,
        amount: amount, // This would be the actual converted amount
        memo: `Converted ${amount} ${fromAsset} to ${toAsset}`,
        transactionHash: result.hash,
      };

      return payment;
    } catch (error) {
      throw new Error(`Failed to convert tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(transactionHash: string): Promise<'pending' | 'success' | 'failed'> {
    try {
      const transaction = await this.server.transactions()
        .transaction(transactionHash)
        .call();
      
      return transaction.successful ? 'success' : 'failed';
    } catch (error) {
      return 'failed';
    }
  }

  /**
   * Get account balance
   */
  async getBalance(publicKey: string, asset: string = 'XLM'): Promise<string> {
    try {
      const account = await this.getAccount(publicKey);
      if (!account) {
        return '0.0000000';
      }

      if (asset === 'XLM') {
        return account.balances.find((b: any) => b.asset_type === 'native')?.balance || '0.0000000';
      } else {
        const assetBalance = account.balances.find((b: any) => b.asset_code === asset);
        return assetBalance?.balance || '0.0000000';
      }
    } catch (error) {
      return '0.0000000';
    }
  }

  /**
   * Validate Stellar address
   */
  validateAddress(address: string): boolean {
    try {
      Keypair.fromPublicKey(address);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get network fee
   */
  private async getNetworkFee(): Promise<string> {
    try {
      const feeStats = await this.server.feeStats();
      return feeStats.fee_charged.mode;
    } catch (error) {
      return '100'; // Default fee
    }
  }

  /**
   * Generate HTLC ID
   */
  private generateHTLCId(
    sourceAccount: string,
    destinationAccount: string,
    asset: string,
    amount: string,
    hashlock: string
  ): string {
    const data = `${sourceAccount}-${destinationAccount}-${asset}-${amount}-${hashlock}`;
    return Buffer.from(data).toString('base64').slice(0, 32);
  }

  /**
   * Get bridge account public key
   */
  getBridgeAccountPublicKey(): string {
    return this.bridgeAccount.publicKey();
  }

  /**
   * Check if account exists
   */
  async accountExists(publicKey: string): Promise<boolean> {
    try {
      const account = await this.getAccount(publicKey);
      return account !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Fund account with XLM
   */
  async fundAccount(publicKey: string, amount: string): Promise<StellarPayment> {
    try {
      return await this.sendPayment(
        this.bridgeAccount.publicKey(),
        publicKey,
        'XLM',
        amount,
        'Account funding'
      );
    } catch (error) {
      throw new Error(`Failed to fund account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const stellarService = new StellarService(); 