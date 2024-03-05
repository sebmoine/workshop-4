import bodyParser from "body-parser";
import express, { Request, Response } from "express";
import { REGISTRY_PORT } from "../config";

export type Node = { nodeId: number; pubKey: string };

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
    const newNode: Node = { nodeId, pubKey };
    nodeRegistry.push(newNode);
    res.status(200).send("Node registered successfully");
  });

  const server = _registry.listen(REGISTRY_PORT, () => {
    console.log(`registry is listening on port ${REGISTRY_PORT}`);
  });

  return server;
}
