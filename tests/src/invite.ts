
import { DnaSource } from "@holochain/client";
import { pause, runScenario } from "@holochain/tryorama";
import pkg from 'tape-promise/tape';
const { test } = pkg;

import { privatePublicationDna } from  "../utils";


export default () => test("role CRUD tests", async (t) => {
  await runScenario(async scenario => {

    const dnas: DnaSource[] = [{path: privatePublicationDna }];

    const [alice, bob]  = await scenario.addPlayersWithHapps([dnas, dnas]);

    await scenario.shareAllAgents();

    const createInput = {
  "role": "you you truck",
  "agent": Buffer.from(new Uint8Array([132,32,36,116,83,163,135,44,75,78,192,249,238,46,131,53,207,221,83,152,80,129,195,174,5,8,92,106,161,14,189,202,223,117,235,64,219,227,136]))
};

    // Alice creates a role
    const createOutput: any = await alice.cells[0].callZome({
      zome_name: "roles",
      fn_name: "create_role",
      payload: createInput,
    });
    t.ok(createOutput.actionHash);  // test 1
    t.ok(createOutput.entryHash);   // test 2

    // Wait for the created entry to be propagated to the other node.
    await pause(100);

    
    // Bob gets the created role
    const readOutput: typeof createInput = await bob.cells[0].callZome({
      zome_name: "roles",
      fn_name: "get_role",
      payload: createOutput.entryHash,
    });
    t.deepEqual(readOutput, createInput); // test 3
    
    
    
  });



});
