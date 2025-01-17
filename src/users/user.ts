import bodyParser from "body-parser";
import express from "express";
import { BASE_USER_PORT, BASE_ONION_ROUTER_PORT, REGISTRY_PORT } from "../config";
import { Node } from "../registry/registry";
import { createRandomSymmetricKey, exportSymKey, rsaEncrypt, symEncrypt } from "../crypto";


export type SendMessageBody = {
  message: string;
  destinationUserId: number;
};

export async function user(userId: number) {
  const _user = express();
  _user.use(express.json());
  _user.use(bodyParser.json());

  // Implement the status route
  _user.get("/status", (req, res) => {
    res.send("live");
  });

  let lastReceivedMessage: string | null = null;
  let lastSentMessage: string | null = null;
  let getLastCircuit: Node[] = [];
  
  _user.get("/getLastReceivedMessage", (req, res) => {
  res.json({ result: lastReceivedMessage });
});
  
  _user.get("/getLastSentMessage", (req, res) => {
  res.json({ result: lastSentMessage });
});

  // Receive a message
  _user.post("/message", (req, res) => {
    const body = req.body as SendMessageBody;
    if (!body.message) {
      res.status(400).send("Invalid message");
      return;
    }
    lastReceivedMessage = body.message;
    res.status(200).send("success");
  });

  _user.get("/getLastCircuit", (req, res) => {
    res.status(200).json({result: getLastCircuit.map((node) => node.nodeId)});
  });

  _user.post("/sendMessage", async (req, res) => {
    const { message, destinationUserId } = req.body;
    
    //create a random circuit of 3 distinct nodes with the help of the node registry
    const nodes = await fetch(`http://localhost:${REGISTRY_PORT}/getNodeRegistry`).then((res) => res.json()).then((body: any) => body.nodes);
  
    let circuit: Node[] = [];
    while (circuit.length < 3) {
      const randomIndex = Math.floor(Math.random() * nodes.length);
      const randomNode = nodes[randomIndex]
      if (!circuit.map(node => node.nodeId).includes(randomNode.nodeId)) {
        circuit.push(randomNode);
      }
    }
    lastSentMessage = message;
    let messageToSend = message;
    let destination = `${BASE_USER_PORT + destinationUserId}`.padStart(10, "0") //"encoded as a string of 10 characters with leading zeros"
                                                                                // because 4012 : node 12 and base_port of nodes 4000, should be "0000004012"

    //create each layer of encryption
    for (let i = 0; i < circuit.length; i++) {
      const node = circuit[i];
      const symKey = await createRandomSymmetricKey();
      const messageToEncrypt = `${destination}${messageToSend}`; //"The previous value and the message should be concatenated...
      const encryptedMessage = await symEncrypt(symKey, messageToEncrypt); //...and encrypted with the associated symmetric key"
      destination = `${BASE_ONION_ROUTER_PORT + node.nodeId}`.padStart(10, "0")
      const encryptedSymKey = await rsaEncrypt(await exportSymKey(symKey), node.pubKey); //"the symmetric key needs to be encrypted with the associated node's RSA public key"
      messageToSend = encryptedSymKey + encryptedMessage; 
    }
    circuit.reverse(); //from first node to last node
    getLastCircuit=circuit;

    await fetch(`http://localhost:${BASE_ONION_ROUTER_PORT + circuit[0].nodeId}/message`, {
      method: "POST",
      body: JSON.stringify({ message: messageToSend }),
      headers: { "Content-Type": "application/json" },
    });
    res.status(200).send("The encrypted message has been successfully delivered to the entry node.");
  });

  const server = _user.listen(BASE_USER_PORT + userId, () => {
    console.log(
      `User ${userId} is listening on port ${BASE_USER_PORT + userId}`
    );
  });

  return server;
}
