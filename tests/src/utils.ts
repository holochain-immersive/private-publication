import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { decompressSync, unzipSync } from "fflate";

import { AppBundle } from "@holochain/client";
import { decode } from "@msgpack/msgpack";
import { AgentApp, Conductor, Scenario } from "@holochain/tryorama";
import { serializeHash } from "./grant";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function privatePublicationApp(): AppBundle {
  const privatePublicationHapp = path.join(
    __dirname,
    "../../workdir/private_publication.happ"
  );

  const appBundleBytes = fs.readFileSync(privatePublicationHapp);

  return decode(decompressSync(new Uint8Array(appBundleBytes))) as any;
}

export async function installApp(
  scenario: Scenario
): Promise<[Conductor, AgentApp]> {
  // Set up the app to be installed
  const appBundle = privatePublicationApp();

  const aliceConductor = await scenario.addConductor();
  await aliceConductor.attachAppInterface();
  await aliceConductor.connectAppInterface();
  const alicePubKey = await aliceConductor.adminWs().generateAgentPubKey();
  appBundle.manifest.roles.find(
    (r) => r.name === "private_publication"
  )!.dna.modifiers = {
    network_seed: "throwaway",
    properties: {
      progenitor: serializeHash(alicePubKey),
    },
  };

  const alice = await aliceConductor.installApp(
    { bundle: appBundle },
    {
      installedAppId: "private_publication",
      agentPubKey: alicePubKey,
    }
  );
  await aliceConductor
    .adminWs()
    .enableApp({ installed_app_id: "private_publication" });

  await aliceConductor.connectAppAgentInterface("private_publication");
  return [aliceConductor, alice];
}
