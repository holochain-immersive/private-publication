import { pause, runScenario } from "@holochain/tryorama";
import { encode } from "@msgpack/msgpack";
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

const isExercise = process.env["EXERCISE"] === "2";
const stepNum = isExercise && parseInt(process.env["STEP"] as string);

export default () =>
  test("Invite agent to edit the publication", async (t) => {
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
        await bob.adminWs().registerDna({
          path: privatePublicationDna,
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
          installed_app_id: "private_publication_lobby",
        });
        await bob
          .adminWs()
          .enableApp({ installed_app_id: "private_publication_lobby" });

        const carol = await scenario.addConductor();
        const carolPubKey = await carol.adminWs().generateAgentPubKey();

        await carol.adminWs().registerDna({
          path: lobbyDna,
          properties: {
            progenitor: serializeHash(alicePubKey),
          },
        });
        await carol.adminWs().registerDna({
          path: privatePublicationDna,
          properties: {
            progenitor: serializeHash(alicePubKey),
          },
        });

        await carol.adminWs().installApp({
          agent_key: carolPubKey,
          dnas: [
            {
              hash: lobbyDnaHash,
              role_id: "lobby",
            },
          ],
          installed_app_id: "private_publication_lobby",
        });
        await carol.adminWs().enableApp({
          installed_app_id: "private_publication_lobby",
        });

        await scenario.shareAllAgents();

        await alice.appWs().callZome({
          cap_secret: null,
          cell_id: [lobbyDnaHash, alicePubKey],
          fn_name: "create_membrane_proof_for",
          payload: bobPubKey,
          provenance: alicePubKey,
          zome_name: "private_publication_lobby",
        });
        t.ok(true);

        if (isExercise && stepNum === 1) return;

        await pause(100);

        const membraneProof = await bob.appWs().callZome({
          cap_secret: null,
          cell_id: [lobbyDnaHash, bobPubKey],
          fn_name: "get_my_membrane_proof",
          payload: null,
          provenance: bobPubKey,
          zome_name: "private_publication_lobby",
        });
        t.ok(membraneProof);

        try {
          await bob.adminWs().installApp({
            agent_key: bobPubKey,
            dnas: [
              {
                membrane_proof: encode(membraneProof) as any,
                hash: privatePublicationDnaHash,
                role_id: "private_publication",
              },
            ],
            installed_app_id: "private_publication",
          });
          t.ok(true);
        } catch (e) {
          t.ok(
            false,
            "An agent that has been given a membrane proof should be able to enter the private publications DNA"
          );
          throw e;
        }

        await bob
          .adminWs()
          .enableApp({ installed_app_id: "private_publication" });

        if (isExercise && stepNum === 2) return;

        try {
          await carol.adminWs().installApp({
            agent_key: carolPubKey,
            dnas: [
              {
                hash: privatePublicationDnaHash,
                role_id: "private_publication",
              },
            ],
            installed_app_id: "private_publication",
          });
          await carol.adminWs().enableApp({
            installed_app_id: "private_publication",
          });
          t.ok(
            false,
            "An agent other than the progenitor shouldn't be able to install the private_publication cell"
          );
        } catch (e) {
          console.log(e);
          t.ok(true);
        }

        try {
          await carol.adminWs().installApp({
            agent_key: carolPubKey,
            dnas: [
              {
                hash: privatePublicationDnaHash,
                membrane_proof: encode(membraneProof) as any,
                role_id: "private_publication",
              },
            ],
            installed_app_id: "private_publication",
          });
          await carol.adminWs().enableApp({
            installed_app_id: "private_publication",
          });
          t.ok(
            false,
            "An agent other than the progenitor shouldn't be able to install the private_publication cell"
          );
        } catch (e) {
          t.ok(true);
        }
        if (isExercise && stepNum === 3) return;

        if (isExercise && stepNum === 4) {
          await alice.appWs().callZome({
            cap_secret: null,
            cell_id: [privatePublicationDnaHash, alicePubKey],
            fn_name: "assign_editor_role",
            payload: bobPubKey,
            provenance: alicePubKey,
            zome_name: "roles",
          });
          await bob.appWs().callZome({
            cap_secret: null,
            cell_id: [privatePublicationDnaHash, bobPubKey],
            fn_name: "assign_editor_role",
            payload: alicePubKey,
            provenance: bobPubKey,
            zome_name: "roles",
          });
          return;
        }

        if (isExercise && stepNum == 5) {
          await alice.appWs().callZome({
            cap_secret: null,
            cell_id: [privatePublicationDnaHash, alicePubKey],
            fn_name: "assign_editor_role",
            payload: bobPubKey,
            provenance: alicePubKey,
            zome_name: "roles",
          });
          try {
            await bob.appWs().callZome({
              cap_secret: null,
              cell_id: [privatePublicationDnaHash, bobPubKey],
              fn_name: "assign_editor_role",
              payload: alicePubKey,
              provenance: bobPubKey,
              zome_name: "roles",
            });
            t.ok(
              false,
              "An agent other than the progenitor should not be able to assign roles"
            );
          } catch (e) {
            t.ok(true);
          }
          return;
        }

        try {
          await bob.appWs().callZome({
            cap_secret: null,
            cell_id: [privatePublicationDnaHash, bobPubKey],
            fn_name: "create_post",
            payload: {
              title: "hello",
              content: "hi",
            },
            provenance: bobPubKey,
            zome_name: "posts",
          });
          t.ok(
            false,
            "An agent that hasn't been granted the editor role shouldn't be able to create posts"
          );
        } catch (e) {
          t.ok(true);
        }

        await alice.appWs().callZome({
          cap_secret: null,
          cell_id: [privatePublicationDnaHash, alicePubKey],
          fn_name: "assign_editor_role",
          payload: bobPubKey,
          provenance: alicePubKey,
          zome_name: "roles",
        });

        await bob.appWs().callZome({
          cap_secret: null,
          cell_id: [privatePublicationDnaHash, bobPubKey],
          fn_name: "create_post",
          payload: {
            title: "hello",
            content: "hi",
          },
          provenance: bobPubKey,
          zome_name: "posts",
        });

        if (isExercise && stepNum === 6) return;

        const bobsPostHash = await bob.appWs().callZome({
          cap_secret: null,
          cell_id: [privatePublicationDnaHash, bobPubKey],
          fn_name: "create_post",
          payload: {
            title: "hello",
            content: "hi",
          },
          provenance: bobPubKey,
          zome_name: "posts",
        });

        const alicesPostHash = await alice.appWs().callZome({
          cap_secret: null,
          cell_id: [privatePublicationDnaHash, alicePubKey],
          fn_name: "create_post",
          payload: {
            title: "hello",
            content: "hi",
          },
          provenance: alicePubKey,
          zome_name: "posts",
        });

        try {
          await alice.appWs().callZome({
            cap_secret: null,
            cell_id: [privatePublicationDnaHash, alicePubKey],
            fn_name: "update_post",
            payload: {
              post_to_update: bobsPostHash,
              updated_post: {
                title: "asdf",
                content: "yes!",
              },
            },
            provenance: alicePubKey,
            zome_name: "posts",
          });
          await bob.appWs().callZome({
            cap_secret: null,
            cell_id: [privatePublicationDnaHash, bobPubKey],
            fn_name: "update_post",
            payload: {
              post_to_update: alicesPostHash,
              updated_post: {
                title: "asdf",
                content: "yes!",
              },
            },
            provenance: bobPubKey,
            zome_name: "posts",
          });
          t.ok(
            false,
            "An agent that's not the author of a post shouldn't be able to update it"
          );
        } catch (e) {
          t.ok(true);
        }
      });
    } catch (e) {
      console.log(e);
      process.exit(1);
    }
  });
