import { Bot } from 'grammy'
import hre from "hardhat"
import pg from 'pg'

class FaucetDatabase {
    client
    constructor(pgUrl){
        this.client = new pg.Client(pgUrl)
    }
    
    async connect(){
        try {
            await this.client.connect()
            console.log('Connected to database')
        } catch (error) {
            console.error('Failed to connect to database:', error)
            throw error
        }
    }
    async canClaim(params){
        const latestClaim = await this.getLatestClaim(params);
        if(latestClaim){
            // check if latest is over a day old
            const now = new Date();
            const claimTime = new Date(latestClaim.created_at);
            const timeDiff = now - claimTime;
            const dayInMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
            return timeDiff >= dayInMs;
        } 
        return true; // No previous claim, can claim
    }

    async getLatestClaim(params){
        const res = await this.client.query('SELECT * FROM drips WHERE telegram_username=$1 ORDER BY created_at DESC LIMIT 1', [params.telegram_username])
        return res.rows.length > 0 ? res.rows[0] : null;
    }

    async exists(params){
        const res = await this.client.query('SELECT chainid, to_address, telegram_username FROM drips WHERE telegram_username=$1', [params.telegram_username])
        return res.rows.length > 0;
    }

    async insert(params) {
        const { chainId, transactionHash, tokenAddress, fromAddress, toAddress, telegramUsername, valueParsed } = params
        await this.client.query(`
            INSERT INTO drips (chainid, transaction_hash, token_address, from_address, to_address, telegram_username, value_parsed, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [
                chainId,
                transactionHash,
                tokenAddress,
                fromAddress,
                toAddress,
                telegramUsername,
                valueParsed,
                new Date()
            ]
        )
    }
}
const API_KEY = process.env.TELEGRAM_BOT_TOKEN

const db = new FaucetDatabase(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/casino_faucet?sslmode=disable')
const bot = new Bot(API_KEY);

bot.command('start', async (ctx) => {
    try {
        console.log('[cmd] start')
        const member = ctx.from
        const isBot = member.is_bot
        if(isBot){
            await ctx.reply("Bots are not allowed.")
            return
        }

        if(!member.username){
            await ctx.reply("Failed to get username.")
            return
        }

        await ctx.reply("Please enter the recipient address you want the testnet funds delivered on.")
    } catch (error) {
        console.error('Error in start command:', error)
        try {
            await ctx.reply("Sorry, there was an error processing your request. Please try again later.")
        } catch (replyError) {
            console.error('Failed to send error message:', replyError)
        }
    }
})


bot.command('help', async (ctx) => {
    try {
        const helpMessage = `
🚰 **Arbitrum Sepolia Faucet Bot** 🚰

Welcome to the testnet ETH faucet! Get free test ETH for development on Arbitrum Sepolia.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔹 **How to use:**
1️⃣ Send /start to begin
2️⃣ Send any valid Ethereum address (0x...)
3️⃣ Receive 0.01 ETH on Arbitrum Sepolia

🔹 **Features:**
💰 Free 0.01 ETH per claim
⏰ 24-hour cooldown between claims
🔗 Arbitrum Sepolia testnet only
🔍 Transaction explorer links

🔹 **Rules:**
• One claim per user per day
• Valid Ethereum addresses only
• No bots allowed
• Telegram username required

🔹 **Network Info:**
🌐 Network: Arbitrum Sepolia
🔗 Chain ID: 421614
🔍 Explorer: sepolia.arbiscan.io

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 **Tips:**
• Make sure your address is correct
• Check the explorer link for confirmation
• Need more ETH? Wait 24 hours and claim again!

🐛 **Issues?** Contact support or try again later.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `.trim()

        await ctx.reply(helpMessage, { parse_mode: 'Markdown' })
    } catch (error) {
        console.error('Error in help command:', error)
        try {
            await ctx.reply("Sorry, there was an error displaying the help menu. Please try again later.")
        } catch (replyError) {
            console.error('Failed to send error message:', replyError)
        }
    }
})

bot.on('message', async (ctx) => {
    try {
        console.log(ctx.message.text)
        // parse regex
        const text = ctx.message.text

        // parse first address
        const regex = `(0x)?[0-9a-fA-F]{40}`
        const re = RegExp(regex)
        
        const foundAddress = re.test(text)
        if(!foundAddress) return

        const matches = re.exec(text)
        const address = matches[0]
        
        // check if user or address hasn't claimed already today
        console.log(`checking if ${ctx.from.username} can claim`)
        if(address === hre.ethers.ZeroAddress || !hre.ethers.isAddress(address)){
            await ctx.reply('Sending everything I own to the address right away.')
            setTimeout(async () => {
                await ctx.replyWithAnimation('https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExeXJiOXFoOWhtZWgwbGt3Z2ttZ2pyamQwZzVzbzJ1djRsaGduMzl0aSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/qpCvOBBmBkble/giphy.gif', {
                    caption: "Just kidding! You silly goose.\nNow why would you do that? 😿"
                })
            }, 2000)
            return
        }
        try {
            const canClaim = await db.canClaim({telegram_username: ctx.from.username})
            if(!canClaim){
                console.log("cant claim")
                await ctx.reply("You already claimed a drip today.\nTry again tomorrow.")
                return
            }
        } catch (dbError) {
            console.error('Database error checking claim status:', dbError)
            await ctx.reply("Sorry, there was a database error. Please try again later.")
            return
        }
        
        console.log("Claiming")
        
        try {
            // Verify we're still on Arbitrum Sepolia
            const network = await hre.ethers.provider.getNetwork()
            if (network.chainId !== 421614n) {
                await ctx.reply("Error: Bot is not connected to Arbitrum Sepolia network")
                return
            }
            
            // generate signature for address
            const [relayer] = await hre.ethers.getSigners()
            
            // Get current gas prices for Arbitrum Sepolia
            const feeData = await hre.ethers.provider.getFeeData()
            const maxFeePerGas = feeData.maxFeePerGas
            const priorityFee = feeData.maxPriorityFeePerGas
            
            const dripAmount = hre.ethers.parseEther('0.01')
            const txRequest = {
                to: address,
                value: dripAmount,
                maxFeePerGas,
                maxPriorityFeePerGas: priorityFee
            };

            const tx = await relayer.sendTransaction(txRequest)
            if(!tx) {
                await ctx.reply("Failed to create transaction.")
                return
            }

            try {
                await db.insert({
                    chainId: Number(network.chainId), // Use actual network chain ID (421614 for Arbitrum Sepolia)
                    transactionHash: tx.hash,
                    tokenAddress: hre.ethers.ZeroAddress,
                    fromAddress: relayer.address,
                    toAddress: address,
                    telegramUsername: ctx.from.username,
                    valueParsed: hre.ethers.formatEther(dripAmount),
                })
            } catch (dbError) {
                console.error('Database error saving transaction:', dbError)
                // Don't return here - still send the success message since tx was sent
            }
            
            const formattedExplorer = `https://sepolia.arbiscan.io/tx/${tx.hash}`
            await ctx.reply(`✅ Sent 0.01 ETH to ${address}\n\nTransaction: ${tx.hash}\nExplorer: ${formattedExplorer}`)
            
        } catch (txError) {
            console.error('Transaction error:', txError)
            if (txError.code === 'INSUFFICIENT_FUNDS') {
                await ctx.reply("❌ Bot wallet has insufficient funds. Please contact support.")
            } else if (txError.code === 'NETWORK_ERROR') {
                await ctx.reply("❌ Network error. Please try again later.")
            } else {
                await ctx.reply("❌ Transaction failed. Please check the address and try again.")
            }
        }
        
    } catch (error) {
        console.error('Error in message handler:', error)
        try {
            await ctx.reply("Sorry, there was an unexpected error. Please try again later.")
        } catch (replyError) {
            console.error('Failed to send error message:', replyError)
        }
    }
})


