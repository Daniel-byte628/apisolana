import { Connection, Keypair } from "@solana/web3.js";
import { Metaplex, keypairIdentity, bundlrStorage, toMetaplexFile } from "@metaplex-foundation/js";
import express from "express";
import fetch from "node-fetch";

const app = express();
const port = 3000;

const QUICKNODE_RPC = "https://api.devnet.solana.com";
const SOLANA_CONNECTION = new Connection(QUICKNODE_RPC);

const secret = ""; // Reemplaza con tu clave privada
const secretKey = Uint8Array.from([...Buffer.from(secret, "base64")]);
const WALLET = Keypair.fromSecretKey(secretKey);

const METAPLEX = Metaplex.make(SOLANA_CONNECTION)
    .use(keypairIdentity(WALLET))
    .use(bundlrStorage({
        address: 'https://devnet.bundlr.network',
        providerUrl: QUICKNODE_RPC,
        timeout: 60000,
    }));

app.get("/nft", async (req, res) => {
    try {
        const imgUri = "URL_DE_LA_IMAGEN"; // Reemplaza con la URL de la imagen
        const metadataUri = await uploadMetadata(imgUri, "image/jpg", "QuickNode art", "QuickNode is a work of art!", [
            { trait_type: 'Speed', value: 'Quick' },
            { trait_type: 'Type', value: 'Abstract' },
            { trait_type: 'Background', value: 'Blue' }
        ]);
        const nft = await mintNft(metadataUri, "QuickNode art", 500, "QNA", [{ address: WALLET.publicKey, share: 100 }]);
        res.json({ nft });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

async function uploadMetadata(imgUri, imgType, nftName, description, attributes) {
    console.log('Step 2 - Uploading Metadata');
    const { uri } = await METAPLEX.nfts().uploadMetadata({
        name: nftName,
        description,
        image: imgUri,
        attributes,
        properties: {
            files: [
                {
                    type: imgType,
                    uri: imgUri,
                },
            ],
        },
    });
    console.log('   Metadata URI:', uri);
    return uri;
}

async function mintNft(metadataUri, name, sellerFee, symbol, creators) {
    console.log('Step 3 - Minting NFT');
    const { nft } = await METAPLEX.nfts().create({
        uri: metadataUri,
        name,
        sellerFeeBasisPoints: sellerFee,
        symbol,
        creators,
        isMutable: false,
    }, { commitment: "finalized" });

    console.log('   Success!🎉');
    console.log(`   Minted NFT: https://explorer.solana.com/address/${nft.address}?cluster=devnet`);
    return nft;
}

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

   














