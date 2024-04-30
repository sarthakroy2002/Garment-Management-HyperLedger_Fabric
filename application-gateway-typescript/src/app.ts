'use strict';

import * as grpc from '@grpc/grpc-js';
import { connect, Contract, Identity, Signer, signers } from '@hyperledger/fabric-gateway';
import * as crypto from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import { TextDecoder } from 'util';
import express from 'express';

const channelName = envOrDefault('CHANNEL_NAME', 'mychannel');
const chaincodeName = envOrDefault('CHAINCODE_NAME', 'basic');
const mspId = envOrDefault('MSP_ID', 'Org1MSP')

const app = express();
const port = process.env.PORT || 3000;

const cryptoPath = envOrDefault('CRYPTO_PATH', path.resolve(__dirname, '..', '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com'));

const keyDirectoryPath = envOrDefault('KEY_DIRECTORY_PATH', path.resolve(cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'keystore'));

const certPath = envOrDefault('CERT_PATH', path.resolve(cryptoPath, 'users', 'User1@org1.example.com', 'msp', 'signcerts', 'cert.pem'));

const tlsCertPath = envOrDefault('TLS_CERT_PATH', path.resolve(cryptoPath, 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt'));

const peerEndpoint = envOrDefault('PEER_ENDPOINT', 'localhost:7051');

const peerHostAlias = envOrDefault('PEER_HOST_ALIAS', 'peer0.org1.example.com');

const utf8Decoder = new TextDecoder();
const assetId = `asset${Date.now()}`;
let gateway: { getNetwork: (arg0: string) => any; };
let client: any;

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.post('/api/garments', async (req, res) => {
    const { garmentId, color, size, owner, appraisedValue } = req.body;
    try {
        const network = gateway.getNetwork(channelName);
        const contract = network.getContract(chaincodeName);
        await contract.submitTransaction(
            'CreateGarment',
            garmentId,
            color,
            size,
            owner,
            appraisedValue
        );
        res.status(201).send('Garment created successfully');
    } catch (error) {
        console.error('Error creating garment:', error);
        res.status(500).send('Failed to create garment');
    }
});

app.get('/api/garments', async (req, res) => {
    try {
        const network = gateway.getNetwork(channelName);
        const contract = network.getContract(chaincodeName);
        const resultBytes = await contract.evaluateTransaction('GetAllGarments');
        const resultJson = utf8Decoder.decode(resultBytes);
        const garments = JSON.parse(resultJson);
        res.status(200).json(garments);
    } catch (error) {
        console.error('Error fetching garments:', error);
        res.status(500).send('Failed to fetch garments');
    }
});

async function maini(): Promise<void> {
    await displayInputParameters();

    const client = await newGrpcConnection();

    const gateway = connect({
        client,
        identity: await newIdentity(),
        signer: await newSigner(),
        evaluateOptions: () => {
            return { deadline: Date.now() + 5000 };
        },
        endorseOptions: () => {
            return { deadline: Date.now() + 15000 };
        },
        submitOptions: () => {
            return { deadline: Date.now() + 5000 };
        },
        commitStatusOptions: () => {
            return { deadline: Date.now() + 60000 };
        },
    });

    try {
        while (true) {
            await displayMenu();

            const choice = await askForUserInput('Enter your choice: ');

            switch (choice.trim()) {
                case '1':
                    await createGarment(gateway);
                    break;
                case '2':
                    await getAllGarments(gateway);
                    break;
                case '0':
                    console.log('Exiting...');
                    return;
                default:
                    console.log('Invalid choice. Please select again.');
                    break;
            }
        }
    } finally {
        gateway.close();
        client.close();
    }
}

async function newGrpcConnection(): Promise<grpc.Client> {
    const tlsRootCert = await fs.readFile(tlsCertPath);
    const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
    return new grpc.Client(peerEndpoint, tlsCredentials, {
        'grpc.ssl_target_name_override': peerHostAlias,
    });
}

async function newIdentity(): Promise<Identity> {
    const credentials = await fs.readFile(certPath);
    return { mspId, credentials };
}

async function newSigner(): Promise<Signer> {
    const files = await fs.readdir(keyDirectoryPath);
    const keyPath = path.resolve(keyDirectoryPath, files[0]);
    const privateKeyPem = await fs.readFile(keyPath);
    const privateKey = crypto.createPrivateKey(privateKeyPem);
    return signers.newPrivateKeySigner(privateKey);
}

async function displayInputParameters(): Promise<void> {
    console.log(`channelName:       ${channelName}`);
    console.log(`chaincodeName:     ${chaincodeName}`);
    console.log(`mspId:             ${mspId}`);
    console.log(`cryptoPath:        ${cryptoPath}`);
    console.log(`keyDirectoryPath:  ${keyDirectoryPath}`);
    console.log(`certPath:          ${certPath}`);
    console.log(`tlsCertPath:       ${tlsCertPath}`);
    console.log(`peerEndpoint:      ${peerEndpoint}`);
    console.log(`peerHostAlias:     ${peerHostAlias}`);
}

async function displayMenu(): Promise<void> {
    console.log('\n==== MENU ====');
    console.log('1. Create a new garment');
    console.log('2. View all garments');
    console.log('0. Exit');
    console.log('==============');
}

async function askForUserInput(prompt: string): Promise<string> {
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise<string>(resolve => {
        readline.question(prompt, (input: string | PromiseLike<string>) => {
            readline.close();
            resolve(input);
        });
    });
}

async function createGarment(gateway: any): Promise<void> {
    const network = gateway.getNetwork(channelName);
    const contract = network.getContract(chaincodeName);

    console.log('\n=== Create New Garment ===');

    const garmentId = await askForUserInput('Enter garment ID: ');
    const color = await askForUserInput('Enter color: ');
    const size = await askForUserInput('Enter size: ');
    const owner = await askForUserInput('Enter owner: ');
    const appraisedValue = await askForUserInput('Enter appraised value: ');

    console.log('\n--> Submit Transaction: CreateGarment, creating new garment...');
    
    await contract.submitTransaction(
        'CreateGarment',
        garmentId,
        color,
        size,
        owner,
        appraisedValue
    );

    console.log(`*** Garment with ID ${garmentId} created successfully`);
}

async function getAllGarments(gateway: any): Promise<void> {
    const network = gateway.getNetwork(channelName);
    const contract = network.getContract(chaincodeName);

    console.log('\n--> Evaluate Transaction: GetAllGarments, function returns all the current garments on the ledger');

    const resultBytes = await contract.evaluateTransaction('GetAllGarments');

    const resultJson = utf8Decoder.decode(resultBytes);
    const result = JSON.parse(resultJson);
    console.log('*** Result:', result);
}

function envOrDefault(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
}

maini().catch(error => {
    console.error('******** FAILED to run the application:', error);
    process.exitCode = 1;
});

app.listen(port, async () => {
    try {
        const tlsRootCert = await fs.readFile(tlsCertPath);
        const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
        client = new grpc.Client(peerEndpoint, tlsCredentials, {
            'grpc.ssl_target_name_override': peerHostAlias,
        });

        gateway = await connect({
            client,
            identity: await newIdentity(),
            signer: await newSigner(),
            evaluateOptions: () => {
                return { deadline: Date.now() + 5000 };
            },
            endorseOptions: () => {
                return { deadline: Date.now() + 15000 };
            },
            submitOptions: () => {
                return { deadline: Date.now() + 5000 };
            },
            commitStatusOptions: () => {
                return { deadline: Date.now() + 60000 };
            },
        });
        console.log(`Server is running on port ${port}`);
    } catch (error) {
        console.error('Failed to initialize the gateway:', error);
        process.exit(1);
    }
});
