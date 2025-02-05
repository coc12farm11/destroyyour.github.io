// const web3 = require('@solana/web3.js');
// const { TOKEN_PROGRAM_ID } = require('@solana/spl-token');

// async function getSpecificTokenBalance(walletAddress, specificTokenMint) {
//     // Подключаемся к сети Solana
//     const connection = new web3.Connection(web3.clusterApiUrl('mainnet-beta'));
    
//     // Преобразуем адреса в публичные ключи
//     const pubKey = new web3.PublicKey(walletAddress);
//     const tokenMintPubKey = new web3.PublicKey(specificTokenMint);
    
//     try {
//         // Получаем все токенные аккаунты
//         const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubKey, {
//             programId: TOKEN_PROGRAM_ID,
//         });

//         // Ищем конкретный токен
//         const specificToken = tokenAccounts.value.find(tokenAccount => 
//             tokenAccount.account.data.parsed.info.mint === specificTokenMint
//         );

//         if (specificToken) {
//             const tokenData = specificToken.account.data.parsed.info;
            
//             // Формируем объект с данными токена
//             const tokenInfo = {
//                 mint: tokenData.mint,
//                 owner: tokenData.owner,
//                 balance: tokenData.tokenAmount.uiAmount,
//                 decimals: tokenData.tokenAmount.decimals,
//                 address: specificToken.pubkey.toString()
//             };

//             console.log('Информация о токене:');
//             console.log(`Адрес токена: ${tokenInfo.mint}`);
//             console.log(`Владелец: ${tokenInfo.owner}`);
//             console.log(`Баланс: ${tokenInfo.balance}`);
//             console.log(`Decimals: ${tokenInfo.decimals}`);
//             console.log(`Адрес аккаунта токена: ${tokenInfo.address}`);

//             return tokenInfo;
//         } else {
//             console.log('Токен не найден в кошельке');
//             return null;
//         }
//     } catch (error) {
//         console.error('Ошибка при получении данных токена:', error);
//         throw error;
//     }
// }

// // Пример использования
// const WALLET_ADDRESS = '8cabpA9iTMnCm58eECPBvabV7Nm6hF83MWdWuULn2k14';
// const TOKEN_MINT = 'D5U74oLHp4qsRxfBCH6LpVeWqQXY5XwgTW1s9h37pump';

// getSpecificTokenBalance(WALLET_ADDRESS, TOKEN_MINT)
//     .then(tokenInfo => {
//         if (tokenInfo) {
//             // Здесь можно добавить дополнительную обработку данных
//             console.log('Данные успешно получены');
//         }
//     })
//     .catch(error => {
//         console.error('Произошла ошибка:', error);
//     });


const web3 = require('@solana/web3.js');

async function getTokenLargestAccounts(tokenMintAddress) {
  const connection = new web3.Connection('https://api.mainnet-beta.solana.com', 'confirmed');
  const mintPubkey = new web3.PublicKey(tokenMintAddress);

  try {
    console.log(`Connecting to ${connection.rpcEndpoint}`);
    console.log(`Fetching information for mint: ${tokenMintAddress}`);

    // Сначала проверим, существует ли минт
    const mintInfo = await connection.getAccountInfo(mintPubkey);
    if (!mintInfo) {
      throw new Error('Mint account does not exist');
    }

    const largestAccounts = await connection.getTokenLargestAccounts(mintPubkey);

    console.log('Largest token accounts:');
    largestAccounts.value.forEach((account, index) => {
      console.log(`${index + 1}: Address: ${account.address.toBase58()}, Amount: ${account.amount}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
    if (error instanceof web3.SolanaJSONRPCError) {
      console.error('RPC Error Code:', error.code);
      console.error('RPC Error Data:', error.data);
    }
  }
}

// Вызываем функцию с адресом минта токена
getTokenLargestAccounts('D5U74oLHp4qsRxfBCH6LpVeWqQXY5XwgTW1s9h37pump');