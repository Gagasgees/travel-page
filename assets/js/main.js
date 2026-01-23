// GLOBAL STATE
let isConnected = false;
let currentAccount = null;
let isConnecting = false; // Tambahkan flag untuk mencegah permintaan duplikat


const menuBtn = document.getElementById("menu-btn");
const navLinks = document.getElementById("nav-links");
const menuBtnIcon = menuBtn.querySelector("i");

menuBtn.addEventListener("click", (e) => {
    navLinks.classList.toggle("open");

    const isOpen = navLinks.classList.contains("open");
    menuBtnIcon.setAttribute("class", isOpen ? "ri-close-line" : "ri-menu-line");
});

navLinks.addEventListener("click", (e) => {
    navLinks.classList.remove("open");
    menuBtnIcon.setAttribute("class", "ri-menu-line");
});


// CHECK CONNECTION ON PAGE LOAD
async function checkConnection() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                currentAccount = accounts[0];
                isConnected = true;
                updateAllButtons(); // Perbarui teks tombol
            }
        } catch (error) {
            console.error("Error checking MetaMask connection:", error);
        }
    }
}


// CONNECT METAMASK
async function connectMetamask(buttonId) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;

    const text = btn.querySelector("span");
    if (!text) return;

    const dropdownId = buttonId === "metamaskDesktop" ? "dropdownDesktop" : "dropdownMobile";
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;

    // Jika sudah connect, toggle dropdown saja
    if (isConnected) {
        dropdown.classList.add("show");
        return;
    }

    // Cegah permintaan duplikat
    if (isConnecting) {
        console.warn("Connection request already in progress.");
        return;
    }

    // Jika MetaMask tidak ada
    if (typeof window.ethereum === 'undefined') {
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (isMobile) {
            window.location.href = 'https://metamask.app.link/dapp/' + window.location.href.replace(/^https?:\/\//, '');
        } else {
            window.open('https://metamask.io/download/', '_blank');
        }
        return;
    }

    // Proses koneksi
    text.textContent = 'Connecting...';
    isConnecting = true; // Set flag untuk mencegah permintaan baru

    try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        currentAccount = accounts[0];
        isConnected = true;

        // Update teks tombol dan tampilkan dropdown
        updateAllButtons();
        dropdown.classList.add("show");
    } catch (error) {
        console.error("Error connecting to MetaMask:", error);

        // Tangani kasus MetaMask terputus
        if (error.message.includes("MetaMask: Disconnected")) {
            alert("MetaMask disconnected. Please reload the page and try again.");
        } else if (error.message.includes("wallet_requestPermissions")) {
            alert("A connection request is already pending. Please wait.");
        } else {
            alert("Failed to connect to MetaMask. Please try again.");
        }

        text.textContent = 'Connect';
    } finally {
        isConnecting = false; // Reset flag setelah permintaan selesai
    }
}

// UPDATE ALL BUTTONS
function updateAllButtons() {
    ["metamaskDesktop", "metamaskMobile"].forEach((id) => {
        const span = document.getElementById(id)?.querySelector("span");
        if (!span) return;

        if (!currentAccount) {
            span.textContent = "No Wallet";
        } else {
            const shortAddress = currentAccount.slice(0, 6) + '...' + currentAccount.slice(-4);
            span.textContent = shortAddress;
        }
    });
}

// EVENT LISTENER BUTTON
document.getElementById("metamaskDesktop")?.addEventListener("click", (e) => {
    e.stopPropagation();
    connectMetamask("metamaskDesktop");
});

document.getElementById("metamaskMobile")?.addEventListener("click", (e) => {
    e.stopPropagation();
    connectMetamask("metamaskMobile");
});

document.getElementById("balanceDesktop")?.addEventListener("click", (e) => {
    e.stopPropagation();
    fetchAndDisplayBalance();
});

// CLOSE DROPDOWN JIKA KLIK LUAR
document.addEventListener("click", (e) => {
    ["metamaskDesktop", "metamaskMobile"].forEach((id) => {
        const btn = document.getElementById(id);
        const dropdownId = id === "metamaskDesktop" ? "dropdownDesktop" : "dropdownMobile";
        const dropdown = document.getElementById(dropdownId);

        if (!btn || !dropdown) return;

        // Sembunyikan dropdown hanya jika klik di luar tombol dan dropdown
        if (!btn.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove("show");
        }
    });
});

