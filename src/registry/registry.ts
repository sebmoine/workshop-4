import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { REGISTRY_PORT } from "../config";
import { generateRsaKeyPair, GenerateRsaKeyPair } from "./crypto";

export type Node = { nodeId: number; pubKey: string; priKey: string; };

export type RegisterNodeBody = {
  nodeId: number;
  pubKey: string;
};

export type GetNodeRegistryBody = {
  nodes: Node[];
};
const nodeRegistry: Node[] = [];

export async function launchRegistry() {
  const _registry = express();
  _registry.use(express.json());
  _registry.use(bodyParser.json());

  // Implement the status route
  _registry.get("/status", (req, res) => {
    res.send('live');
  });

  // Register a new node
  _registry.post("/registerNode", async (req, res) => {
    const { nodeId, pubKey } = req.body as RegisterNodeBody;

    if (!nodeId || !pubKey) {
      res.status(400).send("Invalid request body");
      return;
    }
    const keyPair: GenerateRsaKeyPair = await generateRsaKeyPair();
    const { publicKey, privateKey } = keyPair;
    const newNode: Node = {
      nodeId,
      pubKey,
      priKey: privateKey.toString(),
    };
    nodeRegistry.push(newNode);
    res.status(200).send("Node registered successfully");
  });

  // Get the private key of a node
  _registry.get("/getPrivateKey", (req, res) => {
    const { nodeId } = req.query;
    if (!nodeId) {
      res.status(400).send("Invalid request");
      return;
    }
    const node = nodeRegistry.find((n) => n.nodeId === Number(nodeId));
    if (!node) {
      res.status(404).send("Node not found");
      return;
    }
    const payload = { result: node.priKey };
    res.status(200).json(payload);
  });


  // Get the node registry
  _registry.get("/getNodeRegistry", (req, res) => {
    const registry: GetNodeRegistryBody = {
      nodes: nodeRegistry,
    };
    res.status(200).json(registry);
  });

  
  const server = _registry.listen(REGISTRY_PORT, () => {
    console.log(`registry is listening on port ${REGISTRY_PORT}`);
  });
  return server;
}
