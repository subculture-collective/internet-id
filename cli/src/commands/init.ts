import inquirer from "inquirer";
import { ConfigManager } from "../config";

export async function initCommand(): Promise<void> {
  console.log("🔧 Internet ID CLI Configuration\n");

  const config = new ConfigManager();
  const current = config.getAll();

  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "apiUrl",
      message: "API URL:",
      default: current.apiUrl || "http://localhost:3001",
    },
    {
      type: "input",
      name: "apiKey",
      message: "API Key (optional):",
      default: current.apiKey || "",
    },
    {
      type: "password",
      name: "privateKey",
      message: "Private Key (for signing):",
      default: current.privateKey || "",
      validate: (input: string) => {
        if (!input) return "Private key is required";
        if (!/^(0x)?[0-9a-fA-F]{64}$/.test(input)) {
          return "Invalid private key format (must be 64 hex characters, optionally prefixed with 0x)";
        }
        return true;
      },
    },
    {
      type: "input",
      name: "rpcUrl",
      message: "RPC URL:",
      default: current.rpcUrl || "https://sepolia.base.org",
    },
    {
      type: "input",
      name: "registryAddress",
      message: "Registry Contract Address (optional):",
      default: current.registryAddress || "",
    },
    {
      type: "list",
      name: "ipfsProvider",
      message: "IPFS Provider:",
      choices: ["web3storage", "pinata", "infura", "local"],
      default: current.ipfsProvider || "web3storage",
    },
  ]);

  // Ask for provider-specific credentials
  if (answers.ipfsProvider === "web3storage") {
    const web3Answers = await inquirer.prompt([
      {
        type: "password",
        name: "web3StorageToken",
        message: "Web3.Storage Token:",
        default: current.web3StorageToken || "",
      },
    ]);
    answers.web3StorageToken = web3Answers.web3StorageToken;
  } else if (answers.ipfsProvider === "pinata") {
    const pinataAnswers = await inquirer.prompt([
      {
        type: "password",
        name: "pinataJwt",
        message: "Pinata JWT:",
        default: current.pinataJwt || "",
      },
    ]);
    answers.pinataJwt = pinataAnswers.pinataJwt;
  } else if (answers.ipfsProvider === "infura") {
    const infuraAnswers = await inquirer.prompt([
      {
        type: "input",
        name: "infuraProjectId",
        message: "Infura Project ID:",
        default: current.infuraProjectId || "",
      },
      {
        type: "password",
        name: "infuraProjectSecret",
        message: "Infura Project Secret:",
        default: current.infuraProjectSecret || "",
      },
      {
        type: "input",
        name: "ipfsApiUrl",
        message: "IPFS API URL:",
        default: current.ipfsApiUrl || "https://ipfs.infura.io:5001",
      },
    ]);
    Object.assign(answers, infuraAnswers);
  } else if (answers.ipfsProvider === "local") {
    const localAnswers = await inquirer.prompt([
      {
        type: "input",
        name: "ipfsApiUrl",
        message: "Local IPFS API URL:",
        default: current.ipfsApiUrl || "http://127.0.0.1:5001",
      },
    ]);
    answers.ipfsApiUrl = localAnswers.ipfsApiUrl;
  }

  config.setAll(answers);
  config.save();

  console.log(`\n✅ Configuration saved to ${config.getConfigPath()}`);
}
