
import { LitElement, html } from 'lit';
import { state, customElement, property } from 'lit/decorators.js';
import { InstalledCell, AppWebsocket, EntryHash, InstalledAppInfo } from '@holochain/client';
import { contextProvided } from '@lit-labs/context';
import { appInfoContext, appWebsocketContext } from '../../../contexts';
import { Profile } from '../../../types/lobby/profiles';
import '@material/mwc-circular-progress';
import '@type-craft/title/title-detail';

@customElement('profile-detail')
export class ProfileDetail extends LitElement {
  @property()
  entryHash!: EntryHash;

  @state()
  _profile: Profile | undefined;

  @contextProvided({ context: appWebsocketContext })
  appWebsocket!: AppWebsocket;

  @contextProvided({ context: appInfoContext })
  appInfo!: InstalledAppInfo;

  async firstUpdated() {
    const cellData = this.appInfo.cell_data.find((c: InstalledCell) => c.role_id === 'lobby')!;

    this._profile = await this.appWebsocket.callZome({
      cap_secret: null,
      cell_id: cellData.cell_id,
      zome_name: 'profiles',
      fn_name: 'get_profile',
      payload: this.entryHash,
      provenance: cellData.cell_id[1]
    });
  }

  render() {
    if (!this._profile) {
      return html`<div style="display: flex; flex: 1; align-items: center; justify-content: center">
        <mwc-circular-progress indeterminate></mwc-circular-progress>
      </div>`;
    }

    return html`
      <div style="display: flex; flex-direction: column">
        <span style="font-size: 18px">Profile</span>

        
    <title-detail
    
    .value=${this._profile.nickname}
      style="margin-top: 16px"
    ></title-detail>

      </div>
    `;
  }
}
