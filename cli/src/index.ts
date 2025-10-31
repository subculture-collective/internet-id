#!/usr/bin/env node

import { Command } from "commander";
import { initCommand } from "./commands/init";
import { uploadCommand } from "./commands/upload";
import { verifyCommand } from "./commands/verify";

const program = new Command();

program
  .name("internet-id")
  .description("CLI tool for Internet ID content registration and verification")
  .version("1.0.0");

// init command
program
  .command("init")
  .description("Configure credentials and settings")
  .action(async () => {
    try {
      await initCommand();
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

// upload command
program
  .command("upload <file>")
  .description("Upload and register content")
  .option(
    "-u, --upload-content",
    "Upload content to IPFS (default: privacy mode, only manifest is uploaded)"
  )
  .option("-k, --private-key <key>", "Private key for signing (overrides config)")
  .option("-r, --rpc-url <url>", "RPC URL (overrides config)")
  .option("-g, --registry <address>", "Registry contract address (overrides config)")
  .option("-p, --ipfs-provider <provider>", "IPFS provider: web3storage, pinata, infura, local")
  .action(async (file: string, options: any) => {
    try {
      await uploadCommand(file, options);
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

// verify command
program
  .command("verify <input>")
  .description(
    "Verify content against manifest and on-chain registry (input: file path or manifest URI)"
  )
  .option("-r, --rpc-url <url>", "RPC URL (overrides config)")
  .option("-g, --registry <address>", "Registry contract address (overrides config)")
  .action(async (input: string, options: any) => {
    try {
      await verifyCommand(input, options);
    } catch (error: any) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  });

program.parse(process.argv);