// DROPDOWN ACTIONS
// Open MetaMask Portfolio in a new tab
function openMetaMaskPortfolio() {
    const url = 'https://portfolio.metamask.io';
    window.open(url, '_blank');
}

// Tooltip helpers (desktop hover)
function showTooltipFor(target, text) {
    if (!target) return;
    let tip = target._metaTip;
    if (!tip) {
        tip = document.createElement('div');
        tip.className = 'meta-tooltip';
        document.body.appendChild(tip);
        target._metaTip = tip;
    }
    tip.textContent = text;
    const rect = target.getBoundingClientRect();
    tip.style.left = (rect.left + rect.width / 2) + 'px';
    tip.style.top = (rect.top - 8) + 'px';
    tip.classList.add('visible');
}

function hideTooltipFor(target) {
    if (!target) return;
    const tip = target._metaTip;
    if (tip) tip.classList.remove('visible');
}

// Wire desktop buttons (hover tooltip + click redirect)
function wireDesktopRedirect(btnId) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.addEventListener('mouseenter', () => showTooltipFor(btn, 'you will be redirected to MetaMask Portfolio'));
    btn.addEventListener('mouseleave', () => hideTooltipFor(btn));
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openMetaMaskPortfolio();
        closeDropdowns();
    });
}

wireDesktopRedirect('buyDesktop');
wireDesktopRedirect('sendDesktop');
wireDesktopRedirect('swapDesktop');

// Wire mobile buttons (confirm then redirect)
['buyMobile', 'sendMobile', 'swapMobile'].forEach((id) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('you will be redirected to MetaMask Portfolio. Continue?')) {
            openMetaMaskPortfolio();
            closeDropdowns();
        }
    });
});

document.getElementById("balanceDesktop")?.addEventListener("click", (e) => {
    e.stopPropagation();
    fetchAndDisplayBalance(); // Call the balance function
    closeDropdowns(); // Close dropdown after action
});

document.getElementById("walletDesktop")?.addEventListener("click", (e) => {
    e.stopPropagation();
    displayWalletAddress(); // Call the wallet address function
    closeDropdowns(); // Close dropdown after action
});

document.getElementById("historyDesktop")?.addEventListener("click", (e) => {
    e.stopPropagation();
    fetchTransactionHistory(); // Call the transaction history function
    closeDropdowns(); // Close dropdown after action
});

// Centralized disconnect logic
function disconnectWallet() {
    isConnected = false;
    currentAccount = null;
    updateAllButtons();
    // hide any open info cards
    ['balanceCard', 'walletCard', 'historyCard', 'productsCard'].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('active');
    });
    closeDropdowns();
}

document.getElementById("disconnectDesktop")?.addEventListener("click", (e) => {
    e.stopPropagation();
    disconnectWallet();
});

document.getElementById("disconnectMobile")?.addEventListener("click", (e) => {
    e.stopPropagation();
    disconnectWallet();
});

// Helper function to close all dropdowns
function closeDropdowns() {
    ["dropdownDesktop", "dropdownMobile"].forEach((dropdownId) => {
        const dropdown = document.getElementById(dropdownId);
        if (dropdown) dropdown.classList.remove("show");
    });
}

// Show message using existing wallet card when wallet not connected
function showNoWalletPrompt() {
    const walletAddrEl = document.getElementById('walletAddress');
    const walletCard = document.getElementById('walletCard');
    if (walletAddrEl && walletCard) {
        walletAddrEl.textContent = 'Please connect your MetaMask wallet first.';
        walletCard.classList.add('active');
    } else {
        alert('Please connect your MetaMask wallet first.');
    }
}