const init = async () => {
    try {
        console.log('Initializing bot...')
        
        // Connect to database
        await db.connect()
        
        // Ensure we're connected to Arbitrum Sepolia
        const network = await hre.ethers.provider.getNetwork()
        console.log(`Connected to network: ${network.name} (Chain ID: ${network.chainId})`)
        
        if (network.chainId !== 421614n) {
            console.error(`Error: Expected Arbitrum Sepolia (Chain ID: 421614), but connected to Chain ID: ${network.chainId}`)
            console.error('Please ensure HARDHAT_NETWORK is set to arbitrumSepolia or update your hardhat.config.js')
            process.exit(1)
        }
        
        // Initialize bot
        await bot.init()
        console.log(`Started bot: ${API_KEY}\non: ${bot.botInfo.username}`)
        console.log(`Running on Arbitrum Sepolia (Chain ID: ${network.chainId})`)
        
        // Start bot
        bot.start()
        console.log('Bot is running successfully!')
        
    } catch (error) {
        console.error('Failed to initialize bot:', error)
        
        if (error.message.includes('database') || error.code === 'ECONNREFUSED') {
            console.error('Database connection failed. Please check if PostgreSQL is running.')
        } else if (error.message.includes('network') || error.code === 'NETWORK_ERROR') {
            console.error('Network connection failed. Please check your internet connection and RPC URL.')
        } else if (error.message.includes('bot') || error.response?.error_code === 401) {
            console.error('Bot token is invalid. Please check your API_KEY.')
        }
        
        process.exit(1)
    }
}

init()
