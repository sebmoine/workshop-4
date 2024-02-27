import bodyParser from "body-parser";
import express from "express";
import { BASE_ONION_ROUTER_PORT } from "../config";

// Define variables to store messages and destinations
let encryptedMessage = null;
let decryptedMessage = null;
let nextDestination = null;

export async function simpleOnionRouter(nodeId: number) {
  const onionRouter = express();
  onionRouter.use(express.json());
  onionRouter.use(bodyParser.json());

  // Implement the status route
  onionRouter.get("/status", (req, res) => {
    res.send("live");
  });

  // Implement the getLastReceivedEncryptedMessage route
  onionRouter.get("/getLastReceivedEncryptedMessage", (req, res) => {
    res.json({ result: encryptedMessage });
  });

  const server = onionRouter.listen(BASE_ONION_ROUTER_PORT + nodeId, () => {
    console.log(
      `Onion router ${nodeId} is listening on port ${
        BASE_ONION_ROUTER_PORT + nodeId
      }`
    );
  });

  return server;
}