// Function to fetch and display MetaMask balance
async function fetchAndDisplayBalance() {
    console.log("fetchAndDisplayBalance called"); // Debugging log

    if (!isConnected || !currentAccount) {
        console.error("MetaMask is not connected or currentAccount is null"); // Debugging log
        showNoWalletPrompt();
        return;
    }

    // Show loading on refresh button if present
    const refreshBtn = document.getElementById('refreshBalance');
    if (refreshBtn) {
        refreshBtn.classList.add('loading');
        refreshBtn.disabled = true;
    }

    try {
        console.log("Fetching balance for account:", currentAccount); // Debugging log
        const balance = await window.ethereum.request({
            method: "eth_getBalance",
            params: [currentAccount, "latest"],
        });

        // Convert balance from Wei to Ether using ethers.js
        const ethBalance = ethers.utils.formatEther(balance);
        console.log("Balance fetched:", ethBalance); // Debugging log

        document.getElementById("ethBalance").textContent = parseFloat(ethBalance).toFixed(4);

        // Ensure the balance card is visible
        const balanceCard = document.getElementById("balanceCard");
        if (balanceCard) {
            balanceCard.classList.add("active");
            console.log("Balance card displayed"); // Debugging log
        } else {
            console.error("Balance card element not found");
        }
    } catch (error) {
        console.error("Error fetching balance:", error);
        alert("Failed to fetch balance. Please try again.");
    } finally {
        if (refreshBtn) {
            refreshBtn.classList.remove('loading');
            refreshBtn.disabled = false;
        }
    }
}

// Function to display wallet address
function displayWalletAddress() {
    if (!isConnected || !currentAccount) {
        showNoWalletPrompt();
        return;
    }

    const walletAddress = currentAccount;
    const walletAddrEl = document.getElementById("walletAddress");
    const walletCard = document.getElementById("walletCard");
    if (walletAddrEl) walletAddrEl.textContent = walletAddress;
    if (walletCard) walletCard.classList.add('active');
}

// Etherscan API key storage helpers
const ETHERSCAN_API_KEY_STORAGE = 'etherscan_api_key';
function getEtherscanApiKey() {
    return localStorage.getItem(ETHERSCAN_API_KEY_STORAGE) || '';
}
function promptForEtherscanApiKey() {
    const key = prompt('Please enter your Etherscan API key (needed to fetch history). Leave empty to cancel.');
    if (key) localStorage.setItem(ETHERSCAN_API_KEY_STORAGE, key);
    return key;
}

// Consolidated function to fetch transaction history (normal tx + token transfers)
async function fetchTransactionHistory() {
    if (!isConnected || !currentAccount) {
        showNoWalletPrompt();
        return;
    }

    const apiKey = getEtherscanApiKey();
    const transactionList = document.getElementById('transactionList');
    if (!apiKey) {
        // Show the history card and instruct user to either open Etherscan or set an API key via Refresh
        if (transactionList) {
            transactionList.innerHTML = '';
            const li = document.createElement('li');
            li.textContent = 'No Etherscan API key set. Click "Open in Etherscan" to view on etherscan.io, or click Refresh to enter an API key.';
            transactionList.appendChild(li);
        }
        const historyCard = document.getElementById('historyCard');
        if (historyCard) historyCard.classList.add('active');
        return;
    }

    const refreshBtn = document.getElementById('refreshHistory');
    if (refreshBtn) {
        refreshBtn.classList.add('loading');
        refreshBtn.disabled = true;
    }

    try {
        const addr = currentAccount;
        // fetch normal ETH transactions and token transfers in parallel
        const txListURL = `https://api.etherscan.io/api?module=account&action=txlist&address=${addr}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`;
        const tokenTxURL = `https://api.etherscan.io/api?module=account&action=tokentx&address=${addr}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`;

        const [txRes, tokenRes] = await Promise.all([fetch(txListURL), fetch(tokenTxURL)]);
        const txData = await txRes.json();
        const tokenData = await tokenRes.json();

        const transactions = [];

        if (txData.status === '1' && Array.isArray(txData.result)) {
            txData.result.forEach((tx) => {
                const valueEth = ethers.utils.formatEther(tx.value || '0');
                const direction = (tx.to && tx.to.toLowerCase() === addr.toLowerCase()) ? 'Incoming' : 'Outgoing';
                transactions.push({
                    type: 'ETH',
                    hash: tx.hash,
                    timeStamp: Number(tx.timeStamp) || 0,
                    value: valueEth,
                    from: tx.from,
                    to: tx.to,
                    direction,
                    raw: tx
                });
            });
        }

        if (tokenData.status === '1' && Array.isArray(tokenData.result)) {
            tokenData.result.forEach((tk) => {
                // token value scaled by decimals
                const decimals = Number(tk.tokenDecimal) || 0;
                const value = decimals > 0 ? (Number(tk.value) / Math.pow(10, decimals)) : Number(tk.value);
                const direction = (tk.to && tk.to.toLowerCase() === addr.toLowerCase()) ? 'Incoming' : 'Outgoing';
                transactions.push({
                    type: 'TOKEN',
                    tokenSymbol: tk.tokenSymbol || tk.contractAddress,
                    hash: tk.hash,
                    timeStamp: Number(tk.timeStamp) || 0,
                    value: value,
                    from: tk.from,
                    to: tk.to,
                    direction,
                    raw: tk
                });
            });
        }

        // sort by timestamp desc
        transactions.sort((a, b) => b.timeStamp - a.timeStamp);

        const transactionList = document.getElementById('transactionList');
        if (!transactionList) {
            alert('Transaction list element not found in the DOM.');
            return;
        }

        transactionList.innerHTML = '';

        if (transactions.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'No transactions found.';
            transactionList.appendChild(li);
        } else {
            transactions.forEach((t) => {
                const li = document.createElement('li');
                li.className = 'tx-item';
                const date = new Date(t.timeStamp * 1000).toLocaleString();
                if (t.type === 'ETH') {
                    li.innerHTML = `<strong>${t.direction}</strong> • ${parseFloat(t.value).toFixed(6)} ETH<br><small>${date} • <a href="https://etherscan.io/tx/${t.hash}" target="_blank">View on Etherscan</a></small>`;
                } else {
                    li.innerHTML = `<strong>${t.direction}</strong> • ${t.value} ${t.tokenSymbol || ''}<br><small>${date} • <a href="https://etherscan.io/tx/${t.hash}" target="_blank">View on Etherscan</a></small>`;
                }
                transactionList.appendChild(li);
            });
        }

        // show history card
        const historyCard = document.getElementById('historyCard');
        if (historyCard) historyCard.classList.add('active');

    } catch (error) {
        console.error('Error fetching transaction history:', error);
        alert('Failed to fetch transaction history. Please try again.');
    } finally {
        if (refreshBtn) {
            refreshBtn.classList.remove('loading');
            refreshBtn.disabled = false;
        }
    }
}

