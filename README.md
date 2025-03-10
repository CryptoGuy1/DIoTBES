Decetralized IoT-Blockchain for Environmental Sensing (DIoTBES)

This guide provides a step-by-step tutorial for deploying a Hyperledger Fabric blockchain network integrated with IoT-based environmental sensing. The system enables secure and transparent data logging for methane and environmental data.

📌 Prerequisites
Before you begin, install all required dependencies from the Hyperledger Fabric official documentation:

🔗 Download Prerequisites: https://hyperledger-fabric.readthedocs.io/en/latest/prereqs.html

✅ Install:

Git (for version control)
cURL (for downloading dependencies)
Docker & Docker-Compose (to run blockchain nodes)
Node.js & npm (to run the REST API backend)
Verify Installation
Run the following commands to check if everything is installed:

git --version
docker --version
docker-compose --version
node -v
npm -v
If any of these are missing, install them using the Hyperledger Fabric prerequisites guide.

1️⃣ Clone Hyperledger Fabric Sample Network

Run the command below to download the Hyperledger Fabric test network:

git clone --branch main https://github.com/hyperledger/fabric-samples.git
Navigate to the test-network directory:

cd fabric-samples/test-network
📌 Important:

Delete the default asset-transfer-basic folder:
rm -rf ../asset-transfer-basic
Copy the updated version from this repository:
cp -r /path/to/this/repo/asset-transfer-basic ../fabric-samples/
Replace /path/to/this/repo/ with your actual directory path.

2️⃣ Start the Blockchain Network

Inside the test-network folder, run the following commands in order:

🔻 Stop any previous network

./network.sh down
🔻 Start the blockchain network

./network.sh up
🔻 Create a new channel

./network.sh createChannel
🔻 Deploy the Smart Contract (Chaincode)

./network.sh deployCC -ccn basic -ccp ../asset-transfer-basic/DHT-sensor-chaincode -ccl typescript -c mychannel
✅ If successful, your Hyperledger Fabric blockchain is now running.

3️⃣ Configure Environment Variables

Before interacting with the blockchain, set the following environment variables.

Run:

export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=$PWD/../config/
🔹 Set up Org1 Peer Environment:

export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
export CORE_PEER_ADDRESS=localhost:7051
4️⃣ Initialize the Blockchain Ledger

Run this command to initialize the blockchain ledger with default sensor data:

peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" -C mychannel -n basic --peerAddresses localhost:7051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt" --peerAddresses localhost:9051 --tlsRootCertFiles "${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt" -c '{"function":"InitLedger","Args":[]}'
✅ To verify data stored on the blockchain, query the ledger:

peer chaincode query -C mychannel -n basic -c '{"Args":["GetAllAssets"]}'
This command should return JSON output with sensor readings.

5️⃣ Start the REST API Server

The REST API backend allows external applications to interact with the blockchain.

Navigate to the backend directory:

cd ../asset-transfer-basic/DHT-sensor-backend
🔹 Install dependencies:

npm install
🔹 Build the project:

npm run build
🔹 Set up required environment variables:

export PRIVATE_KEY_FILE_ORG1=../test-network/organizations/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/keystore/priv_sk
export CERTIFICATE_FILE_ORG1=../test-network/organizations/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp/signcerts/User1@org1.example.com-cert.pem
export CONNECTION_PROFILE_FILE_ORG1=../test-network/organizations/peerOrganizations/org1.example.com/connection-org1.json
🔹 Start Redis Database:

export REDIS_PASSWORD=$(uuidgen)
npm run start:redis
🔹 Start the REST API Server:

npm run start:dev
✅ The API is now running and ready to process blockchain transactions.

6️⃣ Retrieve the Space API Key

The API Key is required for authenticating sensor data submissions.

🔹 Run the following command inside DHT-sensor-backend folder:

SAMPLE_APIKEY=$(grep ORG1_APIKEY .env | cut -d '=' -f 2-)
🔹 Display the API Key:

echo $SAMPLE_APIKEY
📌 Copy this key and paste it inside the IoT sensor script.

7️⃣ Connect IoT Sensor Data to the Blockchain

To stream real-time sensor data to the blockchain:

1️⃣ Stop any running server.py script on the IoT server.

2️⃣ Open the server.py script:

nano server.py
3️⃣ Replace the old API key with the new one retrieved earlier.

4️⃣ Restart the script:

python3 server.py
Now, sensor data will be automatically recorded onto the blockchain.

8️⃣ Collecting Sensor Data from IoT Devices

The environmental sensing system utilizes three Raspberry Pi computers deployed at different locations. Each Raspberry Pi is equipped with a DHT11 sensor to collect humidity and temperature data.

🔹 How the IoT Sensor System Works
1️⃣ Each Raspberry Pi runs a Python script (Rpi.py) to collect temperature and humidity readings.
2️⃣ The script transmits the sensor data to server.py, running on the IoT server.
3️⃣ The IoT server then forwards the data to the blockchain via the REST API.

🔹 Setting Up the Raspberry Pi Sensors
To start sensor data collection, follow these steps on each Raspberry Pi:

📌 Step 1: Stop any existing sensor script
If Rpi.py is already running, stop it:

pkill -f Rpi.py
📌 Step 2: Start the Raspberry Pi Sensor Script

python3 Rpi.py
This script will:

Read data from the DHT11 sensor.
Send the sensor data to the IoT server (server.py).
The IoT server will push the data to the blockchain.
📌 Step 3: Verify the IoT Server Connection
On the IoT server, make sure server.py is running:

python3 server.py
📌 Step 4: Confirm Blockchain Storage
Query the blockchain to check if the sensor data has been recorded:

peer chaincode query -C mychannel -n basic -c '{"Args":["GetAllAssets"]}'

9️⃣ Running Performance Tests with Hyperledger Caliper

To benchmark the network performance, install and run Caliper.

1. Install Caliper
npm install --only=prod @hyperledger/caliper-cli
npm install --only=prod @hyperledger/caliper-cli@0.6.0
2. Bind Caliper to Fabric
npx caliper bind --caliper-bind-sut fabric:fabric-gateway
3. Run Benchmarking
npx caliper launch manager \
--caliper-benchconfig benchmarks/config.yaml \
--caliper-networkconfig networks/network-config-local.yaml \
--caliper-workspace .
📌 This will generate a performance report including transaction speed, latency, and efficiency.

🎯 Conclusion

By following this guide, you have: ✅ Deployed a Hyperledger Fabric blockchain network
✅ Deployed a smart contract for IoT sensor data
✅ Started a REST API server for blockchain transactions
✅ Connected real-time IoT sensor data to the blockchain
✅ Performed performance benchmarking with Hyperledger Caliper

💡 Ensure you update file paths based on your system directory structure.

📖 For troubleshooting, refer to Hyperledger Fabric Documentation.

