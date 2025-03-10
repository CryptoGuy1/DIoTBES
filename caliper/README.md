
# **Caliper Local Installation Guide**

This guide will help you with installing and binding Caliper for benchmarking your Hyperledger Fabric network.

---

## **1. Install Caliper**

To install Caliper globally and bind it to your Hyperledger Fabric network:



- **Install Caliper CLI Globally**:
  ```bash
  npm install --only=prod @hyperledger/caliper-cli
  npm install  --only=prod @hyperledger/caliper-cli@0.6.0
  ```
---


## **2. Bind Caliper to Specific Fabric Versions**

You can bind Caliper to different versions of Hyperledger Fabric:

- **Binding to Fabric Gateway - Recommended**:


  ```bash
  npx caliper bind --caliper-bind-sut fabric:fabric-gateway

  ```
- **Binding to Fabric 2.2**:
  ```bash
  npx caliper bind --caliper-bind-sut fabric:2.2
  ```

- **Binding to Fabric 2.4**:
  ```bash
  npx caliper bind --caliper-bind-sut fabric:2.4
  ```

---

## **3. Unbind Caliper**

If you need to unbind Caliper from a specific Fabric version:

- **Unbind from Fabric 2.2**:
  ```bash
  npx caliper unbind --caliper-bind-sut fabric:2.2
  ```

- **Unbind from Fabric Gateway**:
  ```bash
  npx caliper unbind --caliper-bind-sut fabric:fabric-gateway
  ```

---

## **4. Launching Caliper for Benchmarking**

To launch Caliper with your benchmark and network configuration:

```bash
npx caliper launch manager \
--caliper-benchconfig benchmarks/config.yaml \
--caliper-networkconfig networks/network-config-local.yaml \
--mymodule-performance-shoudbefast=true \
--caliper-workspace .
```

---

## **5. Rate Types in Caliper**

Caliper supports a variety of rate control mechanisms to shape the load for your performance tests:

- **Fixed Rate**: A constant transaction rate.
- **Fixed Feedback Rate**: Adjusts based on previous rounds.
- **Fixed Load**: Consistent transaction count.
- **Maximum Rate**: Max out the throughput.
- **Linear Rate**: Gradually increase the transaction rate over time.
- **Composite Rate**: A combination of multiple rate controllers.
- **Zero Rate**: No transactions sent (useful for testing environments).
- **Record Rate**: Play transactions at recorded intervals.
- **Replay Rate**: Replay a predefined load profile.

---

By following this guide, you will be able to install, bind, unbind, and run Caliper effectively for performance benchmarking of Hyperledger Fabric networks.