// Event listeners for buttons
document.getElementById("balanceDesktop")?.addEventListener("click", fetchAndDisplayBalance);
document.getElementById("walletDesktop")?.addEventListener("click", displayWalletAddress);
document.getElementById("historyDesktop")?.addEventListener("click", fetchTransactionHistory);

// Function to fetch and display products (example placeholder)
async function fetchProducts() {
    // Fetch products without requiring an external API key.
    // Approach: show native ETH balance and check a configurable list of token/NFT contracts
    if (!isConnected || !currentAccount) {
        showNoWalletPrompt();
        return;
    }

    // configurable list of ERC-20 token contracts to check (add contracts you care about)
    // Load tracked token contracts from localStorage (user-configurable order)
    let trackedTokenContractsRaw = localStorage.getItem('tracked_token_contracts') || '';
    let trackedTokenContracts = trackedTokenContractsRaw.split(',').map(s => s.trim()).filter(Boolean);
    // normalize and dedupe (preserve first occurrence order)
    trackedTokenContracts = trackedTokenContracts.filter((v, i, a) => v && a.findIndex(x => x.toLowerCase() === v.toLowerCase()) === i);

    let trackedNftContractsRaw = localStorage.getItem('tracked_nft_contracts') || '';
    let trackedNftContracts = trackedNftContractsRaw.split(',').map(s => s.trim()).filter(Boolean);
    trackedNftContracts = trackedNftContracts.filter((v, i, a) => v && a.findIndex(x => x.toLowerCase() === v.toLowerCase()) === i);

    const userConfigured = (localStorage.getItem('user_has_configured') === 'true');
    // If user has not configured, show popular tokens even if balance 0 (showZero = true)
    await fetchLocalProducts(trackedTokenContracts, trackedNftContracts, !userConfigured);
}

