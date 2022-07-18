import { pause, runScenario } from "@holochain/tryorama";
import pkg from "tape-promise/tape";
const { test } = pkg;

import { lobbyDna, privatePublicationDna, progenitorHapp } from "./utils";
import { Base64 } from "js-base64";

export function deserializeHash(hash: string): Uint8Array {
  return Base64.toUint8Array(hash.slice(1));
}

export function serializeHash(hash: Uint8Array): string {
  return `u${Base64.fromUint8Array(hash, true)}`;
}

const isExercise = process.env["EXERCISE"] === "1";
const stepNum = isExercise && parseInt(process.env["STEP"] as string);

export default () =>
  test("Grant capability", async (t) => {
    try {
      await runScenario(async (scenario) => {
        const alice = await scenario.addConductor();
        const alicePubKey = await alice.adminWs().generateAgentPubKey();

        const lobbyDnaHash = await alice.adminWs().registerDna({
          path: lobbyDna,
          properties: {
            progenitor: serializeHash(alicePubKey),
          },
        });

        const privatePublicationDnaHash = await alice.adminWs().registerDna({
          path: privatePublicationDna,
          properties: {
            progenitor: serializeHash(alicePubKey),
          },
        });
        await alice.adminWs().installApp({
          agent_key: alicePubKey,
          dnas: [
            {
              hash: lobbyDnaHash,
              role_id: "lobby",
            },
            {
              hash: privatePublicationDnaHash,
              role_id: "private_publication",
            },
          ],
          installed_app_id: "private_publication",
        });
        await alice.adminWs().enableApp({
          installed_app_id: "private_publication",
        });

        const bob = await scenario.addConductor();
        const bobPubKey = await bob.adminWs().generateAgentPubKey();
        await bob.adminWs().registerDna({
          path: lobbyDna,
          properties: {
            progenitor: serializeHash(alicePubKey),
          },
        });
        await bob.adminWs().installApp({
          agent_key: bobPubKey,
          dnas: [
            {
              hash: lobbyDnaHash,
              role_id: "lobby",
            },
          ],
          installed_app_id: "private_publication",
        });
        await bob
          .adminWs()
          .enableApp({ installed_app_id: "private_publication" });

        await scenario.shareAllAgents();

        const progenitor = await alice.appWs().callZome({
          cap_secret: null,
          cell_id: [lobbyDnaHash, alicePubKey],
          fn_name: "progenitor",
          payload: null,
          provenance: alicePubKey,
          zome_name: "private_publication_lobby",
        });
        t.equal(serializeHash(alicePubKey), serializeHash(progenitor));

        if (isExercise && stepNum === 1) return;

        await alice.appWs().callZome({
          cap_secret: null,
          cell_id: [privatePublicationDnaHash, alicePubKey],
          fn_name: "create_post",
          payload: {
            title: "Post 1",
            content: "Posts post",
          },
          provenance: alicePubKey,
          zome_name: "posts",
        });

        let allPosts = await alice.appWs().callZome({
          cap_secret: null,
          cell_id: [lobbyDnaHash, alicePubKey],
          fn_name: "request_read_all_posts",
          payload: null,
          provenance: alicePubKey,
          zome_name: "private_publication_lobby",
        });
        t.equal(allPosts.length, 1);
        if (isExercise && stepNum === 2) return;

        try {
          const allPosts: any = await bob.appWs().callZome({
            cap_secret: null,
            cell_id: [lobbyDnaHash, bobPubKey],
            fn_name: "read_all_posts",
            payload: null,
            provenance: bobPubKey,
            zome_name: "private_publication_lobby",
          });
          t.ok(false);
        } catch (e) {
          t.ok(true);
        }

        const secret = await alice.appWs().callZome({
          cap_secret: null,
          cell_id: [lobbyDnaHash, alicePubKey],
          fn_name: "grant_capability_to_read",
          payload: bobPubKey,
          provenance: alicePubKey,
          zome_name: "private_publication_lobby",
        });
        if (isExercise && stepNum === 3) return;

        await bob.appWs().callZome({
          cap_secret: null,
          cell_id: [lobbyDnaHash, bobPubKey],
          fn_name: "store_capability_claim",
          payload: secret,
          provenance: bobPubKey,
          zome_name: "private_publication_lobby",
        });
        if (isExercise && stepNum === 4) return;

        allPosts = await bob.appWs().callZome({
          cap_secret: null,
          cell_id: [lobbyDnaHash, bobPubKey],
          fn_name: "read_all_posts",
          payload: null,
          provenance: bobPubKey,
          zome_name: "private_publication_lobby",
        });
        t.equal(allPosts.length, 1);

        if (isExercise && stepNum === 5) return;

      });
    } catch (e) {
      console.log(e);
      process.exit(1);
    }
  });
