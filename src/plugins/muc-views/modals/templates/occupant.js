import { __ } from 'i18n';
import { html } from "lit";

export default (el) => {
    const model = el.model;

    const i18n_name = __('Name');

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
    			<p><strong>${i18n_name}:</strong> ${model.getDisplayName()}</p>
    		</div>
    	</div>
    `;
}