// No automatic defaults: user must Configure contracts to display real products
function initDefaultTrackedContracts() {
    const prevTokens = localStorage.getItem('tracked_token_contracts') || '';
    // Remove unwanted defaults (WETH / WBTC) if previously stored
    const unwanted = [
        '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
        '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599'  // WBTC
    ];

    if (prevTokens) {
        const arr = prevTokens.split(',').map(s => s.trim()).filter(Boolean);
        const filtered = arr.filter(c => !unwanted.includes(c.toLowerCase()));
        const normalized = filtered.join(',');
        if (normalized !== prevTokens) {
            localStorage.setItem('tracked_token_contracts', normalized);
        }
    } else {
        const defaults = [
            '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
            '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
            '0x6B175474E89094C44Da98b954EedeAC495271d0F'  // DAI
        ].join(',');
        localStorage.setItem('tracked_token_contracts', defaults);
    }

    const prevNfts = localStorage.getItem('tracked_nft_contracts') || '';
    if (!prevNfts) {
        localStorage.setItem('tracked_nft_contracts', '');
    }

    // mark whether the user explicitly configured a contract
    if (!localStorage.getItem('user_has_configured')) {
        localStorage.setItem('user_has_configured', 'false');
    }
}

// Fetch ERC-20 token balances and NFTs owned by the connected address using Etherscan APIs
async function fetchLocalProducts(trackedTokenContracts = [], trackedNftContracts = [], showZero = false) {
    const addr = currentAccount;
    const productList = document.getElementById('productList');
    if (!productList) return;
    productList.innerHTML = '';

    const provider = new ethers.providers.Web3Provider(window.ethereum);

    // 1) Native ETH as product — show if balance > 0 or showZero requested
    try {
        const balance = await provider.getBalance(addr);
        if (balance && (balance.gt(0) || showZero)) {
            const eth = ethers.utils.formatEther(balance);
            const li = document.createElement('li');
            li.className = 'product-item eth-item';
            li.innerHTML = `
                <div class="product-row">
                    <div class="product-info">
                        <strong>ETH</strong>
                        <div class="product-desc">Balance: ${parseFloat(eth).toFixed(1)} ETH</div>
                    </div>
                    <div class="product-actions">
                        <button class="btn view-on-etherscan" data-href="https://etherscan.io/address/${addr}">View</button>
                    </div>
                </div>
            `;
            productList.appendChild(li);
        }
    } catch (err) {
        console.error('Failed to read ETH balance', err);
    }

    // 2) ERC-20 tokens from configured list
    const ERC20_ABI = [
        'function balanceOf(address) view returns (uint256)',
        'function decimals() view returns (uint8)',
        'function symbol() view returns (string)'
    ];

    for (const c of trackedTokenContracts) {
        try {
            const contract = new ethers.Contract(c, ERC20_ABI, provider);
            const [rawBal, decimals, symbol] = await Promise.all([
                contract.balanceOf(addr),
                contract.decimals().catch(() => 18),
                contract.symbol().catch(() => 'TOKEN')
            ]);
            const human = ethers.utils.formatUnits(rawBal, decimals || 0);
            // Render token if balance > 0 or showZero (for popular tokens initial view)
                if ((rawBal && rawBal.gt(0)) || showZero) {
                const li = document.createElement('li');
                li.className = 'product-item token-item';
                li.innerHTML = `
                    <div class="product-row">
                        <div class="product-info">
                            <strong>${symbol}</strong>
                                <div class="product-desc">Balance: ${parseFloat(human).toFixed(1)}</div>
                        </div>
                        <div class="product-actions">
                            <button class="btn view-on-etherscan" data-href="https://etherscan.io/token/${c}?a=${addr}">View</button>
                        </div>
                    </div>
                `;
                productList.appendChild(li);
            }
        } catch (err) {
            console.warn('Failed to read token', c, err);
        }
    }

    // 3) NFTs from configured list (attempt enumeration if ERC-721 Enumerable)
    const ERC721_ABI = [
        'function balanceOf(address) view returns (uint256)',
        'function tokenOfOwnerByIndex(address,uint256) view returns (uint256)',
        'function supportsInterface(bytes4) view returns (bool)'
    ];

    for (const c of trackedNftContracts) {
        try {
            const contract = new ethers.Contract(c, ERC721_ABI, provider);
            const balance = await contract.balanceOf(addr);
            const count = balance.toNumber();
            if (count === 0) continue;

            for (let i = 0; i < count; i++) {
                try {
                    const tokenId = await contract.tokenOfOwnerByIndex(addr, i);
                    const li = document.createElement('li');
                    li.className = 'product-item nft-item';
                    li.innerHTML = `
                        <div class="product-row">
                            <div class="product-info">
                                <strong>NFT</strong>
                                <div class="product-desc">Contract: ${c} • Token ID: ${tokenId.toString()}</div>
                            </div>
                            <div class="product-actions">
                                <button class="btn view-on-etherscan" data-href="https://etherscan.io/token/${c}?a=${addr}">View</button>
                                <button class="btn open-opensea" data-href="https://opensea.io/assets/ethereum/${c}/${tokenId.toString()}">OpenSea</button>
                            </div>
                        </div>
                    `;
                    productList.appendChild(li);
                } catch (err) {
                    console.warn('Failed to read tokenOfOwnerByIndex for', c, err);
                }
            }
        } catch (err) {
            console.warn('Failed to read NFT contract', c, err);
        }
    }

    // delegated handlers for view/open
    if (!productList.dataset.delegateSet) {
        productList.addEventListener('click', (e) => {
            const view = e.target.closest('.view-on-etherscan');
            if (view) {
                const href = view.getAttribute('data-href');
                if (href) {
                    // Open the Etherscan token/address page in a new tab
                    window.open(href, '_blank');
                }
                return;
            }
            const os = e.target.closest('.open-opensea');
            if (os) {
                const href = os.getAttribute('data-href');
                if (href) window.open(href, '_blank');
                return;
            }
        });
        productList.dataset.delegateSet = '1';
    }

    const productsCard = document.getElementById('productsCard');
    if (productsCard) productsCard.classList.add('active');
}

