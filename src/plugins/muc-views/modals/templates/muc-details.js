import { __ } from 'i18n';
import { html } from "lit";

export default (model) => {
    const num_occupants = model.occupants.filter((o) => o.get('show') !== 'offline').length;

    const i18n_name = __('Name');
    const i18n_online_users = __('Online users');

    return html`
    	<div style="display: flex; align-items: center; gap: 1rem;">
    		<converse-avatar
    			.model=${model}
    			class="avatar"
    			name="${model.getDisplayName()}"
    			nonce=${model.vcard?.get('vcard_updated')}
    			height="72" width="72"
    		></converse-avatar>

    		<div>
    			<p><strong>${i18n_name}:</strong> ${model.get('name')}</p>
    			<p><strong>${i18n_online_users}:</strong> ${num_occupants}</p>
    		</div>
    	</div>
  `;
}
