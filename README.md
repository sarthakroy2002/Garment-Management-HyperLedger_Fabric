# Garment Management - Hyperledger Fabric Network Application 
This project is a Hyperledger Fabric Network Application for managing garments. It is a simple application that demonstrates the use of Hyperledger Fabric Network for managing garments. The application is developed using Hyperledger Fabric Network, Node.js, and Express.js.

## How to run the application
1. Clone the repository
2. Setup the Hyperledger Fabric Network by
- Install WSL2 Ubuntu on your Windows 11 by starting Windows Terminal as Administrator and run the following commands
```
wsl --install
```
- Install Docker Desktop on your Windows 11 from Docker Website
- Open Docker and go to `Settings -> Resources -> WSL Integration` and enable the `Ubuntu`
- Start WSL2 Ubuntu and run the following commands to install the required dependencies
```bash
sudo apt-get install git curl -y

sudo apt update

sudo apt install ca-certificates curl gnupg

sudo mkdir -p /etc/apt/keyrings

curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg

echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list

sudo apt update

sudo apt install nodejs

sudo apt install build-essential
```
- Clone the Hyperledger Fabric Samples repository
```bash
mkdir -p $HOME/go/src/github.com/your_github_userid

cd $HOME/go/src/github.com/your_github_userid

curl -sSLO https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh && chmod +x install-fabric.sh

./install-fabric.sh
```
3. Now copy the `application-gateway-typescript` and `chaincode-javascript` folders to the `fabric-samples/asset-transfer-basic` folder
4. Go back to the `fabric-samples` folder
5. Start the Hyperledger Fabric Network by running the following commands
```bash
./network.sh down
./network.sh up createChannel -c mychannel -ca
./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/chaincode-javascript -ccl javascript
cd ..
cd asset-transfer-basic/application-gateway-typescript
npm install
npm start
```
6. The Application will be running in CLI
7. The Application API will be available in `http://localhost:3000/api/garment`
7. If you want to see the WebUI for fetching all blocks, Then copy the frontend folder from `application-gateway-typescript` to your Windows and then run the `index.html` file in your browser

### Developed by Sarthak Roy by refering the given samples provided by Hyperledger