// Prompt user to configure tracked contracts and save order to localStorage
function configureTrackedContracts() {
    const prevTokens = localStorage.getItem('tracked_token_contracts') || '';
    const prevNfts = localStorage.getItem('tracked_nft_contracts') || '';
    const tokenInput = prompt('Enter ERC-20 token contract addresses in desired order (comma separated):', prevTokens);
    if (tokenInput !== null) {
        const normalized = tokenInput.split(',').map(s => s.trim()).filter(Boolean).join(',');
        localStorage.setItem('tracked_token_contracts', normalized);
    }

    const nftInput = prompt('Enter ERC-721 contract addresses for enumeration (comma separated):', prevNfts);
    if (nftInput !== null) {
        const normalized = nftInput.split(',').map(s => s.trim()).filter(Boolean).join(',');
        localStorage.setItem('tracked_nft_contracts', normalized);
    }

    alert('Configuration saved. Refreshing products...');
    fetchProducts();
}

// Configure a single contract (prompt), detect type and add to tracked lists
async function configureSingleContract() {
    if (!isConnected || !currentAccount) {
        showNoWalletPrompt();
        return;
    }

    const input = prompt('Enter contract address to track (ERC-20 or ERC-721):');
    if (!input) return;
    let addr;
    try {
        addr = ethers.utils.getAddress(input.trim());
    } catch (err) {
        alert('Invalid address');
        return;
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);

    // Try ERC-20
    const ERC20_ABI = ['function symbol() view returns (string)', 'function decimals() view returns (uint8)', 'function balanceOf(address) view returns (uint256)'];
    try {
        const token = new ethers.Contract(addr, ERC20_ABI, provider);
        const symbol = await token.symbol().catch(() => null);
        if (symbol) {
            // add to tracked tokens at top
            const prev = localStorage.getItem('tracked_token_contracts') || '';
            const arr = prev.split(',').map(s=>s.trim()).filter(Boolean);
            // remove if exists
            const filtered = arr.filter(c => c.toLowerCase() !== addr.toLowerCase());
            filtered.unshift(addr);
            localStorage.setItem('tracked_token_contracts', filtered.join(','));
            alert('Token contract added: ' + (symbol || addr));
            // mark user has configured, show Refresh and Buy
            localStorage.setItem('user_has_configured', 'true');
            const refreshBtn = document.getElementById('refreshProducts');
            const buyBtn = document.getElementById('buyProducts');
            if (refreshBtn) refreshBtn.style.display = '';
            if (buyBtn) buyBtn.style.display = '';
            fetchProducts();
            return;
        }
    } catch (err) {
        // continue to try ERC-721
    }

    // Try ERC-721
    const ERC721_ABI = ['function supportsInterface(bytes4) view returns (bool)', 'function balanceOf(address) view returns (uint256)'];
    try {
        const nft = new ethers.Contract(addr, ERC721_ABI, provider);
        const balance = await nft.balanceOf(currentAccount).catch(() => null);
        if (balance !== null) {
            // add to tracked nft list
            const prev = localStorage.getItem('tracked_nft_contracts') || '';
            const arr = prev.split(',').map(s=>s.trim()).filter(Boolean);
            const filtered = arr.filter(c => c.toLowerCase() !== addr.toLowerCase());
            filtered.unshift(addr);
            localStorage.setItem('tracked_nft_contracts', filtered.join(','));
            alert('NFT contract added and will be enumerated (if supported).');
            // mark user has configured, show Refresh and Buy
            localStorage.setItem('user_has_configured', 'true');
            const refreshBtn = document.getElementById('refreshProducts');
            const buyBtn = document.getElementById('buyProducts');
            if (refreshBtn) refreshBtn.style.display = '';
            if (buyBtn) buyBtn.style.display = '';
            fetchProducts();
            return;
        }
    } catch (err) {
        console.warn('Not ERC-721 either', err);
    }

    alert('Contract does not appear to be ERC-20 or ERC-721 (or call failed). It was not added.');
}

