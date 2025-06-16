import { html } from 'lit';
import { __ } from 'i18n';
import 'shared/components/image-picker.js';
import tplChatStatusForm from './chat-status-form.js';

/**
 * @param {import('../modals/profile').default} el
 */
export default (el) => {
    const i18n_status = __('Status');

    // Initialize navigation_tabs as a Map
    const navigation_tabs = new Map();

    navigation_tabs.set(
        'status',
        html`<li role="presentation" class="nav-item">
            <a
                class="nav-link ${el.tab === 'status' ? 'active' : ''}"
                id="status-tab"
                href="#status-tabpanel"
                aria-controls="status-tabpanel"
                role="tab"
                @click="${(ev) => el.switchTab(ev)}"
                data-name="status"
                data-toggle="tab"
                >${i18n_status}</a
            >
        </li>`
    );

    return html`
        <div class="tab-content">
            ${
                navigation_tabs.get('status')
                    ? html`<div
                          class="tab-pane ${el.tab === 'status' ? 'active' : ''}"
                          id="status-tabpanel"
                          role="tabpanel"
                          aria-labelledby="status-tab"
                      >
                          ${el.tab === 'status' ? tplChatStatusForm(el) : ''}
                      </div>`
                    : ''
            }
        </div>
    </div>`;
};
