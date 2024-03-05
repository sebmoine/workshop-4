import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { REGISTRY_PORT } from "../config";

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
  _registry.post("/registerNode", (req, res) => {
    const { nodeId, pubKey } = req.body as RegisterNodeBody;
    if (!nodeId || !pubKey) {
      res.status(400).send("Invalid request body");
      return;
    }
    const nodeKeyPair = generateKeyPair();
    const newNode: Node = {
      nodeId,
      pubKey,
      privateKey: nodeKeyPair.privateKey,
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
    const payload = { result: node.privateKey };
    res.status(200).json(payload);
  });

  const server = _registry.listen(REGISTRY_PORT, () => {
    console.log(`registry is listening on port ${REGISTRY_PORT}`);
  });
  return server;
}