// Event listeners for buttons
document.getElementById("historyDesktop")?.addEventListener("click", fetchTransactionHistory);
document.getElementById("productsDesktop")?.addEventListener("click", fetchProducts);
document.getElementById("productsMobile")?.addEventListener("click", (e) => {
    e.stopPropagation();
    fetchProducts();
    closeDropdowns();
});

// Event listeners for action buttons in the landing page section
document.addEventListener("DOMContentLoaded", () => {
    

    // Specific listeners for balance actions (close + refresh)
    document.getElementById('closeBalance')?.addEventListener('click', (e) => {
        const balanceCard = document.getElementById('balanceCard');
        if (balanceCard) {
            balanceCard.classList.remove('active');
        }
    });

    document.getElementById('refreshBalance')?.addEventListener('click', (e) => {
        e.stopPropagation();
        fetchAndDisplayBalance();
    });

    // History card actions
    document.getElementById('refreshHistory')?.addEventListener('click', (e) => {
        e.stopPropagation();
        // If no API key stored, prompt user to enter one before fetching
        if (!getEtherscanApiKey()) {
            const key = promptForEtherscanApiKey();
            if (!key) return; // user cancelled
        }
        fetchTransactionHistory();
    });

    document.getElementById('closeHistory')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const historyCard = document.getElementById('historyCard');
        if (historyCard) historyCard.classList.remove('active');
    });

    document.getElementById('openEtherscan')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!isConnected || !currentAccount) {
            showNoWalletPrompt();
            return;
        }
        // Open the Etherscan wallet address page in a new tab
        const etherscanUrl = `https://etherscan.io/address/${currentAccount}`;
        window.open(etherscanUrl, '_blank');
    });

    // Products card global buttons
    document.getElementById('configureProducts')?.addEventListener('click', (e) => {
        e.stopPropagation();
        configureSingleContract();
    });

    document.getElementById('openEtherscanProducts')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!isConnected || !currentAccount) {
            showNoWalletPrompt();
            return;
        }
        // Open the Etherscan wallet address page in a new tab
        const etherscanUrl = `https://etherscan.io/address/${currentAccount}`;
        window.open(etherscanUrl, '_blank');
    });

    document.getElementById('refreshProducts')?.addEventListener('click', (e) => {
        e.stopPropagation();
        fetchProducts();
    });

    document.getElementById('buyProducts')?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!isConnected || !currentAccount) {
            showNoWalletPrompt();
            return;
        }
        // Try to open MetaMask mobile app pointing to the address on Etherscan
        const etherscanAddr = `https://etherscan.io/address/${currentAccount}`;
        const metaLink = `https://metamask.app.link/dapp/${etherscanAddr.replace(/^https?:\/\//, '')}`;
        // open metaLink; if it fails user can still use etherscan
        window.open(metaLink, '_blank');
    });

    
    
    // Explicit listeners for copy/close buttons with unique IDs
    document.getElementById('copyWallet')?.addEventListener('click', (e) => {
        e.stopPropagation();
        copyWallet();
    });

    document.getElementById('closeWallet')?.addEventListener('click', (e) => {
        e.stopPropagation();
        closeWallet();
    });

    // Close products card
    document.getElementById('closeProducts')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const productsCard = document.getElementById('productsCard');
        if (productsCard) productsCard.classList.remove('active');
    });

    // Set visibility of Refresh/Buy in products footer only if user explicitly configured contracts
    const refreshBtn = document.getElementById('refreshProducts');
    const buyBtn = document.getElementById('buyProducts');
    const userConfigured = (localStorage.getItem('user_has_configured') === 'true');
    if (userConfigured) {
        if (refreshBtn) refreshBtn.style.display = '';
        if (buyBtn) buyBtn.style.display = '';
    } else {
        if (refreshBtn) refreshBtn.style.display = 'none';
        if (buyBtn) buyBtn.style.display = 'none';
    }
});

