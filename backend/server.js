const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const serve = require('koa-static');
const Router = require('@koa/router');
const cors = require('@koa/cors');
const OAuth = require('oauth-1.0a');
const crypto = require('crypto');
const fetch = require('node-fetch');
const fs = require('node:fs');
const path = require('path');
const { ethers } = require('ethers');
require('dotenv').config({path: path.resolve(__dirname, '../.env')});

// Hosts
const backend_host = process.env.VITE_BACKEND_HOST;
const frontend_host = process.env.VITE_FRONTEND_HOST;

// Twitter consumer key and secret
const consumerKey = process.env.API_KEY;
const consumerSecret = process.env.API_SECRET;

// Avalanche provider API
const PROVIDER_API_URL = process.env.BLAST_API_URL;
// Contract address and ABI
const CONTRACT_ADDRESS = process.env.VITE_CONTRACT_ADDRESS;
const contractMetadata = JSON.parse(fs.readFileSync("meta/CoqTip_metadata.json"));
const CONTRACT_ABI = contractMetadata.output.abi;

// Create a Koa app
const app = new Koa();

// Enable CORS
app.use(cors({ origin: frontend_host }));

// Serve static files from the React app
app.use(serve(path.join(__dirname, '../dist')));

// Create a router
const router = new Router();

// Set up an ethers provider
const provider = new ethers.JsonRpcProvider(PROVIDER_API_URL);
// Create wallet to sign transactions
const wallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY, provider);
// Create a contract instance
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

// Request token URL
const requestTokenUrl = 'https://api.twitter.com/oauth/request_token';
// Access token URL
const accessTokenUrl = 'https://api.twitter.com/oauth/access_token';

// Initialize OAuth 1.0a
const oauth = OAuth({
    consumer: { key: consumerKey, secret: consumerSecret },
    signature_method: 'HMAC-SHA1',
    hash_function(base_string, key) {
        return crypto.createHmac('sha1', key).update(base_string).digest('base64');
    }
});

async function initiateOAuth(ctx) {
    try {

        const walletAddress = ctx.query.address;
        if (!walletAddress) {
            ctx.status = 400;
            ctx.body = {
                error: "Missing query parameter: address"
            };
            return;
        }

        // Get a request token
        const requestData = {
            url: requestTokenUrl,
            method: 'POST',
            data: { oauth_callback: backend_host + '/twitter/callback' + '?address=' + walletAddress }
        };

        const authHeader = oauth.toHeader(oauth.authorize(requestData));

        const response = await fetch(requestData.url, {
            method: requestData.method,
            headers: authHeader
        });

        const responseText = await response.text();
        const responseParams = new URLSearchParams(responseText);
        const oauthToken = responseParams.get('oauth_token');

        // Redirect user to Twitter authentication page
        ctx.redirect(`https://api.twitter.com/oauth/authenticate?oauth_token=${oauthToken}`);
    } catch (error) {
        console.error(error);
        ctx.status = 500;
        ctx.body = 'Authentication failed';
    }
}

async function handleCallback(ctx) {
    const oauthToken = ctx.query.oauth_token;
    const oauthVerifier = ctx.query.oauth_verifier;

    if (!oauthToken || !oauthVerifier) {
        ctx.status = 400;
        ctx.body = 'Invalid request. Missing OAuth token or verifier.';
        return;
    }

    const walletAddress = ctx.query.address;

    try {
        // Exchange the oauth_token and oauth_verifier for an access token
        const accessTokenData = await getAccessToken(oauthToken, oauthVerifier);

        linkHandle(accessTokenData.screen_name, walletAddress);
        console.log('Successfully linked handle to address:', accessTokenData.screen_name, walletAddress);

        ctx.redirect(frontend_host);
    } catch (error) {
        console.error('Error during Twitter callback:', error);
        ctx.status = 500;
        ctx.body = 'Failed to authenticate with Twitter.';
    }
}

async function getAccessToken(oauthToken, oauthVerifier) {
    const token = {
        key: oauthToken,
        secret: '' // Temporary token secret is not needed for this request
    };

    const requestData = {
        url: accessTokenUrl,
        method: 'POST',
        data: { oauth_verifier: oauthVerifier }
    };

    // Using the same oauth object configured with your consumer key and secret
    const authHeader = oauth.toHeader(oauth.authorize(requestData, token));

    try {
        const response = await fetch(requestData.url, {
            method: requestData.method,
            headers: {
                ...authHeader,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            // OAuth verifier is sent as form data
            body: new URLSearchParams({ oauth_verifier: oauthVerifier })
        });

        if (!response.ok) {
            throw new Error('Failed to get access token');
        }

        const responseText = await response.text();
        const responseParams = new URLSearchParams(responseText);

        return {
            oauth_token: responseParams.get('oauth_token'),
            oauth_token_secret: responseParams.get('oauth_token_secret'),
            user_id: responseParams.get('user_id'),
            screen_name: responseParams.get('screen_name'),
        };
    } catch (error) {
        console.error('Error fetching access token:', error);
        throw error;
    }
}

async function linkHandle(handle, address) {
    try {
        await contract.createLink(handle, address);
    } catch (error) {
        console.error('Smart Contract call failed:', error);
        throw error;
    }
}

// Routes
router.get('/handle', async (ctx) => {
    ctx.set('Content-Type', 'application/json');
    const address = ctx.query.address;
    if (!address) {
        ctx.status = 400; // Set HTTP status to 400 Bad Request
        ctx.body = {
            error: "Missing query parameter: address"
        };
        return; // Stop processing
    }
    try {
        const data = await contract.getHandle(address);
        if (data === "") {
            ctx.status = 400;
            ctx.body = {
                error: "Given address does not have a handle linked to it"
            };
            return;
        }
        ctx.body = { handle: data };
    } catch (error) {
        ctx.status = 400;
        ctx.body = {
            error: 'Smart Contract call failed: ' + error
        };
        return;
    }
});

router.get('/auth/twitter', initiateOAuth);
router.get('/twitter/callback', handleCallback);

app.use(bodyParser());
app.use(router.routes());
app.use(router.allowedMethods());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}`);
});