import * as fs from "fs";
import * as path from "path";
import * as os from "os";

export interface InternetIdConfig {
  apiUrl?: string;
  apiKey?: string;
  privateKey?: string;
  rpcUrl?: string;
  registryAddress?: string;
  ipfsProvider?: "web3storage" | "pinata" | "infura" | "local";
  web3StorageToken?: string;
  pinataJwt?: string;
  infuraProjectId?: string;
  infuraProjectSecret?: string;
  ipfsApiUrl?: string;
}

export class ConfigManager {
  private configPath: string;
  private config: InternetIdConfig;

  constructor() {
    this.configPath = path.join(os.homedir(), ".internet-id.json");
    this.config = this.load();
  }

  private load(): InternetIdConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const data = fs.readFileSync(this.configPath, "utf-8");
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn("Warning: Could not load config file, using defaults");
    }
    return {};
  }

  public save(): void {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      throw new Error(`Failed to save config: ${error}`);
    }
  }

  public get(key: keyof InternetIdConfig): string | undefined {
    return this.config[key];
  }

  public set(key: keyof InternetIdConfig, value: any): void {
    this.config[key] = value;
  }

  public getAll(): InternetIdConfig {
    return { ...this.config };
  }

  public setAll(config: InternetIdConfig): void {
    this.config = { ...config };
  }

  public clear(): void {
    this.config = {};
    if (fs.existsSync(this.configPath)) {
      fs.unlinkSync(this.configPath);
    }
  }

  public getConfigPath(): string {
    return this.configPath;
  }
}