// Copy wallet address helper
function copyWallet() {
    const walletAddress = document.getElementById('walletAddress');
    if (!walletAddress) return;
    const text = walletAddress.textContent.trim();
    if (!text || text === '-' || text.toLowerCase().includes('please connect')) {
        alert('No wallet address to copy.');
        return;
    }
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('copyWallet');
        if (btn) {
            const prev = btn.textContent;
            btn.textContent = 'Copied';
            setTimeout(() => btn.textContent = prev, 1200);
        }
    }).catch((err) => {
        console.error('Failed to copy:', err);
        alert('Failed to copy wallet address.');
    });
}

// Close wallet card helper
function closeWallet() {
    const walletCard = document.getElementById('walletCard');
    if (walletCard) walletCard.classList.remove('active');
}

// Show single product detail and also surface MetaMask info
function viewProduct(product) {
    if (!product) return;
    const productList = document.getElementById('productList');
    if (!productList) return;

    productList.innerHTML = '';

    const detail = document.createElement('div');
    detail.className = 'product-detail';
    detail.innerHTML = `
        <h3>${product.name}</h3>
        <p class="product-desc">${product.desc || ''}</p>
        <p><strong>Price:</strong> <span class="product-price">${product.price}</span></p>
        <p><strong>Seller:</strong> <span id="productSeller">-</span></p>
        <div class="product-detail-actions">
            <button class="btn back-to-list">Back</button>
            <button class="btn buy-now" id="buyNowBtn">Buy Now</button>
        </div>
    `;

    productList.appendChild(detail);

    // show seller as connected wallet (if available)
    const sellerEl = document.getElementById('productSeller');
    if (sellerEl) {
        if (isConnected && currentAccount) sellerEl.textContent = currentAccount;
        else sellerEl.textContent = 'Please connect MetaMask';
    }

    // show product card
    const productsCard = document.getElementById('productsCard');
    if (productsCard) productsCard.classList.add('active');

    // surface wallet info in other cards as well
    if (isConnected) {
        displayWalletAddress();
        fetchAndDisplayBalance();
    }

    // back to list handler
    detail.querySelector('.back-to-list')?.addEventListener('click', (e) => {
        e.stopPropagation();
        fetchProducts();
    });

    // buy now handler in detail view
    detail.querySelector('#buyNowBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        buyProduct(product);
    });
}

// Buy product via MetaMask (opens MetaMask confirmation)
async function buyProduct(product) {
    if (!isConnected || !currentAccount) {
        showNoWalletPrompt();
        return;
    }

    try {
        // parse price like "0.1 ETH"
        const priceStr = (product.price || '').toLowerCase().replace('eth', '').trim();
        if (!priceStr) {
            alert('Product price missing.');
            return;
        }

        const value = ethers.utils.parseEther(priceStr);

        const to = product.seller || '0x000000000000000000000000000000000000dEaD';

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        const tx = await signer.sendTransaction({
            to,
            value,
        });

        alert('Transaction submitted: ' + tx.hash);
        // show products card and refresh balance
        fetchAndDisplayBalance();
    } catch (err) {
        console.error('Buy transaction failed:', err);
        alert('Purchase failed or cancelled.');
    }
}

// PAnggil CHECKCONNECTION SAAT HALAMAN DIMUAT
document.addEventListener("DOMContentLoaded", () => {
    initDefaultTrackedContracts();
    checkConnection();
});




