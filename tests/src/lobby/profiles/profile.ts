
import { DnaSource } from "@holochain/client";
import { pause, runScenario } from "@holochain/tryorama";
import pkg from 'tape-promise/tape';
const { test } = pkg;

import { lobbyDna } from  "../../utils";


export default () => test("profile CRUD tests", async (t) => {
  await runScenario(async scenario => {

    const dnas: DnaSource[] = [{path: lobbyDna }];

    const [alice, bob]  = await scenario.addPlayersWithHapps([dnas, dnas]);

    await scenario.shareAllAgents();

    const createInput = {
  "nickname": "oops got they"
};

    // Alice creates a profile
    const createOutput: any = await alice.cells[0].callZome({
      zome_name: "profiles",
      fn_name: "create_profile",
      payload: createInput,
    });
    t.ok(createOutput.actionHash);  // test 1
    t.ok(createOutput.entryHash);   // test 2

    // Wait for the created entry to be propagated to the other node.
    await pause(100);

    
    // Bob gets the created profile
    const readOutput: typeof createInput = await bob.cells[0].callZome({
      zome_name: "profiles",
      fn_name: "get_profile",
      payload: createOutput.entryHash,
    });
    t.deepEqual(readOutput, createInput); // test 3
    
    
    
  });



});
